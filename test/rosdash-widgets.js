ROSDASH.Constant = new Object();
ROSDASH.Constant.run = function (block, input)
{
	return {o0: block.value};
}

ROSDASH.rosArray = new Object();
ROSDASH.rosArray.run = function (block, input)
{
	var a = new Array();
	for (var i in input)
	{
		a.push(input[i]);
	}
	return {o0: a};
}

ROSDASH.memArray = new Object();
ROSDASH.memArray.data = new Object();
ROSDASH.memArray.length = 100;
ROSDASH.memArray.run = function (block, input)
{
	if (! (block.id in ROSDASH.memArray.data))
	{
		ROSDASH.memArray.data[block.id] = new Array();
	}
	ROSDASH.memArray.data[block.id].push(input[0]);
	if (ROSDASH.memArray.length < ROSDASH.memArray.data[block.id].length)
	{
		ROSDASH.memArray.data[block.id].splice(0, ROSDASH.memArray.data[block.id].length - ROSDASH.memArray.length);
	}
	return {o0: ROSDASH.memArray.data[block.id]};
}

ROSDASH.Addition = new Object();
ROSDASH.Addition.run = function (block, input)
{
	var sum = input[0];
	for (var i = 1; i < input.length; ++ i)
	{
		sum += input[i];
	}
	return {o0: sum};
}

ROSDASH.Switch = new Object();
ROSDASH.Switch.run = function (block, input)
{
	//@todo design default value and compulsory inputs
	if (input.length < 2)
	{
		console.error("input not enough: " + block.id);
		return undefined;
	}
	var output = new Object();
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
	} else
	{
		if (input[0] == input[1])
		{
			output["o0"] = true;
		} else
		{
			output["o0"] = false;
		}
	}
	return output;
}

ROSDASH.rosMsg = new Object();
ROSDASH.Topic = new Object();
ROSDASH.Topic.runOnce = function (block)
{
	var rosname = block.rosname;
	var type = 'std_msgs/String';
	ROSDASH.rosMsg[rosname] = {error: "cannot connect to this topic"};
	var listener = new ROSLIB.Topic({
		ros : ROSDASH.ros,
		name : rosname,
		messageType : type
	});
	listener.subscribe(function(message)
	{
		ROSDASH.rosMsg[rosname] = message;
		//listener.unsubscribe();
	});
}
ROSDASH.Topic.run = function (block, input)
{
	var output = new Object();
	if (undefined !== block.rosname)
	{
		//ROSDASH.rosMsg[name] = "running";
		output.o0 = ROSDASH.rosMsg[block.rosname];
	}
	return output;
}

ROSDASH.ToggleButton = new Object();
ROSDASH.ToggleButton.init = function (widget)
{
	widget.widgetContent = '<input id="mySwitch" type="checkbox" checked />';
	return widget;
}
ROSDASH.ToggleButton.runOnce = function (block)
{
	if ($('#mySwitch').length > 0)
	{
		$('#mySwitch').wrap('<div id="mySwitch2" class="switch" data-on-label="ROCK!" data-off-label="NO" />').parent().bootstrapSwitch();
		$('#mySwitch2').on('switch-change', function (e, data) {
			var $el = $(data.el)
			  , value = data.value;
			console.log("toggled button");
		});
		//$('#toggle-state-switch').bootstrapSwitch('toggleState');
		//$('#toggle-state-switch').bootstrapSwitch('setState', false); // true || false
	} else
	{
		setTimeout(ROSDASH.ToggleButton.runOnce, 500);
	}
}

ROSDASH.msgToStr = new Object();
ROSDASH.msgToStr.run = function (block, input)
{
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
			str += ROSDASH.msgToStr.run(block, {0: msg[i]}).o0;
			str += " ) ";
		}
	} else
	{
		str += msg;
	}
	var output = {o0: str};
	return output;
}
ROSDASH.Text = new Object();
ROSDASH.Text.run = function (block, input)
{
	input[0] = (undefined === input[0]) ? block.name : input[0];
	input[1] = (undefined === input[1]) ? "(empty content)" : input[1];
	$("#myDashboard").sDashboard("setHeaderById", block.id, input[0]);
	$("#myDashboard").sDashboard("setContentById", block.id, input[1]);
}

