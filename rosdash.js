var ROSDASH = new Object();


///////////////////////////////////// constant parameters


// the status of development, i.e. devel, stable
ROSDASH.develStatus = "devel";

// the parameters from url, executes immediately
ROSDASH.queryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    	// If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    	// If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    	// If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();


///////////////////////////////////// events


// event emitter
ROSDASH.ee = ("EventEmitter" in window) ? new EventEmitter() : undefined;
// event when the page is loaded
$(document).ready(function() {
	// event when the document has been fully loaded
	ROSDASH.ee.emitEvent('pageReady');
});


///////////////////////////////////// dashboard


// load the entire dashboard
ROSDASH.startDash = function ()
{
	// be careful with the order
	ROSDASH.loadDash();
	ROSDASH.initJson();
	ROSDASH.initToolbar("toolbar");
	ROSDASH.initSidebar("sidebar");
}
// load an empty dashboard
ROSDASH.loadDash = function ()
{
	$("#panel").empty();
	// create empty dashboard editor
	$("#panel").sDashboard({
		dashboardData : [],
		disableSelection : ROSDASH.dashConf.disable_selection
	});
	ROSDASH.dashBindEvent("panel");
	// show it
	$("#panel").css("visibility", "visible");
	// fade in
	$("#panel").fadeIn("slow");

	$("#cy").empty();
	// create an empty cytoscape diagram
	$('#cy').cytoscape({
		showOverlay: false,
		style: ROSDASH.defaultStyle,
		elements: {nodes: new Array(), edges: new Array()},
		ready: function ()
		{
			window.cy = this;
		}
	});
}
// show view or not
ROSDASH.showView = function (from, to)
{
	// if the same view
	if (to == from)
	{
		return;
	}
	// only editor and diagram have sidebar
	if ("panel" == to || "editor" == to || "diagram" == to)
	{
		$("#canvas").css("left", "160px");
		$("#sidebar").show("slide", { direction: "left" }, 500);
	} else
	{
		// remove sidebar
		$("#sidebar").hide("slide", { direction: "left" }, 500);
		$("#canvas").css("left", "0px");
	}
	var from_canvas;
	// remove the original view
	switch (from)
	{
	case "panel":
		from_canvas = "panel";
		break;
	case "editor":
		from_canvas = "editor";
		break;
	case "diagram":
		from_canvas = "cy";
		break;
	case "json":
		from_canvas = "json";
		break;
	case "docs":
		from_canvas = "docs";
		break;
	default:
		break;
	}
	if (undefined !== from_canvas)
	{
		// hide it
		$("#" + from_canvas).css("visibility", "hidden");
		// fade out
		$("#" + from_canvas).fadeOut("slow");
	}
	var to_canvas;
	// show the new view
	switch (to)
	{
	case "panel":
		to_canvas = "panel";
		ROSDASH.resetPanelToolbar();
		break;
	case "editor":
		to_canvas = "editor";
		ROSDASH.resetEditorToolbar();
		break;
	case "diagram":
		to_canvas = "cy";
		ROSDASH.resetDiagramToolbar();
		break;
	case "json":
		to_canvas = "json";
		ROSDASH.resetJsonToolbar();
		ROSDASH.loadJsonEditor(ROSDASH.getDashJson());
		break;
	case "docs":
		to_canvas = "docs";
		ROSDASH.resetDefaultToolbar();
		break;
	default:
		to_canvas = undefined;
		console.error("show wrong view", from, to);
		break;
	}
	if (undefined !== to_canvas)
	{
		// show it
		$("#" + to_canvas).css("visibility", "inherit");
		// fade in
		$("#" + to_canvas).fadeIn("slow");
	}
	// switch to new view type
	ROSDASH.dashConf.view = to;
	// init sidebar form
	ROSDASH.initForm();
}

// if dashboard has been changed
ROSDASH.dashChanged = false;
// create a json representing a dashboard
ROSDASH.getDashJson = function ()
{
	var json = ROSDASH.dashConf;
	json.version = ROSDASH.version;
	json.date = new Date().toString();
	// diagram blocks
	json.block = new Object();
	// diagram edges
	json.edge = new Array();
	if ("cy" in window && typeof window.cy.fit == "function")
	{
		// don't save popups into file
		ROSDASH.removeAllPopup();
		// add all edges into json
		window.cy.edges().each(function (i, ele)
		{
			var e = {
				source: ele.source().id(),
				target: ele.target().id()
			};
			json.edge.push(e);
		});
	}
	// add all blocks into json
	for (var i in ROSDASH.blocks)
	{
		json.block[i] = ROSDASH.blocks[i];
	}
	return json;
}

// dashboard configuration
ROSDASH.dashConf = {
	// basic
	name: "index",
	discrip: "",
	view: "panel",

	// ros
	host: "",
	port: "",

	// dependencies
	require: [],
	//@deprecated
	js: [],
	css: [],
	json: [],

	// panel
	disable_selection: true,
	run_msec: 200,
	widget_width: 400,
	widget_height: 230,
	header_height: 16,
	content_height: 180
};
// if started loading json files specified by dash file
ROSDASH.loadDashJson = false;
// set config, and load required json
ROSDASH.setDashConf = function (conf)
{
	// set all config
	for (var i in conf)
	{
		if (i in ROSDASH.dashConf)
		{
			if ("version" == i && ROSDASH.dashConf.version != conf.version)
			{
				console.error("configure version conflicts", conf.version, ROSDASH.dashConf.version);
				continue;
			}
			if ("panel_name" == i && ROSDASH.dashConf.name != conf.name)
			{
				console.error("panel_name conflicts", conf.name, ROSDASH.dashConf.name);
				continue;
			}
			ROSDASH.dashConf[i] = conf[i];
		}
	}
	ROSDASH.checkDashConfValid(ROSDASH.dashConf);
	// load json specified by dash config
	for (var i in ROSDASH.dashConf.json)
	{
		if (undefined === ROSDASH.dashConf.json[i] || "" == ROSDASH.dashConf.json[i] || " " == ROSDASH.dashConf.json[i])
		{
			continue;
		}
		ROSDASH.loadJson(ROSDASH.dashConf.json[i], function (json)
		{
			ROSDASH.loadWidgetDef(json.widgets);
		});
	}
	ROSDASH.loadDashJson = true;
}
// check if dashboard config is valid or not
ROSDASH.checkDashConfValid = function (conf)
{
	// run speed too fast
	if (conf.run_msec < 1)
	{
		console.warning("run_msec is too low: ", conf.run_msec);
		conf.run_msec = 100;
	}
	// set default port
	if (undefined === conf.port || "" == conf.port || " " == conf.port)
	{
		conf.port = "9090";
	}
}


///////////////////////////////////// panel


