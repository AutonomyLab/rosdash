var ROSDASH = new Object();

///////////////////////////////////// constant parameters


///////////////////////////////////// events

ROSDASH.ee = ("EventEmitter" in window) ? new EventEmitter() : undefined;

///////////////////////////////////// sidebars

// sidebar form by dhtmlXForm
ROSDASH.formCanvas = "rosform";
ROSDASH.formDiagramMain = [{
		type: "label",
		label: "Add a New Block",
		name: "addlabel",
		width: 180
	}, {
		type: "button",
		value: "Blocks",
		name: "addblock",
		width: 180
	}, {
		type: "button",
		value: "Constants",
		name: "addconstant",
		width: 180
	}, {
		type: "button",
		value: "ROS items",
		name: "addROSitem",
		width: 180
	}
	/*, {
		type: "label",
		label: "Debug Info",
		name: "debuglabel",
		width: 180
	}, {
		type: "button",
		value: "msgs",
		name: "msgs",
		width: 180
	}*/
];
ROSDASH.formPanelMain = [{
	type: "label",
	label: "Add a New Widget",
	name: "addlabel",
	width: 180
	}, {
		type: "button",
		value: "Widgets",
		name: "addwidget",
		width: 180
	}
];
// the form object
ROSDASH.form;
// the function handle for clicking
ROSDASH.formItemType;
// the second parameter
ROSDASH.formItemType2;
// current directory in the form
ROSDASH.formList;
// count the items in the form in order to help append buttons
ROSDASH.formCount = 0;
// init a new form when beginning or return to main page
ROSDASH.initForm = function ()
{
	ROSDASH.removeForm();
	// create a new form
	switch (ROSDASH.ownerConf.view_type)
	{
	case "editor":
		ROSDASH.form = new dhtmlXForm(ROSDASH.formCanvas, ROSDASH.formPanelMain);
		ROSDASH.formCount = ROSDASH.formPanelMain.length;
		break;
	case "diagram":
		ROSDASH.form = new dhtmlXForm(ROSDASH.formCanvas, ROSDASH.formDiagramMain);
		ROSDASH.formCount = ROSDASH.formDiagramMain.length;
		break;
	default:
		ROSDASH.form = new dhtmlXForm(ROSDASH.formCanvas, []);
		ROSDASH.formCount = 1;
		break;
	}
	// callbacks for buttons in form
	ROSDASH.form.attachEvent("onButtonClick", function(id)
	{
		// if a directory
		if (id.substring(0, 4) == "dir-")
		{
			ROSDASH.formClickDir(id.substring(4));
			return;
		}
		// if an item
		if (id.substring(0, 5) == "item-")
		{
			ROSDASH.formClickItem(id.substring(5));
			return;
		}
		switch (id)
		{
		// back to the main page
		case "backhome":
			ROSDASH.formList = undefined;
			ROSDASH.formItemType = undefined;
			ROSDASH.initForm();
			break;
		// add a new block
		case "addblock":
			ROSDASH.formList = ROSDASH.blockList;
			ROSDASH.formItemType = "addBlockByType";
			ROSDASH.showBlocksInForm({
				type: "button",
				value: "Blocks",
				name: "addblock",
				width: 180
			});
			break;
		// add a new constant
		case "addconstant":
			ROSDASH.formList = ROSDASH.msgList;
			ROSDASH.formItemType = "addConstant";
			ROSDASH.showBlocksInForm({
				type: "button",
				value: "Constants",
				name: "addconstant",
				width: 180
			});
			break;
		// add a new ros item
		case "addROSitem":
			ROSDASH.formList = ROSDASH.rosNames;
			// ROSDASH.formItemType2 is needed to choose ros item
			ROSDASH.formItemType = "addRosItem";
			ROSDASH.showBlocksInForm({
				type: "button",
				value: "ROS items",
				name: "addROSitem",
				width: 180
			});
			break;
		// add a new widget
		case "addwidget":
			ROSDASH.formList = ROSDASH.widgetList;
			ROSDASH.formItemType = "addWidgetByType";
			ROSDASH.showBlocksInForm({
				type: "button",
				value: "Widgets",
				name: "addwidget",
				width: 180
			});
			break;
		// add a new ros item from textbox
		case "addfromtextbox":
			ROSDASH.addRosItem(ROSDASH.toolbar.getValue("input"));
			break;
		case "property":
		case "config":
		case "allproperty":
			ROSDASH.jsonFormType = id;
			switch (ROSDASH.ownerConf.view_type)
			{
			case "panel":
			case "editor":
				ROSDASH.callJsonForm(ROSDASH.widgets[ROSDASH.selectedWidget]);
				break;
			case "diagram":
				ROSDASH.callJsonForm(ROSDASH.blocks[ROSDASH.selectedBlock]);
				break;
			}
			break;
		case "msgs":
			ROSDASH.jsonFormType = id;
			ROSDASH.jsonForm(ROSDASH.msgTypes);
			break;
		default:
			console.error("sidebar click error", id);
			break;
		}
	});
}
// remove all items in form
ROSDASH.removeForm = function ()
{
	if (undefined !== ROSDASH.form)
	{
		var items = ROSDASH.form.getItemsList();
		for (var i in items)
		{
			ROSDASH.form.removeItem(items[i]);
		}
	}
	ROSDASH.formList = undefined;
	ROSDASH.formItemType = undefined;
	ROSDASH.formClickBlockId = undefined;
	ROSDASH.formCount = 0;
}
// clear the form except title
ROSDASH.clearForm = function ()
{
	var items = ROSDASH.form.getItemsList();
	for (var i in items)
	{
		if (items[i] != "addlabel")
		{
			ROSDASH.form.removeItem(items[i]);
		}
	}
	ROSDASH.formCount = 1;
	ROSDASH.formClickBlockId = undefined;
}
ROSDASH.showBlocksInForm = function (parent)
{
	if (undefined === ROSDASH.formList)
	{
		return;
	}
	ROSDASH.clearForm();
	// back home button
	ROSDASH.form.addItem(null, {
		type: "button",
		value: "Home",
		name: "backhome",
		width: 180
	}, ROSDASH.formCount);
	// previous page button
	if (typeof parent == "object")
	{
		ROSDASH.form.addItem(null, parent, ++ ROSDASH.formCount);
	}
	ROSDASH.form.addItem(null, {
		type: "label",
		label: "Directories:",
		name: "directories",
		width: 180
		}, ++ ROSDASH.formCount);
	for (var i in ROSDASH.formList)
	{
		// add a directory
		if ("_" != i)
		{
			ROSDASH.form.addItem(null, {
				type: "button",
				value: i,
				name: "dir-" + i,
				width: 180
			}, ++ ROSDASH.formCount);
		} else
		{
			ROSDASH.form.addItem(null, {
				type: "label",
				label: "Items:",
				name: "items",
				width: 180
				}, ++ ROSDASH.formCount);
			// add an item
			for (var i in ROSDASH.formList["_"])
			{
				ROSDASH.form.addItem(null, {
					type: "button",
					value: ROSDASH.formList["_"][i],
					name: "item-" + ROSDASH.formList["_"][i],
					width: 180
				}, ++ ROSDASH.formCount);
			}
		}
	}
	if (undefined !== parent && "addROSitem" == parent.name)
	{
		ROSDASH.form.addItem(null, {
			type: "button",
			value: "add from textbox",
			name: "addfromtextbox",
			width: 180
		}, ++ ROSDASH.formCount);
	}
}
// if clicking a directory
ROSDASH.formClickDir = function (name, parent)
{
	switch (name)
	{
	case "topic":
	case "service":
	case "param":
		ROSDASH.formItemType2 = name;
		break;
	}
	if (name in ROSDASH.formList && (typeof ROSDASH.formList[name] == "object" || typeof ROSDASH.formList[name] == "array"))
	{
		// new form of sub-directory
		ROSDASH.formList = ROSDASH.formList[name];
		ROSDASH.showBlocksInForm(parent);
	}
}
// if clicking an item
ROSDASH.formClickItem = function (name)
{
	// the callback function of clicking
	var fn = ROSDASH[ROSDASH.formItemType];
	if(typeof fn === 'function')
	{
		switch (ROSDASH.formItemType)
		{
		case "addRosItem":
			fn(name, ROSDASH.formItemType2);
			break;
		default:
			fn(name);
			break;
		}
		var count = 0;
		for (var i in ROSDASH.blocks)
		{
			++ count;
			if (count > 1)
			{
				break;
			}
		}
		// if adding the first item, zoom to a good view
		if (1 == count)
		{
			window.cy.fit();
			window.cy.zoom(1.0);
		}
	} else
	{
		console.error("form click item error", ROSDASH.formItemType, typeof fn, name);
	}
}
// if clicking a block
ROSDASH.formClickBlockId = undefined;
ROSDASH.formClickBlock = function (id)
{
	// don't view in panel
	if ("panel" == ROSDASH.ownerConf.view_type)
	{
		return;
	}
	// if clicking a new block
	if (undefined === ROSDASH.formClickBlockId)
	{
		ROSDASH.form.addItem(null, {
			type: "label",
			label: "Selected Block:",
			name: "selectedlabel",
			width: 180
			}, ++ ROSDASH.formCount);
		ROSDASH.form.addItem(null, {
			type: "button",
			value: "Property",
			name: "property",
			width: 180
			}, ++ ROSDASH.formCount);
		ROSDASH.form.addItem(null, {
			type: "button",
			value: "Config",
			name: "config",
			width: 180
			}, ++ ROSDASH.formCount);
		ROSDASH.form.addItem(null, {
			type: "button",
			value: "All Properties",
			name: "allproperty",
			width: 180
			}, ++ ROSDASH.formCount);
	}
	ROSDASH.formClickBlockId = id;
	var show;
	switch (ROSDASH.ownerConf.view_type)
	{
	case "panel":
	case "editor":
		show = ROSDASH.widgets[id];
		break;
	case "diagram":
		show = ROSDASH.blocks[id];
		break;
	}
	// show in jsoneditor
	ROSDASH.callJsonForm(show);
}

// sidebar json form by FlexiJsonEditor
// form type
ROSDASH.jsonFormType = "property";
// a json form for block or widget
ROSDASH.callJsonForm = function (block)
{
	if (undefined === block)
	{
		return;
	}
	var json;
	switch (ROSDASH.jsonFormType)
	{
	// for selective property of block
	case "property":
		switch (ROSDASH.ownerConf.view_type)
		{
		case "panel":
		case "editor":
			json = ROSDASH.getWidgetEditableProperty(block.widgetId);
			break;
		case "diagram":
			json = ROSDASH.getBlockEditableProperty(block.id);
			break;
		}
		break;
	// for config of block
	case "config":
		switch (ROSDASH.ownerConf.view_type)
		{
		case "panel":
		case "editor":
			json = block.config;
			break;
		case "diagram":
			json = block.config;
			break;
		}
		if (undefined === json)
		{
			config = {
				title: "",
				cacheable: false
			};
		}
		break;
	// for all property of block
	case "allproperty":
		switch (ROSDASH.ownerConf.view_type)
		{
		case "panel":
		case "editor":
			json = block;
			break;
		case "diagram":
			json = block;
			break;
		}
		break;
	default:
		if (typeof block == "object" || typeof block == "array")
		{
			json = block;
		} else
		{
			json = [block];
		}
		break;
	}
	$('#jsoneditor').jsonEditor(json,
	{
		change: ROSDASH.updateJsonForm,
		propertyclick: null
	});
}
// when changes, update the form
ROSDASH.updateJsonForm = function (data)
{
	switch (ROSDASH.jsonFormType)
	{
	case "property":
		switch (ROSDASH.ownerConf.view_type)
		{
		case "panel":
		case "editor":
			ROSDASH.callbackUpdatePanelForm(data);
			// save changed data to widget
			for (var i in data)
			{
				ROSDASH.widgets[ROSDASH.selectedWidget][i] = data[i];
			}
			break;
		case "diagram":
			ROSDASH.callbackUpdateDiagramForm(data);
			// save changed data to block
			for (var i in data)
			{
				ROSDASH.blocks[ROSDASH.selectedBlock][i] = data[i];
			}
			break;
		}
		break;
	case "config":
		switch (ROSDASH.ownerConf.view_type)
		{
		case "panel":
		case "editor":
			ROSDASH.widgets[ROSDASH.selectedWidget].config = data;
			break;
		case "diagram":
			ROSDASH.blocks[ROSDASH.selectedBlock].config = data;
			break;
		}
		break;
	default:
		console.error("You cannot make change to that", ROSDASH.jsonFormType, data);
		break;
	}
	ROSDASH.ee.emitEvent('change');
}
// if change json form in panel or editor
ROSDASH.callbackUpdatePanelForm = function (data)
{
	// update widget title
	if (("widgetTitle" in data) && ROSDASH.widgets[ROSDASH.selectedWidget].widgetTitle != data.widgetTitle)
	{
		$("li#" + ROSDASH.selectedWidget + " div.sDashboardWidget div.sDashboardWidgetHeader span.header").html(data.widgetTitle);
	}
	// update height or width
	if (("width" in data) && ROSDASH.widgets[ROSDASH.selectedWidget].width != data.width)
	{
		$("li#" + ROSDASH.selectedWidget + " div.sDashboardWidget").width(parseFloat(data.width));
	}
	if (("height" in data) && ROSDASH.widgets[ROSDASH.selectedWidget].height != data.height)
	{
		$("li#" + ROSDASH.selectedWidget + " div.sDashboardWidget").height(parseFloat(data.height));
	}
	if (("content_height" in data) && ROSDASH.widgets[ROSDASH.selectedWidget].content_height != data.content_height)
	{
		$("li#" + ROSDASH.selectedWidget + " div.sDashboardWidget div.sDashboardWidgetContent").height(parseFloat(data.height));
	}
	if (("header_height" in data) && ROSDASH.widgets[ROSDASH.selectedWidget].header_height != data.header_height)
	{
		$("li#" + ROSDASH.selectedWidget + " div.sDashboardWidget div.sDashboardWidgetHeader").height(parseFloat(data.height));
	}
}
// if change json form in diagram
ROSDASH.callbackUpdateDiagramForm = function (data)
{
	// update position
	if (ROSDASH.blocks[ROSDASH.selectedBlock].x != data.x || ROSDASH.blocks[ROSDASH.selectedBlock].y != data.y)
	{
		window.cy.$('#' + ROSDASH.selectedBlock).position({x: parseFloat(data.x), y: parseFloat(data.y)});
	}
	// update name
	if (("value" in data) && ROSDASH.blocks[ROSDASH.selectedBlock].value != data.value)
	{
		ROSDASH.blocks[ROSDASH.selectedBlock].value = data.value;
		window.cy.$('#' + ROSDASH.selectedBlock).data("name", ROSDASH.getDisplayName(ROSDASH.blocks[ROSDASH.selectedBlock]));
	}
	// update name
	if (("rosname" in data) && ROSDASH.blocks[ROSDASH.selectedBlock].rosname != data.rosname)
	{
		ROSDASH.blocks[ROSDASH.selectedBlock].rosname = data.rosname;
		window.cy.$('#' + ROSDASH.selectedBlock).data("name", ROSDASH.getDisplayName(ROSDASH.blocks[ROSDASH.selectedBlock]));
	}
}

