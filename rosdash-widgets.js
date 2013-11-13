//@bug@solved input.length does not work

//////////////////////////////////// datatypes

// constant value
ROSDASH.Constant = function (block)
{
	this.block = block;
	
}
//@input	none
//@output	the value of the constant
ROSDASH.Constant.prototype.run = function (input)
{
	//@todo put is_number into std_msgs.json
	// if a number
	if ("Float32" == this.block.constname)
	{
		return {o0: parseFloat(this.block.value)};
	} else
	{
		return {o0: this.block.value};
	}
}

// multi array
ROSDASH.multiArray = function (block)
{
	this.block = block;
	this.array = new Array();
}
//@input	each value
//@output	an array of all the values
ROSDASH.multiArray.prototype.run = function (input)
{
	this.array = new Array();
	for (var i in input)
	{
		this.array.push(input[i]);
	}
	return {o0: this.array};
}
ROSDASH.multiArray.prototype.addTo = function (pos, value)
{
	this.array.push(value);
}

// memorable array, can memorize historic data with max length
ROSDASH.memArray = function (block)
{
	this.block = block;
	this.data = new Array();
	//@todo change to config
	this.max_length = 100;
}
//@input	one new data
//@output	an array of historic data with length of this.max_length
ROSDASH.memArray.prototype.run = function (input)
{
	this.data.push(input[0]);
	// if exceeds
	if (this.max_length < this.data.length)
	{
		// cut the beginning ones
		this.data.splice(0, this.data.length - this.max_length);
	}
	return {o0: this.data};
}

// json
ROSDASH.Json = function (block)
{
	this.block = block;
	this.json = new Array();
}
//@input	
//@output	
ROSDASH.Json.prototype.run = function (input)
{
	var count = 0;
	for (var i in input)
	{
		++ count;
		if (count % 2)
		{
			continue;
		}
		this.json[input[i - 1]] = input[i];
	}
	return {o0: this.json};
}
ROSDASH.Json.prototype.addTo = function (key, value)
{
	this.json[key] = value;
}


//////////////////////////////////// datatype operations

ROSDASH.AddTo = function (block)
{
	this.block = block;
}
ROSDASH.AddTo.prototype.run = function (input)
{
	switch (typeof input[0])
	{
	case "array":
		var a = new ROSDASH.multiArray();
		a.run(input[0]);
		a.addTo(input[1]);
		break;
	case "object":
		var a = new ROSDASH.Json();
		a.run(input[0]);
		a.addTo(input[1], input[2]);
		break;
	}
	return {o0 : a};
}

ROSDASH.ValueAt = function (block)
{
	this.block = block;
}
ROSDASH.ValueAt.prototype.run = function (input)
{
	var value;
	switch (typeof input[0])
	{
	case "array":
		value = input[0][input[1]];
		break;
	case "object":
		value = input[0][input[1]];
		break;
	}
	return {o0 : value};
}

// transform json into string
ROSDASH.arrayToStr = function (block)
{
	this.block = block;
}
//@input	the array (object, associative array, or topic message)
//@output	the corresponding string
//@todo str to json, simply JSON.stringify
ROSDASH.arrayToStr.prototype.run = function (input)
{
	// if empty
	if (undefined === input || undefined === input[0])
	{
		return {o0: ""};
	}
	var msg = input[0];
	var str = "";
	if (typeof msg == "object" || typeof msg == "array")
	{
		for (var i in msg)
		{
			str += " ( " + i + ": ";
			// recursive call for sub-array
			str += this.run({0: msg[i]}).o0;
			str += " ) ";
		}
	} else
	{
		str += msg;
	}
	return {o0: str};
}

ROSDASH.StrToJson = function (block)
{
	this.block = block;
}
ROSDASH.StrToJson.prototype.run = function (input)
{
	return {o0 : JSON.parse(input[0])};
}

//////////////////////////////////// arithmetics

// add inputs up
ROSDASH.Addition = function (block)
{
	this.block = block;
}
//@input	all elements to be added
//@output	sum
ROSDASH.Addition.prototype.run = function (input)
{
	var sum = input[0];
	for (var i = 1; i < input.length; ++ i)
	{
		sum += input[i];
	}
	return {o0: sum};
}

// not tested
ROSDASH.Division = function (block)
{
	this.block = block;
}
ROSDASH.Division.prototype.run = function (input)
{
	var output;
	if (typeof input[0] == "object")
	{
		output = new Object();
		for (var i in input[0])
		{
			output[i] = input[0][i] / input[1];
		}
	} else if (typeof input[0] == "array")
	{
		output = new Array();
		for (var i in input[0])
		{
			output[i] = input[0][i] / input[1];
		}
	} else
	{
		output = input[0] / input[1];
	}
	return {o0: output};
}

//////////////////////////////////// matrix operations

// just for array @deprecated
ROSDASH.Insert = function (block)
{
	this.block = block;
}
ROSDASH.Insert.prototype.run = function (input)
{
	if (undefined === input[2] || (typeof input[0] != "array" && typeof input[0] != "object"))
	{
		return undefined;
	}
	var output = new Array();
	for (var i in input[0])
	{
		var num = parseInt(i, 10);
		if (!isNaN(i) && i >= 0)
		{
			output[i] = input[0][i];
		}
	}
	output.splice(input[2], 0, input[1]);
	return {o0: output};
}

ROSDASH.Reshape = function (block)
{
	this.block = block;
	this.len = 0;
}
ROSDASH.Reshape.prototype.vectorize = function (data)
{
	if (typeof data == "object" || typeof data == "array")
	{
		var v = new Array();
		for (var i in data)
		{
			v = v.concat(this.vectorize(data[i]));
		}
		return v;
	} else
	{
		++ this.len;
		return [ data ];
	}
}
ROSDASH.Reshape.prototype.run = function (input)
{
	// if not an array
	if (typeof input[0] != "object" && typeof input[0] != "array")
	{
		return input[0];
	}
	this.len = 0;
	// vectorize
	var vector = this.vectorize(input[0]);
	var is_int1 = false, is_int2 = false;
	// if input[1] is int
	if (typeof input[1] === 'number' && parseFloat(input[1]) == parseInt(input[1], 10) && !isNaN(input[1]) && input[1] > 0)
	{
		is_int1 = true;
	}
	// if input[2] is int
	if (typeof input[2] === 'number' && parseFloat(input[2]) == parseInt(input[2], 10) && !isNaN(input[2]) && input[2] > 0)
	{
		is_int2 = true;
	}
	var row, column;
	if (! is_int1 && ! is_int2)
	{
		return input[0];
	} else if (! is_int2)
	{
		row = input[1];
		column = Math.ceil(this.len / row);
		if (column <= 0)
		{
			column = 1;
		}
	} else if (! is_int1)
	{
		column = input[2];
		row = Math.ceil(this.len / column);
		if (row <= 0)
		{
			row = 1;
		}
	} else
	{
		row = input[1];
		column = input[2];
	}
	var output = new Array();
	for (var i = 0; i < column; ++ i)
	{
		var o = new Array();
		for (var j = 0; j < row; ++ j)
		{
			if (i * row + j < vector.length)
			{
				o.push(vector[i * row + j]);
			} else
			{
				switch (typeof vector[0])
				{
				case "number":
					o.push(0);
					break;
				case "string":
					o.push(" ");
					break;
				default:
					o.push(" ");
					//o.push(undefined);
				}
			}
		}
		output.push(o);
	}
	if (1 == input[1])
	{
		return {o0: o};
	} else
	{
		return {o0: output};
	}
}

//@deprecated json, add to json, diagram representation
ROSDASH.AssocArray = function (block)
{
	this.block = block;
}
ROSDASH.AssocArray.prototype.run = function (input)
{
	var assoc = new Object();
	if (undefined !== input[0])
	{
		assoc[input[0]] = input[1];
	}
	return {o0: assoc};
}

//@deprecated
ROSDASH.addToAssocArray = function (block)
{
	this.block = block;
}
ROSDASH.addToAssocArray.prototype.run = function (input)
{
	var assoc;
	if (typeof input[0] != "object")
	{
		return {o0: new Object()};
	} else if (undefined === input[1])
	{
		return {o0: input[0]};
	}
	assoc = input[0];
	assoc[input[1]] = input[2];
	return {o0: assoc};
}

//////////////////////////////////// functional flow

// switch-case function
ROSDASH.Switch = function (block)
{
	this.block = block;
}
//@input	the input value and all cases
//@output	true if the case matches the input value, false if not
ROSDASH.Switch.prototype.run = function (input)
{
	//@todo design default value and compulsory inputs
	if (input.length < 2)
	{
		console.error("input not enough: " + this.block.id);
		return undefined;
	}
	var output = new Object();
	// if input[1] is an array of cases
	if (typeof input[1] == "array")
	{
		for (var i in input[1])
		{
			if (input[0] == input[1][i])
			{
				output["o" + i] = true;
			} else
			{
				output["o" + i] = false;
			}
		}
	} else // if not, means all the following inputs are cases
	{
		// avoid input[0]
		for (var i = 0; i < input.length - 1; ++ i)
		{
			if (input[0] == input[i + 1])
			{
				output["o" + i] = true;
			} else
			{
				output["o" + i] = false;
			}
		}
	}
	return output;
}

//////////////////////////////////// ROS

ROSDASH.RosList = function (block)
{
	this.block = block;
}
ROSDASH.RosList.prototype.run = function (input)
{
	var output = new Array();
	var max = Math.max( Math.max(ROSDASH.rosNames.topic["_"].length, ROSDASH.rosNames.service["_"].length), ROSDASH.rosNames.param["_"].length);
	// rotate the table @todo should I rotate that?
	for (var i = 0; i < max; ++ i)
	{
		var tmp = new Array();
		if (ROSDASH.rosNames.topic["_"].length > i)
		{
			tmp[0] = ROSDASH.rosNames.topic["_"][i];
		} else
		{
			tmp[0] = " ";
		}
		if (ROSDASH.rosNames.service["_"].length > i)
		{
			tmp[1] = ROSDASH.rosNames.service["_"][i];
		} else
		{
			tmp[1] = " ";
		}
		if (ROSDASH.rosNames.param["_"].length > i)
		{
			tmp[2] = ROSDASH.rosNames.param["_"][i];
		} else
		{
			tmp[2] = " ";
		}
		output.push(tmp);
	}
	return {o0: output};
}

// ROS topic
ROSDASH.Topic = function (block)
{
	this.block = block;
	this.ros_msg = {error: "cannot connect to this topic"};
	this.topic;
}
// subscribe a ROS topic for once
ROSDASH.Topic.prototype.initRos = function ()
{
	this.topic = new ROSLIB.Topic({
		ros : ROSDASH.ros,
		name : this.block.rosname,
		messageType : this.block.rostype
	});
	var self = this;
	// subscribe a ROS topic
	this.topic.subscribe(function (message)
	{
		self.ros_msg = message;
		//listener.unsubscribe();
	});
	return true;
}
//@input	ROS topic message to publish
//@output	ROS topic message
ROSDASH.Topic.prototype.run = function (input)
{
	// if should publish, publish
	if (undefined !== input[0])
	{
		var msg;
		if (typeof input[0] == "string" && this.block.rostype == 'std_msgs/String')
		{
			msg = new ROSLIB.Message({data: input[0]});
		} else
		{
			msg = new ROSLIB.Message(input[0]);
		}
		this.topic.publish(msg);
	}
	return {o0:  this.ros_msg};
}

ROSDASH.Service = function (block)
{
	this.block = block;
	this.service;
	this.result = "cannot connect to this service";
}
ROSDASH.Service.prototype.initRos = function ()
{
	// First, we create a Service client with details of the service's name and service type.
	this.service = new ROSLIB.Service({
		ros : ROSDASH.ros,
		name : this.block.rosname,
		messageType : this.block.rostype
	});
	return true;
}
ROSDASH.Service.prototype.run = function (input)
{
	var msg = (undefined !== input[0]) ? input[0] : {A : 1, B : 2};
	var request = new ROSLIB.ServiceRequest(msg);
	var that = this;
	this.service.callService(request, function (result) {
		that.result = jQuery.extend(true, {}, result);
	});
	return {o0: this.result};
}