// load widgets from json
ROSDASH.loadPanel = function (blocks)
{
	if (undefined === blocks)
	{
		return;
	}
	// create an empty panel
	$("#panel").empty();
	$("#panel").sDashboard({
		dashboardData : [],
		disableSelection : ROSDASH.dashConf.disable_selection
	});
	ROSDASH.dashBindEvent("panel");

	var widgets = new Array();
	// create object for each widget config
	for (var i in blocks)
	{
		if (("has_panel" in blocks[i]) && (true == blocks[i].has_panel || "true" == blocks[i].has_panel))
		{
			var order = parseInt(blocks[i].order);
			widgets[order] = {
				"widgetTitle":		blocks[i].name,
				"widgetId":			blocks[i].id,
				"number":			blocks[i].number,
				"widgetType":		blocks[i].type,
				"pos":				order,
				"width":			blocks[i].width,
				"height":			blocks[i].height,
				"header_height":	blocks[i].header_height,
				"content_height":	blocks[i].content_height
			};
		}
	}
	// add widget in reverse order
	for (var i = widgets.length - 1; i >= 0; -- i)
	{
		if (! (i in widgets))
		{
			continue;
		}
		ROSDASH.addWidget(widgets[i]);
	}
	ROSDASH.ee.emitEvent("panelReady");
}
// start to run widgets
ROSDASH.runPanel = function ()
{
	ROSDASH.ee.emitEvent("initBegin");
	for (var i in ROSDASH.connection)
	{
		//ROSDASH.initWidget(i);
	}
	ROSDASH.runStatus = "initialized";
	ROSDASH.ee.emitEvent("runBegin");
	ROSDASH.runWidgets();
}
// bind callback functions
ROSDASH.dashBindEvent = function (canvas)
{
	$("#" + canvas).bind("sdashboardorderchanged", function(e, data)
	{
		ROSDASH.moveWidget(data.sortedDefinitions);
	});
	$("#" + canvas).bind("sdashboardheaderclicked", ROSDASH.selectWidgetCallback);
	$("#" + canvas).bind("sdashboardwidgetmaximized", ROSDASH.widgetMaxCallback);
	$("#" + canvas).bind("sdashboardwidgetminimized", ROSDASH.widgetMaxCallback);
	$("#" + canvas).bind("sdashboardwidgetadded", ROSDASH.widgetAddCallback);
	$("#" + canvas).bind("sdashboardwidgetremoved", function(e, data)
	{
		ROSDASH.removeWidget(data.widgetDefinition.widgetId);
	});
	$("#" + canvas).bind("sdashboardwidgetset", ROSDASH.widgetSetCallback);
	$("#" + canvas).bind("sdashboardheaderset", ROSDASH.headerSetCallback);
}
ROSDASH.widgetMaxCallback = function (e, data)
{}
ROSDASH.widgetAddCallback = function (e, data)
{}
ROSDASH.widgetSetCallback = function (e, data)
{}
ROSDASH.headerSetCallback = function (e, data)
{}


///////////////////////////////////// jsonEditor


// the json in jsonEditor
ROSDASH.jsonEditorJson = {
	"string": "test",
	"number": 5,
	"array": [1, 2, 3],
	"object": {
		"property": "test1",
		"subobj": {
			"arr": ["test2", "test3"],
			"numero": 1
		}
	}
};
// load it
ROSDASH.loadJsonEditor = function (src)
{
	ROSDASH.jsonEditorJson = src;
	// callback for json text
    $('#jsontext').change(function () {
        var val = $('#jsontext').val();
        if (val)
        {
            try {
				ROSDASH.jsonEditorJson = JSON.parse(val);
			}
            catch (e) {
				console.error('Error in parsing json', e);
				return;
			}
			// update jsoneditor
			$('#jsoneditor').jsonEditor(ROSDASH.jsonEditorJson, { change: function (data) {
				ROSDASH.jsonEditorJson  = data;
				// update jsontext
				$('#jsontext').val(JSON.stringify(json));
				// reload everything
				//ROSDASH.loadEditor(data.block);
				ROSDASH.loadDiagram(data);
			}, propertyclick: null });
			// reload everything
			//ROSDASH.loadEditor(ROSDASH.jsonEditorJson.block);
			ROSDASH.loadDiagram(ROSDASH.jsonEditorJson);
        } else
        {
			console.error("invalid json", val);
			return;
        }
    });
    // callback for expander button
    $('#expander').click(function () {
        var editor = $('#jsoneditor');
        editor.toggleClass('expanded');
        $(this).text(editor.hasClass('expanded') ? 'Collapse' : 'Expand all');
    });
	// set json to jsoneditor and text
	$('#jsontext').val(JSON.stringify(ROSDASH.jsonEditorJson));
    $('#jsoneditor').jsonEditor(ROSDASH.jsonEditorJson, { change: function (data) {
		ROSDASH.jsonEditorJson  = data;
		// update jsontext
		$('#jsontext').val(JSON.stringify(json));
		// reload everything
		//ROSDASH.loadEditor(data.block);
		ROSDASH.loadDiagram(data);
	}, propertyclick: null });
}


///////////////////////////////////// block definitions


// json file names for blocks
ROSDASH.blockFiles = ["blocks.json"];
// block definitions
ROSDASH.blockDef = new Object();
// block lists for sidebar
ROSDASH.blockList = new Object();
// widget lists for sidebar
ROSDASH.widgetList = new Object();

// load widget json from files
ROSDASH.loadBlockFiles = function (files)
{
	// load from widget definition json
	for (var i in files)
	{
		ROSDASH.loadJson(files[i], function (json)
		{
			ROSDASH.loadWidgetDef(json.widgets);
		});
	}
}
// load widgets from json
ROSDASH.loadWidgetDef = function (data)
{
	// for each widget json
	for (var k in data)
	{
		// wrong format
		if (! ("type" in data[k]))
		{
			continue;
		}
		// save to ROSDASH.blockDef
		ROSDASH.blockDef[data[k].type] = data[k];
		// save to list for sidebar
		ROSDASH.loadBlockList(data[k]);
	}
}
// set to sidebar lists
ROSDASH.loadBlockList = function (json)
{
	// alias for block list for sidebar
	var list = ROSDASH.blockList;
	// alias for widget list for panel sidebar
	var list2 = ROSDASH.widgetList;
	// add category name to list
	for (var m in json.category)
	{
		// alias
		var c = json.category[m];
		// goto this category directory
		if (c in list)
		{
			list = list[c];
		} else
		{
			// add to block category directory
			list[c] = new Object();
			list = list[c];
		}
		// add to widget category directory
		if (json.has_panel)
		{
			if (c in list2)
			{
				list2 = list2[c];
			} else
			{
				list2[c] = new Object();
				list2 = list2[c];
			}
		}
	}
	// add definition to block list
	if (! ("_" in list))
	{
		list["_"] = new Array();
	}
	list["_"].push(json.type);
	// add definition to widget list
	if (json.has_panel)
	{
		if (! ("_" in list2))
		{
			list2["_"] = new Array();
		}
		list2["_"].push(json.type);
	}
}

// if widget name valid in widget definition list
ROSDASH.checkBlockTypeValid = function (name)
{
	return (name in ROSDASH.blockDef) && ("class_name" in ROSDASH.blockDef[name]);
}