ROSDASH.Speech = new Object();
ROSDASH.Speech.init = function (widget)
{
	widget.widgetTitle = widget.widgetId + ' <input type="button" id="speak" value="speak" /><span id="audio"></span>';
	widget.widgetContent = "";
	return widget;
}
ROSDASH.Speech.runOnce = function (block)
{
	var s = $("#speak");
	if (s.length > 0)
	{
		$("#speak").click(ROSDASH.Speech.speak);
	}
}
ROSDASH.Speech.content = "";
ROSDASH.Speech.run = function (block, input)
{
	input[0] = (undefined === input[0]) ? "(empty content)" : input[0];
	ROSDASH.Speech.content = input[0];
	$("#myDashboard").sDashboard("setContentById", block.id, input[0]);
}
ROSDASH.Speech.speak = function ()
{
	speak(ROSDASH.Speech.content);
}

ROSDASH.Table = new Object();
ROSDASH.Table.run = function (block, input)
{
	input[0] = (undefined === input[0]) ? block.name : input[0];
	var aoColumns = new Array();
	for (var i in input[1])
	{
		aoColumns.push({sTitle: input[1][i]});
	}
	$("#myDashboard").sDashboard("setHeaderById", block.id, input[0]);
	var tableDef = {
		"aaData" : input[2],
		"aoColumns" : aoColumns
	};
	var dataTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display sDashboardTableView table table-bordered"></table>').dataTable(tableDef);
	$("#myDashboard").sDashboard("setContentById", block.id, dataTable);
}

ROSDASH.Turtlesim = new Object();
ROSDASH.Turtlesim.init = function (widget)
{
	widget.widgetContent = '<canvas id="world" width="100%" height="100%" style="border: 2px solid black"></canvas>';
	return widget;
}
ROSDASH.Turtlesim.runOnce = function (block)
{
      var ros = new ROS('ws://192.168.1.123:9090');
      ros.on('connection', function() {
        var context = document.getElementById('world').getContext('2d');
        var turtleSim = new TurtleSim({
          ros     : ros
        , context : context
        });
        turtleSim.spawnTurtle('turtle1');
        turtleSim.draw();
      });
}

ROSDASH.Ros2d = new Object();
ROSDASH.Ros2d.init = function (widget)
{
	widget.widgetContent = '<div id="ros2d_map"></div>';
	return widget;
}
ROSDASH.Ros2d.runOnce = function (block)
{
	if (ROSDASH.ros_connected)
	{
		// Create the main viewer.
		var viewer = new ROS2D.Viewer({
		  divID : 'ros2d_map',
		  width : 308,
		  height : 250
		});
		// Setup the map client.
		var gridClient = new ROS2D.OccupancyGridClient({
		  ros : ROSDASH.ros,
		  rootObject : viewer.scene
		});
		// Scale the canvas to fit to the map
		gridClient.on('change', function() {
		  viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
		  viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
		});
	} else
	{
		setTimeout(ROSDASH.Ros2d.runOnce, 500);
	}
}

ROSDASH.Ros3d = new Object();
ROSDASH.Ros3d.init = function (widget)
{
	widget.widgetContent = '<div id="ros3d_map"></div>';
	return widget;
}
ROSDASH.Ros3d.runOnce = function (block)
{
	if (ROSDASH.ros_connected)
	{
		// Create the main viewer.
		var viewer = new ROS3D.Viewer({
		  divID : 'ros3d_map',
		  width : 80,
		  height : 60,
		  antialias : true
		});
		// Setup the marker client.
		var gridClient = new ROS3D.OccupancyGridClient({
		  ros : ROSDASH.ros,
		  rootObject : viewer.scene
		});
	} else
	{
		setTimeout(ROSDASH.Ros3d.runOnce, 500);
	}
}