// init the entire sidebar
ROSDASH.initSidebar = function ()
{
	ROSDASH.initForm();
}

///////////////////////////////////// toolbars (dhtmlXToolbar)

// toolbar on the top
ROSDASH.toolbar;
ROSDASH.toolbarCanvas = "toolbarObj";
ROSDASH.list_depth;
// list the content in toolbar
ROSDASH.listInToolbar = function ()
{
	// remove the original items
	ROSDASH.toolbar.forEachItem(function(itemId) {
		if (itemId != "logo")
		{
			ROSDASH.toolbar.removeItem(itemId);
		}
    });
    // add button for back to main toolbar
    ROSDASH.toolbar.addButton("main", 1, "", "redo.gif", "redo_dis.gif");
    var count = 1;
    // show items for the list
    for (var i in ROSDASH.list_depth)
    {
		// an item
		if (typeof ROSDASH.list_depth[i] == "string")
		{
			ROSDASH.toolbar.addButton("list-" + ROSDASH.list_depth[i], ++ count, ROSDASH.list_depth[i], "settings.gif", "settings.gif");
		} else if ("_" == i)
		{
			continue;
		} else // an directory
		{
			ROSDASH.toolbar.addButton("list-" + i, ++ count, i, "other.gif", "other.gif");
		}
	}
	// show items in a directory
	if ("_" in ROSDASH.list_depth)
	{
		var list = ROSDASH.list_depth["_"];
		for (var i in list)
		{
			if (typeof list[i] == "string")
			{
				ROSDASH.toolbar.addButton("list-" + list[i], ++ count, list[i], "settings.gif", "settings.gif");
			} else if ("_" == i)
			{
				continue;
			} else
			{
				ROSDASH.toolbar.addButton("list-" + i, ++ count, i, "settings.gif", "settings.gif");
			}
		}
	}
}
// list the property of a widget or block
ROSDASH.listProperty = function (type)
{
	// remove previous items
	ROSDASH.toolbar.forEachItem(function(itemId){
		if (itemId != "logo" && itemId != "input")
		{
			ROSDASH.toolbar.removeItem(itemId);
		}
    });
    // set property of selected item
    ROSDASH.toolbar.addButton("setproperty", 2, "set property", "paste.gif", "paste_dis.gif");
    // back to main toolbar
    ROSDASH.toolbar.addButton("main", 3, "back", "redo.gif", "redo_dis.gif");
	var selected;
	// choose between panel or diagram
	switch (type)
	{
	case "panel":
		if (undefined === ROSDASH.selectedWidget)
		{
			return;
		}
		selected = ROSDASH.widgets[ROSDASH.selectedWidget];
		break;
	case "diagram":
		if (undefined === ROSDASH.selectedBlock)
		{
			return;
		}
		selected = ROSDASH.blocks[ROSDASH.selectedBlock];
		break;
	}
	var count = 3;
	// add buttons for each property item
	for (var i in selected)
	{
		ROSDASH.toolbar.addButton("property-" + i, ++ count, i, "settings.gif", "settings.gif");
	}
}
ROSDASH.selected_property;

// init the toolbar for panel
ROSDASH.initToolbar = function ()
{
	if ($("#toolbarObj").length <= 0)
	{
		console.error("toolbar not ready ", "#toolbarObj");
		return;
	}
	// default settings for toolbar
	ROSDASH.toolbar = new dhtmlXToolbarObject("toolbarObj");
	ROSDASH.toolbar.setIconSize(32);
	ROSDASH.toolbar.setIconsPath("lib/dhtmlxSuite/dhtmlxToolbar/samples/common/imgs/");
	// onclick event for each button in toolbar
	ROSDASH.toolbar.attachEvent("onClick", function(id)
	{
		switch (id)
		{
		// back to main view of toolbar
		case "main":
			switch (ROSDASH.ownerConf.view_type)
			{
			case "panel":
				ROSDASH.resetPanelToolbar();
				break;
			case "editor":
				ROSDASH.resetEditorToolbar();
				break;
			case "diagram":
				ROSDASH.resetDiagramToolbar();
				break;
			}
			break;
		// connect with ROS
		case "connect":
			ROSDASH.connectROS(ROSDASH.toolbar.getValue("input"));
			break;
		case "addwidget": // add a new widget by the input box
			ROSDASH.addWidgetByType(ROSDASH.toolbar.getValue("input"));
			break;
		case "listwidget": // list items of widget
			ROSDASH.list_depth = ROSDASH.widgetList;
			ROSDASH.listInToolbar();
			break;
		case "listblock":
			ROSDASH.list_depth = ROSDASH.blockList;
			ROSDASH.listInToolbar();
			break;
		case "listconst":
			ROSDASH.list_depth = ROSDASH.blockList.constant;
			ROSDASH.listInToolbar();
			break;
		case "addros":
			window.cy.center(ROSDASH.addRosItem(ROSDASH.toolbar.getValue("input")));
			break;
		case "listros":
			ROSDASH.list_depth = ROSDASH.rosNames;
			ROSDASH.listInToolbar();
			break;
		case "find":
			switch (ROSDASH.ownerConf.view_type)
			{
			case "panel":
			case "editor":
				console.log("find");
				break;
			case "diagram":
				ROSDASH.findBlock(ROSDASH.toolbar.getValue("input"));
				break;
			}
			break;
		case "save": // save to json file
			switch (ROSDASH.ownerConf.view_type)
			{
			case "panel":
			case "editor":
				ROSDASH.savePanel();
				break;
			case "diagram":
				ROSDASH.saveDiagram();
				break;
			}
			break;
		case "remove":
			switch (ROSDASH.ownerConf.view_type)
			{
			case "panel":
			case "editor":
				console.log("remove");
				break;
			case "diagram":
				ROSDASH.removeBlock(ROSDASH.toolbar.getValue("input"));
				break;
			}
			break;
		case "undo":
			console.log("undo");
			break;
		case "redo":
			console.log("redo");
			break;
		case "property": // list the property of selected widget
			ROSDASH.listProperty("panel");
			break;
		// zindex for overlay
		case "zindex":
			$("#myCanvas").zIndex( ($("#myCanvas").zIndex() == 100) ? -10 : 100 );
			break;
		// fit the canvas for diagram
		case "fit":
			window.cy.fit();
			break;
		// add a comment in diagram
		case "addcomment":
			var c = ROSDASH.addBlockComment(ROSDASH.toolbar.getValue("input"));
			if (undefined !== c)
			{
				window.cy.center(c);
			}
			break;
		case "diagram": // open the corresponding diagram
			var url = 'diagram.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + ROSDASH.ownerConf.panel_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port;
			// if an item is selected, diagram should focus on that
			if (undefined !== ROSDASH.selectedWidget)
			{
				url += '&selected=' + ROSDASH.selectedWidget;
			}
			window.open(url);
			break;
		case "panel": // open the corresponding panel
			var url = 'panel.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + ROSDASH.ownerConf.panel_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port;
			// if an item is selected, diagram should focus on that
			if (undefined !== ROSDASH.selectedWidget)
			{
				url += '&selected=' + ROSDASH.selectedWidget;
			}
			window.open(url);
			break;
		case "editor": // open the corresponding editor
			var url = 'editor.html?owner=' + ROSDASH.ownerConf.name + '&panel=' + ROSDASH.ownerConf.panel_name + '&host=' + ROSDASH.ownerConf.ros_host + '&port=' + ROSDASH.ownerConf.ros_port;
			// if an item is selected, diagram should focus on that
			if (undefined !== ROSDASH.selectedWidget)
			{
				url += '&selected=' + ROSDASH.selectedWidget;
			}
			window.open(url);
			break;
		case "jsoneditor":
			var url = 'jsoneditor.html?owner=' + ROSDASH.ownerConf.name;
			window.open(url);
			break;
		default:
			console.error("unknown button in toolbar: ", id);
			break;
		}
	});
	switch (ROSDASH.ownerConf.view_type)
	{
	case "panel":
		ROSDASH.resetPanelToolbar();
		break;
	case "editor":
		ROSDASH.resetEditorToolbar();
		break;
	case "diagram":
		ROSDASH.resetDiagramToolbar();
		break;
	}
}
// reset the toolbar for panel
ROSDASH.resetPanelToolbar = function ()
{
	// remove previous items
	ROSDASH.toolbar.forEachItem(function(itemId)
	{
		ROSDASH.toolbar.removeItem(itemId);
	});
	var count = 0;
	var logo_text = '<a href="index.html" target="_blank">ROSDASH</a>';
	ROSDASH.toolbar.addText("logo", count, logo_text);
	ROSDASH.toolbar.addText("user", ++ count, "Guest");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	var ownername = '<a href="panel.html?owner=' + ROSDASH.ownerConf.name + '" target="_blank">' + ROSDASH.ownerConf.name + '</a>';
	ROSDASH.toolbar.addText("owner", ++ count, ownername);
	ROSDASH.toolbar.addText("panelname", ++ count, ROSDASH.ownerConf.panel_name);
	var ros_host = (undefined !== ROSDASH.ownerConf.ros_host && "" != ROSDASH.ownerConf.ros_host) ? ROSDASH.ownerConf.ros_host : "disconnected";
	ROSDASH.toolbar.addText("ros", ++ count, ros_host);
	ROSDASH.toolbar.addText("saving", ++ count, "unchanged");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	ROSDASH.toolbar.addInput("input", ++ count, "", 160);
	ROSDASH.toolbar.addButton("connect", ++ count, "connect", "new.gif", "new_dis.gif");
	ROSDASH.toolbar.addButton("find", ++ count, "find", "cut.gif", "cut_dis.gif");
	//ROSDASH.toolbar.addButton("zindex", ++ count, "zindex", "database.gif", "database.gif");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	if ("panel" == ROSDASH.ownerConf.view_type)
	{
		ROSDASH.toolbar.addButton("editor", ++ count, "editor", "database.gif", "database.gif");
	} else
	{
		ROSDASH.toolbar.addButton("panel", ++ count, "panel", "database.gif", "database.gif");
	}
	ROSDASH.toolbar.addButton("diagram", ++ count, "diagram", "database.gif", "database.gif");
	ROSDASH.toolbar.addButton("jsoneditor", ++ count, "json editor", "database.gif", "database.gif");
}
// reset the toolbar for editor
ROSDASH.resetEditorToolbar = function ()
{
	// remove previous items
	ROSDASH.toolbar.forEachItem(function(itemId)
	{
		ROSDASH.toolbar.removeItem(itemId);
	});
	var count = 0;
	var logo_text = '<a href="index.html" target="_blank">ROSDASH</a>';
	ROSDASH.toolbar.addText("logo", count, logo_text);
	ROSDASH.toolbar.addText("user", ++ count, "Guest");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	var ownername = '<a href="panel.html?owner=' + ROSDASH.ownerConf.name + '" target="_blank">' + ROSDASH.ownerConf.name + '</a>';
	ROSDASH.toolbar.addText("owner", ++ count, ownername);
	ROSDASH.toolbar.addText("panelname", ++ count, ROSDASH.ownerConf.panel_name);
	var ros_host = (undefined !== ROSDASH.ownerConf.ros_host && "" != ROSDASH.ownerConf.ros_host) ? ROSDASH.ownerConf.ros_host : "disconnected";
	ROSDASH.toolbar.addText("ros", ++ count, ros_host);
	ROSDASH.toolbar.addText("saving", ++ count, "unchanged");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	ROSDASH.toolbar.addInput("input", ++ count, "", 160);
	ROSDASH.toolbar.addButton("connect", ++ count, "connect", "new.gif", "new_dis.gif");
	ROSDASH.toolbar.addButton("find", ++ count, "find", "cut.gif", "cut_dis.gif");
	ROSDASH.toolbar.addButton("undo", ++ count, "undo", "undo.gif", "undo_dis.gif");
	ROSDASH.toolbar.addButton("redo", ++ count, "redo", "redo.gif", "redo_dis.gif");
	//ROSDASH.toolbar.addButton("zindex", ++ count, "zindex", "database.gif", "database.gif");
	ROSDASH.toolbar.addButton("save", ++ count, "save", "save.gif", "save_dis.gif");
	// if you are not the owner, cannot save
	if (ROSDASH.userConf.name != ROSDASH.ownerConf.name && "@@sudo@@" != ROSDASH.userConf.name)
	{
		ROSDASH.toolbar.disableItem("save");
	}
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	if ("panel" == ROSDASH.ownerConf.view_type)
	{
		ROSDASH.toolbar.addButton("editor", ++ count, "editor", "database.gif", "database.gif");
	} else
	{
		ROSDASH.toolbar.addButton("panel", ++ count, "panel", "database.gif", "database.gif");
	}
	ROSDASH.toolbar.addButton("diagram", ++ count, "diagram", "database.gif", "database.gif");
	ROSDASH.toolbar.addButton("jsoneditor", ++ count, "json editor", "database.gif", "database.gif");
}
// reset the items in the toolbar for diagram
ROSDASH.resetDiagramToolbar = function ()
{
	ROSDASH.toolbar.forEachItem(function(itemId)
	{
		ROSDASH.toolbar.removeItem(itemId);
	});
	var count = 0;
	var logo_text = '<a href="index.html" target="_blank">ROSDASH</a>';
	ROSDASH.toolbar.addText("logo", count, logo_text);
	var username = '<a href="panel.html?owner=' + ROSDASH.ownerConf.name + '" target="_blank">' + ROSDASH.ownerConf.name + '</a>';
	ROSDASH.toolbar.addText("user", ++ count, username);
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	var ownername = '<a href="panel.html?owner=' + ROSDASH.ownerConf.name + '" target="_blank">' + ROSDASH.ownerConf.name + '</a>';
	ROSDASH.toolbar.addText("owner", ++ count, ownername);
	ROSDASH.toolbar.addText("panelname", ++ count, ROSDASH.ownerConf.panel_name);
	var ros_host = (undefined !== ROSDASH.ownerConf.ros_host && "" != ROSDASH.ownerConf.ros_host) ? ROSDASH.ownerConf.ros_host : "disconnected";
	ROSDASH.toolbar.addText("ros", ++ count, ros_host);
	ROSDASH.toolbar.addText("saving", ++ count, "unchanged");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	ROSDASH.toolbar.addInput("input", ++ count, "", 160);
	ROSDASH.toolbar.addButton("connect", ++ count, "connect", "cut.gif", "cut_dis.gif");
	ROSDASH.toolbar.addButton("find", ++ count, "find", "cut.gif", "cut_dis.gif");
	ROSDASH.toolbar.addButton("addcomment", ++ count, "add comment", "new.gif", "new_dis.gif");
	ROSDASH.toolbar.addButton("remove", ++ count, "remove", "remove-icon.gif", "remove-icon.gif");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	ROSDASH.toolbar.addButton("undo", ++ count, "undo", "undo.gif", "undo_dis.gif");
	ROSDASH.toolbar.addButton("redo", ++ count, "redo", "redo.gif", "redo_dis.gif");
	ROSDASH.toolbar.addButton("save", ++ count, "save", "save.gif", "save_dis.gif");
	if (ROSDASH.userConf.name != ROSDASH.ownerConf.name && "@@sudo@@" != ROSDASH.userConf.name)
	{
		ROSDASH.toolbar.disableItem("save");
	}
	ROSDASH.toolbar.addButton("fit", ++ count, "fit", "stylesheet.gif", "stylesheet.gif");
	ROSDASH.toolbar.addSeparator("s" + count, ++ count);

	ROSDASH.toolbar.addButton("panel", ++ count, "panel", "database.gif", "database.gif");
	ROSDASH.toolbar.addButton("editor", ++ count, "editor", "database.gif", "database.gif");
	ROSDASH.toolbar.addButton("jsoneditor", ++ count, "json editor", "database.gif", "database.gif");
}