///////////////////////////////////// msg type definitions


// file path list for msg jsons
ROSDASH.msgFiles = ["msgs.json"];
// msg list for sidebar
ROSDASH.msgList = new Object();
// msg definitions
ROSDASH.msgs = new Object();

// load message type definitions from json files
ROSDASH.loadMsgJson = function ()
{
	for (var i in ROSDASH.msgFiles)
	{
		ROSDASH.loadJson(ROSDASH.msgFiles[i]);
	}
}
// parse message for sidebar list
ROSDASH.loadMsgDef = function ()
{
	if (undefined === ROSDASH.msgList)
	{
		ROSDASH.msgList = new Object();
	}
	if (undefined === ROSDASH.msgList["_"])
	{
		ROSDASH.msgList["_"] = new Array();
	}
	// add to msg list
	var list = ROSDASH.msgList["_"];
	for (var i in ROSDASH.msgFiles)
	{
		var data = ROSDASH.jsonLoadList[ROSDASH.msgFiles[i]].data.msgs;
		for (var j in data)
		{
			if (undefined != data[j].name)
			{
				// add to definition list
				ROSDASH.msgs[data[j].name] = data[j];
				// add to msg list for sidebar
				list.push(data[j].name);
			}
		}
	}
	ROSDASH.traverseMsgType();
}

//@todo msg type relations
ROSDASH.msgTypes = new Object();
ROSDASH.traverseMsgType = function ()
{
	for (var i in ROSDASH.msgs)
	{
		if (! (i in ROSDASH.msgTypes))
		{
			ROSDASH.msgTypes[i] = "msgs";
		}
		if (typeof ROSDASH.msgs[i].definition != "array")
		{
			continue;
		}
		for (var j in ROSDASH.msgs[i].definition)
		{
			if (! ("type" in ROSDASH.msgs[i].definition[j]))
			{
				continue;
			}
			ROSDASH.msgTypes[ROSDASH.msgs[i].definition[j].type] = "def";
		}
	}
}

// the default value for a msg
ROSDASH.getMsgDefaultValue = function (name)
{
	// not exist
	if (! (name in ROSDASH.msgs) || ! ("definition" in ROSDASH.msgs[name]))
	{
		console.error("getMsgDefaultValue error", name);
		return null;
	}
	var value;
	// if it is a simple value without sub-msgs
	if (1 == ROSDASH.msgs[name].definition.length)
	{
		switch (ROSDASH.msgs[name].definition[0].type)
		{
		case "int32":
		case "int64":
			value = 0;
			break;
		case "float32":
		case "float64":
			value = 0.0;
			break;
		case "string":
		default:
			value = "";
			break;
		}
	} else
	{
		// an json value
		value = new Object();
		for (var i in ROSDASH.msgs[name].definition)
		{
			value[ROSDASH.msgs[name].definition[i].name] = "";
		}
	}
	return value;
}
//@deprecated get message type definitions from ROSDASH.msg_json
ROSDASH.getMsgDef = function (name)
{
	for (var i in ROSDASH.msgFiles)
	{
		var json = ROSDASH.jsonLoadList[ROSDASH.msgFiles[i]].data;
		for (var j in json)
		{
			var json2 = json[j];
			if (undefined === json2.name)
			{
				for (var k in json2)
				{
					if (json2[k].name == name)
					{
						return json2[k];
					}
				}
			} else
			{
				if (json2.name == name)
				{
					return json2;
				}
			}
		}
	}
	return undefined;
}
// check if it is an existing msg type
ROSDASH.checkMsgTypeValid = function (name)
{
	return (undefined !== ROSDASH.getMsgDef(name));
}


///////////////////////////////////// load json


// the data list from json files
ROSDASH.jsonLoadList = new Object();
ROSDASH.frontpageJson = 'data/output.json';
// init loading msg type and widget definitions from json files
ROSDASH.initJson = function ()
{
	ROSDASH.loadMsgJson();
	ROSDASH.loadBlockFiles(ROSDASH.blockFiles);
	// load the frontpage from json file
	ROSDASH.loadJson(ROSDASH.frontpageJson, function (json)
	{
		//@todo
		//ROSDASH.connectROS(ROSDASH.dashConf.host, ROSDASH.dashConf.port);
		// load diagram
		ROSDASH.loadDiagram(json);
		// parse diagrma for loading panel
		ROSDASH.parseDiagram(json);
	});
	ROSDASH.waitJson();
}

// status if all json loading are ready
ROSDASH.jsonReady = false;
// wait when loading jsons
ROSDASH.waitJson = function ()
{
	//@deprecated if dash conf is loaded, load specified jsons. must be executed before examine jsonLoadList
	var conf_path = "data/index/conf.json";
	if (! ROSDASH.loadDashJson && (conf_path in ROSDASH.jsonLoadList) && 2 == ROSDASH.jsonLoadList[conf_path].status)
	{
		ROSDASH.setDashConf(ROSDASH.jsonLoadList[conf_path].data);
	}
	// if loading finishes or not
	var flag = true;
	for (var i in ROSDASH.jsonLoadList)
	{
		// if loading fails
		if (ROSDASH.jsonLoadList[i].status < 0)
		{
			// don't reload, just ignore it
		}
		// if loading is unsuccessful or not finishes
		else if (ROSDASH.jsonLoadList[i].status < 2 && ROSDASH.jsonLoadList[i].status >= 0)
		{
			flag = false;
			// if returned but not succeed, read again
			if (1 == ROSDASH.jsonLoadList[i].status)
			{
				console.warn("load file again", i);
				ROSDASH.loadJson(i);
			}
			break;
		}
	}
	// if not ready
	if (! flag)
	{
		// wait again
		setTimeout(ROSDASH.waitJson, 300);
	} else
	{
		// emit a event for json ready
		ROSDASH.ee.emitEvent("jsonReady");
		ROSDASH.jsonReady = true;
		// parse msgs after loading json
		ROSDASH.loadMsgDef();
	}
}


///////////////////////////////////// widget requirements


// a list of requirements, i.e. js, css, json, etc.
ROSDASH.loadList = new Object();
// check all statically loaded scripts
ROSDASH.checkScripts = function ()
{
	$("script").each(function (key, value) {
		var src = $(this).attr("src");
		ROSDASH.loadList[src] = new Object();
		ROSDASH.loadList[src].data = value;
		ROSDASH.loadList[src].type = undefined;
		ROSDASH.loadList[src].status = 2;
	});
}
ROSDASH.ee.addListener("pageReady", ROSDASH.checkScripts);