ROSDASH.Param = function (block)
{
	this.block = block;
	this.param;
	this.output = "cannot connect to this param";
}
ROSDASH.Param.prototype.initRos = function ()
{
	// First, we create a Service client with details of the service's name and service type.
	this.param = new ROSLIB.Param({
		ros : ROSDASH.ros,
		name : this.block.rosname
	});
	return true;
}
ROSDASH.Param.prototype.run = function (input)
{
	var that = this;
	this.param.get(function (value) {
		that.output = value;
	});
	if (undefined !== input[0])
	{
		this.param.set(input[0]);
	}
	return {o0: that.output};
}

//////////////////////////////////// input

// toggle button (don't use the name of switch because it is used)
ROSDASH.ToggleButton = function (block)
{
	this.block = block;
	this.canvas_id = "togglebutton_" + this.block.id;
	this.button_id = "togglebutton2_" + this.block.id;
	this.value = true;
	// if multiple toggle buttons
	if (("config" in this.block) && ("button_num" in this.block.config))
	{
		this.button_id = new Array();
		this.value = new Array();
		for (var i = 0; i < this.block.config.button_num; ++ i)
		{
			this.button_id.push("togglebutton2_" + this.block.id + "_" + i);
			this.value.push(true);
		}
	}
}
ROSDASH.ToggleButton.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<input id="' + this.canvas_id + '" type="checkbox" checked />';
	return widget;
}
ROSDASH.ToggleButton.prototype.init = function ()
{
	var that = this;
	// if a single button
	if (typeof this.button_id != "array")
	{
		$('#' + this.canvas_id).wrap('<div id="' + this.button_id + '" class="switch" data-on-label="YES" data-off-label="NO" />').parent().bootstrapSwitch();
		$('#' + this.button_id).on('switch-change', function (e, data) {
			that.value = data.value;
		});
		//$('#toggle-state-switch').bootstrapSwitch('toggleState');
		//$('#toggle-state-switch').bootstrapSwitch('setState', false); // true || false
	} else // if multiple buttons
	{
		for (var i in this.button_id)
		{
			$('#' + this.canvas_id).wrap('<div id="' + this.button_id[i] + '" class="switch" data-on-label="YES" data-off-label="NO" />').parent().bootstrapSwitch();
			$('#' + this.button_id[i]).on('switch-change', function (e, data) {
				//@bug [i] does not work?
				that.value[i] = data.value;
			});
		}
	}
	return true;

}
//@input	none
//@output	the value of button or value list of buttons
ROSDASH.ToggleButton.prototype.run = function (input)
{
	return {o0: this.value};
}

// a virtual joystick, support tablet
ROSDASH.VirtualJoystick = function (block)
{
	this.block = block;
	this.canvas_id = "VirtualJoystick-" + this.block.id;
	this.joy_obj;
	this.unlock = false;
	this.joy = {
		header : 
		{
			seq : 0,
			stamp : 
			{
				sec : parseInt(new Date().getTime() / 1000),
				nsec : parseInt(new Date().getTime() % 1000 * 1000000)
			},
			frame_id : ""
		},
		axes : [0, 0, 0, 0, 0, 0],
		buttons : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	};
}
ROSDASH.VirtualJoystick.prototype.addWidget = function (widget)
{
	widget.widgetTitle = this.block.id + ' <input type="button" id="' + this.canvas_id + '-lock" value="unlock" />';
	widget.widgetContent = '<div id="' + this.canvas_id + '" style="width:100%; height:100%; -webkit-user-select: none; -moz-user-select: none;"></div>';
	return widget;
}
ROSDASH.VirtualJoystick.prototype.init = function ()
{
	var that = this;
	// click to change lock or unlock
	$("#" + that.canvas_id + "-lock").click(function ()
	{
		if ("lock" == $("#" + that.canvas_id + "-lock").val())
		{
			that.unlock = false;
			$("#" + that.canvas_id + "-lock").val("unlock");
		} else
		{
			that.unlock = true;
			$("#" + that.canvas_id + "-lock").val("lock");
		}
	});
	//console.log("touchscreen for VirtualJoystick is", VirtualJoystick.touchScreenAvailable() ? "available" : "not available");
	this.joy_obj = new VirtualJoystick({
		container		: document.getElementById(this.canvas_id),
		mouseSupport	: true
	});
	return true;
}
//@input	none
//@output	joy msg, VirtualJoystick object
ROSDASH.VirtualJoystick.prototype.run = function (input)
{
	this.joy = {
		header : 
		{
			seq : this.joy.header.seq + 1,
			stamp : 
			{
				sec : parseInt(new Date().getTime() / 1000),
				nsec : parseInt(new Date().getTime() % 1000 * 1000000)
			},
			frame_id : ""
		},
		axes : [Number(this.joy_obj.left() - this.joy_obj.right()), Number(this.joy_obj.up() - this.joy_obj.down()), 0, 0, 0, 0],
		buttons : [Number(this.unlock), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	};
	return {
		o0: this.joy,
		o1: this.joy_obj
	};
}

//////////////////////////////////// basic output

// text widget
ROSDASH.Text = function (block)
{
	this.block = block;
}
ROSDASH.Text.prototype.addWidget = function (widget)
{
	widget.widgetContent = "";
	return widget;
}
//@input	content
//@output	none
ROSDASH.Text.prototype.run = function (input)
{
	// if json, transform into string
	if (typeof input[0] == "object" || typeof input[0] == "array")
	{
		input[0] = JSON.stringify(input[0]);
	}
	$("#myDashboard").sDashboard("setContentById", this.block.id, input[0]);
}

// text widget with speaking library
ROSDASH.Speech = function (block)
{
	this.block = block;
	this.canvas_id = "Speech" + this.block.id;
	this.content = "";
}
ROSDASH.Speech.prototype.addWidget = function (widget)
{
	// add a button for speak
	widget.widgetTitle += ' <input type="button" id="' + this.canvas_id + '" value="speak" /><span id="audio"></span>';
	widget.widgetContent = this.content;
	return widget;
}
ROSDASH.Speech.prototype.init = function ()
{
	var that = this;
	if ($("#" + this.canvas_id).length <= 0)
	{
		return false;
	}
	// append the callback function to button
	$("#" + this.canvas_id).click(function ()
	{
		// speak by speak.js
		speak(that.content);
	});
	return true;
}
//@input	the content to speak
//@output	none
ROSDASH.Speech.prototype.run = function (input)
{
	if (typeof input[0] == "object" || typeof input[0] == "array")
	{
		if ("data" in input[0])
		{
			this.content = JSON.stringify(input[0].data);
		} else
		{
			this.content = JSON.stringify(input[0]);
		}
	} else
	{
		this.content = input[0];
	}
	// if new message comes, speak
	//speak(this.content);
	$("#myDashboard").sDashboard("setContentById", this.block.id, this.content);
}

// table
ROSDASH.Table = function (block)
{
	this.block = block;
	this.titles = (undefined !== this.block.config.table_titles) ? this.block.config.table_titles : [""];
}
ROSDASH.Table.prototype.addWidget = function (widget)
{
	widget.widgetContent = {
		"aaData" : [[]],
		"aoColumns" : [],
		"iDisplayLength": 25,
		"aLengthMenu": [[1, 25, 50, -1], [1, 25, 50, "All"]],
		"bPaginate": true,
		"bAutoWidth": false
	};
	for (var i in this.titles)
	{
		widget.widgetContent.aoColumns.push({sTitle : this.titles[i]});
		widget.widgetContent.aaData[0].push("");
	}
	return widget;
}
//@input	contents
//@output	none
ROSDASH.Table.prototype.run = function (input)
{
	// if not a matrix, transform into matrix
	if (typeof input[0] != "array" && typeof input[0] != "object")
	{
		var tmp = input[0];
		input[0] = new Array();
		input[0].push(new Array());
		input[0][0].push(tmp);
	}
	// for content
	var aaData = new Array();
	for (var i in input[0])
	{
		var tmp = new Array();
		for (var j in input[0][i])
		{
			// handle special cases
			if (typeof input[0][i][j] == "number")
			{
				tmp.push("" + input[0][i][j]);
			} else if (undefined === input[0][i][j])
			{
				tmp.push("");
			} else
			{
				tmp.push(input[0][i][j]);
			}
		}
		// make content long enough
		while (tmp.length < this.titles.length)
		{
			tmp.push("");
		}
		aaData.push(tmp);
	}
	// if empty
	if (aaData.length == 0)
	{
		var tmp = new Array();
		for (var j = 0; j < this.titles.length; ++ j)
		{
			tmp.push("");
		}
		aaData.push(tmp);
	}
	// make content long enough
	if (aaData[0].length < this.titles.length)
	{
		for (var j = aaData[0].length; j < this.titles.length; ++ j)
		{
			aaData[0].push("");
		}
	}
	$("#myDashboard").sDashboard("refreshTableById", this.block.id, aaData);
}

//////////////////////////////////// networks

//@todo a uniform representation for network diagram
// network by cytoscape.js
ROSDASH.cyNetwork = function (block)
{
	this.block = block;
	this.canvas = "cyNetwork_" + this.block.id;
	this.cy = undefined;
	var that = this;
	this.options = ("config" in this.block && "option" in this.block.config) ? this.block.config.option : {
    showOverlay: false,
    minZoom: 0.5,
    maxZoom: 2,
    style: cytoscape.stylesheet()
      .selector('node')
        .css({
          'content': 'data(name)',
          'font-family': 'helvetica',
          'font-size': 14,
          'text-outline-width': 3,
          'text-outline-color': '#888',
          'text-valign': 'center',
          'color': '#fff',
          'width': 'mapData(weight, 30, 80, 20, 50)',
          'height': 'mapData(height, 0, 200, 10, 45)',
          'border-color': '#fff'
        })
      .selector(':selected')
        .css({
          'background-color': '#000',
          'line-color': '#000',
          'target-arrow-color': '#000',
          'text-outline-color': '#000'
        })
      .selector('edge')
        .css({
          'width': 2,
          'target-arrow-shape': 'triangle'
        })
    ,
    elements: {
      nodes: [
        {
          data: { id: 'j', name: 'Jerry', weight: 65, height: 174 }
        },
        {
          data: { id: 'e', name: 'Elaine', weight: 48, height: 160 }
        },
        {
          data: { id: 'k', name: 'Kramer', weight: 75, height: 185 }
        },
        {
          data: { id: 'g', name: 'George', weight: 70, height: 150 }
        }
      ],
      edges: [
        { data: { source: 'j', target: 'e' } },
        { data: { source: 'j', target: 'k' } },
        { data: { source: 'j', target: 'g' } },

        { data: { source: 'e', target: 'j' } },
        { data: { source: 'e', target: 'k' } },

        { data: { source: 'k', target: 'j' } },
        { data: { source: 'k', target: 'e' } },
        { data: { source: 'k', target: 'g' } },

        { data: { source: 'g', target: 'j' } }
      ],
    },
    ready: function(){
      that.cy = this;
    }
  };
}
ROSDASH.cyNetwork.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas + '" style="width:100%; height:100%;"></div>';
	return widget;
}
ROSDASH.cyNetwork.prototype.init = function ()
{
	if ($("#" + this.canvas).length <= 0)
	{
		return false;
	}
  $('#' + this.canvas).cytoscape(this.options);
	return true;
}
//@input	none
//@output	network object
ROSDASH.cyNetwork.prototype.run = function (input)
{
	return {o0: this.cy};
}

//@deprecated
ROSDASH.cyNetworkLoadOnce = function (block)
{
	this.block = block;
	this.success = false;
}
ROSDASH.cyNetworkLoadOnce.prototype.run = function (input)
{
	if (! this.success && undefined !== input[0] && undefined !== input[1])
	{
		input[0].load(input[1]);
		this.success = true;
	}
	return {o0: input[0]};
}

// rosdash diagram by cytoscape.js
//@bug too many bugs
ROSDASH.cyDiagram = function (block)
{
	this.block = block;
	this.canvas = "cy";
	this.duplicate = false;
	this.cy;
	this.init_success = false;
}
ROSDASH.cyDiagram.prototype.addWidget = function (widget)
{
	if ($("#" + this.canvas).length <= 0)
	{
		widget.widgetContent = '<div id="' + this.canvas + '" style="width:100%; height:100%;"></div>';
	} else
	{
		this.duplicate = true;
	}
	return widget;
}
ROSDASH.cyDiagram.prototype.init = function ()
{
	if ($("#" + this.canvas).length <= 0)
	{
		return false;
	}
	if (this.duplicate || this.init_success)
	{
		return;
	}
	ROSDASH.startDiagram(ROSDASH.ownerConf.name, ROSDASH.ownerConf.panel_name, undefined);
	this.init_success = true;
	return true;
}