// add user name to toolbar. called when user login
ROSDASH.addToolbarUserName = function ()
{
	if ($("#toolbarObj").length > 0)
	{
		var user_text = ROSDASH.userConf.name;
		if ("Guest" != ROSDASH.userConf.name)
		{
			user_text = '<a href="panel.html?owner=' + ROSDASH.userConf.name + '" target="_blank">' + ROSDASH.userConf.name + '</a>(<a href="panel.html?status=logout">logout</a>)';
		}
		// add to toolbar
		ROSDASH.toolbar.setItemText("user", user_text);
	}
}
ROSDASH.ee.addListener("jsonReady", ROSDASH.addToolbarUserName);
// add panel name to toolbar. called when json files are ready
ROSDASH.addToolbarPanelName = function ()
{
	// add to HTML title
	$('title').text($('title').text() + " - " + ROSDASH.ownerConf.name + " - " + ROSDASH.ownerConf.panel_name);
	if ($("#toolbarObj").length > 0)
	{
		var owner_text = '<a href="panel.html?owner=' + ROSDASH.ownerConf.name + '" target="_blank">' + ROSDASH.ownerConf.name + '</a>';
		// add to toolbar
		ROSDASH.toolbar.setItemText("owner", owner_text);
		ROSDASH.toolbar.setItemText("panelname", ROSDASH.ownerConf.panel_name);
	}
}
ROSDASH.ee.addListener("jsonReady", ROSDASH.addToolbarPanelName);
// add ros host to toolbar
ROSDASH.addToolbarRosValue = function ()
{
	// add to HTML title
	$('title').text($('title').text() + " - " + ROSDASH.ownerConf.ros_host);
	if ($("#toolbarObj").length > 0)
	{
		// add to toolbar
		ROSDASH.toolbar.setItemText("ros", ROSDASH.ownerConf.ros_host);
	}
}

// when changes, notify user
ROSDASH.onChange = function ()
{
	if (undefined === ROSDASH.toolbar)
	{
		return;
	}
	ROSDASH.toolbar.setItemText("saving", '<font color="red">unsaved</font>');
}
ROSDASH.ee.addListener("change", ROSDASH.onChange);
// when saves, notify user
ROSDASH.onSave = function ()
{
	if (undefined === ROSDASH.toolbar)
	{
		return;
	}
	ROSDASH.toolbar.setItemText("saving", 'saved');
}
ROSDASH.ee.addListener("saved", ROSDASH.onSave);