// load required files, i.e. js, css, etc.
ROSDASH.loadRequired = function (i)
{
	if (undefined === ROSDASH.blocks[i])
	{
		setTimeout(ROSDASH.loadRequired[i], 100);
		return;
	}
	if (undefined === ROSDASH.blocks[i].require)
	{
		ROSDASH.blocks[i].require = new Object();
	}
	// load required js
	if (undefined !== ROSDASH.blockDef[ROSDASH.connection[i].block.type] && undefined !== ROSDASH.blockDef[ROSDASH.connection[i].block.type].js)
	{
		for (var j in ROSDASH.blockDef[ROSDASH.connection[i].block.type].js)
		{
			ROSDASH.blocks[i].require[ ROSDASH.blockDef[ROSDASH.connection[i].block.type].js[j] ] = false;
			try {
				ROSDASH.loadJs(ROSDASH.blockDef[ROSDASH.connection[i].block.type].js[j], function (data)
				{
					ROSDASH.blocks[i].require[ ROSDASH.blockDef[ROSDASH.connection[i].block.type].js[j] ] = true;
				});
			} catch (err)
			{
				ROSDASH.connection[i].error = true;
				console.error("loading js required by widget error:", ROSDASH.connection[i].block.type, ROSDASH.blockDef[ROSDASH.connection[i].block.type].js[j], err.message, err.stack);
			}
		}
	}
	// load required css
	if (ROSDASH.blockDef[ROSDASH.connection[i].block.type] && undefined !== ROSDASH.blockDef[ROSDASH.connection[i].block.type].css)
	{
		for (var j in ROSDASH.blockDef[ROSDASH.connection[i].block.type].css)
		{
			ROSDASH.blocks[i].require[ ROSDASH.blockDef[ROSDASH.connection[i].block.type].js[j] ] = false;
			try {
				ROSDASH.loadCss(ROSDASH.blockDef[ROSDASH.connection[i].block.type].js[j], function (data)
				{
					ROSDASH.blocks[i].require[ ROSDASH.blockDef[ROSDASH.connection[i].block.type].js[j] ] = true;
				});
			} catch (err)
			{
				ROSDASH.connection[i].error = true;
				console.error("loading css required by widget error:", ROSDASH.connection[i].block.type, ROSDASH.blockDef[ROSDASH.connection[i].block.type].css[j], err.message, err.stack);
			}
		}
	}
}
// wait for loading js
ROSDASH.waitLoadJs = function ()
{
	// if loading finishes or not
	var flag = true;
	for (var i in ROSDASH.loadList)
	{
		// if not loaded
		if (ROSDASH.loadList[i].status < 2 && ROSDASH.loadList[i].status != 0)
		{
			ROSDASH.loadJs(i);
			flag = false;
		}
	}
	if (! flag)
	{
		// wait for loading again
		console.log("wait for loading js");
		setTimeout(ROSDASH.waitLoadJs, 300);
	} else
	{
		//@todo successfully loaded
		ROSDASH.instantiateWidgets();
		ROSDASH.loadPanel(ROSDASH.blocks);
	}
}

// load json and register them
ROSDASH.loadJson = function (file, func)
{
	if (undefined === file || "" == file)
	{
		return;
	}
	// init status
	if (! (file in ROSDASH.jsonLoadList))
	{
		ROSDASH.jsonLoadList[file] = new Object();
	}
	if (undefined === ROSDASH.jsonLoadList[file].status)
	{
		ROSDASH.jsonLoadList[file].status = 0;
		ROSDASH.jsonLoadList[file].type = "json";
	}
	// do not load again
	if (ROSDASH.jsonLoadList[file].status >= 2)
	{
		return;
	}
	$.getJSON(file, function (data, status, xhr)
	{
		ROSDASH.jsonLoadList[file].data = data;
		// if successful, status = 1 + 1
		ROSDASH.jsonLoadList[file].status = 1;
		console.log("load", file);
		if (typeof(func) == "function")
		{
			return func(data);
		}
	})
	.fail(function (jqXHR, textStatus) {
		console.error("fail to load", file, jqXHR, textStatus);
		ROSDASH.jsonLoadList[file].status = -10;
	})
	.always(function () {
		// if not successful, status = 1
		++ ROSDASH.jsonLoadList[file].status;
	});
}
// load js file required by widgets
ROSDASH.loadJs = function (file, func)
{
	if (undefined === file || "" == file)
	{
		return;
	}
	if (undefined === ROSDASH.loadList[file])
	{
		ROSDASH.loadList[file] = new Object();
	}
	if (undefined === ROSDASH.loadList[file].status)
	{
		ROSDASH.loadList[file].status = 0;
		ROSDASH.loadList[file].type = "js";
	}
	// do not load again
	if (ROSDASH.loadList[file].status >= 2)
	{
		return;
	}
	$.getScript(file, function (data, status, jqxhr)
	{
		ROSDASH.loadList[file].data = data;
		ROSDASH.loadList[file].status = 1;
		console.log("load", file);
		if (typeof(func) == "function")
		{
			return func(data);
		}
	}).fail(function (jqxhr, settings, exception)
	{
		ROSDASH.loadList[file].status = -10;
		console.warn("fail to load", file, jqxhr, settings, exception);
	}).always(function() {
		++ ROSDASH.loadList[file].status;
	});
}
// load css file
ROSDASH.loadCss = function (file, func)
{
	if (undefined === file || "" == file)
	{
		return;
	}
	if (undefined === ROSDASH.loadList[file])
	{
		ROSDASH.loadList[file] = new Object();
	}
	if (undefined === ROSDASH.loadList[file].status)
	{
		ROSDASH.loadList[file].status = 0;
	}
	$('head').append('<link rel="stylesheet" href="' + file + '" type="text/css" />');
	ROSDASH.loadList[file].data = file;
	ROSDASH.loadList[file].type = "css";
	ROSDASH.loadList[file].status = 2;
	if (typeof(func) == "function")
	{
		return func(data);
	}
	console.log("load", file);
}