// network by arbor.js
ROSDASH.arborNetwork = function (block)
{
	this.block = block;
	this.canvas = "arborNetwork_" + this.block.id;
	this.network;
}
ROSDASH.arborNetwork.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<canvas id="' + this.canvas + '" style="width:100%; height:100%;"></canvas>';
	return widget;
}
ROSDASH.arborNetwork.prototype.init = function ()
{
	if ($("#" + this.canvas).length <= 0)
	{
		return false;
	}
	this.network = this.arborInit(this.canvas);
	return true;
}
//@input	none
//@output	network object
ROSDASH.arborNetwork.prototype.run = function (input)
{
	return {o0 : this.network};
}
ROSDASH.arborNetwork.prototype.Renderer = function (canvas)
{
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d");
    var particleSystem
    var that = {
      init:function(system){
        //
        // the particle system will call the init function once, right before the
        // first frame is to be drawn. it's a good place to set up the canvas and
        // to pass the canvas size to the particle system
        //
        // save a reference to the particle system for use in the .redraw() loop
        particleSystem = system

        // inform the system of the screen dimensions so it can map coords for us.
        // if the canvas is ever resized, screenSize should be called again with
        // the new dimensions
        particleSystem.screenSize(canvas.width, canvas.height) 
        particleSystem.screenPadding(80) // leave an extra 80px of whitespace per side
        
        // set up some event handlers to allow for node-dragging
        that.initMouseHandling()
      },
      redraw:function(){
        // 
        // redraw will be called repeatedly during the run whenever the node positions
        // change. the new positions for the nodes can be accessed by looking at the
        // .p attribute of a given node. however the p.x & p.y values are in the coordinates
        // of the particle system rather than the screen. you can either map them to
        // the screen yourself, or use the convenience iterators .eachNode (and .eachEdge)
        // which allow you to step through the actual node objects but also pass an
        // x,y point in the screen's coordinate system
        // 
        ctx.fillStyle = "white"
        ctx.fillRect(0,0, canvas.width, canvas.height)
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords
          // draw a line from pt1 to pt2
          ctx.strokeStyle = "rgba(0,0,0, .333)"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(pt1.x, pt1.y)
          ctx.lineTo(pt2.x, pt2.y)
          ctx.stroke()
        })
        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords
          // draw a rectangle centered at pt
          var w = 10
          ctx.fillStyle = (node.data.alone) ? "orange" : "black"
          ctx.fillRect(pt.x-w/2, pt.y-w/2, w,w)
        })    			
      },
      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        var dragged = null;
        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();
            _mouseP = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            dragged = particleSystem.nearest(_mouseP);

            if (dragged && dragged.node !== null){
              // while we're dragging, don't let physics move the node
              dragged.node.fixed = true
            }
            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)
            return false
          },
          dragged:function(e){
            var pos = $(canvas).offset();
            var s = arbor.Point(e.pageX-pos.left, e.pageY-pos.top)
            if (dragged && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }
            return false
          },
          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 1000
            dragged = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
        // start listening
        $(canvas).mousedown(handler.clicked);
      },
    }
    return that;
}    
ROSDASH.arborNetwork.prototype.arborInit = function (canvas)
{
    var sys = arbor.ParticleSystem(1000, 600, 0.5) // create the system with sensible repulsion/stiffness/friction
    sys.parameters({gravity:true}) // use center-gravity to make the graph settle nicely (ymmv)
    sys.renderer = this.Renderer("#" + canvas) // our newly created renderer will have its .init() method called shortly by sys...
    // add some nodes to the graph and watch it go...
    sys.addEdge('a','b')
    sys.addEdge('a','c')
    sys.addEdge('a','d')
    sys.addEdge('a','e')
    sys.addNode('f', {alone:true, mass:.25})
    // or, equivalently:
    //
    // sys.graft({
    //   nodes:{
    //     f:{alone:true, mass:.25}
    //   }, 
    //   edges:{
    //     a:{ b:{},
    //         c:{},
    //         d:{},
    //         e:{}
    //     }
    //   }
    // })
    return sys;
}

// network by dracula.js
ROSDASH.draculaNetwork = function (block)
{
	this.block = block;
	this.canvas = "draculaNetwork_" + this.block.id;
	this.network = undefined;
}
ROSDASH.draculaNetwork.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas + '" style="width:100%; height:100%;"></div>';
	return widget;
}
ROSDASH.draculaNetwork.prototype.init = function ()
{
	if ($("#" + this.canvas).length <= 0)
	{
		return false;
	}
	this.network = this.draculaInit(this.canvas);
	return true;
}
//@input	none
//@output	network object
ROSDASH.draculaNetwork.prototype.run = function (input)
{
	return {o0 : this.network};
}
// latest version on github does not work
ROSDASH.draculaNetwork.prototype.draculaInit = function (canvas)
{
	if (! $("#" + canvas).length)
	{
		console.error("no canvas for dracula");
		return;
	}
    var width = $("#" + canvas).width();
    var height = $("#" + canvas).height();

    if (undefined != renderer)
    {
		renderer.r.remove();
	}
    var layouter = undefined;
    var renderer = undefined;

    var g = new Graph();

    /* add a simple node */
    g.addNode("strawberry");
    g.addNode("cherry");

    /* add a node with a customized label */
    g.addNode("1", { label : "Tomato" });

	
    /* add a node with a customized shape 
       (the Raphael graph drawing implementation can draw this shape, please 
       consult the RaphaelJS reference for details http://raphaeljs.com/) */
//    var render = function(r, n) {
//        var label = r.text(0, 30, n.label).attr({opacity:0});
        /* the Raphael set is obligatory, containing all you want to display */
//        var set = r.set().push(
//            r.rect(-30, -13, 62, 86).attr({"fill": "#fa8", "stroke-width": 2, r : "9px"}))
//            .push(label);
        /* make the label show only on hover */
//        set.hover(function(){ label.animate({opacity:1,"fill-opacity":1}, 500); }, function(){ label.animate({opacity:0},300); });

//        tooltip = r.set()
//            .push(
//                r.rect(0, 0, 90, 30).attr({"fill": "#fec", "stroke-width": 1, r : "9px"})
//            ).push(
//                r.text(25, 15, "overlay").attr({"fill": "#000000"})
//            );
//        for(i in set.items) {
//            set.items[i].tooltip(tooltip);
//        };
//	//            set.tooltip(r.set().push(r.rect(0, 0, 30, 30).attr({"fill": "#fec", "stroke-width": 1, r : "9px"})).hide());
//        return set;
//    };
	
    g.addNode("id35", {
        label : "meat\nand\ngreed" //,
        /* filling the shape with a color makes it easier to be dragged */
        /* arguments: r = Raphael object, n : node object */
//        render : render
    });
    //    g.addNode("Wheat", {
    /* filling the shape with a color makes it easier to be dragged */
    /* arguments: r = Raphael object, n : node object */
    //        shapes : [ {
    //                type: "rect",
    //                x: 10,
    //                y: 10,
    //                width: 25,
    //                height: 25,
    //                stroke: "#f00"
    //            }, {
    //                type: "text",
    //                x: 30,
    //                y: 40,
    //                text: "Dump"
    //            }],
    //        overlay : "<b>Hello <a href=\"http://wikipedia.org/\">World!</a></b>"
    //    });

    st = { directed: true, label : "Label",
            "label-style" : {
                "font-size": 20
            }
        };
    g.addEdge("kiwi", "penguin", st);

    /* connect nodes with edges */
    g.addEdge("strawberry", "cherry");
    g.addEdge("cherry", "apple");
    g.addEdge("cherry", "apple")
    g.addEdge("1", "id35");
    g.addEdge("penguin", "id35");
    g.addEdge("penguin", "apple");
    g.addEdge("kiwi", "id35");

    /* a directed connection, using an arrow */
    g.addEdge("1", "cherry", { directed : true } );
    
    /* customize the colors of that edge */
    g.addEdge("id35", "apple", { stroke : "#bfa" , fill : "#56f", label : "Meat-to-Apple" });
    
    /* add an unknown node implicitly by adding an edge */
    g.addEdge("strawberry", "apple");

    g.removeNode("1");

    /* layout the graph using the Spring layout implementation */
    layouter = new Graph.Layout.Spring(g);
    
    /* draw the graph using the RaphaelJS draw implementation */
    renderer = new Graph.Renderer.Raphael(canvas, g, width, height);
    
    //    console.log(g.nodes["kiwi"]);
    return g;
};

//////////////////////////////////// database

//@todo sql, uniform insert and query
ROSDASH.JsDatabase = function (block)
{
	this.block = block;
	this.db;
}
ROSDASH.JsDatabase.prototype.init = function ()
{
	this.db = TAFFY([
		{"key":1, "value":"John", "status":"active"},
		{"key":2, "value":"Kelly", "status":"active"},
		{"key":3, "value":"Jeff", "status":"inactive"}
	]);
	this.db.type = "js";
	return true;
}
ROSDASH.JsDatabase.prototype.run = function (input)
{
	return {o0 : this.db};
}

ROSDASH.DbInsert = function (block)
{
	this.block = block;
}
ROSDASH.DbInsert.prototype.run = function (input)
{
	var that = this;
	switch (input[0].type)
	{
	case "js":
		input[0].insert(input[1]);
		break;
	case "redis":
		$.ajax({
			type: "POST",
			url: "rosdash.php",
			data: {
				func: "redisSet",
				key: input[1].key,
				value: JSON.stringify(input[1])
			},
			success: function( data, textStatus, jqXHR )
			{
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				console.error("DbInsert error: ", jqXHR, textStatus, errorThrown);
			}
		}).always(function() {});
		break;
	case "mysql":
		break;
	default:
		break;
	}
	return {o0 : input[0]};
}

ROSDASH.DbQuery = function (block)
{
	this.block = block;
	this.output;
}
ROSDASH.DbQuery.prototype.run = function (input)
{
	var that = this;
	switch (input[0].type)
	{
	case "js":
		input[0](input[1]).each(function (r) {
			that.output = new Array();
			that.output.push(r);
		});
		break;
	case "redis":
		var key = input[1];
		if (typeof input[1] == "object" && undefined !== input[1].key)
		{
			key = input[1].key;
		}
		$.ajax({
			type: "POST",
			url: "rosdash.php",
			data: {
				func: "redisGet",
				key: key
			},
			success: function( data, textStatus, jqXHR )
			{
				that.output = JSON.parse(data);
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				console.error("DbQuery error: ", jqXHR, textStatus, errorThrown);
			}
		}).always(function() {});
		break;
	case "mysql":
		break;
	default:
		break;
	}
	return {o0 : input[0], o1 : that.output};
}

ROSDASH.DbStatus = function (block)
{
	this.block = block;
	this.interval = 1000;
	this.previous = undefined;
	this.status = "cannot connect to server"
}
ROSDASH.DbStatus.prototype.run = function (input)
{
	if (undefined != this.previous && new Date() - this.previous < this.interval)
	{
		return {
			o0 : input[0],
			o1 : this.status
		};
	}
	this.previous = new Date();
	var that = this;
	switch (input[0].type)
	{
	case "js":
		this.status = "js database works fine";
		break;
	case "redis":
		$.ajax({
			type: "POST",
			url: "rosdash.php",
			data: {
				func: "redisStatus"
			},
			success: function( data, textStatus, jqXHR )
			{
				that.status = data;
			},
			error: function(jqXHR, textStatus, errorThrown)
			{
				console.error("DbStatus error: ", jqXHR, textStatus, errorThrown);
			}
		}).always(function() {});
		break;
	case "mysql":
		break;
	default:
		this.status = "invalid database";
		break;
	}
	return {
		o0 : input[0],
		o1 : this.status
	};
}

ROSDASH.RedisDb = function (block)
{
	this.block = block;
	this.database = {type : "redis", host : "localhost", port : "6379"};
}
ROSDASH.RedisDb.prototype.run = function (input)
{
	return {o0 : this.database};
}

ROSDASH.RedisBackup = function (block)
{
	this.block = block;
}
ROSDASH.RedisBackup.prototype.run = function (input)
{
	
	return {o0 : input[0]};
}

//////////////////////////////////// drawings