///////////////////////////////////// user configuration

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
	/*
	var json_info = new Object();
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

///////////////////////////////////// panel configuration

// dashboard owner configuration
ROSDASH.ownerConf = {
	// basic
	version: "0.1",
	name: "index",
	discrip: "",
	panel_name: "index",
	view_type: "panel",

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
ROSDASH.checkownerConfValid = function ()
{
	if (ROSDASH.ownerConf.run_msec < 100)
	{
		console.warning("run_msec is too low: ", ROSDASH.ownerConf.run_msec);
		ROSDASH.ownerConf.run_msec = 100;
	}
	if (undefined === ROSDASH.ownerConf.ros_port || "" == ROSDASH.ownerConf.ros_port || " " == ROSDASH.ownerConf.ros_port)
	{
		ROSDASH.ownerConf.ros_port = "9090";
	}
}
// set panel name
ROSDASH.setPanel = function (owner, panel_name)
{
	if (undefined !== owner && "" != owner)
	{
		ROSDASH.ownerConf.name = owner;
	}
	if (undefined !== panel_name && "" != panel_name)
	{
		ROSDASH.ownerConf.panel_name = panel_name;
	}
}
ROSDASH.setownerConf = function (conf)
{
	for (var i in conf)
	{
		if (i in ROSDASH.ownerConf)
		{
			if ("version" == i && ROSDASH.ownerConf.version != conf.version)
			{
				console.error("configure version conflicts", conf.version, ROSDASH.ownerConf.version);
				return;
			}
			if ("name" == i && ROSDASH.ownerConf.name != conf.name)
			{
				console.error("configure user name conflicts", conf.name);
				return;
			}
			if ("panel_name" == i && ROSDASH.ownerConf.panel_name != conf.panel_name)
			{
				console.error("configure panel name conflicts", conf.panel_name);
				return;
			}
			ROSDASH.ownerConf[i] = conf[i];
		}
	}
	ROSDASH.checkownerConfValid();
	// load json specified by user config
	for (var i in ROSDASH.ownerConf.json)
	{
		ROSDASH.loadJson(ROSDASH.ownerConf.json[i]);
	}
}
// if connected ROS, set the ROS names. called when ROS connection made
ROSDASH.setRosValue = function (host, port)
{
	ROSDASH.ownerConf.ros_host = host;
	ROSDASH.ownerConf.ros_port = port;
	ROSDASH.addToolbarRosValue();
}

///////////////////////////////////// ROS

// the instance of ROS connection
ROSDASH.ros;
// ROS connected or not
ROSDASH.rosConnected = false;
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
	ROSDASH.ros = new ROSLIB.Ros();
	ROSDASH.ros.on('error', function(error) {
		console.error("ROS connection error", host, port, error);
		ROSDASH.rosConnected = false;
	});
	ROSDASH.ros.on('connection', function() {
		ROSDASH.rosConnected = true;
		console.log('ROS connection made: ', host + ":" + port);
		ROSDASH.setRosValue(host, port);
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
		console.log('ROS connection closed: ', host + ":" + port);
		ROSDASH.ros = undefined;
		// emit event for ros connected
		ROSDASH.ee.emitEvent('rosClosed');
	});
	ROSDASH.ros.connect('ws://' + host + ':' + port);
}
// ROS item list for sidebar
ROSDASH.rosNames = {
	topic: {"_": new Array()},
	service: {"_": new Array()},
	param: {"_": new Array()}
};
// get existing ROS names from ROSLIB
ROSDASH.getROSNames = function (ros)
{
	ROSDASH.ros.getTopics(function (topics)
	{
		// deep copy
		ROSDASH.rosNames.topic["_"] = $.extend(true, [], topics);
	});
	ROSDASH.ros.getServices(function (services)
	{
		ROSDASH.rosNames.service["_"] = $.extend(true, [], services);
	});
	ROSDASH.ros.getParams(function (params)
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

///////////////////////////////////// load json

// the data list from json files
ROSDASH.jsonLoadList = new Object();
// transform from raw json into real json. @note check number or not?
ROSDASH.transformRawJson = function (raw)
{
	for (var i in raw)
	{
		if ("true" == raw[i])
		{
			raw[i] = true;
		} else if ("false" == raw[i])
		{
			raw[i] = false;
		} else if ("null" == raw[i])
		{
			raw[i] = null;
		} else if (typeof raw[i] == "object")
		{
			raw[i] = ROSDASH.transformRawJson(raw[i]);
		}
	}
	return raw;
}
// uniform function to load json and register them
ROSDASH.loadJson = function (file)
{
	// if end with .json, you can ignore that
	if (".json" != file.slice(-5))
	{
		file = file + ".json";
	}
	// init status
	if (! (file in ROSDASH.jsonLoadList))
	{
		ROSDASH.jsonLoadList[file] = new Object();
		ROSDASH.jsonLoadList[file].status = 0;
	}
	$.getJSON(file, function (data, status, xhr)
	{
		ROSDASH.jsonLoadList[file].data = data;
		// if successful, status = 2
		++ ROSDASH.jsonLoadList[file].status;
	})
	.fail(function (jqXHR, textStatus) {
		console.error("load json file", file, "failed", jqXHR, textStatus);
		ROSDASH.jsonLoadList[file].status = -1;
	})
	.always(function () {
		// if not successful, status = 1
		++ ROSDASH.jsonLoadList[file].status;
	});
}
// status if json load is ready
ROSDASH.jsonReady = false;
// wait when loading jsons
ROSDASH.waitJson = function ()
{
	// if owner conf is loaded, load specified jsons. must be executed before examine jsonLoadList
	var conf_path = "file/" + ROSDASH.ownerConf.name + "/conf.json";
	if ((conf_path in ROSDASH.jsonLoadList) && 2 == ROSDASH.jsonLoadList[conf_path].status)
	{
		ROSDASH.setownerConf(ROSDASH.jsonLoadList[conf_path].data);
	}
	// if loading finishes
	var flag = true;
	for (var i in ROSDASH.jsonLoadList)
	{
		// if loading fails
		if (ROSDASH.jsonLoadList[i].status < 0)
		{
			flag = false;
			break;
		}
		// if loading unsuccessfully
		else if (ROSDASH.jsonLoadList[i].status < 2)
		{
			flag = false;
			// if returned but not succeed, read again
			if (1 == ROSDASH.jsonLoadList[i].status)
			{
				console.warn("load json file", i, "again");
				ROSDASH.loadJson(i);
			}
			break;
		}
	}
	// if not ready
	if (! flag)
	{
		// wait again
		setTimeout(ROSDASH.waitJson, 200);
	} else
	{
		ROSDASH.ee.emitEvent("jsonReady");
		ROSDASH.jsonReadyFunc();
		console.log("loaded json files");
		ROSDASH.jsonReady = true;
		// emit a event for json ready
	}
}
// functions called after jsons are ready
ROSDASH.jsonReadyFunc = function ()
{
	switch (ROSDASH.ownerConf.view_type)
	{
	case "panel":
		// parse msgs
		ROSDASH.loadMsgDef();
		// load widgets and blocks
		ROSDASH.loadWidgetDef();
		// run panel
		ROSDASH.readDiagram(ROSDASH.jsonLoadList['file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-diagram.json"].data);
		ROSDASH.loadPanel(ROSDASH.jsonLoadList['file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-panel.json"].data);
		// wait for js loading
		setTimeout(ROSDASH.exePanel, 300);
		break;
	case "editor":
		// parse msgs after loading json
		ROSDASH.loadMsgDef();
		// load widgets and blocks
		ROSDASH.loadWidgetDef();
		// show panel editor
		ROSDASH.loadPanel(ROSDASH.jsonLoadList['file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-panel.json"].data);
		ROSDASH.compareDiagram();
		ROSDASH.ee.emitEvent("editorReady");
		break;
	case "diagram":
		// parse msgs after loading json
		ROSDASH.loadMsgDef();
		// load widgets and blocks
		ROSDASH.loadWidgetDef();
		// run diagram after loading json
		ROSDASH.runDiagram(ROSDASH.jsonLoadList['file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-diagram.json"].data);
		break;
	case "jsoneditor":
		json = ROSDASH.jsonLoadList[src].data;
		src_success = true;
		// run jsoneditor
		startJsonEditor();
		ROSDASH.ee.emitEvent("jsonEditorReady");
		break;
	default:
		break;
	}
}

// save data to json file in server. @note PHP will ignore empty json part
ROSDASH.saveJson = function (data, filename)
{
	// prevent others from saving
	if (ROSDASH.userConf.name != ROSDASH.ownerConf.name && "@@sudo@@" != ROSDASH.userConf.name)
	{
		alert("are you the owner?", ROSDASH.userConf.name);
		return;
	}
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
			console.log("saveJson successful: ", filename, data, textStatus, jqXHR.responseText);
			ROSDASH.ee.emitEvent("saved");
		},
		error: function(jqXHR, textStatus, errorThrown)
		{
			console.log("saveJson error: ", filename, jqXHR.responseText, textStatus, errorThrown);
		}
	});
}
// init loading msg type and widget definitions from json files
ROSDASH.initJson = function ()
{
	// load user config json
	ROSDASH.loadJson("file/" + ROSDASH.ownerConf.name + "/conf.json");
	ROSDASH.loadMsgJson();
	ROSDASH.loadWidgetJson();
}

///////////////////////////////////// msg type definitions

// file path list for msg jsons
ROSDASH.msgJson = ["param/msgs.json"];
// msg list for sidebar
ROSDASH.msgList = new Object();
// msg definitions
ROSDASH.msgs = new Object();
// load message type definitions from json
ROSDASH.loadMsgJson = function ()
{
	for (var i in ROSDASH.msgJson)
	{
		ROSDASH.loadJson(ROSDASH.msgJson[i]);
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
	// add to block list constant
	var list = ROSDASH.msgList["_"];
	for (var i in ROSDASH.msgJson)
	{
		var data = ROSDASH.jsonLoadList[ROSDASH.msgJson[i]].data.msgs;
		for (var j in data)
		{
			if (undefined != data[j].name)
			{
				// add to definition list
				ROSDASH.msgs[data[j].name] = data[j];
				// add to block list for sidebar
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
	// if a simple value as one
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
	for (var i in ROSDASH.msgJson)
	{
		var json = ROSDASH.jsonLoadList[ROSDASH.msgJson[i]].data;
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

///////////////////////////////////// widget definitions

// json file names for widgets
ROSDASH.widgetJson = ["param/widgets.json"];
// widget definitions
ROSDASH.widgetDef = new Object();
// block lists for diagram sidebar
ROSDASH.blockList = new Object();
// widget lists for editor sidebar
ROSDASH.widgetList = new Object();
// save to sidebar list
ROSDASH.loadWidgetList = function (json)
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
// save widget definitions
ROSDASH.loadWidgetDef = function (data)
{
	// for each json file
	for (var i in ROSDASH.widgetJson)
	{
		var data = ROSDASH.jsonLoadList[ROSDASH.widgetJson[i]].data.widgets;
		// for each widget json
		for (var k in data)
		{
			// wrong format
			if (! ("type" in data[k]))
			{
				continue;
			}
			// save to ROSDASH.widgetDef
			ROSDASH.widgetDef[data[k].type] = data[k];
			// save to list for sidebar
			ROSDASH.loadWidgetList(data[k]);
		}
	}
}
// load widget json from files
ROSDASH.loadWidgetJson = function ()
{
	// load from widget definition json
	for (var i in ROSDASH.widgetJson)
	{
		ROSDASH.loadJson(ROSDASH.widgetJson[i]);
	}
}
// if widget name valid in widget definition list
ROSDASH.checkWidgetTypeValid = function (name)
{
	return (name in ROSDASH.widgetDef) && ("class_name" in ROSDASH.widgetDef[name]);
}

///////////////////////////////////// blocks in diagram

//@todo generate the position for new blocks to be. maybe should follow the mouse
ROSDASH.getNextNewBlockPos = function ()
{
	return [0, 0];
}
// a list of configurations for each block
ROSDASH.blocks = new Object();
// add a new ros item block, not add one from init json file
ROSDASH.addRosItem = function (rosname, type)
{
	if ("topic" != type && "service" != type && "param" != type)
	{
		type = "topic";
	}
	//@note maybe i should allow conflict?
	if ("" == rosname || ROSDASH.checkRosConflict(rosname, type))
	{
		console.error("ros item name is not valid: ", rosname);
		return;
	}
	var next_pos = ROSDASH.getNextNewBlockPos();
	var x = (typeof x !== "undefined") ? parseFloat(x) : next_pos[0];
	var y = (typeof y !== "undefined") ? parseFloat(y) : next_pos[1];
	var count = ROSDASH.rosBlocks[type].length;
	var id = type + "-" + count;
	var body = window.cy.add({
		group: "nodes",
		data: {
			id: id,
			name: rosname,
			faveColor: 'Gold'
		},
		position: { x: x, y: y },
		classes: "body"
	});
	window.cy.add({
		group: "nodes",
		data: {
			id: id + "-i0"
		},
		position: { x: x + ROSDASH.INPUT_POS[1][0][0], y: y + ROSDASH.INPUT_POS[1][0][1] },
		classes: "input",
		locked: true
	});
	window.cy.add({
		group: "nodes",
		data: {
			id: id + "-o0"
		},
		position: { x: x + ROSDASH.OUTPUT_POS[1][0][0], y: y + ROSDASH.OUTPUT_POS[1][0][1] },
		classes: "output",
		locked: true
	});
	var block = {
		id: id,
		type: type,
		name: rosname,
		rosname: rosname,
		rostype: '',
		number: ROSDASH.rosBlocks.topic.length,
		x: x,
		y: y
	};
	// set the input of this block
	if (undefined !== ROSDASH.widgetDef[type].input)
	{
		// assign by deep copy
		block.input = ROSDASH.widgetDef[type].input.slice();
	} else
	{
		block.input = new Array();
	}
	// set the output of this block
	if (undefined !== ROSDASH.widgetDef[type].output)
	{
		// assign by copy
		block.output = ROSDASH.widgetDef[type].output.slice();
	} else
	{
		block.output = new Array();
	}
	ROSDASH.blocks[id] = block;
	ROSDASH.rosBlocks[type].push(rosname);
	// return to facilitate fitting to
	return id;
}
// add a new block based on type
ROSDASH.addBlockByType = function (type)
{
	return ROSDASH.addBlock({type: type});
}
// add a new constant block based on type
ROSDASH.addConstant = function (const_type)
{
	var value = ROSDASH.getMsgDefaultValue(const_type);
	var block = {
		type: "constant",
		constant: true,
		constname: const_type,
		value: value
	};
	return ROSDASH.addBlock(block);
}

// init the configuration of a new block
ROSDASH.initBlockConf = function (block)
{
	if (ROSDASH.checkWidgetTypeValid(block.type))
	{
		block.list_name = ("constant" != block.type) ? block.type : block.constname;
		// for ros items
		if ("topic" == block.type || "service" == block.type || "param" == block.type)
		{
			ROSDASH.rosBlocks[block.type].push(block.rosname);
		}
	}
	// for constant
	else if (ROSDASH.checkMsgTypeValid(block.type))
	{
		// should be in front of def.type
		block.list_name = block.type;
		block.constname = block.type;
		block.type = "constant";
		block.constant = true;
		block.value = "";
	} else
	{
		// the widget type is invalid, and the error message is sent from ROSDASH.checkWidgetTypeValid
		return undefined;
	}
	// set the input of this block
	if (undefined !== ROSDASH.widgetDef[block.type].input)
	{
		// assign by deep copy
		block.input = ROSDASH.widgetDef[block.type].input.slice();
	} else
	{
		block.input = new Array();
	}
	// set the output of this block
	if (undefined !== ROSDASH.widgetDef[block.type].output)
	{
		// assign by deep copy
		block.output = ROSDASH.widgetDef[block.type].output.slice();
	} else
	{
		block.output = new Array();
	}
	if (undefined === block.config)
	{
		// assign config to a block from definition
		if (undefined !== ROSDASH.widgetDef[block.type].config)
		{
			block.config = ROSDASH.transformRawJson(ROSDASH.widgetDef[block.type].config);
		} else
		{
			block.config = {
				title: "",
				cacheable: false
			};
		}
	} else
	{
		// transform config from raw json into real json
		block.config = ROSDASH.transformRawJson(block.config);
	}
	// if no position specified, use the new position for a block
	var next_pos = ROSDASH.getNextNewBlockPos();
	block.x = (typeof block.x != "undefined") ? parseFloat(block.x) : next_pos[0];
	block.y = (typeof block.y != "undefined") ? parseFloat(block.y) : next_pos[1];
	return block;
}
// determine the block number
ROSDASH.getBlockNum = function (block, block_type)
{
	if (typeof block.number == "string")
	{
		block.number = parseInt(block.number);
	}
	// if no block number specified
	if (undefined === block.number)
	{
		// if no count, initialize to zero
		if (undefined === ROSDASH.widgetDef[block_type])
		{
			ROSDASH.widgetDef[block_type] = new Object();
			ROSDASH.widgetDef[block_type].count = 0;
		} else if (undefined === ROSDASH.widgetDef[block_type].count)
		{
			ROSDASH.widgetDef[block_type].count = 0;
		} else // add the count by one
		{
			++ ROSDASH.widgetDef[block_type].count;
		}
		block.number = ROSDASH.widgetDef[block_type].count;
		// add id by number
		block.id = block_type + "-" +  ROSDASH.widgetDef[block_type].count;
		// if constant, set the name as value
		if ("constant" == block.type && undefined !== block.value)
		{
			if ("array" == typeof block.value || "object" == typeof block.value)
			{
				block.name = JSON.stringify(block.value);
			} else
			{
				block.name = block.value;
			}
		} else // set the name by id
		{
			block.name = block_type + " " +  ROSDASH.widgetDef[block_type].count;
		}
	}
	// if no widget_def, initialize to def.number
	else if (undefined === ROSDASH.widgetDef[block_type])
	{
		ROSDASH.widgetDef[block_type] = new Object();
		ROSDASH.widgetDef[block_type].count = block.number;
	}
	// if no count, initialize to def.number
	else if (undefined === ROSDASH.widgetDef[block_type].count)
	{
		ROSDASH.widgetDef[block_type].count = 0;
	}
	// if larger than count, set count to def.number
	else if (block.number > ROSDASH.widgetDef[block_type].count)
	{
		ROSDASH.widgetDef[block_type].count = block.number;
	} else // otherwise, ignore the count
	{
		// test if conflict with other block number
		for (var i in ROSDASH.blocks)
		{
			if (block_type == ROSDASH.blocks[i].type && block.number == ROSDASH.blocks[i].number)
			{
				console.error("block number conflicts: " + block.id);
				return block;
			}
		}
	}
	return block;
}
// get a suitable name displayed in diagram
ROSDASH.getDisplayName = function (block)
{
	var true_name = block.name;
	switch (block.type)
	{
	case "constant":
		if (undefined !== block.value)
		{
			if ("array" == typeof block.value || "object" == typeof block.value)
			{
				true_name = JSON.stringify(block.value);
			} else
			{
				true_name = block.value;
			}
		}
		break;
	case "topic":
	case "service":
	case "param":
		if (undefined !== block.rosname)
		{
			true_name = block.rosname;
		}
		break;
	}
	if (16 < true_name.length)
	{
		true_name = true_name.substring(0, 16 - 3) + "...";
	}
	return true_name;
}
ROSDASH.addBlock = function (block)
{
	var block = ROSDASH.initBlockConf(block);
	// if fail to init a block
	if (undefined === block)
	{
		return undefined;
	}
	// determine the block number
	block = ROSDASH.getBlockNum(block, block.list_name);
	// set color by type
	var color = "Aquamarine";
	switch (block.type)
	{
	case "constant":
		color = "Chartreuse";
		break;
	case "topic":
	case "service":
	case "param":
		color = "Gold";
		break;
	}
	// true name for display, compatible with old blocks
	var true_name = ROSDASH.getDisplayName(block);
	// add the body of the block
	var body = window.cy.add({
		group: "nodes",
		data: {
			id: block.id,
			name: true_name, // block.name,
			faveColor: color,
		},
		position: { x: block.x, y: block.y },
		classes: "body"
	});
	// add input pins
	for (var i = 0; i < block.input.length; ++ i)
	{
		window.cy.add({
			group: "nodes",
			data: {
				id: block.id + "-i" + i
			},
			position: { x: block.x + ROSDASH.INPUT_POS[block.input.length][i][0], y: block.y + ROSDASH.INPUT_POS[block.input.length][i][1] },
			classes: "input",
			locked: true
		});
	}
	// add output pins
	for (var i = 0; i < block.output.length; ++ i)
	{
		window.cy.add({
			group: "nodes",
			data: {
				id: block.id + "-o" + i
			},
			position: { x: block.x + ROSDASH.OUTPUT_POS[block.output.length][i][0], y: block.y + ROSDASH.OUTPUT_POS[block.output.length][i][1] },
			classes: "output",
			locked: true
		});
	}
	// save the information of the block into ROSDASH.blocks by id
	ROSDASH.blocks[block.id] = block;
	return block.id;
}

///////////////////////////////////// pins

// input pin position distribution
ROSDASH.INPUT_POS = {
	"1": [[-70, 0]],
	"2": [[-70, -20], [-70, 20]],
	"3": [[-70, -20], [-70, 0], [-70, 20]],
	"4": [[-70, -30], [-70, -10], [-70, 10], [-70, 30]],
	"5": [[-70, -40], [-70, -20], [-70, 0], [-70, 20], [-70, 40]],
	"6": [[-70, -50], [-70, -30], [-70, -10], [-70, 10], [-70, 30], [-70, 50]],
	// more are coming
};
// output pin position distribution
ROSDASH.OUTPUT_POS = {
	"1": [[70, 0]],
	"2": [[70, -20], [70, 20]],
	"3": [[70, -20], [70, 0], [70, 20]],
	"4": [[70, -30], [70, -10], [70, 10], [70, 30]],
	"5": [[70, -40], [70, -20], [70, 0], [70, 20], [70, 40]],
	"6": [[70, -50], [70, -30], [70, -10], [70, 10], [70, 30], [70, 50]],
	// more are coming
};
//@note undone
ROSDASH.addPin = function (block, type, num)
{
	var pin = block[type][num];
	/*if (! ROSDASH.checkPinDataType(pin.datatype))
	{
		return false;
	}*/
	if ("true" == pin.subordinate || true == pin.subordinate)
	{
		return;
	}
	var pin_pos = ("input" == type) ? ROSDASH.INPUT_POS[block.input.length][num] : ROSDASH.OUTPUT_POS[block.output.length][num]
	window.cy.add({
		group: "nodes",
		data: {
			id: block.id + "-" + type.substring(0, 1) + i,
			height: ROSDASH.PIN_SIZE[0],
			weight: ROSDASH.PIN_SIZE[1],
			faveColor: ROSDASH.PIN_COLOR,
			faveShape: ROSDASH.BLOCK_SHAPE
		},
		position: { x: block.x + pin_pos[0], y: block.y + pin_pos[1] },
		classes: type,
		locked: true
	});
	block[type][num].exist = true;
}
// get the body name of a pin
ROSDASH.getBlockParent = function (block)
{
	// Blockname-TypeNumber
	var index = block.lastIndexOf("-");
	return block.substring(0, index);
}
// get the number of a pin
ROSDASH.getPinNum = function (pin)
{
	// Blockname-TypeNumber
	var index = pin.lastIndexOf("-");
	return parseFloat(pin.substring(index + 2));
}
// get the type of a pin
ROSDASH.getPinType = function (pin)
{
	// Blockname-TypeNumber
	var index = pin.lastIndexOf("-");
	//@note 1 is not always true
	return pin.substring(index + 1, 1);
}
// get the type and number of a pin
ROSDASH.getPinTypeNum = function (pin)
{
	// Blockname-TypeNumber
	var index = pin.lastIndexOf("-");
	return pin.substring(index + 1);
}
//@todo change the pins of a block
ROSDASH.changePin = function (id, pin_type, action)
{
	// get the block body
	var block = ROSDASH.blocks[ROSDASH.getBlockParent(id)];
	if (undefined === block)
	{
		return;
	}
	var count = 0;
	switch (action)
	{
	case "add":
		for (var i in block[pin_type])
		{
			if ("true" == block[pin_type][i].addKey)
			{
				++ count;
				var tmp = jQuery.extend(true, {}, block[pin_type][i]);
				tmp.addKey = "false";
				block[pin_type].push(tmp);
				window.cy.add({
					group: "nodes",
					data: {
						id: block.id + "-i" + (block[pin_type].length - 1)
					},
					position: { x: block.x, y: block.y },
					classes: pin_type,
					locked: true
				});
			}
		}
		if (count)
		{
			for (var i in block[pin_type])
			{
				window.cy.nodes("#" + block.id + "-" + pin_type.substring(0, 1) + i).position({x : block.x + ROSDASH.INPUT_POS[block[pin_type].length][i][0], y : block.y + ROSDASH.INPUT_POS[block[pin_type].length][i][1]});
			}
		}
		break;
	}
}

