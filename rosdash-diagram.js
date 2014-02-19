///////////////////////////////////// diagram


// depend on cytoscape.js
ROSDASH.defaultStyle = ("cytoscape" in window) ? cytoscape.stylesheet()
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
	})
: undefined;
// load diagram from json
ROSDASH.loadDiagram = function (json)
{
	// if canvas is not loaded
	if ($("#cy").length <= 0 || undefined === window.cy || typeof window.cy.fit != "function")
	{
		//@todo
		setTimeout(function () {
			ROSDASH.loadDiagram(json);
		}, 300);
		return;
	}
	// remove previous data
	try {
		window.cy.remove(window.cy.elements("node"));
		window.cy.remove(window.cy.elements("edge"));
	} catch (error)
	{
		console.error("cy not ready", window.cy, error);
		setTimeout(function () {
			ROSDASH.loadDiagram(json);
		}, 300);
		return;
	}
	// load blocks
	for (var i in json.block)
	{
		ROSDASH.addBlock(json.block[i]);
	}
	// load edges
	for (var i in json.edge)
	{
		// identify the source and target
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


///////////////////////////////////// blocks in diagram


// a list of blocks in diagram
ROSDASH.blocks = new Object();
// add a new block by type
ROSDASH.addBlockByType = function (type)
{
	var id = ROSDASH.addBlock({type: type});
	// add a corresponding widget
	if (undefined !== id && (true == ROSDASH.blockDef[type].has_panel || "true" == ROSDASH.blockDef[type].has_panel))
	{
		ROSDASH.addWidgetByType(type, ROSDASH.blocks[id].number);
	}
	return id;
}
// add a block by config
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
	default:
		color = "Aquamarine";
		break;
	}
	// get name for display
	var display_name = ROSDASH.getDisplayName(block);
	// add the body of the block
	var body = window.cy.add({
		group: "nodes",
		data: {
			id: block.id,
			name: display_name,
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
// add a new ros item block, not add one from init json file
ROSDASH.addRosItem = function (rosname, type)
{
	if ("topic" != type && "service" != type && "param" != type)
	{
		type = "topic";
	}
	//@note maybe i should allow conflict?
	if (undefined === rosname || "" == rosname || ROSDASH.checkRosConflict(rosname, type))
	{
		console.error("ros item name is not valid", rosname);
		return;
	}
	// set the new block location
	var next_pos = ROSDASH.getNextNewBlockPos();
	var x = (typeof x !== "undefined") ? parseFloat(x) : next_pos[0];
	var y = (typeof y !== "undefined") ? parseFloat(y) : next_pos[1];
	var count = ROSDASH.rosBlocks[type].length;
	var id = type + "-" + count;
	// add block body
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
	// add block input pins
	window.cy.add({
		group: "nodes",
		data: {
			id: id + "-i0"
		},
		position: { x: x + ROSDASH.INPUT_POS[1][0][0], y: y + ROSDASH.INPUT_POS[1][0][1] },
		classes: "input",
		locked: true
	});
	// add block output pins
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
	if (undefined !== ROSDASH.blockDef[type].input)
	{
		// assign by deep copy
		block.input = ROSDASH.blockDef[type].input.slice();
	} else
	{
		block.input = new Array();
	}
	// set the output of this block
	if (undefined !== ROSDASH.blockDef[type].output)
	{
		// assign by copy
		block.output = ROSDASH.blockDef[type].output.slice();
	} else
	{
		block.output = new Array();
	}
	// register the new block
	ROSDASH.blocks[id] = block;
	ROSDASH.rosBlocks[type].push(rosname);
	// return to facilitate "fit"
	return id;
}

//@todo generate the position for new blocks to be. maybe should follow the mouse
ROSDASH.getNextNewBlockPos = function ()
{
	return [0, 0];
}
// init the configuration of a new block
ROSDASH.initBlockConf = function (block)
{
	if (ROSDASH.checkBlockTypeValid(block.type))
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
		// the widget type is invalid, and the error message is sent from ROSDASH.checkBlockTypeValid
		return undefined;
	}
	// set the input of this block
	if (undefined !== ROSDASH.blockDef[block.type].input)
	{
		// assign by deep copy
		block.input = ROSDASH.blockDef[block.type].input.slice();
	} else
	{
		block.input = new Array();
	}
	// set the output of this block
	if (undefined !== ROSDASH.blockDef[block.type].output)
	{
		// assign by deep copy
		block.output = ROSDASH.blockDef[block.type].output.slice();
	} else
	{
		block.output = new Array();
	}
	if (undefined === block.config)
	{
		// assign config to a block from definition
		if (undefined !== ROSDASH.blockDef[block.type].config)
		{
			block.config = ROSDASH.transformRawJson(ROSDASH.blockDef[block.type].config);
		} else
		{
			block.config = new Object();
		}
		// compulsory config
		block.config.cacheable = block.config.cacheable || false;
		// for a widget
		if (true == ROSDASH.blockDef[block.type].has_panel)
		{
			block.config.title = block.config.title || block.name;
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
		if (undefined === ROSDASH.blockDef[block_type])
		{
			ROSDASH.blockDef[block_type] = new Object();
			ROSDASH.blockDef[block_type].count = 0;
		} else if (undefined === ROSDASH.blockDef[block_type].count)
		{
			ROSDASH.blockDef[block_type].count = 0;
		} else // add the count by one
		{
			++ ROSDASH.blockDef[block_type].count;
		}
		block.number = ROSDASH.blockDef[block_type].count;
		// add id by number
		block.id = block_type + "-" +  ROSDASH.blockDef[block_type].count;
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
			block.name = block_type + " " +  ROSDASH.blockDef[block_type].count;
		}
	}
	// if no widgetDef, initialize to def.number
	else if (undefined === ROSDASH.blockDef[block_type])
	{
		ROSDASH.blockDef[block_type] = new Object();
		ROSDASH.blockDef[block_type].count = block.number;
	}
	// if no count, initialize to def.number
	else if (undefined === ROSDASH.blockDef[block_type].count)
	{
		ROSDASH.blockDef[block_type].count = 0;
	}
	// if larger than count, set count to def.number
	else if (block.number > ROSDASH.blockDef[block_type].count)
	{
		ROSDASH.blockDef[block_type].count = block.number;
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
	var display_name = block.name;
	switch (block.type)
	{
	case "constant":
		if (undefined !== block.value)
		{
			if ("array" == typeof block.value || "object" == typeof block.value)
			{
				display_name = JSON.stringify(block.value);
			} else
			{
				display_name = block.value;
			}
		}
		break;
	case "topic":
	case "service":
	case "param":
		if (undefined !== block.rosname)
		{
			display_name = block.rosname;
		}
		break;
	}
	if (16 < display_name.length)
	{
		display_name = display_name.substring(0, 16 - 3) + "...";
	}
	return display_name;
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
	//@todo more are coming
};
// output pin position distribution
ROSDASH.OUTPUT_POS = {
	"1": [[70, 0]],
	"2": [[70, -20], [70, 20]],
	"3": [[70, -20], [70, 0], [70, 20]],
	"4": [[70, -30], [70, -10], [70, 10], [70, 30]],
	"5": [[70, -40], [70, -20], [70, 0], [70, 20], [70, 40]],
	"6": [[70, -50], [70, -30], [70, -10], [70, 10], [70, 30], [70, 50]],
	//@todo more are coming
};
// get the body name of a pin
ROSDASH.getBlockParent = function (block)
{
	// format: Blockname-TypeNumber
	var index = block.lastIndexOf("-");
	return block.substring(0, index);
}
// get the number of a pin
ROSDASH.getPinNum = function (pin)
{
	// format: Blockname-TypeNumber
	var index = pin.lastIndexOf("-");
	return parseFloat(pin.substring(index + 2));
}
// get the type of a pin
ROSDASH.getPinType = function (pin)
{
	// format: Blockname-TypeNumber
	var index = pin.lastIndexOf("-");
	//@bug 1 is not always true
	return pin.substring(index + 1, 1);
}
// get the type and number of a pin
ROSDASH.getPinTypeNum = function (pin)
{
	// format: Blockname-TypeNumber
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
	if (undefined === ROSDASH.blockDef[type])
	{
		return;
	}
	// remove pins
	//@note change to ROSDASH.blocks
	for (var i = 0; i < ROSDASH.blockDef[type].input.length; ++ i)
	{
		ROSDASH.removeBlock(id + "-i" + i);
	}
	for (var i = 0; i < ROSDASH.blockDef[type].output.length; ++ i)
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
	var pin_num = ROSDASH.getPinNum(source);
	if (! (body in ROSDASH.blocks) || pin_num >= ROSDASH.blocks[body].output.length)
	{
		console.error("cannot connect: ", source, body);
		return;
	}
	body = ROSDASH.getBlockParent(target);
	var pin_num = ROSDASH.getPinNum(target);
	if (! (body in ROSDASH.blocks) || pin_num >= ROSDASH.blocks[body].input.length)
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
	if (undefined !== ROSDASH.blockDef[target.type] && undefined !== ROSDASH.blockDef[target.type].descrip)
	{
		text += " : " + ROSDASH.blockDef[target.type].descrip;
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