//@todo config the target canvas
ROSDASH.Painter = function (block)
{
	this.block = block;
	this.target_id = "turtlesim-0";
	this.canvas;
	this.stage;
	this.drawingCanvas;
	this.oldPt;
	this.oldMidPt;
	this.title;
	this.color;
	this.stroke;
	this.colors;
	this.index;
}
ROSDASH.Painter.prototype.init = function ()
{
	var html = '<canvas id="myCanvas" width="960" height="400" style="position: absolute; top: 0px; left: 0px; z-index: 100; border-style:solid; border-width:2px;"></canvas>'
	$("#myDashboard").sDashboard("addContentById", this.target_id, html);
	var that = this;
	if (window.top != window) {
		document.getElementById("header").style.display = "none";
	}
	function stop() {}
	function handleMouseDown(event) {
		if (that.stage.contains(that.title)) { that.stage.clear(); that.stage.removeChild(that.title); }
		that.color = that.colors[(that.index++)%that.colors.length];
		that.stroke = 5; //Math.random()*30 + 10 | 0;
		that.oldPt = new createjs.Point(that.stage.mouseX, that.stage.mouseY);
		that.oldMidPt = that.oldPt;
		that.stage.addEventListener("stagemousemove" , handleMouseMove);
	}
	function handleMouseMove(event) {
		var midPt = new createjs.Point(that.oldPt.x + that.stage.mouseX>>1, that.oldPt.y+that.stage.mouseY>>1);
		that.drawingCanvas.graphics.clear().setStrokeStyle(that.stroke, 'round', 'round').beginStroke(that.color).moveTo(midPt.x, midPt.y).curveTo(that.oldPt.x, that.oldPt.y, that.oldMidPt.x, that.oldMidPt.y);
		that.oldPt.x = that.stage.mouseX;
		that.oldPt.y = that.stage.mouseY;
		that.oldMidPt.x = midPt.x;
		that.oldMidPt.y = midPt.y;
		that.stage.update();
	}
	function handleMouseUp(event) {
		that.stage.removeEventListener("stagemousemove" , handleMouseMove);
	}
	this.canvas = document.getElementById("myCanvas");
	this.index = 0;
	this.colors = ["#828b20", "#b0ac31", "#cbc53d", "#fad779", "#f9e4ad", "#faf2db", "#563512", "#9b4a0b", "#d36600", "#fe8a00", "#f9a71f"];
	//check to see if we are running in a browser with touch support
	this.stage = new createjs.Stage(this.canvas);
	this.stage.autoClear = false;
	this.stage.enableDOMEvents(true);
	createjs.Touch.enable(this.stage);
	createjs.Ticker.setFPS(24);
	this.drawingCanvas = new createjs.Shape();
	this.stage.addEventListener("stagemousedown", handleMouseDown);
	this.stage.addEventListener("stagemouseup", handleMouseUp);
	/*title = new createjs.Text("Click and Drag to draw", "36px Arial", "#777777");
	title.x = 300;
	title.y = 200;
	stage.addChild(title);*/
	this.stage.addChild(this.drawingCanvas);
	this.stage.update();
	return true;
}
ROSDASH.Painter.prototype.run = function (input)
{
	return;
}

//////////////////////////////////// multimedia

ROSDASH.UserCamera = function (block)
{
	this.block = block;
	this.canvas_id = "UserCamera-" + this.block.id;
	this.video;
	this.canvas;
	this.context;
	this.imageData;
	this.detector;
    this.lastTime = 0;
	this.vendors = ['ms', 'moz', 'webkit', 'o'];
}
ROSDASH.UserCamera.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<video id="video' + this.canvas_id + '" autoplay="true" style="display:none;"></video>' + 
		'<canvas id="canvas' + this.canvas_id + '" style="width:100%; height:100%;"></canvas>';
	return widget;
}
ROSDASH.UserCamera.prototype.init = function ()
{
	if ($("#video" + this.canvas_id).length <= 0)
	{
		return false;
	}
	this.onLoad();
	return true;
}
ROSDASH.UserCamera.prototype.onLoad = function ()
{
	this.video = document.getElementById("video" + this.canvas_id);
	this.canvas = document.getElementById("canvas" + this.canvas_id);
	this.context = this.canvas.getContext("2d");
	this.canvas.width = parseInt(this.canvas.style.width);
	this.canvas.height = parseInt(this.canvas.style.height);
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	var that = this;
	if (navigator.getUserMedia) {
		function successCallback(stream){
		  if (window.webkitURL) {
			that.video.src = window.webkitURL.createObjectURL(stream);
		  } else if (video.mozSrcObject !== undefined) {
			that.video.mozSrcObject = stream;
		  } else {
			that.video.src = stream;
		  }
		}
		function errorCallback(error) {}
		navigator.getUserMedia({video: true}, successCallback, errorCallback);
		that.detector = new AR.Detector();
		this.requestAnimationFrame();
	}
}
ROSDASH.UserCamera.prototype.tick = function ()
{
	var that = this;
	this.requestAnimationFrame();
	if (this.video.readyState === this.video.HAVE_ENOUGH_DATA){
		this.snapshot();
		var markers = this.detector.detect(this.imageData);
		this.drawCorners(markers);
		this.drawId(markers);
	}
}
ROSDASH.UserCamera.prototype.requestAnimationFrame = function(element)
{
	var currTime = new Date().getTime();
	var timeToCall = Math.max(0, 16 - (currTime - this.lastTime));
	var that = this;
	var id = window.setTimeout(function() { that.tick(currTime + timeToCall); }, 
	  timeToCall);
	this.lastTime = currTime + timeToCall;
	return id;
}
ROSDASH.UserCamera.prototype.snapshot = function ()
{
	this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
	this.imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
}
ROSDASH.UserCamera.prototype.drawCorners = function (markers)
{
	var corners, corner, i, j;
	this.context.lineWidth = 3;
	for (i = 0; i !== markers.length; ++ i)
	{
		corners = markers[i].corners;
		this.context.strokeStyle = "red";
		this.context.beginPath();
		for (j = 0; j !== corners.length; ++ j)
		{
			corner = corners[j];
			this.context.moveTo(corner.x, corner.y);
			corner = corners[(j + 1) % corners.length];
			this.context.lineTo(corner.x, corner.y);
		}
		this.context.stroke();
		this.context.closePath();
		this.context.strokeStyle = "green";
		this.context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
	}
}
ROSDASH.UserCamera.prototype.drawId = function (markers)
{
	var corners, corner, x, y, i, j;
	this.context.strokeStyle = "blue";
	this.context.lineWidth = 1;
	for (i = 0; i !== markers.length; ++ i)
	{
		corners = markers[i].corners;
		x = Infinity;
		y = Infinity;
		for (j = 0; j !== corners.length; ++ j)
		{
			corner = corners[j];
			x = Math.min(x, corner.x);
			y = Math.min(y, corner.y);
		}
		this.context.strokeText(markers[i].id, x, y)
	}
}
ROSDASH.UserCamera.prototype.run = function (input)
{
	return {o0 : this.video};
}

ROSDASH.HeadTracker = function (block)
{
	this.block = block;
	this.canvas = "HeadTracker-" + this.block.id;
	this.pos = new Object();
}
ROSDASH.HeadTracker.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<canvas id="compare' + this.canvas + '" width="100%" height="100%" style="display:none"></canvas>' +
		'<video id="vid' + this.canvas + '" autoplay loop width="100%" height="100%"></video>' +
		'<canvas id="overlay' + this.canvas + '" width="100%" height="100%"></canvas>' +
		'<canvas id="debug' + this.canvas + '" width="100%" height="100%"></canvas>' +
		'<p id="gUMMessage"></p>' +
		'<p>Status : <span id="headtrackerMessage"></span></p>' +
		'<p><input type="button" onclick="htracker.stop();htracker.start();" value="reinitiate facedetection"></input>' +
		'<br/><br/>' +
		'<input type="checkbox" onclick="showProbabilityCanvas()" value="asdfasd"></input>Show probability-map</p>';
	return widget;
}
ROSDASH.HeadTracker.prototype.init = function ()
{
	if ($("#vid" + this.canvas).length <= 0)
	{
		return false;
	}
	// set up video and canvas elements needed
	var videoInput = document.getElementById('vid' + this.canvas);
	var canvasInput = document.getElementById('compare' + this.canvas);
	var canvasOverlay = document.getElementById('overlay' + this.canvas)
	var debugOverlay = document.getElementById('debug' + this.canvas);
	var overlayContext = canvasOverlay.getContext('2d');
	canvasOverlay.style.position = "absolute";
	canvasOverlay.style.top = "auto"; //'0px';
	canvasOverlay.style.zIndex = '100001';
	canvasOverlay.style.display = 'block';
	debugOverlay.style.position = "absolute";
	debugOverlay.style.top = "auto"; //'0px';
	debugOverlay.style.zIndex = '100002';
	debugOverlay.style.display = 'none';
	// add some custom messaging
	statusMessages = {
		"whitebalance" : "checking for stability of camera whitebalance",
		"detecting" : "Detecting face",
		"hints" : "Hmm. Detecting the face is taking a long time",
		"redetecting" : "Lost track of face, redetecting",
		"lost" : "Lost track of face",
		"found" : "Tracking face"
	};
	supportMessages = {
		"no getUserMedia" : "Unfortunately, <a href='http://dev.w3.org/2011/webrtc/editor/getusermedia.html'>getUserMedia</a> is not supported in your browser. Try <a href='http://www.opera.com/browser/'>downloading Opera 12</a> or <a href='http://caniuse.com/stream'>another browser that supports getUserMedia</a>. Now using fallback video for facedetection.",
		"no camera" : "No camera found. Using fallback video for facedetection."
	};
	document.addEventListener("headtrackrStatus", function(event) {
		if (event.status in supportMessages) {
			var messagep = document.getElementById('gUMMessage');
			messagep.innerHTML = supportMessages[event.status];
		} else if (event.status in statusMessages) {
			var messagep = document.getElementById('headtrackerMessage');
			messagep.innerHTML = statusMessages[event.status];
		}
	}, true);
	// the face tracking setup
	var htracker = new headtrackr.Tracker({altVideo : {ogv : "./media/capture5.ogv", mp4 : "./media/capture5.mp4"}, calcAngles : true, ui : false, headPosition : false, debug : debugOverlay});
	htracker.init(videoInput, canvasInput);
	htracker.start();
	var that = this;
	// for each facetracking event received draw rectangle around tracked face on canvas
	document.addEventListener("facetrackingEvent", function( event ) {
		// clear canvas
		overlayContext.clearRect(0,0,320,240);
		// once we have stable tracking, draw rectangle
		if (event.detection == "CS") {
			for (var i in event)
			{
				that.pos[i] = event[i];
			}
			overlayContext.translate(event.x, event.y)
			overlayContext.rotate(event.angle-(Math.PI/2));
			overlayContext.strokeStyle = "#00CC00";
			overlayContext.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height);
			overlayContext.rotate((Math.PI/2)-event.angle);
			overlayContext.translate(-event.x, -event.y);
		}
	});
	// turn off or on the canvas showing probability
	function showProbabilityCanvas() {
		var debugCanvas = document.getElementById('debug');
		if (debugCanvas.style.display == 'none') {
			debugCanvas.style.display = 'block';
		} else {
			debugCanvas.style.display = 'none';
		}
	}
	return true;
}
ROSDASH.HeadTracker.prototype.run = function (input)
{
	return {o0 : {x : this.pos.x, y : this.pos.y}};
}