///////////////////////////////////// block actions (cytoscape)

// find block by id or name
ROSDASH.findBlock = function (id)
{
	if (undefined === id || "" == id || " " == id)
	{
		return undefined;
	}
	var block;
	// find by id
	window.cy.nodes("#" + id).each(function (i, ele) {
		block = ele;
	});
	if (undefined === block)
	{
		// find by name
		window.cy.nodes('[name="' + id + '"]').each(function (i, ele) {
			block = ele;
		});
		if (undefined === block)
		{
			console.log("cannot find", id);
		}
	}
	// if find, center to it
	if (undefined !== block)
	{
		block.select();
		window.cy.center(block);
	}
	return block.id;
}
ROSDASH.removeBlock = function (name)
{
	var ele = window.cy.$(':selected');
	var id;
	var type;
	// priority on selected elements
	if (ele.size() > 0 )
	{
		ele.each(function (i, ele)
		{
			// reserve the id
			id = ele.id();
			// remove block from blocks
			if (ele.id() in ROSDASH.blocks)
			{
				// reserve the type
				type = ROSDASH.blocks[ele.id()].type;
				delete ROSDASH.blocks[ele.id()];
			}
			ele.remove();
		});
	}
	// then the block name from the function argument
	else if (undefined !== name && "" != name)
	{
		// first check id
		ele = window.cy.nodes('[id = "' + name + '"]');
		if (0 == ele.size())
		{
			// then check name
			ele = window.cy.nodes('[name = "' + name + '"]');
			if (ele.size() > 0)
			{
				id = ele.id();
			}
		} else
		{
			id = name;
		}
		if (0 < ele.size())
		{
			// remove block from blocks
			if (id in ROSDASH.blocks)
			{
				type = ROSDASH.blocks[id].type;
				delete ROSDASH.blocks[id];
			}
			ele.remove();
		}
	}
	if (undefined === ROSDASH.widgetDef[type])
	{
		return;
	}
	// remove pins
	//@note change to ROSDASH.blocks
	for (var i = 0; i < ROSDASH.widgetDef[type].input.length; ++ i)
	{
		ROSDASH.removeBlock(id + "-i" + i);
	}
	for (var i = 0; i < ROSDASH.widgetDef[type].output.length; ++ i)
	{
		ROSDASH.removeBlock(id + "-o" + i);
	}
	ROSDASH.removeAllPopup();
}

ROSDASH.movingBlock;
// move a block body
ROSDASH.moveBlock = function (id)
{
	// target does not exist
	if (undefined === ROSDASH.blocks[id])
	{
		return;
	}
	// hide input pins
	var pin_num = ROSDASH.blocks[id].input.length;
	for (var i = 0; i < pin_num; ++ i)
	{
		window.cy.nodes('[id = "' + id + "-i" + i + '"]').hide();
	}
	// hide input pins
	pin_num = ROSDASH.blocks[id].output.length;
	for (var i = 0; i < pin_num; ++ i)
	{
		window.cy.nodes('[id = "' + id + "-o" + i + '"]').hide();
	}
	// remove all popups when moving
	ROSDASH.removeAllPopup();
}
// let pins follow body when moving
ROSDASH.followBlock = function (target)
{
	var id = target.id();
	if (! (id in ROSDASH.blocks))
	{
		return;
	}
	// update the position in ROSDASH.blocks
	ROSDASH.blocks[id].x = target.position('x');
	ROSDASH.blocks[id].y = target.position('y');
	var type = ROSDASH.blocks[id].type;
	// input pins follow
	var pin_num = ROSDASH.blocks[id].input.length;
	for (var i = 0; i < pin_num; ++ i)
	{
		window.cy.nodes('[id = "' + id + "-i" + i + '"]').positions(function (j, ele)
		{
			ele.position({
				x: target.position('x') + ROSDASH.INPUT_POS[pin_num][i][0],
				y: target.position('y') + ROSDASH.INPUT_POS[pin_num][i][1]
			});
		}).show();
	}
	// output pins follow
	pin_num = ROSDASH.blocks[id].output.length;
	for (var i = 0; i < pin_num; ++ i)
	{
		window.cy.nodes('[id = "' + id + "-o" + i + '"]').positions(function (j, ele)
		{
			ele.position({
				x: target.position('x') + ROSDASH.OUTPUT_POS[pin_num][i][0],
				y: target.position('y') + ROSDASH.OUTPUT_POS[pin_num][i][1]
			});
		}).show();
	}
}
ROSDASH.blockMoveCallback = function ()
{
	// move the block body
	window.cy.on('position', function(evt)
	{
		if (evt.cyTarget.id() != ROSDASH.movingBlock)
		{
			ROSDASH.movingBlock = evt.cyTarget.id();
			ROSDASH.moveBlock(ROSDASH.movingBlock);
		}
	});
	// when releasing, let pins follow
	window.cy.on('free', function(evt)
	{
		ROSDASH.followBlock(evt.cyTarget);
		ROSDASH.movingBlock = undefined;
	});
}