ROSDASH.Gmap = new Object();
ROSDASH.Gmap.gmap = undefined;
ROSDASH.Gmap.init = function (widget)
{
	widget.widgetContent = '<div id="map-canvas" style="height:100%; width:100%;" />';
	return widget;
}
ROSDASH.Gmap.runOnce = function ()
{
	var LAB = [49.276802, -122.914913];
	if ($("#map-canvas").length)
	{
		var mapOptions = {
		  center: new google.maps.LatLng(LAB[0], LAB[1]),
		  zoom: 14,
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		ROSDASH.Gmap.gmap = new google.maps.Map(document.getElementById("map-canvas"),
			mapOptions);
	} else
	{
		setTimeout(ROSDASH.Gmap.runOnce, 500);
	}
}
ROSDASH.Gmap.resizeGmap = function ()
{
	google.maps.event.trigger(ROSDASH.Gmap.gmap, "resize");
}

ROSDASH.GmapTraj = new Object();
ROSDASH.GmapTraj.robot = new Object();
ROSDASH.GmapTraj.run = function (block, input)
{
	if (input.length < 2 || undefined === input[0])
	{
		return;
	}
	if (! (block.id in ROSDASH.GmapTraj.robot))
	{
		ROSDASH.GmapTraj.robot[block.id] = new Object();
	}
	for (var i in input[1])
	{
		if (undefined !== ROSDASH.GmapTraj.robot[block.id].robot)
		{
			ROSDASH.GmapTraj.robot[block.id].robot.setMap(null);
		}
		ROSDASH.GmapTraj.robot[block.id].robot = new google.maps.Marker({
			position: new google.maps.LatLng(input[1][i].x, input[1][i].y),
			map: input[0],
			title: "robot " + i,
			icon: "resource/cabs.png",
			//shadow: {url: 'resource/cabs.shadow.png',}
		});
	}
}

ROSDASH.SafeRange = new Object();
ROSDASH.SafeRange.min = 0;
ROSDASH.SafeRange.max = 100;
ROSDASH.SafeRange.run = function (block, input)
{
	if (input[0] < ROSDASH.SafeRange.min || input[0] > ROSDASH.SafeRange.max)
	{
		return {o0: false};
	} else
	{
		return {o0: true};
	}
}

ROSDASH.Flot = new Object();
ROSDASH.Flot.plot;
ROSDASH.Flot.init = function (widget)
{
	var id = "flot_" + widget.widgetId;
	widget.widgetContent = '<div id="' + id + '" style="height:100%;width:100%;" />';
	return widget;
}
ROSDASH.Flot.getDefaultData = function ()
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
ROSDASH.Flot.option = {
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
	//@note still some bugs
	//yaxis: { min: 0, max: 100 },
	yaxis: {
		tickFormatter: function (v, axis)
		{
			return v.toFixed(2);
		}
	},
	grid: {show: true},
	legend: { position: "nw" },
	grid: {
		show: true,
		hoverable: true,
		autoHighlight: false
	}
};
ROSDASH.Flot.runOnce = function (block)
{
	var id = "flot_" + block.id;
	if ($("#" + id).length > 0)
	{
			ROSDASH.Flot.plot = $.plot("#" + id, ROSDASH.Flot.getDefaultData(), ROSDASH.Flot.option);
	}
}
ROSDASH.Flot.run = function (block, input)
{
	input[0] = (undefined === input[0]) ? block.name : input[0];
	$("#myDashboard").sDashboard("setHeaderById", block.id, input[0]);
	if (undefined !== input[1])
	{
		var data = new Array();
		for (var i in input[1])
		{
			var d = new Array();
			for (var j in input[1][i])
			{
				if (typeof input[1][i][j] != "array")
				{
					d.push([j, input[1][i][j]]);
				} else if (input[1][i][j].length < 2)
				{
					d.push([j, input[1][i][j][0]]);
				} else
				{
					d.push([input[1][i][j][0], input[1][i][j][1]]);
				}
			}
			data.push(d);
		}
		ROSDASH.Flot.plot.setData( data );
		ROSDASH.Flot.plot.draw();
	}
}

ROSDASH.Vumeter = new Object();
ROSDASH.Vumeter.init = function (widget)
{
	widget.widgetContent = '<div id="vumeter_container" style="width:100%; height:100%; margin: 0 auto;"></div>';
	return widget;
}
ROSDASH.Vumeter.runOnce = function (block)
{
	$('#vumeter_container').highcharts({
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
	
	},
	// Let the music play
	function(chart) {
	    setInterval(function() {
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
	
	        left.update(leftVal, false);
	        right.update(rightVal, false);
	        chart.redraw();
	    }, 500);
	});
}

ROSDASH.SimRobot = new Object();
ROSDASH.SimRobot.boundary = [-100, 100];
ROSDASH.SimRobot.last_loc = [0, 0];
ROSDASH.SimRobot.loc_step = 5;
ROSDASH.SimRobot.run = function (block, input)
{
	var loc = new Array();
	for (var i = 0; i < 2; ++ i)
	{
		loc[i] = ROSDASH.SimRobot.last_loc[0] + (Math.random() - 0.5) * ROSDASH.SimRobot.loc_step;
		if (loc[i] < ROSDASH.SimRobot.boundary[0])
		{
			loc[i] = ROSDASH.SimRobot.boundary[0];
		} else if (loc[i] > ROSDASH.SimRobot.boundary[1])
		{
			loc[i] = ROSDASH.SimRobot.boundary[1];
		}
	}
	var output = {
		o0: loc[0], //location x
		o1: loc[1], //location y
		o2: Math.random() * 10, //speed
		o3: Math.random() * 100, //voltage
		o4: Math.random() * 100 //current
	};
	return output;
}