ROSDASH.HandTracker = function (block)
{
	this.block = block;
	this.canvas = "HandTracker-" + this.block.id;
}
ROSDASH.HandTracker.prototype.addWidget = function (widget)
{
	widget.widgetContent =	'<video id="video' + this.canvas + '" autoplay="true" style="display:none;"></video>' +
		'<canvas id="canvas' + this.canvas + '" style="width:100%; height:100%; border:1px solid black;"></canvas>' +
		'<div style="margin: 15px;">' +
		  '<input id="cbxHull' + this.canvas + '" type="checkbox" checked="checked">Convex Hull</input>' +
		  '<input id="cbxDefects' + this.canvas + '" type="checkbox">Convexity Defects</input>' +
		  '<input id="cbxSkin' + this.canvas + '" type="checkbox" checked="checked">Skin Detection</input>' +
		'</div>';
	return widget;
}
ROSDASH.HandTracker.prototype.init = function ()
{
	if ($("#cbxHull" + this.canvas).length <= 0)
	{
		return false;
	}
	var that = this;
	this.tracker = new HT.Tracker( {fast: true} );
	this.cbxHull = document.getElementById("cbxHull" + this.canvas);
	this.cbxDefects = document.getElementById("cbxDefects" + this.canvas);
	this.cbxSkin = document.getElementById("cbxSkin" + this.canvas);
	this.video = document.getElementById("video" + this.canvas);
	this.canvas = document.getElementById("canvas" + this.canvas);
	this.context = this.canvas.getContext("2d");
	this.canvas.width = parseInt(this.canvas.style.width) / 2;
	this.canvas.height = parseInt(this.canvas.style.height) / 2;
	this.image = this.context.createImageData(
	this.canvas.width * 0.2, this.canvas.height * 0.2);
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
	if (navigator.getUserMedia){
	navigator.getUserMedia({video:true},
	  function(stream){ return that.videoReady(stream); },
	  function(error){ return that.videoError(error); } );
	}
	return true;
};
ROSDASH.HandTracker.prototype.videoReady = function (stream)
{
	if (window.webkitURL) {
		this.video.src = window.webkitURL.createObjectURL(stream);
	} else if (video.mozSrcObject !== undefined) {
		this.video.mozSrcObject = stream;
	} else {
		this.video.src = stream;
	}
	this.tick();
};
ROSDASH.HandTracker.prototype.videoError = function (error)
{};
ROSDASH.HandTracker.prototype.tick = function ()
{
	var that = this, image, candidate;
	requestAnimationFrame( function() { return that.tick(); } );
	if (this.video.readyState === this.video.HAVE_ENOUGH_DATA){
		image = this.snapshot();
		candidate = this.tracker.detect(image);
		this.draw(candidate);
	}
};
ROSDASH.HandTracker.prototype.snapshot = function ()
{
	this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
	return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
};
ROSDASH.HandTracker.prototype.draw = function (candidate)
{
	if (candidate){
		if (this.cbxHull.checked){
		  this.drawHull(candidate.hull, "red");
		}
		if (this.cbxDefects.checked){
		  this.drawDefects(candidate.defects, "blue");
		}
	}
	if (this.cbxSkin.checked){
		this.context.putImageData(
		  this.createImage(this.tracker.mask, this.image), 
		  this.canvas.width - this.image.width,
		  this.canvas.height - this.image.height);
	}
};
ROSDASH.HandTracker.prototype.drawHull = function (hull, color)
{
	var len = hull.length, i = 1;
	if (len > 0){
		this.context.beginPath();
		this.context.strokeStyle = color;
		this.context.moveTo(hull[0].x, hull[0].y);
		for (; i < len; ++ i){
		  this.context.lineTo(hull[i].x, hull[i].y);
		}
		this.context.stroke();
		this.context.closePath();
	}
};
ROSDASH.HandTracker.prototype.drawDefects = function (defects, color)
{
	var len = defects.length, i = 0, point;
	if (len > 0){
		this.context.beginPath();
		this.context.strokeStyle = color;
		for (; i < len; ++ i){
		  point = defects[i].depthPoint;
		  this.context.strokeRect(point.x - 2, point.y - 2, 4, 4);
		}
		this.context.stroke();
		this.context.closePath();
	}
};
ROSDASH.HandTracker.prototype.createImage = function (imagesrc, imagedst)
{
	var src = imagesrc.data, dst = imagedst.data,
	  width = imagesrc.width, span = 4 * width,
	  len = src.length, i = 0, j = 0, k = 0;
	for(i = 0; i < len; i += span){
		for(j = 0; j < width; j += 5){
		  dst[k] = dst[k + 1] = dst[k + 2] = src[i];
		  dst[k + 3] = 255;
		  k += 4;
		  i += 5;
		}
	}
	return imagedst;
};

//////////////////////////////////// roslibjs

// Turtlesim from ROS desktop widget
ROSDASH.Turtlesim = function (block)
{
	this.block = block;
	this.canvas_id = "turtlesim-" + this.block.id;
}
ROSDASH.Turtlesim.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<canvas id="' + this.canvas_id + '" width="' + ROSDASH.ownerConf.widget_width + 'px" height="' + ROSDASH.ownerConf.content_height + 'px"></canvas>';
	return widget;
}
ROSDASH.Turtlesim.prototype.initRos = function ()
{
	//@note a deprecated ROS connection
	var ros = new ROS('ws://localhost:9090');
	var self = this;
	ros.on('connection', function()
	{
		console.log("deprecated rosjs connected");
		var context = document.getElementById(self.canvas_id).getContext('2d');
		var turtleSim = new TurtleSim({
			ros     : ros,
			context : context
		});
		turtleSim.spawnTurtle('turtle1');
		turtleSim.draw();
	});
	return true;
}

// ros2djs
ROSDASH.Ros2d = function (block)
{
	this.block = block;
	this.canvas_id = "ros2d-" + this.block.id;
	this.viewer;
}
ROSDASH.Ros2d.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas_id + '"></div>';
	return widget;
}
ROSDASH.Ros2d.prototype.initRos = function ()
{
	if ($("#" + this.canvas_id).length <= 0)
	{
		return false;
	}
	var that = this;
	// Create the main viewer.
	that.viewer = new ROS2D.Viewer({
	  divID : this.canvas_id,
	  width : ROSDASH.ownerConf.widget_width,
	  height : ROSDASH.ownerConf.content_height
	});
	// Setup the map client.
	var gridClient = new ROS2D.OccupancyGridClient({
	  ros : ROSDASH.ros,
	  rootObject : that.viewer.scene
	});
	// Scale the canvas to fit to the map
	gridClient.on('change', function() {
	  that.viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
	  that.viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
	});
	return true;
}
ROSDASH.Ros2d.prototype.run = function (input)
{
	return {o0 : this.viewer};
}

// ros3djs
// enable 3d for Chrome: (Unfortunately it is not compatible with Diagram)
// type "about:flags" on address bar of google chrome 
// then under "Override software rendering list" click "enable" 
ROSDASH.Ros3d = function (block)
{
	this.block = block;
	this.canvas_id = "ros3d-" + this.block.id;
	this.viewer;
}
ROSDASH.Ros3d.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas_id + '"></div>';
	return widget;
}
ROSDASH.Ros3d.prototype.init = function ()
{
	if ($("#" + this.canvas_id).length <= 0)
	{
		return false;
	}
	var that = this;
	// Create the main viewer.
	that.viewer = new ROS3D.Viewer({
	  divID : that.canvas_id,
	  width : 600, //ROSDASH.ownerConf.widget_width,
	  height : 600, //ROSDASH.ownerConf.content_height,
	  antialias : true
	});
	that.viewer.addObject(new ROS3D.Grid());
	// load the map
	var gridClient = new ROS3D.OccupancyGridClient({
	  ros : ROSDASH.ros,
	  rootObject : that.viewer.scene
	});
	return true;
}
ROSDASH.Ros3d.prototype.run = function (input)
{
	return {o0: this.viewer};
}

ROSDASH.Ros3dUrdf = function (block)
{
	this.block = block;
	this.success = false;
}
ROSDASH.Ros3dUrdf.prototype.run = function (input)
{
	if (! this.success && undefined != input[0])
	{
		new ROS3D.UrdfClient({
			ros : ROSDASH.ros,
			tfClient : new ROSLIB.TFClient({
				ros : ROSDASH.ros,
				angularThres : 0.01,
				transThres : 0.01,
				rate : 10.0
			}),
			path : 'http://resources.robotwebtools.org/',
			rootObject : input[0].scene
		});
		this.success = true;
	}
	return {o0: input[0]};
}

ROSDASH.Ros3dMarker = function (block)
{
	this.block = block;
	this.success = false;
}
ROSDASH.Ros3dMarker.prototype.run = function (input)
{
	if (! this.success && undefined != input[0] && typeof input[1] == "string")
	{
		var markerClient = new ROS3D.MarkerClient({
			ros : ROSDASH.ros,
			tfClient : new ROSLIB.TFClient({
				ros : ROSDASH.ros,
				angularThres : 0.01,
				transThres : 0.01,
				rate : 10.0,
				fixedFrame : '/my_frame'
			}),
			topic : input[1],
			rootObject : input[0].scene
		});
		this.success = true;
	}
	//console.log(this.marker.currentMarker.pose.position.x);
	return {o0: input[0]};
}

ROSDASH.Ros3dInteractiveMarker = function (block)
{
	this.block = block;
	this.success = false;
}
ROSDASH.Ros3dInteractiveMarker.prototype.run = function (input)
{
	if (! this.success && undefined != input[0] && typeof input[1] == "string")
	{
		var markerClient = new ROS3D.InteractiveMarkerClient({
			ros : ROSDASH.ros,
			tfClient : new ROSLIB.TFClient({
				ros : ROSDASH.ros,
				angularThres : 0.01,
				transThres : 0.01,
				rate : 10.0,
				fixedFrame : '/base_link'
			}),
			topic : input[1],
			camera : input[0].camera,
			rootObject : input[0].selectableObjects
		});
		this.success = true;
	}
	return {o0: input[0]};
}

ROSDASH.JoystickToRos3dMarker = function (block)
{
	this.block = block;
	this.default_marker = {
		mesh_use_embedded_materials:false,
		scale:{y:1, x:1, z:1}, 
		frame_locked:false, 
		color:{a:1, r:0, b:0, g:1}, 
		text:"", 
		pose:{
			position:{y:0, x:0, z:0}, 
			orientation:{y:0, x:0, z:0, w:1}}, 
		mesh_resource:"", 
		header:{stamp:{secs:1374700821, nsecs:725229501}, frame_id:"/my_frame", seq:545585}, 
		colors:[], 
		points:[], 
		action:0, 
		lifetime:{secs:0, nsecs:0}, 
		ns:"basic_shapes", 
		type:2, 
		id:0
	};
	this.default_joystick = {
		dx: 0,
		dy: 0,
		right: 0,
		up: 0,
		left: 0,
		down: 0
	};
}
ROSDASH.JoystickToRos3dMarker.prototype.run = function (input)
{
	var marker = (undefined !== input[0] && undefined !== input[0].pose) ? input[0] : this.default_marker;
	var joystick = (undefined !== input[1]) ? input[1] : this.default_joystick;
	marker.pose.position.x -= input[1].dx / 100.0;
	marker.pose.position.y += input[1].dy / 100.0;
	return {o0: marker};
}

ROSDASH.RosInteractiveMarker = function (block)
{
	this.block = block;
	this.default_marker = {
		/*mesh_use_embedded_materials:false,
		scale:{y:1, x:1, z:1}, 
		frame_locked:false, 
		color:{a:1, r:0, b:0, g:1}, 
		text:"", 
		pose:{
			position:{y:0, x:0, z:0}, 
			orientation:{y:0, x:0, z:0, w:1}}, 
		mesh_resource:"", 
		header:{stamp:{secs:1374700821, nsecs:725229501}, frame_id:"/my_frame", seq:545585}, 
		colors:[], 
		points:[], 
		action:0, 
		lifetime:{secs:0, nsecs:0}, 
		ns:"basic_shapes", 
		type:2, 
		id:0*/
	};
	this.default_joystick = {
		dx: 0,
		dy: 0,
		right: 0,
		up: 0,
		left: 0,
		down: 0
	};
}
ROSDASH.RosInteractiveMarker.prototype.run = function (input)
{
	var marker = (undefined !== input[0] && undefined !== input[0].pose) ? input[0] : this.default_marker;
	var joystick = (undefined !== input[1]) ? input[1] : this.default_joystick;
	/*marker.pose.position.x -= input[1].dx / 100.0;
	marker.pose.position.y += input[1].dy / 100.0;*/
	return {o0: marker};
}

// better view in Chrome
ROSDASH.RosMjpeg = function (block)
{
	this.block = block;
	this.canvas = this.block.id + "-RosMjpeg";
	this.viewer;
}
ROSDASH.RosMjpeg.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas + '" style="height:100%; width:100%;" />';
	return widget;
}
ROSDASH.RosMjpeg.prototype.init = function ()
{
	if ($("#" + this.canvas).length <= 0)
	{
		return false;
	}
	var that = this;
	this.viewer = new MJPEGCANVAS.Viewer({
		divID : this.canvas,
		host : ROSDASH.ownerConf.ros_host,
		width : ROSDASH.ownerConf.widget_width,
		height : ROSDASH.ownerConf.content_height,
		// get from block config
		topic : that.block.config.topic
	});
/*
    var viewer = new MJPEGCANVAS.MultiStreamViewer({
      divID : 'mjpeg',
      host : 'localhost',
      width : 640,
      height : 480,
      topics : [ '/wide_stereo/left/image_color', '/l_forearm_cam/image_color',
          '/r_forearm_cam/image_color' ],
      labels : [ 'Robot View', 'Left Arm View', 'Right Arm View' ]
    });
*/
	return true;
}
ROSDASH.RosMjpeg.prototype.run = function (input)
{
	return {o0: this.viewer};
}