//  the former one when connecting
ROSDASH.connectFormer = new Object();
// connect two pins
ROSDASH.connectBlocks = function (source, target)
{
	// if source or target does not exist
	var body = ROSDASH.getBlockParent(source);
	if (! (body in ROSDASH.blocks))
	{
		console.error("cannot connect: ", source, body);
		return;
	}
	body = ROSDASH.getBlockParent(target);
	if (! (body in ROSDASH.blocks))
	{
		console.error("cannot connect: ", target, body);
		return;
	}
	var flag = false;
	// if target has duplicate connection @note maybe a better finding way?
	window.cy.edges().each(function (i, ele)
	{
		if (true == flag)
		{
			return;
		}
		if (ele.source().id() == target || ele.target().id() == target)
		{
			var pin_type = ROSDASH.getPinType(ele.target().id());
			// if input or output. If others (comments, popup, etc), can connect
			if ("i" == pin_type || "o" == pin_type)
			{
				flag = true;
				console.error("duplicate connect: ", ele.source().id(), ele.target().id());
				return;
			}
		}
	});
	if (flag)
	{
		// output error for once
		console.error("duplicate connect: ", target);
		return;
	}
	// add edge
	window.cy.add({
		group: "edges",
		"data": {
		"source": source,
		"target": target,
		"faveColor": "grey",
		"strength": 10
		}
	});
}
ROSDASH.connectBlocksCallback = function ()
{
	window.cy.on('select', function(evt)
	{
		// mark the connect type
		var connect_type = 0;
		if (evt.cyTarget.hasClass("output"))
		{
			connect_type = 1;
		} else if (evt.cyTarget.hasClass("input"))
		{
			connect_type = 2;
		} else
		{
			return;
		}
		// if no former or unselected the former for a while, set the former
		if (undefined === ROSDASH.connectFormer.block || new Date().getTime() - ROSDASH.connectFormer.unselect > 300)
		{
			ROSDASH.connectFormer.block = evt.cyTarget;
			ROSDASH.connectFormer.type = connect_type;
		}
		// can be connected if connect types are different
		else if (undefined != ROSDASH.connectFormer.block && connect_type != ROSDASH.connectFormer.type)
		{
			if (1 == connect_type)
			{
				ROSDASH.connectBlocks(evt.cyTarget.id(), ROSDASH.connectFormer.block.id());
			}
			else if (2 == connect_type)
			{
				ROSDASH.connectBlocks(ROSDASH.connectFormer.block.id(), evt.cyTarget.id());
			}
			ROSDASH.connectFormer.block = undefined;
		} else // connect failed
		{
			ROSDASH.connectFormer.block = undefined;
		}
	});
	// update the unselect time stamp
	window.cy.on('unselect', function(evt)
	{
		ROSDASH.connectFormer.unselect = new Date().getTime();
	});
}

// get a editable subset property in block to edit
ROSDASH.getBlockEditableProperty = function (id)
{
	if (! (id in ROSDASH.blocks))
	{
		return;
	}
	var block = ROSDASH.blocks[id];
	// general property
	var property = {
		x: block.x,
		y: block.y
	};
	// special property
	switch (block.type)
	{
	case "constant":
		property.value = block.value;
		break;
	case "topic":
	case "service":
	case "param":
		property.type = block.type;
		property.rosname = block.rosname;
		property.rostype = block.rostype;
		break;
	default:
	}
	return property;
}

// block selection
ROSDASH.selectedBlock;
// update the sidebar and popups when selected
ROSDASH.selectBlockCallback = function (evt)
{
	// select node
	if (evt.cyTarget.isNode())
	{
		// select pin
		if (evt.cyTarget.hasClass("pin") || evt.cyTarget.hasClass("input") || evt.cyTarget.hasClass("output"))
		{
			ROSDASH.selectedBlock = ROSDASH.getBlockParent(evt.cyTarget.id());
		}
		// select body
		else if (evt.cyTarget.hasClass("body"))
		{
			ROSDASH.selectedBlock = evt.cyTarget.id();
			// add a popup to selected block to show description
			ROSDASH.addBlockPopup(evt.cyTarget.id());
			// a sidebar for block json information
			ROSDASH.jsonFormType = "property";
			ROSDASH.formClickBlock(evt.cyTarget.id());
		}
		// select popup
		else if (evt.cyTarget.hasClass("popup"))
		{
			ROSDASH.selectedBlock = ROSDASH.getBlockParent(evt.cyTarget.id());
			// popup connect
			if (evt.cyTarget.hasClass("pinput") || evt.cyTarget.hasClass("poutput"))
			{
				//@todo popup connect
				console.log("popup connect")
			}
			// change pin
			if (evt.cyTarget.id().substring(evt.cyTarget.id().length - 2) == "-a")
			{
				ROSDASH.changePin(evt.cyTarget.id(), "input", "add");
			}
		}
	} else // select edge
	{
		ROSDASH.selectedBlock = undefined;
		// add a popup to selected edge to show description
		ROSDASH.addEdgePopup(evt.cyTarget);
	}
}

///////////////////////////////////// block popups and comments

// remove all popups when unselected
ROSDASH.removeAllPopup = function ()
{
	// remove previous popups
	cy.$('.popup').each(function (i, ele)
	{
		var id = ROSDASH.getBlockParent(ele.id());
		if ((id in ROSDASH.blocks) && ("popup" in ROSDASH.blocks[id]))
		{
			var tn = ROSDASH.getPinTypeNum(ele.id());
			// remove the name in ROSDASH.blocks[id].popup
			for (var i in ROSDASH.blocks[id].popup)
			{
				if (ROSDASH.blocks[id].popup[i] == tn)
				{
					ROSDASH.blocks[id].popup.splice(i, 1);
					break;
				}
			}
		}
		ele.remove();
	});
}
// add a popup to a pin
ROSDASH.addPinPopup = function (id, pin_type, num)
{
	var block = ROSDASH.blocks[id];
	if (undefined === block[pin_type][num] || undefined === block[pin_type][num].name)
	{
		return;
	}
	// shorthand for pin_type
	var pin_t = pin_type.substring(0, 1);
	var pin_pos = window.cy.nodes('#' + block.id + "-" + pin_t + num).position();
	var text = block[pin_type][num].name;
	window.cy.add({
		group: "nodes",
		data: {
			id: block.id + "-p" + pin_t + num,
			name: text,
			weight: 40,
			height: 80,
			faveShape: "ellipse",
			faveColor: "Cornsilk",
		},
		position: { x: pin_pos.x + (("input" == pin_type) ? -70 : 70), y: pin_pos.y },
		classes: "popup p" + pin_type
	});
	window.cy.add({
		group: "edges",
		"data": {
		"source": block.id + "-p" + pin_t + num,
		"target": block.id + "-" + pin_t + num,
		"strength": 100,
		'target-arrow-shape': 'triangle'
		}
	});
	// add to popup list
	if (id in ROSDASH.blocks && "popup" in ROSDASH.blocks[id])
	{
		ROSDASH.blocks[id].popup.push("p" + pin_t + num);
	}
}
// when a block is clicked, popup descriptions for the block and its inputs and outputs
ROSDASH.addBlockPopup = function (id)
{
	// remove previous popups
	ROSDASH.removeAllPopup();
	var target = ROSDASH.blocks[id];
	if (! ("popup" in ROSDASH.blocks[id]))
	{
		ROSDASH.blocks[id].popup = new Array();
	}
	var text = target.id;
	var discrip_weight = 100;
	// if has description, popup
	if (undefined !== ROSDASH.widgetDef[target.type] && undefined !== ROSDASH.widgetDef[target.type].descrip)
	{
		text += " : " + ROSDASH.widgetDef[target.type].descrip;
		discrip_weight += 300;
	}
	window.cy.add({
		group: "nodes",
		data: {
			id: target.id + "-pd",
			name: text,
			weight: discrip_weight,
			height: 80,
			faveShape: "roundrectangle",
			"faveColor": "Cornsilk",
		},
		position: { x: target.x, y: target.y - 100 },
		classes: "popup"
	});
	window.cy.add({
		group: "edges",
		"data": {
		"source": target.id + "-pd",
		"target": target.id,
		"strength": 100,
		'target-arrow-shape': 'triangle'
		}
	});
	ROSDASH.blocks[id].popup.push("pd");
	// popup names for inputs
	for (var i = 0; i < target.input.length; ++ i)
	{
		ROSDASH.addPinPopup(id, "input", i);
	}
	// popup names for outputs
	for (var i = 0; i < target.output.length; ++ i)
	{
		ROSDASH.addPinPopup(id, "output", i);
	}
	// popup for add a new pin
	for (var i in target.input)
	{
		if ("true" == target.input[i].addKey)
		{
			window.cy.add({
				group: "nodes",
				data: {
					id: target.id + "-pa0",
					name: "add key",
					weight: 100,
					height: 80,
					faveShape: "roundrectangle",
					"faveColor": "Coral",
				},
				position: { x: target.x, y: target.y - 200 },
				classes: "popup"
			});
			window.cy.add({
				group: "edges",
				"data": {
				"source": target.id + "-pa0",
				"target": target.id,
				"strength": 100,
				'target-arrow-shape': 'triangle'
				}
			});
			ROSDASH.blocks[id].popup.push("pa0");
			break;
		}
	}
}
// when an edge is clicked, popup discriptions for both ends
ROSDASH.addEdgePopup = function (edge)
{
	ROSDASH.removeAllPopup();
	var source_id = ROSDASH.getBlockParent(edge.source().id());
	var target_id = ROSDASH.getBlockParent(edge.target().id());
	var source_num = ROSDASH.getPinNum(edge.source().id());
	var target_num = ROSDASH.getPinNum(edge.target().id());
	if (undefined === ROSDASH.blocks[source_id].output[source_num] || undefined === ROSDASH.blocks[target_id].input[target_num])
	{
		return;
	}
	ROSDASH.addPinPopup(source_id, "output", source_num);
	ROSDASH.addPinPopup(target_id, "input", target_num);
}

ROSDASH.commentCount = 0;
// add a comment block by the content
ROSDASH.addBlockComment = function (content)
{
	if (undefined === content)
	{
		return undefined;
	}
	var block = window.cy.add({
		group: "nodes",
		data: {
			id: "c-" + ROSDASH.commentCount,
			name: content,
			weight: 100,
			height: 80,
			faveShape: "roundrectangle",
			faveColor: "Cornsilk",
		},
		position: { x: 0, y: 0 },
		classes: "comment"
	});
	++ ROSDASH.commentCount;
	return "c-" + (ROSDASH.commentCount - 1);
}

///////////////////////////////////// diagram