// transform from raw json into real json, i.e. "true" => true
ROSDASH.transformRawJson = function (json)
{
	for (var i in json)
	{
		if ("true" == json[i])
		{
			json[i] = true;
		} else if ("false" == json[i])
		{
			json[i] = false;
		} else if ("null" == json[i])
		{
			json[i] = null;
		} else if ("undefined" == json[i])
		{
			json[i] = undefined;
		} else if (typeof json[i] == "object" || typeof json[i] == "array")
		{
			json[i] = ROSDASH.transformRawJson(json[i]);
		}
	}
	return json;
}
// download json in a new window
ROSDASH.downloadJson = function (json)
{
	window.open('data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json)), 'Download');
}
// save data to json file in server
//@note PHP will ignore empty json part
ROSDASH.saveJson = function (data, filename)
{
	$.ajax({
		type: "POST",
		url: "rosdash.php",
		dataType: 'json',
		data: {
			func: "saveFile",
			file_name: filename,
			data: data
		},
		success: function( data, textStatus, jqXHR )
		{
			console.log("saveJson successful", filename, data, textStatus, jqXHR.responseText);
			ROSDASH.ee.emitEvent("saveJson");
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			console.log("saveJson error", filename, jqXHR.responseText, textStatus, errorThrown);
		}
	});
}
// callback for uploading json file
ROSDASH.uploadJson = function (file)
{
	console.log("uploadJson", file);
}


///////////////////////////////////// widget actions (based on sDashboard)


// add a widget by type, usually a new widget
ROSDASH.addWidgetByType = function (name, num)
{
	if (! ROSDASH.checkBlockTypeValid(name))
	{
		console.error("widget invalid", name);
		return;
	}
	if (undefined === ROSDASH.blockDef[name])
	{
		ROSDASH.blockDef[name] = new Object();
	}
	// num is set by addBlockByType
	if (undefined !== num)
	{
		ROSDASH.blockDef[name].count = num;
	}
	// set a new count number. don't use getWidgetNum because there is no widget object
	else if (undefined === ROSDASH.blockDef[name].count)
	{
		ROSDASH.blockDef[name].count = 0;
	} else
	{
		++ ROSDASH.blockDef[name].count;
	}
	var widget = {
		widgetTitle : name + " " + ROSDASH.blockDef[name].count,
		widgetId : name + "-" + ROSDASH.blockDef[name].count,
		number : ROSDASH.blockDef[name].count,
		widgetType : name,
		widgetContent : undefined,
		// set the position of new widget as 0
		pos : 0,
		width: ("width" in ROSDASH.blockDef[name]) ? ROSDASH.blockDef[name].width : ROSDASH.dashConf.widget_width,
		height: ("height" in ROSDASH.blockDef[name]) ? ROSDASH.blockDef[name].height : ROSDASH.dashConf.widget_height,
		header_height: ROSDASH.dashConf.header_height,
		content_height: ROSDASH.dashConf.content_height,
		config: ROSDASH.blockDef[name].config
	};
	// move other widgets backward by one
	for (var i in ROSDASH.blocks)
	{
		if (! ("widget" in ROSDASH.blocks[i]))
		{
			continue;
		}
		++ ROSDASH.blocks[i].widget.pos;
	}
	ROSDASH.addWidget(widget);
	ROSDASH.ee.emitEvent('change');
}
// add a widget, usually from json
ROSDASH.addWidget = function (def)
{
	// save the definition of this widget
	if (undefined === ROSDASH.blocks[def.widgetId])
	{
		ROSDASH.blocks[def.widgetId] = new Object();
	}
	ROSDASH.blocks[def.widgetId].widget = def;
	def = ROSDASH.setWidgetContent(def);
	// fail to set content
	if (undefined === def)
	{
		return;
	}
	$("#panel").sDashboard("addWidget", def);
	ROSDASH.ee.emitEvent('addWidget');
}
// set the value of widget content
ROSDASH.setWidgetContent = function (widget)
{
	//@deprecated set default value of content into example data from sDashboard
	switch (widget.widgetType)
	{
	case "table":
		widget.widgetContent = {
			"aaData" : [["", "", ""]],
			"aoColumns" : [{
				"sTitle" : ""
			}, {
				"sTitle" : ""
			}, {
				"sTitle" : ""
			}],
			"iDisplayLength": 25,
			"aLengthMenu": [[1, 25, 50, -1], [1, 25, 50, "All"]],
			"bPaginate": true,
			"bAutoWidth": false
		};
		break;
	case "bubbleChart":
	case "bubble chart":
		widget.widgetType = "chart";
		widget.widgetContent = new Object();
		widget.widgetContent.data = myExampleData.bubbleChartData;
		widget.widgetContent.options = myExampleData.bubbleChartOptions;
		break;
	case "pieChart":
	case "pie chart":
		widget.widgetType = "chart";
		widget.widgetContent = new Object();
		widget.widgetContent.data = myExampleData.pieChartData;
		widget.widgetContent.options = myExampleData.pieChartOptions;
		break;
	case "barChart":
	case "bar chart":
		widget.widgetType = "chart";
		widget.widgetContent = new Object();
		widget.widgetContent.data = myExampleData.barChartData;
		widget.widgetContent.options = myExampleData.barChartOptions;
		break;
	case "chart":
	case "lineChart":
	case "line chart":
		widget.widgetType = "chart";
		widget.widgetContent = new Object();
		widget.widgetContent.data = myExampleData.lineChartData;
		widget.widgetContent.options = myExampleData.lineChartOptions;
		break;
	default:
		widget.widgetContent = "";
		break;
	}

	// if widget instantiated
	if (undefined !== ROSDASH.connection[widget.widgetId] && undefined !== ROSDASH.connection[widget.widgetId].instance)
	{
		// set default title from config
		if (undefined !== ROSDASH.connection[widget.widgetId].block && undefined !== ROSDASH.connection[widget.widgetId].block.config && undefined !== ROSDASH.connection[widget.widgetId].block.config.title && "" != ROSDASH.connection[widget.widgetId].block.config.title)
		{
			widget.widgetTitle = ROSDASH.connection[widget.widgetId].block.config.title;
		}
		// the intance of widget
		var obj = ROSDASH.connection[widget.widgetId].instance;
		try {
			// if cannot pass checking, do not run
			if ( ROSDASH.checkFuncByName("addWidget", obj) )
			{
				// execute addWidget
				widget = ROSDASH.runFuncByName("addWidget", obj, widget);
			}
		} catch (err)
		{
			console.error("add widget error", err.message, err.stack);
			return undefined;
		}
	} else
	{
		console.warn("widget init fail: not instantiated", widget);
	}
	return widget;
}
// set the widget number
ROSDASH.getWidgetNum = function (def)
{
	// if the ROSDASH.blockDef of def.widgetType does not exist - for constant
	if (undefined === ROSDASH.blockDef[def.widgetType])
	{
		ROSDASH.blockDef[def.widgetType] = new Object();
		if (undefined === def.number)
		{
			// init to 0
			ROSDASH.blockDef[def.widgetType].count = 0;
			def.number = ROSDASH.blockDef[def.widgetType].count;
		} else
		{
			ROSDASH.blockDef[def.widgetType].count = def.number;
		}
	}
	else if (undefined === ROSDASH.blockDef[def.widgetType].count)
	{
		if (undefined === def.number)
		{
			// init to 0
			ROSDASH.blockDef[def.widgetType].count = 0;
			def.number = ROSDASH.blockDef[def.widgetType].count;
		} else
		{
			ROSDASH.blockDef[def.widgetType].count = def.number;
		}
	}
	else if (undefined === def.number)
	{
		++ ROSDASH.blockDef[def.widgetType].count;
		def.number = ROSDASH.blockDef[def.widgetType].count;
	} else if (def.number > ROSDASH.blockDef[def.widgetType].count)
	{
			ROSDASH.blockDef[def.widgetType].count = def.number;
	} else
	{
		// if widget number conflicts
		for (var i in ROSDASH.blocks)
		{
			if (! ("widget" in ROSDASH.blocks[i]))
			{
				continue;
			}
			if (ROSDASH.blocks[i].widget.widgetType == def.widgetType && ROSDASH.blocks[i].widget.number == def.number)
			{
				console.error("widget number conflicted: " + def.widgetId);
				// set a new widget number
				++ ROSDASH.blockDef[def.widgetType].count;
				def.number = ROSDASH.blockDef[def.widgetType].count;
			}
		}
	}
	return def;
}

// remove a widget
ROSDASH.removeWidget = function (id)
{
	var pos = ROSDASH.blocks[id].widget.pos;
	// move widgets behind it forward by one
	for (var i in ROSDASH.blocks)
	{
		if (("widget" in ROSDASH.blocks[i]) && ROSDASH.blocks[i].widget.pos > pos)
		{
			-- ROSDASH.blocks[i].widget.pos;
		}
	}
	delete ROSDASH.blocks[id];
	ROSDASH.ee.emitEvent('change');
}
// callback function of sDashboard widget move
ROSDASH.moveWidget = function (sorted)
{
	// update all new positions
	for (var i in sorted)
	{
		if (sorted[i].widgetId in ROSDASH.blocks)
		{
			ROSDASH.blocks[sorted[i].widgetId].widget.pos = i;
		}
	}
	ROSDASH.ee.emitEvent('change');
}
// the widget selected by clicking
ROSDASH.selectedWidget;
ROSDASH.selectWidgetCallback = function (e, data)
{
	ROSDASH.selectedWidget = data.selectedWidgetId;
	var w = ROSDASH.blocks[ROSDASH.selectedWidget].widget;
	// a sidebar for widget json information
	ROSDASH.jsonFormType = "property";
	ROSDASH.formClickBlock(ROSDASH.selectedWidget);
	return w;
}
ROSDASH.findWidget = function (id)
{
	if ((id in ROSDASH.blocks) && ("widget" in ROSDASH.blocks[id]))
	{
		$("#panel").sDashboard("findWidget", id);
	} else
	{
		console.log("cannot find", id);
	}
}

// modify the content of a widget directly
ROSDASH.updateWidgetContent = function (id, content)
{
	$("#panel").sDashboard("setContentById", id, content);
}
// get a editable subset property in widget to edit
ROSDASH.getWidgetEditableProperty = function (id)
{
	if (! (id in ROSDASH.blocks))
	{
		return;
	}
	var widget = ROSDASH.blocks[id].widget;
	var property = {
		widgetTitle: widget.widgetTitle,
		width: widget.width,
		height: widget.height,
		header_height: widget.header_height,
		content_height: widget.content_height
	};
	return property;
}
ROSDASH.initWidget = function (id)
{
	if (! (id in ROSDASH.blocks))
	{
		console.error("init widget error: ROSDASH.blocks not ready", id);
		return;
	}
	// validate the existence of each block just once
	if (! ROSDASH.connection[id].exist)
	{
		console.error("widget does not exist: ", id);
		return;
	}
	ROSDASH.loadRequired(id);
	// if error or already initialized
	if (ROSDASH.connection[id].error || ROSDASH.connection[id].initialized)
	{
		return;
	}
	// check if required js is ready
	/*for (var i in ROSDASH.blocks[id].require)
	{
		if (false == ROSDASH.blocks[id].require[i])
		{
			setTimeout(function ()
			{
				ROSDASH.initWidget(id);
			}, 100);
			return;
		}
	}*/
	if (undefined !== ROSDASH.blockDef[ROSDASH.connection[id].block.type].js)
	{
		var flag = false;
		for (var j in ROSDASH.blockDef[ROSDASH.connection[id].block.type].js)
		{
			if ( ROSDASH.loadList[ROSDASH.blockDef[ROSDASH.connection[id].block.type].js[j]] < 0 )
			{
				//ROSDASH.connection[i].error = true;
			}
			if ( ROSDASH.loadList[ROSDASH.blockDef[ROSDASH.connection[id].block.type].js[j]] < 2 )
			{
				flag = true;
				break;
			}
		}
		// if not ready
		if (flag)
		{
			return;
		}
	}
	if (("has_panel" in ROSDASH.blocks[id]) && (true == ROSDASH.blocks[id].has_panel || "true" == ROSDASH.blocks[id].has_panel))
	{
	}
	if (undefined !== ROSDASH.connection[id].instance)
	{
		// run function by instance of widget class
		try
		{
			ROSDASH.connection[id].initialized = ROSDASH.runFuncByName("init", ROSDASH.connection[id].instance);
		} catch (err)
		{
			console.error("widget init error:", id, err.message, err.stack);
		}
		// if ros connected
		if (ROSDASH.rosConnected && ROSDASH.cycle < 0)
		{
			try	{
				// run initRos
				var initialized = ROSDASH.runFuncByName("initRos", ROSDASH.connection[id].instance);
				// works in chrome 31
				if (false != ROSDASH.connection[id].initialized)
				{
					ROSDASH.connection[id].initialized = initialized;
				 }
			} catch (err)
			{
				console.error("widget initRos error:", id, err.message, err.stack);
			}
		}
		if (undefined === ROSDASH.connection[id].initialized)
		{
			ROSDASH.connection[id].initialized = true;
		}
	}
}


///////////////////////////////////// diagram analysis


// connection relationship for diagram
ROSDASH.connection = new Object();
// parse the diagram to obtain the connection relations
ROSDASH.parseDiagram = function (diagram)
{
	// parse block config into true value
	for (var i in diagram.block)
	{
		if (undefined !== diagram.block[i].config)
		{
			diagram.block[i].config = ROSDASH.transformRawJson(diagram.block[i].config);
		}
	}
	// for each edge
	for (var i in diagram.edge)
	{
		var edge = diagram.edge[i];
		// obtain one block of the edge
		var block1 = ROSDASH.getBlockParent(edge.source);
		ROSDASH.initConnection(block1);
		var type1 = ROSDASH.getPinTypeNum(edge.source);
		// obtain the other block of the edge
		var block2 = ROSDASH.getBlockParent(edge.target);
		ROSDASH.initConnection(block2);
		var type2 = ROSDASH.getPinTypeNum(edge.target);
		// save into ROSDASH.connection
		if (type1.substring(0, 1) == "i" && type2.substring(0, 1) == "o")
		{
			ROSDASH.connection[block1].parent[type1] = block2;
			ROSDASH.connection[block1].type[type1] = type2;
		} else if (type1.substring(0, 1) == "o" && type2.substring(0, 1) == "i")
		{
			ROSDASH.connection[block2].parent[type2] = block1;
			ROSDASH.connection[block2].type[type2] = type1;
		}
	}
	// for each block
	for (var i in diagram.block)
	{
		if (undefined === ROSDASH.blockDef[diagram.block[i].type])
		{
			console.warn("invalid block", i, diagram.block[i].type);
			continue;
		}
		// if it is not in the connection
		if (undefined === ROSDASH.connection[i])
		{
			// generate that block with no connection
			ROSDASH.initConnection(i);
		}
		// record the block property especially config
		ROSDASH.connection[i].block = diagram.block[i];
		// check if cacheable
		if (("config" in ROSDASH.connection[i].block) && ("cacheable" in ROSDASH.connection[i].block.config) && ROSDASH.connection[i].block.config.cacheable)
		{
			ROSDASH.connection[i].cacheable = true;
		}
		// validate the existence of the block
		ROSDASH.connection[i].exist = true;
		// load required files, i.e. js, css, etc.
		ROSDASH.initWidget(i);
	}
	setTimeout(ROSDASH.waitLoadJs, 300);
}
// set a new item in diagram connection
ROSDASH.initConnection = function (id)
{
	if (undefined === ROSDASH.connection[id])
	{
		ROSDASH.connection[id] = {
			// parent blocks
			parent : new Object(),
			// type of each connection
			type : new Object(),
			// if exists in diagram blocks
			exist : false,
			// if executed for this cycle
			cycle : -1,
			// if init method succeeds or not
			initialized : false,
			// if in error when running
			error : false,
			// the output of this block
			output : undefined,
			// if new output is the same as previous
			duplicate : false,
			// if allow cache
			cacheable : false,
		};
	}
}
ROSDASH.instantiateWidgets = function ()
{
	// for each block
	for (var i in ROSDASH.connection)
	{
		if (! ROSDASH.connection[i].exist || ROSDASH.connection[i].error)
		{
			continue;
		}
		try {
			ROSDASH.connection[i].instance = ROSDASH.newObjByName(ROSDASH.blockDef[ROSDASH.connection[i].block.type].class_name, ROSDASH.connection[i].block);
		} catch (err)
		{
			ROSDASH.connection[i].error = true;
			console.error("instantiate widget error:", i, ROSDASH.blockDef[ROSDASH.connection[i].block.type].class_name, err.message, err.stack);
		}
		if (undefined === ROSDASH.connection[i].instance)
		{
			ROSDASH.connection[i].error = true;
		}
	}
}


///////////////////////////////////// diagram execution


// new object by a string of name with at most two arguments
ROSDASH.newObjByName = function (name, arg1, arg2)
{
	if (typeof name != "string")
	{
		return undefined;
	}
	// split by . to parse class with namespaces
	var namespaces = name.split(".");
	var class_name = namespaces.pop();
	var context = window;
	// parse namespaces one by one
	for (var i in namespaces)
	{
		context = context[namespaces[i]];
	}
	// if the class is valid
	if(typeof context == "object" && typeof context[class_name] == "function")
	{
		// new an object of the class
		if (undefined === arg1 && undefined === arg2)
		{
			return new context[class_name] ();
		} else if (undefined === arg2)
		{
			return new context[class_name] (arg1);
		} else
		{
			return new context[class_name] (arg1, arg2);
		}
	} else
	{
		console.error("widget instantiation failed: ", class_name, name, arg1, arg2);
		return undefined;
	}
}
// just check, no run
ROSDASH.checkFuncByName = function (name, context)
{
	if (typeof name != "string")
	{
		return false;
	}
	// if context is undfined, it should be window
	context = (undefined !== context) ? context : window;
	// split by . to parse function with namespaces
	var namespaces = name.split(".");
	// parse namespaces one by one
	// cannot put the last function name here, or else that function cannot use class public variables
	for (var i = 0; i < namespaces.length - 1; ++ i)
	{
		context = context[namespaces[i]];
	}
	// if the function is valid
	if(typeof context == "object" && typeof context[namespaces[namespaces.length - 1]] == "function")
	{
		return true;
	} else
	{
		return false;
	}
}
// check and run function by a string of name with at most two arguments
ROSDASH.runFuncByName = function (name, context, arg1, arg2)
{
	if (typeof name != "string")
	{
		return undefined;
	}
	// if context is undfined, it should be window
	context = (undefined !== context) ? context : window;
	// split by . to parse function with namespaces
	var namespaces = name.split(".");
	// parse namespaces one by one
	// cannot put the last function name here, or else that function cannot use class public variables
	for (var i = 0; i < namespaces.length - 1; ++ i)
	{
		context = context[namespaces[i]];
	}
	// if the function is valid
	if(typeof context == "object" && typeof context[namespaces[namespaces.length - 1]] == "function")
	{
		// support 0, 1, 2 arguments
		if (undefined === arg1 && undefined === arg2)
		{
			return context[namespaces[namespaces.length - 1]] ();
		} else if (undefined === arg2)
		{
			return context[namespaces[namespaces.length - 1]] (arg1);
		} else
		{
			return context[namespaces[namespaces.length - 1]] (arg1, arg2);
		}
	} else
	{
		return undefined;
	}
}

// set a block as initialized, manually by developer
ROSDASH.setInitialized = function (id)
{
	if (id in ROSDASH.connection)
	{
		ROSDASH.connection[id].initialized = true;
		return true;
	}
	return false;
}

ROSDASH.runStatus = "uninitialized";
ROSDASH.doneCount = 0;
// cycles executed in ROSDASH
ROSDASH.cycle = -1;
ROSDASH.runWidgets = function ()
{
	// count how many cycles executed
	++ ROSDASH.cycle;
	ROSDASH.ee.emitEvent("cycleBegin");
	ROSDASH.runStatus = "running";
	ROSDASH.doneCount = 0;
	var last_count = -1;
	// if ROSDASH.doneCount does not change, the diagram execution ends
	while (last_count < ROSDASH.doneCount)
	{
		last_count = ROSDASH.doneCount;
		// for all blocks
		for (var i in ROSDASH.connection)
		{
			// if in error
			if (! ROSDASH.connection[i].exist || ROSDASH.connection[i].error)
			{
				continue;
			}
			// if done
			if (ROSDASH.connection[i].cycle == ROSDASH.cycle)
			{
				continue;
			}
			// check if widget initialization succeeded
			if (false == ROSDASH.connection[i].initialized)
			{
				if (ROSDASH.cycle < 30)
				{
					console.log("widget init again", i);
					ROSDASH.initWidget(i);
				}
				continue;
			}
			var ready_flag = true;
			var duplicate_flag = true;
			var input = new Array();
			// for all the parents of this block
			for (var j in ROSDASH.connection[i].parent)
			{
				// if a parent is not ready
				if (! (ROSDASH.connection[i].parent[j] in ROSDASH.connection) || undefined === ROSDASH.connection[ROSDASH.connection[i].parent[j]].output || ROSDASH.connection[ROSDASH.connection[i].parent[j]].cycle < ROSDASH.cycle)
				{
					ready_flag = false;
					break;
				} else
				{
					if (! ROSDASH.connection[ROSDASH.connection[i].parent[j]].duplicate)
					{
						duplicate_flag = false;
					}
					// get the corresponding order of this input
					var count = parseInt(j.substring(1));
					// save this input by deep copy
					//@bug should not _.clone(), should be specified in config
					input[count] = ROSDASH.connection[ROSDASH.connection[i].parent[j]].output[ROSDASH.connection[i].type[j]];
				}
			}
			// if the block is ready to be execute with all the inputs are ready
			if (ready_flag)
			{
				// run the widget, and save the output into ROSDASH.diagram_output
				if (undefined !== ROSDASH.connection[i].instance)
				{
					// the object of widget class
					var obj = ROSDASH.connection[i].instance;
					try
					{
						// if duplicate and cacheable, don't run
						if (! duplicate_flag || ! ROSDASH.connection[i].cacheable)
						{
							var output = ROSDASH.runFuncByName("run", obj, input);
							// check if duplicate output
							if (_.isEqual(output, ROSDASH.connection[i].output))
							{
								ROSDASH.connection[i].duplicate = true;
							} else
							{
								ROSDASH.connection[i].output = output;
							}
						} else
						{
							//console.log("duplicate and cacheable", i);
						}
						ROSDASH.connection[i].cycle = ROSDASH.cycle;
						ROSDASH.connection[i].error = false;
						++ ROSDASH.doneCount;
					} catch (err)
					{
						console.error("widget runs in error:", i, err.message, err.stack);
						ROSDASH.connection[i].error = true;
					}
				}
				else
				{
					console.error("widget object is not created", i);
					continue;
				}
			}
		}
	}
	ROSDASH.ee.emitEvent("cycleEnd");
	switch (ROSDASH.runStatus)
	{
	case "pause":
	case "stop":
		// don't run
		break;
	default:
		// sleep for a while and start next cycle
		setTimeout(ROSDASH.runWidgets, ROSDASH.dashConf.run_msec);
		break;
	}
}


///////////////////////////////////// ROS


// the instance of ROS connection
ROSDASH.ros;
// ROS connected or not
ROSDASH.rosConnected = false;
// connect with ROS by roslibjs
ROSDASH.connectROS = function (host, port)
{
	// don't need ROS
	if (typeof host === "undefined" || "" == host || " " == host)
	{
		return;
	}
	// default value for port
	port = (typeof port !== "undefined" && "" != port && " " != port) ? port : "9090";
	// close original ROS connection
	if (ROSDASH.rosConnected || undefined !== ROSDASH.ros)
	{
		ROSDASH.ros.close();
	}
	// if not close, wait until close
	if (undefined !== ROSDASH.ros)
	{
		console.log("waiting for ROS connection close");
		setTimeout(function () {
			ROSDASH.connectROS(host, port);
		}, 200);
		return;
	}
	// create a ROS
	ROSDASH.ros = new ROSLIB.Ros();
	ROSDASH.ros.on('error', function(error) {
		console.error("ROS connection error", host, port, error);
		ROSDASH.rosConnected = false;
	});
	ROSDASH.ros.on('connection', function() {
		ROSDASH.rosConnected = true;
		console.log('ROS connection made', host + ":" + port);
		ROSDASH.addToolbarRosValue();
		ROSDASH.getROSNames(ROSDASH.ros);
		// wait until all widgets are ready
		if (ROSDASH.cycle >= 0)
		{
			// emit event for ros connected
			ROSDASH.ee.emitEvent('rosConnected');
		}
	});
	ROSDASH.ros.on('close', function() {
		ROSDASH.rosConnected = false;
		console.log('ROS connection closed', host + ":" + port);
		ROSDASH.ros = undefined;
		// emit event for ros connected
		ROSDASH.ee.emitEvent('rosClosed');
	});
	// connect ROS
	ROSDASH.ros.connect('ws://' + host + ':' + port);
}

// ROS item list for sidebar
ROSDASH.rosNames = {
	topic: {"_": new Array()},
	service: {"_": new Array()},
	param: {"_": new Array()}
};
// get existing ROS names from roslibjs
ROSDASH.getROSNames = function (ros)
{
	ros.getTopics(function (topics)
	{
		// deep copy
		ROSDASH.rosNames.topic["_"] = $.extend(true, [], topics);
	});
	ros.getServices(function (services)
	{
		ROSDASH.rosNames.service["_"] = $.extend(true, [], services);
	});
	ros.getParams(function (params)
	{
		ROSDASH.rosNames.param["_"] = $.extend(true, [], params);
	});
}
// check if the name is an existing ROS item name
ROSDASH.checkRosNameExisting = function (name, type)
{
	var array;
	switch (type)
	{
	case "service":
		array = ROSDASH.rosNames.service["_"];
		break;
	case "param":
		array = ROSDASH.rosNames.param["_"];
		break;
	case "topic":
	default:
		// default is topic
		array = ROSDASH.rosNames.topic["_"];
		break;
	}
	return (jQuery.inArray(name, array) != -1);
}

// ROS blocks in the diagram
ROSDASH.rosBlocks = {
	topic: new Array(),
	service: new Array(),
	param: new Array()
};
// if conflict with existing ROS blocks
ROSDASH.checkRosConflict = function (name, type)
{
	type = (type in ROSDASH.rosBlocks) ? type : "topic";
	return (-1 != jQuery.inArray(name, ROSDASH.rosBlocks[type]));
}


///////////////////////////////////// user configuration @deprecated


// user configuration
ROSDASH.userConf = {
	// basic
	version: "0.1",
	name: "Guest",
	discrip: "",
	auth_info: new Object(),

	// ros
	ros_host: "",
	ros_port: "",

	// files
	panel_names: [],
	js: [],
	css: [],
	json: [],

	// panel
	disable_selection: true,
	run_msec: 200,
	widget_width: 400,
	widget_height: 230,
	header_height: 16,
	content_height: 180
};
// save user name into ROSDASH.userConf and cookie
ROSDASH.setUser = function (user)
{
	/*var json_info = new Object();
	try {
		json_info = JSON.parse(auth_info);
	} catch (e) {
		return;
	}
	if (! ("profile" in json_info) || ! ("displayName" in json_info["profile"]))
	{
		console.error("user name error", json_info);
		return;
	}
	ROSDASH.userConf.auth_info = json_info;
	var user = json_info.profile.displayName;
	*/
	if (undefined !== user && "" != user)
	{
		ROSDASH.userConf.name = user;
	}
	ROSDASH.setCookie("username", ROSDASH.userConf.name);
	ROSDASH.ee.emitEvent("userLogin");
}
// save to cookie
ROSDASH.setCookie = function (c_name, value)
{
	var exdays = 1;
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value = encodeURI(value) + ((exdays==null) ? "" : "; expires=" + exdate.toUTCString());
	document.cookie = c_name + "=" + c_value;
}
// get value from cookie
ROSDASH.getCookie = function (c_name)
{
	var c_value = document.cookie;
	var c_start = c_value.indexOf(" " + c_name + "=");
	if (c_start == -1)
	{
		c_start = c_value.indexOf(c_name + "=");
	}
	if (c_start == -1)
	{
		c_value = null;
	}
	else
	{
		c_start = c_value.indexOf("=", c_start) + 1;
		var c_end = c_value.indexOf(";", c_start);
		if (c_end == -1)
		{
			c_end = c_value.length;
		}
		c_value = decodeURI(c_value.substring(c_start,c_end));
	}
	return c_value;
}
// check username from cookie
ROSDASH.checkCookie = function ()
{
	var username = ROSDASH.getCookie("username");
	if (username!=null && username!="")
	{
		return username;
	}
}
// log out and remove cookie
ROSDASH.logOut = function ()
{
	ROSDASH.setCookie("username", "");
	ROSDASH.ee.emitEvent("userLogOut");
	return "";
}