//////////////////////////////////// map

//@deprecated
ROSDASH.gmap;
// google maps
ROSDASH.Gmap = function (block)
{
	this.block = block;
	this.canvas_id = "gmap-" + this.block.id;
	var LAB = [49.276802, -122.914913];
	// google maps config from block config
	this.options = (("config" in this.block) && (undefined !== this.block.config.options)) ? this.block.config.options : {
		center : LAB,
		zoom : 14,
		markers : [{
			position : LAB,
			title : 'Autonomy Lab at Simon Fraser University'
		}]
	};
	// add script of gmap and invalid callback
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&' + 'callback=googleMaps';
	document.body.appendChild(script);
	this.gmap = undefined;
}
ROSDASH.Gmap.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas_id + '" style="height:100%; width:100%;" />';
	return widget;
}
ROSDASH.Gmap.prototype.init = function ()
{
	if ($("#" + this.canvas_id).length <= 0)
	{
		return false;
	}
	// google maps options
	var mapOptions = {
	  center: new google.maps.LatLng(parseFloat(this.options.center[0]), parseFloat(this.options.center[1])),
	  zoom: parseFloat(this.options.zoom),
	  mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	this.gmap = new google.maps.Map(document.getElementById(this.canvas_id), mapOptions);
	// add markers
	if ("markers" in this.options)
	{
		for (var i in this.options.markers)
		{
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(parseFloat(this.options.markers[i].position[0]), parseFloat(this.options.markers[i].position[1])),
				map: this.gmap,
				title: this.options.markers[i].title
			});
		}
	}
	return true;
}
//@input	none
//@output	gmap object
ROSDASH.Gmap.prototype.run = function (input)
{
	ROSDASH.gmap = this.gmap;
	return {o0: this.gmap};
}
ROSDASH.Gmap.prototype.resizeGmap = function ()
{
	google.maps.event.trigger(this.gmap, "resize");
}

// google maps robot trajectory overlay
ROSDASH.GmapTraj = function (block)
{
	this.block = block;
	this.robot = {
		marker: undefined,
		path: new Array(),
		last_loc: new Array()
	};
}
//@input	google maps object, Pos2D
//@output	google maps object
ROSDASH.GmapTraj.prototype.run = function (input)
{
	var new_x = input[1].y, new_y = -input[1].x;
	if (this.robot.last_loc[0] == new_x && this.robot.last_loc[1] == new_y)
	{
		return {o0: input[0]};
	}
	// clear the old position
	if (undefined !== this.robot.marker)
	{
		this.robot.marker.setMap(null);
	}
	this.robot.marker = new google.maps.Marker({
		position: new google.maps.LatLng(new_x, new_y),
		map: input[0],	// google maps object
		title: "robot",
		icon: "resource/cabs.png",
		//shadow: {url: 'resource/cabs.shadow.png',}
	});
	// keep the length of path no longer than a threshold
	while (this.robot.path.length >= 20)
	{
		this.robot.path[0].setMap(null);
		this.robot.path.splice(0, 1);
	}
	var color = "black";
	var weight = 1;
	var icon = new Array();
	if (undefined === this.robot.last_loc)
	{
		this.robot.last_loc[0] = new_x;
		this.robot.last_loc[1] = new_y;
	}
	// add path
	this.robot.path.push(new google.maps.Polyline({
		map: input[0],
		path: [new google.maps.LatLng(this.robot.last_loc[0], this.robot.last_loc[1]), new google.maps.LatLng(new_x, new_y)],
		strokeColor: color,
		strokeOpacity: 1,
		strokeWeight: weight,
		icons: icon
	}));
	this.robot.last_loc[0] = new_x;
	this.robot.last_loc[1] = new_y;
	return {o0: input[0]};
}

// grids on Google maps representing energy
ROSDASH.GmapEnergyGrid = function (block)
{
	this.block = block;
	this.center = (undefined !== this.block.config && undefined !== this.block.config.center) ? this.block.config.center : [49.276802, -122.914913];
	this.gmap = undefined;
	this.robot = {
		x : this.center[0],
		y : this.center[1]
	};
	this.remove_grids = false;
	this.grids = new Object();
	this.grid_value = new Object();
	this.update_grid = new Object();
}
//@input	google maps object, Pos2D
//@output	google maps object
ROSDASH.GmapEnergyGrid.prototype.run = function (input)
{
	this.gmap = input[0];
	this.robot.x = input[1].y;
	this.robot.y = -input[1].x;
	this.showGrids(this.calcGrids(this.robot.x, this.robot.y));
	return {o0: input[0]};
}
ROSDASH.GmapEnergyGrid.prototype.calcGrids = function (x, y)
{
	var grid = this.coordToGrid(x, y);
	return [grid[0], grid[1], 5, 13];
}
ROSDASH.GmapEnergyGrid.prototype.coordToGrid = function (x, y)
{
	var GRID_SIZE = .001;
	return [Math.round((x - this.center[0] - GRID_SIZE/2) / GRID_SIZE), Math.round((y - this.center[1] - GRID_SIZE/2) / GRID_SIZE)];
}
ROSDASH.GmapEnergyGrid.prototype.clearGrids = function ()
{
	for (i in this.grids)
	{
		google.maps.event.clearListeners(this.grids[i], "click");
		this.grids[i].setMap(null);
	}
}
ROSDASH.GmapEnergyGrid.prototype.showGrids = function (grid)
{
	/*
	if (this.remove_grids)
	{
		this.remove_grids = false;
		this.clearGrids();
		return;
	} else
	{
		this.remove_grids = true;
	}
	*/
	var that = this;
	// I guess it is the way to calculate the grid size, don't need to fix the size of grid
	var grid_size = .001; // * Math.pow(17, 10) / Math.pow(map.getZoom(), 10);
	var center_pos = that.coordToGrid(that.gmap.getCenter().lat(), that.gmap.getCenter().lng());
	var dist, min;
	update_grid = new Object();
	for (var i = 0; i + 3 < grid.length; i += 4)
	{
		// the format of the data is "x y color value"
		var x = grid[i];//Math.round(Math.random() * GRID_NUM - GRID_NUM / 2);
		var y = grid[i+1];
		var color = parseInt(grid[i+2]).toString(16);//Math.round(Math.random() * 160).toString(16);
		if (color.length == 1)
		{
			color = "0" + color;
		}
		else if (color.length > 2)
		{
			color = color.substr(0, 2);
		}
		color = "#FF" + color + color;
		var tmp_grid;
		if ((x + " " + y) in that.grids)
		{
			tmp_grid = that.grids[x + " " + y];
		}
		that.grids[x + " " + y] = new google.maps.Rectangle({
			strokeColor: 'grey',
			strokeOpacity: 0.2,
			strokeWeight: 1,
			fillColor: color,
			fillOpacity: 0.8,
			map: that.gmap,
			title: "value: " + grid[i+3],
			bounds: new google.maps.LatLngBounds(
				new google.maps.LatLng(this.center[0] + x * grid_size, this.center[1] + y * grid_size),
				new google.maps.LatLng(this.center[0] + x * grid_size + grid_size, this.center[1] + y * grid_size + grid_size))
		});
		// old grid need to be deleted, and tmp_grid is used to avoid flashing
		if (typeof tmp_grid != "undefined")
		{
			google.maps.event.clearListeners(that.grids[x + " " + y], "click");
			tmp_grid.setMap(null);
		}
		// add the info window into the grid
		google.maps.event.addListener(that.grids[x + " " + y], "click", function (event)
		{
			var grid_pos = that.coordToGrid(event.latLng.lat(), event.latLng.lng());
			if (! ((grid_pos[0] + " " + grid_pos[1]) in that.grid_value))
			{
				return;
			}
			var info = '<table border="1"><tr><td>grid</td><td>('+grid_pos[0] + ", " + grid_pos[1]+')</td></tr>'
				+ '<tr><td>location</td><td>('+event.latLng.lat()+', '+event.latLng.lng()+')</td></tr>'
				+ '<tr><td>value</td><td>'+ that.grid_value[grid_pos[0] + " " + grid_pos[1]] +'</td></tr>'
				+ '<tr><td>color</td><td>'+ that.grids[grid_pos[0] + " " + grid_pos[1]].fillColor +'</td></tr></table>';
			var infownd = new google.maps.InfoWindow({
				content: info,
				position: event.latLng
			});
			infownd.open(that.gmap);
		});
		// save the grid value in order to be displayed on the info window
		that.grid_value[x + " " + y] = grid[i+3];
		that.update_grid[x + " " + y] = true;
	}
	for (i in that.grids)
	{
		if (! (i in that.update_grid) || ! that.update_grid[i])
		{
			google.maps.event.clearListeners(that.grids[i], "click");
			that.grids[i].setMap(null);
		}
	}
}

//////////////////////////////////// plot

// safe range for text or plot widget
ROSDASH.FlotSafeRange = function (block)
{
	this.block = block;
	this.min = 3;
	this.max = 8;
}
//@input	the value to be tested
//@output	if it is in safe range
ROSDASH.FlotSafeRange.prototype.run = function (input)
{
	return {
		o0: "threshold",
		o1: {above : this.max, below : this.min}
	};
}

// a plot widget
//@todo a uniform representation for plotting
ROSDASH.Flot = function (block)
{
	this.block = block;
	this.plot;
	this.canvas = "flot-" + this.block.id;
	this.options = (undefined !== this.block.config.options) ? this.block.config.options : {
		// drawing is faster without shadows
		series: {
			shadowSize: 0,
			lines: {show: true},
			points: {show: true}
		},
		crosshair: {mode: "x"},
		zoom: {interactive: true},
		pan: {interactive: true},
		// it can adjust automatically
		yaxis: {
			tickFormatter: function (v, axis)
			{
				return v.toFixed(2);
			}
		},
		legend: { position: "nw" },
		grid: {
			show: true,
			hoverable: true,
			autoHighlight: false
		}
	};
}
ROSDASH.Flot.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas + '" style="height:100%; width:100%;" />';
	return widget;
}
ROSDASH.Flot.prototype.getDefaultData = function ()
{
	var d1 = [];
	for (var i = 0; i < 14; i += 0.5) {
		d1.push([i, Math.sin(i)]);
	}
	var d2 = [[0, 3], [4, 8], [8, 5], [9, 13]];
	// A null signifies separate line segments
	var d3 = [[0, 12], [7, 12], null, [7, 2.5], [12, 2.5]];
	return [ d1, d2, d3 ];
}
ROSDASH.Flot.prototype.init = function ()
{
	if ($("#" + this.canvas).length <= 0)
	{
		return false;
	}
	// create the plot with default data
	this.plot = $.plot("#" + this.canvas, this.getDefaultData(), this.option);
	return true;
}
//@input	data
//@output	plot object
ROSDASH.Flot.prototype.run = function (input)
{
	// change data format into [[x, data], ...]
	var data = new Array();
	for (var i in input[0])
	{
		var original;
		if (typeof input[0][i] == "object" && undefined !== input[0][i].data)
		{
			original = input[0][i].data;
		} else
		{
			original = input[0][i];
		}
		var d = new Array();
		for (var j in original)
		{
			if (typeof original[j] != "array")
			{
				d.push([j, original[j]]);
			} else if (original[j].length < 2)
			{
				d.push([j, original[j][0]]);
			} else
			{
				d.push([original[j][0], original[j][1]]);
			}
		}
		if (typeof input[0][i] == "object" && undefined !== input[0][i].data)
		{
			original = input[0][i];
			original.data = d;
		} else
		{
			original = d;
		}
		data.push(original);
	}
	// update dynamically
	this.plot.setData( data );
	this.plot.draw();
	return {o0 : this.plot};
}

ROSDASH.raserScanToFlot = function (block)
{
	this.block = block;
}
ROSDASH.raserScanToFlot.prototype.run = function (input)
{
	var output = new Array();
	output.push(input[0].ranges);
	//output.push(input[0].intensities);
	return {o0 : output};
}