ROSDASH.defaultStyle = undefined;
// depend on cytoscape.js
if ("cytoscape" in window)
{
	ROSDASH.defaultStyle = cytoscape.stylesheet()
		.selector('node').css({
			'shape': 'data(faveShape)',
			'background-color': 'data(faveColor)',
			'border-width': 1,
			'border-color': 'black',
			'width': 'mapData(weight, 10, 30, 20, 60)',
			'height': 'mapData(height, 0, 100, 10, 45)',
			'content': 'data(name)',
			'font-size': 25,
			'text-valign': 'center',
			'text-outline-width': 2,
			'text-outline-color': 'data(faveColor)',
			'color': 'black'
		})
		.selector(':selected').css({
			'border-width': 3,
			'border-color': 'black',
			'color': 'red'
		})
		.selector('edge').css({
			'width': 'mapData(strength, 70, 100, 2, 6)',
			'line-color': 'data(faveColor)',
			'target-arrow-shape': 'triangle',
			'source-arrow-color': 'data(faveColor)',
			'target-arrow-color': 'data(faveColor)'
		})
		.selector('.body').css({
			'shape': 'roundrectangle',
			'width': '130',
			'height': '70'
		})
		.selector('.input').css({
			'shape': 'rectangle',
			'width': '10',
			'height': '10',
			'text-outline-color': 'grey',
			'background-color': 'grey',
			'border-width': 0,
		})
		.selector('.output').css({
			'shape': 'rectangle',
			'width': '10',
			'height': '10',
			'text-outline-color': 'grey',
			'background-color': 'grey',
			'border-width': 0,
		});
}
// save diagram into file
ROSDASH.saveDiagram = function ()
{
	// basic json for a diagram
	var json = {
		user: ROSDASH.ownerConf.name,
		ros_host: ROSDASH.ownerConf.ros_host,
		ros_port: ROSDASH.ownerConf.ros_port,
		panel_name: ROSDASH.ownerConf.panel_name,
		version: ROSDASH.version,
		view_type: "diagram",
		block: new Object(),
		edge: new Array()
	};
	// add all blocks into json
	for (var i in ROSDASH.blocks)
	{
		json.block[i] = ROSDASH.blocks[i];
	}
	// add all edges into json
	window.cy.edges().each(function (i, ele)
	{
		var e = {
			source: ele.source().id(),
			target: ele.target().id()
		};
		json.edge.push(e);
	});
	ROSDASH.saveJson(json, "file/" + json.user + "/" + json.panel_name + "-diagram");
}
// load diagram from json
ROSDASH.loadDiagram = function (json)
{
	// load blocks
	for (var i in json.block)
	{
		ROSDASH.addBlock(json.block[i]);
	}
	// load edges
	for (var i in json.edge)
	{
		// identify the source and target @note should move to connect function
		var source = json.edge[i].source;
		var index = source.lastIndexOf("-");
		var type1 = source.substring(index + 1, index + 2);
		var target = json.edge[i].target;
		index = target.lastIndexOf("-");
		var type2 = target.substring(index + 1, index + 2);
		if ("o" == type1 && "i" == type2)
		{
			ROSDASH.connectBlocks(source, target);
		} else if ("i" == type1 && "o" == type2)
		{
			ROSDASH.connectBlocks(target, source);
		}
	}
	// fit page into best view
	window.cy.fit();
}
// main function for diagram
ROSDASH.startDiagram = function (owner, panel_name, selected)
{
	ROSDASH.ownerConf.view_type = "diagram";
	ROSDASH.setPanel(owner, panel_name);
	ROSDASH.initSidebar();
	ROSDASH.initToolbar();
	ROSDASH.initJson();
	// create an empty cytoscape diagram
	$('#cy').cytoscape({
		showOverlay: false,
		style: ROSDASH.defaultStyle,
		elements: {nodes: new Array(), edges: new Array()},
		ready: function ()
		{
			window.cy = this;
			ROSDASH.selectedBlock = selected;
			ROSDASH.loadJson('file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-diagram.json");
			ROSDASH.waitJson();
		}
	});
}
// run diagram after loading json
ROSDASH.runDiagram = function (data)
{
	ROSDASH.loadDiagram(data);
	// set callback functions
	ROSDASH.blockMoveCallback();
	ROSDASH.connectBlocksCallback();
	window.cy.on('select', ROSDASH.selectBlockCallback);
	window.cy.on('unselect', ROSDASH.removeAllPopup);
	// fit to selected block from url
	if (undefined !== ROSDASH.selectedBlock)
	{
		ROSDASH.findBlock(ROSDASH.selectedBlock);
	}
	ROSDASH.ee.emitEvent("diagramReady");
}

///////////////////////////////////// widget actions (based on sDashboard)

// a list of widgets in the panel
ROSDASH.widgets = new Object();
// set the widget number
ROSDASH.getWidgetNum = function (def)
{
	// if the ROSDASH.widgetDef of def.widgetType does not exist - for constant
	if (undefined === ROSDASH.widgetDef[def.widgetType])
	{
		ROSDASH.widgetDef[def.widgetType] = new Object();
		if (undefined === def.number)
		{
			// init to 0
			ROSDASH.widgetDef[def.widgetType].count = 0;
			def.number = ROSDASH.widgetDef[def.widgetType].count;
		} else
		{
			ROSDASH.widgetDef[def.widgetType].count = def.number;
		}
	}
	else if (undefined === ROSDASH.widgetDef[def.widgetType].count)
	{
		if (undefined === def.number)
		{
			// init to 0
			ROSDASH.widgetDef[def.widgetType].count = 0;
			def.number = ROSDASH.widgetDef[def.widgetType].count;
		} else
		{
			ROSDASH.widgetDef[def.widgetType].count = def.number;
		}
	} else if (undefined === def.number)
	{
		++ ROSDASH.widgetDef[def.widgetType].count;
		def.number = ROSDASH.widgetDef[def.widgetType].count;
	} else if (def.number > ROSDASH.widgetDef[def.widgetType].count)
	{
			ROSDASH.widgetDef[def.widgetType].count = def.number;
	} else
	{
		// if widget number conflicts
		for (var i in ROSDASH.widgets)
		{
			if (ROSDASH.widgets[i].widgetType == def.widgetType && ROSDASH.widgets[i].number == def.number)
			{
				console.error("widget number conflicted: " + def.widgetId);
				// set a new widget number
				++ ROSDASH.widgetDef[def.widgetType].count;
				def.number = ROSDASH.widgetDef[def.widgetType].count;
			}
		}
	}
	return def;
}
// add a widget by type, usually a new widget
ROSDASH.addWidgetByType = function (name)
{
	if (! ROSDASH.checkWidgetTypeValid(name))
	{
		return;
	}
	// set a new count number. don't use getWidgetNum because there is no widget object
	if (undefined === ROSDASH.widgetDef[name])
	{
		ROSDASH.widgetDef[name] = new Object();
		ROSDASH.widgetDef[name].count = 0;
	}
	else if (undefined === ROSDASH.widgetDef[name].count)
	{
		ROSDASH.widgetDef[name].count = 0;
	} else
	{
		++ ROSDASH.widgetDef[name].count;
	}
	var widget = {
		widgetTitle : name + " " + ROSDASH.widgetDef[name].count,
		widgetId : name + "-" + ROSDASH.widgetDef[name].count,
		number : ROSDASH.widgetDef[name].count,
		widgetType : name,
		widgetContent : undefined,
		// set the position of new widget as 0
		pos : 0,
		width: ("width" in ROSDASH.widgetDef[name]) ? ROSDASH.widgetDef[name].width : ROSDASH.ownerConf.widget_width,
		height: ("height" in ROSDASH.widgetDef[name]) ? ROSDASH.widgetDef[name].height : ROSDASH.ownerConf.widget_height,
		header_height: ROSDASH.ownerConf.header_height,
		content_height: ROSDASH.ownerConf.content_height,
		config: ROSDASH.widgetDef[name].config
	};
	// move other widgets backward by one
	for (var i in ROSDASH.widgets)
	{
		++ ROSDASH.widgets[i].pos;
	}
	ROSDASH.addWidget(widget);
	ROSDASH.ee.emitEvent('change');
}
// add a widget, usually from json
ROSDASH.addWidget = function (def)
{
	// if duplicate widget id
	if (def.widgetId in ROSDASH.widgets)
	{
		console.error("widget id duplicate: " + def.widgetId);
		// show the effect
		$("#myDashboard").sDashboard("addWidget", def);
		return;
	}
	def = ROSDASH.getWidgetNum(def);
	// save the definition of this widget
	ROSDASH.widgets[def.widgetId] = def;
	var widget = def;
	widget = ROSDASH.setWidgetContent(widget);
	if (undefined === widget)
	{
		return;
	}
	$("#myDashboard").sDashboard("addWidget", widget);
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
	// set default title
	widget.widgetTitle = widget.widgetType + " " + widget.number;
	// if widget instantiated. if editor, addWidget is not executed
	if (undefined !== ROSDASH.diagramConnection[widget.widgetId] && undefined !== ROSDASH.diagramConnection[widget.widgetId].instance)
	{
		// set default title from config
		if (undefined !== ROSDASH.diagramConnection[widget.widgetId].block && undefined !== ROSDASH.diagramConnection[widget.widgetId].block.config && undefined !== ROSDASH.diagramConnection[widget.widgetId].block.config.title && "" != ROSDASH.diagramConnection[widget.widgetId].block.config.title)
		{
			widget.widgetTitle = ROSDASH.diagramConnection[widget.widgetId].block.config.title;
		}
		// the intance of widget
		var obj = ROSDASH.diagramConnection[widget.widgetId].instance;
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
	}
	return widget;
}

ROSDASH.removeWidget = function (id)
{
	var pos = ROSDASH.widgets[id].pos;
	// move widgets behind it forward by one
	for (var i in ROSDASH.widgets)
	{
		if (ROSDASH.widgets[i].pos > pos)
		{
			-- ROSDASH.widgets[i].pos;
		}
	}
	delete ROSDASH.widgets[id];
	ROSDASH.ee.emitEvent('change');
}
// callback function of sDashboard widget move
ROSDASH.moveWidget = function (sorted)
{
	// update all new positions
	for (var i in sorted)
	{
		if (sorted[i].widgetId in ROSDASH.widgets)
		{
			ROSDASH.widgets[sorted[i].widgetId].pos = i;
		}
	}
	ROSDASH.ee.emitEvent('change');
}
ROSDASH.selectedWidget;
ROSDASH.selectWidgetCallback = function (e, data)
{
	ROSDASH.selectedWidget = data.selectedWidgetId;
	var w = ROSDASH.widgets[ROSDASH.selectedWidget];
	// a sidebar for widget json information
	ROSDASH.jsonFormType = "property";
	ROSDASH.formClickBlock(ROSDASH.selectedWidget);
	return w;
}

// get a editable subset property in widget to edit
ROSDASH.getWidgetEditableProperty = function (id)
{
	if (! (id in ROSDASH.widgets))
	{
		return;
	}
	var widget = ROSDASH.widgets[id];
	var property = {
		widgetTitle: widget.widgetTitle,
		width: widget.width,
		height: widget.height,
		header_height: widget.header_height,
		content_height: widget.content_height
	};
	return property;
}

///////////////////////////////////// panel

// load widgets from json
ROSDASH.loadPanel = function (json)
{
	if (null === json)
	{
		return;
	}
	json = json.widgets;
	var count = 0;
	for (var i in json)
	{
		++ count;
	}
	while (count)
	{
		// find the max widget position and add it
		var max = -1;
		var max_num;
		for (var i in json)
		{
			var pos = parseInt(json[i].pos);
			if (pos > max)
			{
				max = pos;
				max_num = i;
			}
		}
		ROSDASH.addWidget(json[max_num]);
		delete json[max_num];
		-- count;
	}
	// show selected item from url
	if (undefined !== ROSDASH.selectedWidget && ROSDASH.selectedWidget in ROSDASH.widgets)
	{
		$("#" + ROSDASH.selectedWidget + " div.sDashboardWidgetHeader").css("background-color", "Aquamarine");
		ROSDASH.selectWidgetCallback(undefined, {selectedWidgetId: ROSDASH.selectedWidget});
	}
}
// save configuration and widgets to json file
ROSDASH.savePanel = function ()
{
	var json = {
		user: ROSDASH.ownerConf.name,
		panel_name: ROSDASH.ownerConf.panel_name,
		version: ROSDASH.version,
		view_type: "panel",
		ros_host: ROSDASH.ownerConf.ros_host,
		ros_port: ROSDASH.ownerConf.ros_port,
		disable_selection: ROSDASH.ownerConf.disable_selection,
		run_msec: ROSDASH.ownerConf.run_msec,
		widget_width: ROSDASH.ownerConf.widget_width,
		widget_height: ROSDASH.ownerConf.widget_height,
		header_height: ROSDASH.ownerConf.header_height,
		content_height: ROSDASH.ownerConf.content_height,
		widgets: ROSDASH.widgets
	};
	ROSDASH.saveJson(json, "file/" + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-panel");
}
// bind callback functions
ROSDASH.panelBindEvent = function ()
{
	$("#myDashboard").bind("sdashboardorderchanged", function(e, data)
	{
		ROSDASH.moveWidget(data.sortedDefinitions);
	});
	$("#myDashboard").bind("sdashboardheaderclicked", ROSDASH.selectWidgetCallback);
	$("#myDashboard").bind("sdashboardwidgetmaximized", ROSDASH.widgetMaxCallback);
	$("#myDashboard").bind("sdashboardwidgetminimized", ROSDASH.widgetMaxCallback);
	$("#myDashboard").bind("sdashboardwidgetadded", ROSDASH.widgetAddCallback);
	$("#myDashboard").bind("sdashboardwidgetremoved", function(e, data)
	{
		ROSDASH.removeWidget(data.widgetDefinition.widgetId);
	});
	$("#myDashboard").bind("sdashboardwidgetset", ROSDASH.widgetSetCallback);
	$("#myDashboard").bind("sdashboardheaderset", ROSDASH.headerSetCallback);
}

// the main function for panel editor
ROSDASH.startEditor = function (owner, panel_name, selected)
{
	ROSDASH.ownerConf.view_type = "editor";
	ROSDASH.setPanel(owner, panel_name);
	ROSDASH.initToolbar();
	ROSDASH.initSidebar();

	// create empty dashboard
	$("#myDashboard").sDashboard({
		dashboardData : [],
		disableSelection : ROSDASH.ownerConf.disable_selection
	});
	ROSDASH.panelBindEvent();
	ROSDASH.selectedWidget = selected;

	ROSDASH.initJson();
	// check diagram for updates
	ROSDASH.checkDiagram();
	// load panel from json file
	ROSDASH.loadJson('file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-panel.json");
	ROSDASH.waitJson();
}
// the main function for panel
ROSDASH.startPanel = function (owner, panel_name, selected)
{
	ROSDASH.ownerConf.view_type = "panel";
	ROSDASH.setPanel(owner, panel_name);
	ROSDASH.initToolbar();

	// generate empty dashboard
	$("#myDashboard").sDashboard({
		dashboardData : [],
		disableSelection : ROSDASH.ownerConf.disable_selection
	});
	ROSDASH.panelBindEvent();
	ROSDASH.selectedWidget = selected;

	ROSDASH.initJson();
	// load diagram for analysis
	ROSDASH.loadJson('file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-diagram.json");
	// load panel from json file
	ROSDASH.loadJson('file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-panel.json");
	ROSDASH.waitJson();
}
// start to execute widgets
ROSDASH.exePanel = function ()
{
	ROSDASH.ee.emitEvent("panelReady");
	ROSDASH.ee.emitEvent("initBegin");
	ROSDASH.initWidgets();
	ROSDASH.ee.emitEvent("executionBegin");
	ROSDASH.runWidgets();
}

///////////////////////////////////// panel callback

ROSDASH.widgetMaxCallback = function (e, data)
{}
ROSDASH.widgetAddCallback = function (e, data)
{}
ROSDASH.widgetSetCallback = function (e, data)
{}
ROSDASH.headerSetCallback = function (e, data)
{}

///////////////////////////////////// diagram analysis

// diagram for analysis
ROSDASH.diagram = undefined;
// check diagram for updates
ROSDASH.checkDiagram = function ()
{
	var file = 'file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-diagram.json";
	$.getJSON(file, function (data, status, xhr)
	{
		// if different
		if (JSON.stringify(ROSDASH.diagram) != JSON.stringify(data))
		{
			for (var i in data.block)
			{
				// if a widget updates
				if (! (i in ROSDASH.widgets) && ("type" in data.block[i]) && (data.block[i].type in ROSDASH.widgetDef) && ROSDASH.widgetDef[data.block[i].type].has_panel)
				{
					var widget = {
						widgetTitle : data.block[i].name,
						widgetId : data.block[i].id,
						widgetType : data.block[i].type,
						number : data.block[i].number,
						widgetContent : undefined,
						pos : 0,
						width: ("width" in ROSDASH.widgetDef[data.block[i].type]) ? ROSDASH.widgetDef[data.block[i].type].width : ROSDASH.ownerConf.widget_width,
						height: ("height" in ROSDASH.widgetDef[data.block[i].type]) ? ROSDASH.widgetDef[data.block[i].type].height : ROSDASH.ownerConf.widget_height,
						header_height: ROSDASH.ownerConf.header_height,
						content_height: ROSDASH.ownerConf.content_height,
						config : data.block[i].config
					};
					ROSDASH.addWidget(widget);
					console.log("update from diagram", i, data.block[i]);
					ROSDASH.ee.emitEvent('change');
				}
			}
			ROSDASH.diagram = data;
		}
		// wait for next check
		setTimeout(ROSDASH.checkDiagram, 2000);
	});
}
ROSDASH.compareDiagram = function ()
{
	var file = 'file/' + ROSDASH.ownerConf.name + "/" + ROSDASH.ownerConf.panel_name + "-diagram.json";
	$.getJSON(file, function (data, status, xhr)
	{
		for (var i in data.block)
		{
			var type = data.block[i].type;
			if (! (i in ROSDASH.widgets) && (type in ROSDASH.widgetDef) && (true == ROSDASH.widgetDef[type].has_panel || "true" == ROSDASH.widgetDef[type].has_panel))
			{
				var widget = {
					widgetTitle : data.block[i].name,
					widgetId : data.block[i].id,
					widgetType : data.block[i].type,
					number : data.block[i].number,
					widgetContent : undefined,
					pos : 0,
					width: ("width" in ROSDASH.widgetDef[data.block[i].type]) ? ROSDASH.widgetDef[data.block[i].type].width : ROSDASH.ownerConf.widget_width,
					height: ("height" in ROSDASH.widgetDef[data.block[i].type]) ? ROSDASH.widgetDef[data.block[i].type].height : ROSDASH.ownerConf.widget_height,
					header_height: ROSDASH.ownerConf.header_height,
					content_height: ROSDASH.ownerConf.content_height,
					config : data.block[i].config
				};
				ROSDASH.addWidget(widget);
				console.log("update from diagram", i, data.block[i]);
				ROSDASH.ee.emitEvent('change');
			}
		}
	});
}

// read diagram json for panel execution
ROSDASH.readDiagram = function (data)
{
	ROSDASH.diagram = data;
	// parse block config into true value
	for (var i in ROSDASH.diagram.block)
	{
		if (undefined !== ROSDASH.diagram.block[i].config)
		{
			ROSDASH.diagram.block[i].config = ROSDASH.transformRawJson(ROSDASH.diagram.block[i].config);
		}
	}
	ROSDASH.traverseDiagram();
}
// connection relationship for diagram
ROSDASH.diagramConnection = new Object();
// set a new item in diagram connection
ROSDASH.initDiagramConnection = function (id)
{
	if (undefined === ROSDASH.diagramConnection[id])
	{
		ROSDASH.diagramConnection[id] = {
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
// traverse the diagram to obtain the connection relations
ROSDASH.traverseDiagram = function ()
{
	// for each edge
	for (var i in ROSDASH.diagram.edge)
	{
		var edge = ROSDASH.diagram.edge[i];
		// obtain one block of the edge
		var block1 = ROSDASH.getBlockParent(edge.source);
		ROSDASH.initDiagramConnection(block1);
		var type1 = ROSDASH.getPinTypeNum(edge.source);
		// obtain the other block of the edge
		var block2 = ROSDASH.getBlockParent(edge.target);
		ROSDASH.initDiagramConnection(block2);
		var type2 = ROSDASH.getPinTypeNum(edge.target);
		// save into ROSDASH.diagramConnection
		if (type1.substring(0, 1) == "i" && type2.substring(0, 1) == "o")
		{
			ROSDASH.diagramConnection[block1].parent[type1] = block2;
			ROSDASH.diagramConnection[block1].type[type1] = type2;
		} else if (type1.substring(0, 1) == "o" && type2.substring(0, 1) == "i")
		{
			ROSDASH.diagramConnection[block2].parent[type2] = block1;
			ROSDASH.diagramConnection[block2].type[type2] = type1;
		}
	}
	// for each block
	for (var i in ROSDASH.diagram.block)
	{
		// if it is not in the connection
		if (undefined === ROSDASH.diagramConnection[i])
		{
			// generate that block with no connection
			ROSDASH.initDiagramConnection(i);
		}
		// record the block property especially config
		ROSDASH.diagramConnection[i].block = ROSDASH.diagram.block[i];
		// check if cacheable
		if (("config" in ROSDASH.diagramConnection[i].block) && ("cacheable" in ROSDASH.diagramConnection[i].block.config) && ROSDASH.diagramConnection[i].block.config.cacheable)
		{
			ROSDASH.diagramConnection[i].cacheable = true;
		}
		// validate the existence of the block
		ROSDASH.diagramConnection[i].exist = true;
		// load required js
		if (undefined !== ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js)
		{
			for (var j in ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js)
			{
				try {
					ROSDASH.loadJs(ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js[j]);
				} catch (err)
				{
					ROSDASH.diagramConnection[i].error = true;
					console.error("loading js required by widget error:", ROSDASH.diagram.block[i].type, ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js[j], err.message, err.stack);
				}
			}
		}
		// load required css
		if (undefined !== ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].css)
		{
			for (var j in ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].css)
			{
				try {
					ROSDASH.loadCss(ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js[j]);
				} catch (err)
				{
					ROSDASH.diagramConnection[i].error = true;
					console.error("loading css required by widget error:", ROSDASH.diagram.block[i].type, ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].css[j], err.message, err.stack);
				}
			}
		}
		// instantiate widget class with block property
		if (! ROSDASH.diagramConnection[i].error)
		{
			try {
				ROSDASH.diagramConnection[i].instance = ROSDASH.newObjByName(ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].class_name, ROSDASH.diagram.block[i]);
			} catch (err)
			{
				ROSDASH.diagramConnection[i].error = true;
				console.error("instantiate widget error:", i, ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].class_name, err.message, err.stack);
			}
			if (undefined === ROSDASH.diagramConnection[i].instance)
			{
				ROSDASH.diagramConnection[i].error = true;
			}
		}
	}
}

///////////////////////////////////// widget dependency

ROSDASH.requireLoadList = new Object();
// load js file required by widgets
ROSDASH.loadJs = function (file)
{
	if (undefined === ROSDASH.requireLoadList[file])
	{
		ROSDASH.requireLoadList[file] = 0;
	}
	$.getScript(file, function (data, status, jqxhr) {
		++ ROSDASH.requireLoadList[file];
	}).fail(function (jqxhr, settings, exception)
	{
		ROSDASH.requireLoadList[file] = -1;
		console.error("loading js fail:", file, jqxhr, settings, exception);
	}).always(function() {
		++ ROSDASH.requireLoadList[file];
	});
}
// load css file required by widgets
ROSDASH.loadCss = function (file)
{
	$('head').append('<link rel="stylesheet" href="' + file + '" type="text/css" />');
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

ROSDASH.setInitialized = function (id)
{
	if (id in ROSDASH.diagramConnection)
	{
		ROSDASH.diagramConnection[id].initialized = true;
	}
}
// call init functions of widgets
ROSDASH.initWidgets = function ()
{
	for (var i in ROSDASH.diagramConnection)
	{
		// validate the existence of each block just once
		if (! ROSDASH.diagramConnection[i].exist)
		{
			console.error("widget does not exist: ", i);
			continue;
		}
		// if error or already initialized
		if (ROSDASH.diagramConnection[i].error || ROSDASH.diagramConnection[i].initialized)
		{
			continue;
		}
		// check if required js is ready
		if (undefined !== ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js)
		{
			var flag = false;
			for (var j in ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js)
			{
				if ( ROSDASH.requireLoadList[ROSDASH.widgetDef[ROSDASH.diagram.block[i].type].js[j]] < 2 )
				{
					flag = true;
					break;
				}
			}
			// if not ready
			if (flag)
			{
				continue;
			}
		}
		if (undefined !== ROSDASH.diagramConnection[i].instance)
		{
			// run function by instance of widget class
			ROSDASH.callWidgetInit(i);
			// if ros connected
			if (ROSDASH.rosConnected && ROSDASH.cycle < 0)
			{
				try	{
					// run initRos
					var initialized = ROSDASH.runFuncByName("initRos", ROSDASH.diagramConnection[i].instance);
					ROSDASH.diagramConnection[i].initialized = ROSDASH.diagramConnection[i].initialized || initialized;
				} catch (err)
				{
					console.error("widget initRos error:", i, err.message, err.stack);
				}
			}
			if (undefined === ROSDASH.diagramConnection[i].initialized)
			{
				ROSDASH.diagramConnection[i].initialized = true;
			}
		}
	}
}
//@todo change to event, consider return value
ROSDASH.callWidgetInit = function (id)
{
	try
	{
		ROSDASH.diagramConnection[id].initialized = ROSDASH.runFuncByName("init", ROSDASH.diagramConnection[id].instance);
	} catch (err)
	{
		console.error("widget init error:", id, err.message, err.stack);
	}
}

ROSDASH.doneCount = 0;
ROSDASH.cycle = -1;
ROSDASH.runWidgets = function ()
{
	// count how many cycles executed
	++ ROSDASH.cycle;
	ROSDASH.ee.emitEvent("cycleBegin");
	ROSDASH.doneCount = 0;
	var last_count = -1;
	// if ROSDASH.doneCount does not change, the diagram execution ends
	while (last_count < ROSDASH.doneCount)
	{
		last_count = ROSDASH.doneCount;
		// for all blocks
		for (var i in ROSDASH.diagramConnection)
		{
			// if in error
			if (! ROSDASH.diagramConnection[i].exist || ROSDASH.diagramConnection[i].error)
			{
				continue;
			}
			// if done
			if (ROSDASH.diagramConnection[i].cycle == ROSDASH.cycle)
			{
				continue;
			}
			// check if widget initialization succeeded @todo
			if (false == ROSDASH.diagramConnection[i].initialized)
			{
				if (ROSDASH.cycle < 30)
				{
					console.log("widget init again", i);
					ROSDASH.callWidgetInit(i);
				}
				continue;
			}
			var ready_flag = true;
			var duplicate_flag = true;
			var input = new Array();
			// for all the parents of this block
			for (var j in ROSDASH.diagramConnection[i].parent)
			{
				// if a parent is not ready
				if (! (ROSDASH.diagramConnection[i].parent[j] in ROSDASH.diagramConnection) || undefined === ROSDASH.diagramConnection[ROSDASH.diagramConnection[i].parent[j]].output || ROSDASH.diagramConnection[ROSDASH.diagramConnection[i].parent[j]].cycle < ROSDASH.cycle)
				{
					ready_flag = false;
					break;
				} else
				{
					if (! ROSDASH.diagramConnection[ROSDASH.diagramConnection[i].parent[j]].duplicate)
					{
						duplicate_flag = false;
					}
					// get the corresponding order of this input
					var count = parseInt(j.substring(1));
					// save this input by deep copy
					//@bug should not _.clone();
					input[count] = ROSDASH.diagramConnection[ROSDASH.diagramConnection[i].parent[j]].output[ROSDASH.diagramConnection[i].type[j]];
				}
			}
			// if the block is ready to be execute with all the inputs are ready
			if (ready_flag)
			{
				// run the widget, and save the output into ROSDASH.diagram_output
				if (undefined !== ROSDASH.diagramConnection[i].instance)
				{
					// the object of widget class
					var obj = ROSDASH.diagramConnection[i].instance;
					try
					{
						// if duplicate and cacheable, don't run
						if (! duplicate_flag || ! ROSDASH.diagramConnection[i].cacheable)
						{
							var output = ROSDASH.runFuncByName("run", obj, input);
							// check if duplicate output
							if (_.isEqual(output, ROSDASH.diagramConnection[i].output))
							{
								ROSDASH.diagramConnection[i].duplicate = true;
							} else
							{
								ROSDASH.diagramConnection[i].output = output;
							}
						} else
						{
							//console.log("duplicate and cacheable", i);
						}
						ROSDASH.diagramConnection[i].cycle = ROSDASH.cycle;
						ROSDASH.diagramConnection[i].error = false;
						++ ROSDASH.doneCount;
					} catch (err)
					{
						console.error("widget runs in error:", i, err.message, err.stack);
						ROSDASH.diagramConnection[i].error = true;
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
	// sleep for a while and start next cycle
	setTimeout(ROSDASH.runWidgets, ROSDASH.ownerConf.run_msec);
}