//////////////////////////////////// other outputs

// V U meter
//@todo input and output
ROSDASH.Vumeter = function (block)
{
	this.block = block;
	this.canvas_id = "vumeter_" + this.block.id;
	this.config = ("config" in this.block) ? this.block.config : {
	    chart: {
	        type: 'gauge',
	        plotBorderWidth: 1,
	        plotBackgroundColor: {
	        	linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
	        	stops: [
	        		[0, '#FFF4C6'],
	        		[0.3, '#FFFFFF'],
	        		[1, '#FFF4C6']
	        	]
	        },
	        plotBackgroundImage: null,
	        height: 200
	    },
	    title: {
	        text: 'VU meter'
	    },
	    pane: [{
	        startAngle: -45,
	        endAngle: 45,
	        background: null,
	        center: ['25%', '145%'],
	        size: 300
	    }, {
	    	startAngle: -45,
	    	endAngle: 45,
	    	background: null,
	        center: ['75%', '145%'],
	        size: 300
	    }],
	    yAxis: [{
	        min: -20,
	        max: 6,
	        minorTickPosition: 'outside',
	        tickPosition: 'outside',
	        labels: {
	        	rotation: 'auto',
	        	distance: 20
	        },
	        plotBands: [{
	        	from: 0,
	        	to: 6,
	        	color: '#C02316',
	        	innerRadius: '100%',
	        	outerRadius: '105%'
	        }],
	        pane: 0,
	        title: {
	        	text: 'VU<br/><span style="font-size:8px">Channel A</span>',
	        	y: -40
	        }
	    }, {
	        min: -20,
	        max: 6,
	        minorTickPosition: 'outside',
	        tickPosition: 'outside',
	        labels: {
	        	rotation: 'auto',
	        	distance: 20
	        },
	        plotBands: [{
	        	from: 0,
	        	to: 6,
	        	color: '#C02316',
	        	innerRadius: '100%',
	        	outerRadius: '105%'
	        }],
	        pane: 1,
	        title: {
	        	text: 'VU<br/><span style="font-size:8px">Channel B</span>',
	        	y: -40
	        }
	    }],
	    plotOptions: {
	    	gauge: {
	    		dataLabels: {
	    			enabled: false
	    		},
	    		dial: {
	    			radius: '100%'
	    		}
	    	}
	    },
	    series: [{
	        data: [-20],
	        yAxis: 0
	    }, {
	        data: [-20],
	        yAxis: 1
	    }]
	};
	this.update = function (){};
	this.meter = undefined;
	this.left_val = 0;
	this.right_val = 0;
}
ROSDASH.Vumeter.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas_id + '" style="width:100%; height:100%; margin: 0 auto;"></div>';
	return widget;
}
ROSDASH.Vumeter.prototype.init = function ()
{
	var that = this;
	this.meter = $('#' + this.canvas_id).highcharts(this.config,
	// Let the music play
	function(chart)
	{
	    setInterval(function()
	    {
	        var left = chart.series[0].points[0],
	            right = chart.series[1].points[0],
	            leftVal, 
	            inc = (Math.random() - 0.5) * 3;
	
	        leftVal =  left.y + inc;
	        rightVal = leftVal + inc / 3;
	        if (leftVal < -20 || leftVal > 6) {
	            leftVal = left.y - inc;
	        }
	        if (rightVal < -20 || rightVal > 6) {
	            rightVal = leftVal;
	        }
	        left.update(that.left_val, false);
	        right.update(that.right_val, false);
	        chart.redraw();
	    }, 500);
	});
	return true;
}
//@input	none
//@output	meter object
ROSDASH.Vumeter.prototype.run = function (input)
{
	this.left_val = input[0];
	this.right_val = input[1];
	return {o0 : this.meter};
}

//////////////////////////////////// robot simulation

// 2d position controlled by joystick
ROSDASH.Pos2d = function (block)
{
	this.block = block;
	var LAB = [49.276802, -122.914913];
	this.pose2d = {
		x : (undefined !== this.block.config.init_x) ? parseFloat(this.block.config.init_x) : LAB[0],
		y : (undefined !== this.block.config.init_y) ? parseFloat(this.block.config.init_y) : LAB[1],
		theta : (undefined !== this.block.config.init_theta) ? parseFloat(this.block.config.init_theta) : 0,
	};
	this.acceleration = {
		x : (undefined !== this.block.config.acc_x) ? parseFloat(this.block.config.acc_x) : 1,
		y : (undefined !== this.block.config.acc_y) ? parseFloat(this.block.config.acc_y) : 1,
		theta : (undefined !== this.block.config.acc_theta) ? parseFloat(this.block.config.acc_theta) : 1,
	};
}
//@input		joystick control
//@output		Pos2D msg
ROSDASH.Pos2d.prototype.run = function (input)
{
	this.pose2d.x += input[0].axes[0] * this.acceleration.x;
	this.pose2d.y += input[0].axes[1] * this.acceleration.y;
	this.pose2d.theta += input[0].axes[3] * this.acceleration.theta;
	return {o0: this.pose2d};
}

// a simulated mobile robot
ROSDASH.SimRobot = function (block)
{
	var LAB = [49.276802, -122.914913];
	this.block = block;
	this.boundary = [-100, 100];
	this.last_loc = LAB; //[0, 0];
	this.loc_step = 0.001; //5;
}
//@input	none
//@output	location x, location y, speed, voltage, current
ROSDASH.SimRobot.prototype.run = function (input)
{
	var loc = new Array();
	for (var i = 0; i < 2; ++ i)
	{
		loc[i] = this.last_loc[i] + (Math.random() - 0.5) * this.loc_step;
		/*if (loc[i] < this.boundary[0])
		{
			loc[i] = this.boundary[0];
		} else if (loc[i] > this.boundary[1])
		{
			loc[i] = this.boundary[1];
		}*/
	}
	var output = {
		o0: loc[0], // location x
		o1: loc[1], // location y
		o2: Math.random() * 10, // speed
		o3: Math.random() * 100, // voltage
		o4: Math.random() * 100 // current
	};
	return output;
}

//////////////////////////////////// user interfaces

ROSDASH.UserLogin = function (block)
{
	this.block = block;
}
ROSDASH.UserLogin.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="janrainEngageEmbed"></div>';
	return widget;
}
ROSDASH.UserLogin.prototype.init = function ()
{
    if (typeof window.janrain !== 'object') window.janrain = {};
    if (typeof window.janrain.settings !== 'object') window.janrain.settings = {};
    janrain.settings.tokenUrl = 'http://192.168.1.116/rosdash-devel/panel.html?status=login'; //'http://localhost/rosdash-devel/token-url.php'; //'__REPLACE_WITH_YOUR_TOKEN_URL__';
    function isReady()
    {
		janrain.ready = true;
	};
	/*
    if (document.addEventListener) {
      document.addEventListener("DOMContentLoaded", isReady, false);
    } else {
      window.attachEvent('onload', isReady);
    }
    */
    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.id = 'janrainAuthWidget';
    if (document.location.protocol === 'https:') {
      e.src = 'https://rpxnow.com/js/lib/rosdash/engage.js';
    } else {
      e.src = 'http://widget-cdn.rpxnow.com/js/lib/rosdash/engage.js';
    }
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(e, s);
    isReady();
}

// a list of owner names
ROSDASH.OwnerList = function (block)
{
	this.block = block;
	this.column = 3;
	// a list of owner names
	this.owners = new Array();
	// a list of links to ownders' pages
	this.list = new Array();
	this.ajax_return = false;
}
ROSDASH.OwnerList.prototype.init = function ()
{
	if (this.ajax_return)
	{
		return true;
	}
	var self = this;
	$.ajax({
		type: "POST",
		url: "rosdash.php",
		data: {
			func: "getOwnerList"
		},
		success: function( data, textStatus, jqXHR )
		{
			self.ajax_return = true;
			self.list = new Array();
			self.owners = data.split(",");
			var list = new Array();
			for (var i in self.owners)
			{
				if ("" != self.owners[i] && " " != self.owners[i])
				{
					// a link to owner's personal page
					list.push('<a href="panel.html?owner=' + self.owners[i] + '">' + self.owners[i] + '</a>');
				}
				if (list.length >= self.column)
				{
					self.list.push(list);
					list = new Array();
				}
			}
			if (list.length > 0)
			{
				self.list.push(list);
			}
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			console.error("OwnerList error: ", jqXHR, textStatus, errorThrown);
		}
	}).always(function() {});
	return true;
}
ROSDASH.OwnerList.prototype.run = function (input)
{
	if (! this.ajax_return)
	{
		this.init();
	}
	return {o0: this.list};
}

// user welcome
ROSDASH.userWelcome = function (block)
{
	this.block = block;
}
ROSDASH.userWelcome.prototype.userLogin = function ()
{
    if (typeof window.janrain !== 'object') window.janrain = {};
    if (typeof window.janrain.settings !== 'object') window.janrain.settings = {};
    janrain.settings.tokenUrl = 'http://192.168.1.116/rosdash-devel/panel.html?status=login'; //'http://localhost/rosdash-devel/token-url.php'; //'__REPLACE_WITH_YOUR_TOKEN_URL__';
    function isReady()
    {
		janrain.ready = true;
	};
    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.id = 'janrainAuthWidget';
    if (document.location.protocol === 'https:') {
      e.src = 'https://rpxnow.com/js/lib/rosdash/engage.js';
    } else {
      e.src = 'http://widget-cdn.rpxnow.com/js/lib/rosdash/engage.js';
    }
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(e, s);
    isReady();
}
// callback function for createPersonal button
ROSDASH.userWelcome.prototype.createPersonal = function (name)
{
	var self = this;
	$.ajax({
		type: "POST",
		url: "rosdash.php",
		data: {
			func: "newUser",
			username: name
		},
		success: function( data, textStatus, jqXHR )
		{
			console.log("newUser success", data);
			// relocate to new user's personal page
			location.replace("panel.html?owner=" + name);
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			console.error("newUser error", jqXHR, textStatus, errorThrown);
		}
	}).always(function( data, textStatus, jqXHR ) {});
}
// callback function for new panel button
ROSDASH.userWelcome.prototype.newPanel = function (name)
{
	var self = this;
	$.ajax({
		type: "POST",
		url: "rosdash.php",
		data: {
			func: "newPanel",
			username: ROSDASH.ownerConf.name,
			panel: name,
		},
		success: function( data, textStatus, jqXHR )
		{
			console.log("newUser success: ", data);
			// relocate to new panel page
			location.replace("editor.html?owner=" + ROSDASH.ownerConf.name + "&panel=" + name);
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			console.error("newUser error: ", jqXHR, textStatus, errorThrown);
		}
	}).always(function( data, textStatus, jqXHR ) {});
}
ROSDASH.userWelcome.prototype.addWidget = function (widget)
{
	widget.widgetTitle = 'Welcome to ROSDASH';
	// if index page
	if ("index" == ROSDASH.ownerConf.name)
	{
		widget.widgetContent = '<h1 style="color:blue;">Welcome to ROSDASH !</h1>'
			+ '<p style="color:Navy;">A web-based platform of dashboards for roboticists and ROS users.</p>'
			+ '<div id="janrainEngageEmbed" align="center"></div>';
		// for a user
		if ("Guest" != ROSDASH.userConf.name)
		{
			// add createPersonal
			widget.widgetContent += '<p>or'
				+ '<input type="button" value="Goto your personal Dashboard" id="submit_' + this.block.id + '">'
			+ '</p>';
		}
	} else // if a user's personal page
	{
		// add welcome
		widget.widgetContent = '<h1 style="color:blue;">Welcome to ROSDASH, ' + ROSDASH.ownerConf.name + ' !</h1>';
		// add user discription
		if (undefined !== ROSDASH.ownerConf.discrip && "" != ROSDASH.ownerConf.discrip)
		{
			widget.widgetContent += '<p style="color:Navy;">' + ROSDASH.ownerConf.discrip + '</p>';
		}
		// add "add new page"
		widget.widgetContent += //'Your ROS host name:<input type="text" name="ros" id="roshost">'
			'<p>Please select a panel or diagram from the list</p>';
		if (ROSDASH.userConf.name == ROSDASH.ownerConf.name || "@@sudo@@" == ROSDASH.userConf.name)
		{
			widget.widgetContent += '<p>or Add a new one '
					+ '<input type="text" name="name" id="newname_' + this.block.id + '">'
					+ '<input type="button" value="Submit" id="submit_' + this.block.id + '">'
				+ '</p>';
		}
	}
	return widget;
}
ROSDASH.userWelcome.prototype.init = function (input)
{
	var that = this;
	// if index page
	if ("index" == ROSDASH.ownerConf.name)
	{
		this.userLogin();
		if ("Guest" != ROSDASH.userConf.name)
		{
			// append createPersonal callback function to that button
			$("#submit_" + that.block.id).click(function ()
			{
				// send user input to function
				that.createPersonal(ROSDASH.userConf.name);
			});
		} else
		{
		}
	} else
	{
		$("#submit_" + that.block.id).click(function ()
		{
			that.newPanel($("#newname_" + that.block.id).val());
		});
	}
}

// a list of panel names for a user
ROSDASH.panelList = function (block)
{
	this.block = block;
	// a list of panel names
	this.panels = new Array();
	// a list of links to panels
	this.list = new Array();
	this.ajax_return = false;
}
ROSDASH.panelList.prototype.init = function ()
{
	if (this.ajax_return)
	{
		return true;
	}
	var self = this;
	$.ajax({
		type: "POST",
		url: "rosdash.php",
		data: {
			func: "getPanelList",
			user: ROSDASH.ownerConf.name
		},
		success: function ( data, textStatus, jqXHR )
		{
			self.ajax_return = true;
			self.list = new Array();
			self.panels = data.split(" ");
			var list = new Array();
			for (var i in self.panels)
			{
				if ("" == self.panels[i] || " " == self.panels[i])
				{
					continue;
				}
				var pos = self.panels[i].indexOf("-");
				// get the name of panel
				var file_name = self.panels[i].substring(0, pos);
				if (pos < 0)
				{
					continue;
				}
				// if a panel
				else if (self.panels[i].substring(pos) == "-panel.json")
				{
					// first show the panel name
					list.push(file_name);
					// a link to that panel
					list.push('<a href="panel.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + file_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port + '" target="_blank">Panel</a>');
					// a link to editor
					list.push('<a href="editor.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + file_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port + '" target="_blank">Editor</a>');
					// if exists diagram
					if (self.panels.indexOf(file_name + "-diagram.json") != -1)
					{
						// a link to diagram
						list.push('<a href="diagram.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + file_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port + '" target="_blank">Diagram</a>');
						// delete diagram from name list
						self.panels.splice(self.panels.indexOf(file_name + "-diagram.json"), 1);
					} else // if diagram does not exist
					{
						list.push(" ");
					}
				}
				// if diagram
				else if (self.panels[i].substring(pos) == "-diagram.json")
				{
					list.push(file_name);
					// if panel exists
					if (self.panels.indexOf(file_name + "-panel.json") != -1)
					{
						list.push('<a href="panel.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + file_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port + '" target="_blank">Panel</a>');
						list.push('<a href="editor.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + file_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port + '" target="_blank">Editor</a>');
						self.panels.splice(self.panels.indexOf(file_name + "-panel.json"), 1);
					} else
					{
						list.push(" ");
					}
					list.push('<a href="diagram.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + file_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port + '" target="_blank">Diagram</a>');
				} else
				{
					continue;
				}
				self.list.push(list);
				list = new Array();
			}
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			console.log("panelList error: ", jqXHR, textStatus, errorThrown);
		}
	}).always(function() {});
	return true;
}
ROSDASH.panelList.prototype.run = function (input)
{
	if (! this.ajax_return)
	{
		this.init();
	}
	return {o0: this.list};
}

ROSDASH.jsonEditor = function (block)
{
	this.block = block;
	this.canvas = "jsonEditor-" + this.block.id;
	this.success = false;
	this.json = {
		"string": "example",
		"number": 5,
		"array": [1, 2, 3],
		"object": {
			"property": "value",
			"subobj": {
				"arr": ["foo", "ha"],
				"numero": 1
			}
		}
	};
}
ROSDASH.jsonEditor.prototype.updateJson = function (data)
{
	this.json = data;
	console.log("json update", this, this.json)
}
ROSDASH.jsonEditor.prototype.addWidget = function (widget)
{
	var title = this.block.config.jsonname;
	if (this.block.config.readonly)
	{
		title += " (readonly)";
	}
	title += '<input type="button" id="' + this.canvas + '-save" value="save" />';
	widget.widgetTitle = title;
	widget.widgetContent = 
		'<div id="' + this.canvas + 'legend">' +
			'<span id="' + this.canvas + 'expander" style="cursor: pointer; background-color: black; padding: 2px 4px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: white; font-weight: bold; text-shadow: 1px 1px 1px black;">Expand all</span>' +
			'<span class="array" style="background-color: #2D5B89; padding: 2px 4px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: white; font-weight: bold; text-shadow: 1px 1px 1px black;">array</span>' +
			'<span class="object" style="background-color: #E17000; padding: 2px 4px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: white; font-weight: bold; text-shadow: 1px 1px 1px black;">object</span>' +
			'<span class="string" style="background-color: #009408; padding: 2px 4px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: white; font-weight: bold; text-shadow: 1px 1px 1px black;">string</span>' +
			'<span class="number" style="background-color: #497B8D; padding: 2px 4px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: white; font-weight: bold; text-shadow: 1px 1px 1px black;">number</span>' +
			'<span class="boolean" style="background-color: #B1C639; padding: 2px 4px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: white; font-weight: bold; text-shadow: 1px 1px 1px black;">boolean</span>' +
			'<span class="null" style="background-color: #B1C639; padding: 2px 4px; -webkit-border-radius: 5px; -moz-border-radius: 5px; border-radius: 5px; color: white; font-weight: bold; text-shadow: 1px 1px 1px black;">null</span>' +
		'</div>' +
		'<div id="' + this.canvas + '" class="json-editor"></div>';
	return widget;
}
ROSDASH.jsonEditor.prototype.init = function ()
{
	var that = this;
    $('#' + this.canvas + 'expander').click(function() {
        var editor = $('#' + that.canvas);
        editor.toggleClass('expanded');
        $(this).text(editor.hasClass('expanded') ? 'Collapse' : 'Expand all');
    });
    $('#' + this.canvas + '-save').click(function() {
		ROSDASH.saveJson(that.json, that.block.config.filename);
    });
    if (undefined !== this.block.config && (typeof ROSDASH[this.block.config.jsonname] == "object" || typeof ROSDASH[this.block.config.jsonname] == "array"))
    {
		this.json = ROSDASH[this.block.config.jsonname];
	}
    $('#' + that.canvas).jsonEditor(that.json, { change: that.updateJson, propertyclick: null });
    return true;
}
ROSDASH.jsonEditor.prototype.run = function (input)
{
	var that = this;
	if (! this.success && (typeof input[0] == "object" || typeof input[0] == "array"))
	{
		that.json = input[0];
		$('#' + that.canvas).jsonEditor(that.json, { change: that.updateJson, propertyclick: null });
		this.success = true;
	}
}

ROSDASH.jsonVis = function (block)
{
	this.block = block;
	this.canvas = "jsonVis" + this.block.id;
	this.json = {
        "string": "foo",
        "number": 5,
        "array": [1, 2, 3],
        "object": {
            "property": "value",
            "subobj": {
                "arr": ["foo", "ha"],
                "numero": 1
            }
        }
    };
}
ROSDASH.jsonVis.prototype.treeify = function (json, name, head)
{
    head['name']  = name;
    if (_.isObject(json) || _.isArray(json)) {
        head['children'] = [];
        for (var key in json) {
            if (!json.hasOwnProperty(key)) continue;
            var child = {};
            head['children'].push(child);
            this.treeify(json[key], key, child);
        }
    }
}
ROSDASH.jsonVis.prototype.vizcluster = function (json)
{
    var tree = {};
    this.treeify(json, 'JSON', tree);
    $('#' + this.canvas).empty();
    var w = 900;
    var h = 900;
    var rx = w / 2;
    var ry = h / 2;
    var cluster = d3.layout.cluster()
        .size([360, ry - 120])
        .sort(null);
    var diagonal = d3.svg.diagonal.radial()
        .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });
    var svg = d3.select('#' + this.canvas).append('div')
        .style('width', w + 'px')
        .style('height', w + 'px');
    var vis = svg.append("svg:svg")
        .attr("width", w)
        .attr("height", w)
        .append("svg:g")
        .attr("transform", "translate(" + rx + "," + ry + ")");
    vis.append("svg:path")
        .attr("class", "arc")
        .attr("d", d3.svg.arc().innerRadius(ry - 120).outerRadius(ry).startAngle(0).endAngle(2 * Math.PI));
    var nodes = cluster.nodes(tree);
    var link = vis.selectAll("path.link")
        .data(cluster.links(nodes))
        .enter().append("svg:path")
        .attr("class", "link")
        .attr("d", diagonal);
    var node = vis.selectAll("g.node")
        .data(nodes)
        .enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })
    node.append("svg:circle")
        .attr("r", 3);
    node.append("svg:text")
        .attr("dx", function(d) { return d.x < 180 ? 8 : -8; })
        .attr("dy", ".31em")
        .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
        .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
        .text(function(d) { return d.name; });
}
ROSDASH.jsonVis.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<div id="' + this.canvas + '"></div>';
	return widget;
}
ROSDASH.jsonVis.prototype.init = function ()
{
	this.vizcluster(this.json);
	return true;
}
ROSDASH.jsonVis.prototype.run = function (input)
{
	if (undefined === input[0] || "" == input[0])
	{
		return;
	}
	this.vizcluster(input[0]);
}

//////////////////////////////////// others

//slide from www.slideshare.net
ROSDASH.slide = function (block)
{
	this.block = block;
	this.config = ("config" in this.block) ? this.block.config : new Object();
	if (undefined === this.config.src)
	{
		this.config.src = "http://www.slideshare.net/slideshow/embed_code/16073451";
	}
	if (undefined === this.config.width)
	{
		this.config.width = "100%";
	}
	if (undefined === this.config.height)
	{
		this.config.height = "100%";
	}
	if (undefined === this.config.style)
	{
		this.config.style = "border:1px solid #CCC; border-width:1px 1px 0; margin-bottom:5px;";
	}
}
ROSDASH.slide.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<iframe src="' + this.config.src + '" width="' + this.config.width + '" height="' + this.config.height + '" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" style="' + this.config.style + '" allowfullscreen webkitallowfullscreen mozallowfullscreen> </iframe>';
	return widget;
}

ROSDASH.FathomSlide = function (block)
{
	this.block = block;
}
ROSDASH.FathomSlide.prototype.addWidget = function (widget)
{
	widget.widgetContent = 
			'<div id="presentation">'
				+ '<div class="slide">'
					+ '<h1>Slide 1</h1>'
				+ '</div>'
				+ '<div class="slide">'
					+ '<h1>Slide 2</h1>'
				+ '</div>'
				+ '<div class="slide">'
					+ '<h1>Slide 3</h1>'
				+ '</div>'
				+ '<div class="slide">'
					+ '<h1>Slide 4</h1>'
				+ '</div>'
				+ '<div class="slide">'
					+ '<h1>Slide 5</h1>'
				+ '</div>'
			+ '</div>';
	return widget;
}
ROSDASH.FathomSlide.prototype.init = function ()
{
	$("#presentation").fathom();
}

// video from youtube
ROSDASH.youtube = function (block)
{
	this.block = block;
	this.config = ("config" in this.block) ? this.block.config : new Object();
	if (undefined === this.config.src)
	{
		this.config.src = "//www.youtube.com/embed/SxeVZdJFB4s";
	}
	if (undefined === this.config.width)
	{
		this.config.width = "100%";
	}
	if (undefined === this.config.height)
	{
		this.config.height = "100%";
	}
	
}
ROSDASH.youtube.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<iframe width="' + this.config.width + '" height="' + this.config.height + '" src="' + this.config.src + '" frameborder="0" allowfullscreen></iframe>';
	return widget;
}

//////////////////////////////////// for fun

ROSDASH.DoodleGod = function (block)
{
	this.block = block;
}
ROSDASH.DoodleGod.prototype.addWidget = function (widget)
{
	widget.widgetContent = '<object width="180" height="135"><param name="movie" value="http://www.fupa.com/swf/doodle-god/doodlegod.swf"></param><embed src="http://www.fupa.com/swf/doodle-god/doodlegod.swf" type="application/x-shockwave-flash" width="300px" height="200px"></embed></object>';
	return widget;
}

