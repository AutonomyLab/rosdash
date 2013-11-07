/*
 * jquery sDashboard (2.5)
 * Copyright 2012, Model N, Inc
 * Distributed under MIT license.
 * https://github.com/ModelN/sDashboard
 */

( function(factory) {"use strict";
		if ( typeof define === 'function' && define.amd) {
			// Register as an AMD module if available...
			define(['jquery', 'Flotr'], factory);
		} else {
			// Browser globals for the unenlightened...
			factory($, Flotr);
		}
	}(function($, Flotr) {"use strict";

		$.widget("mn.sDashboard", {
			version : "2.5",
			options : {
				dashboardData : []
			},
			_create : function() {
				this.element.addClass("sDashboard");
				this._createView();

			},
			_setOption : function(key, value) {
				this.options[key] = value;
				if (key === "dashboardData") {
					this._createView();
				}
			},

			_createView : function() {
				
				var docHeight = $(document).height();

				$("body").append("<div class='sDashboard-overlay'></div>");

				$(".sDashboard-overlay").height(docHeight);

				$(".sDashboard-overlay").hide();
				
				var _dashboardData = this.options.dashboardData;
				var i;
				for ( i = 0; i < _dashboardData.length; i++ ) {
					var widget = this._constructWidget(_dashboardData[i]);
					//append the widget to the dashboard
					this.element.append(widget);					
					this._renderTable(_dashboardData[i]);
					this._renderChart(_dashboardData[i]);
				}

				var that = this;
				//call the jquery ui sortable on the columns
				this.element.sortable({
					handle : ".sDashboardWidgetHeader",
					update : function(event, ui) {
						var sortOrderArray = $(this).sortable('toArray');
						var sortedDefinitions = [];
						for ( i = 0; i < sortOrderArray.length; i++) {
							var widgetContent = that._getWidgetContentById(sortOrderArray[i], that);
							sortedDefinitions.push(widgetContent);
						}

						if (sortedDefinitions.length > 0) {
							var evtData = {
								sortedDefinitions : sortedDefinitions
							};
							that._trigger("orderchanged", null, evtData);
						}

					}
				});

				var disableSelection = this.options.hasOwnProperty("disableSelection") ? this.options.disableSelection : true;
				if(disableSelection) {
					this.element.disableSelection();
				}
				//bind events for widgets
				this._bindEvents();

				//trigger creation complete when the dashboard widgets are constructed
				this._trigger("creationComplete", null);

			},
			_getWidgetContentById : function(id, context) {
				var widgetData = context.getDashboardData();
				for (var i = 0; i < widgetData.length; i++) {
					var widgetObject = widgetData[i];
					if (widgetObject.widgetId === id) {
						return widgetObject;
					}
				}
				return [];
			},
			_bindEvents : function() {
				var self = this;
				// click event for header
				this.element.on("click",".sDashboardWidgetHeader",function(e)
				{
					$('div.sDashboardWidgetHeader').css("background-color", "");
					// change the color of header if clicked
					$(e.currentTarget).css("background-color", "Aquamarine");
					var header = $(e.currentTarget);
					if (header.length > 0)
					{
						var selectedWidget = header.parents("li:first");
						var evtData = {
							selectedHeader : $(e.currentTarget).text(),
							selectedWidgetId : selectedWidget.attr("id")
						};
						//trigger headerclicked event
						self._trigger("headerclicked", null, evtData);
					}
				});
				//click event for maximize button
				// icon span.ui-icon.ui-icon-circle-arrow-n
				this.element.on("click", ".sDashboardWidgetHeader div.sDashboard-icon.sDashboard-circle-plus-icon", function(e) {

					//get the widget List Item Dom
					var widgetListItem = $(e.currentTarget).parents("li:first");
					//get the widget Container
					var widget = $(e.currentTarget).parents(".sDashboardWidget:first");
					//get the widget Content
					var widgetContainer = widget.find(".sDashboardWidgetContent");
					var widgetDefinition = self._getWidgetContentById(widgetListItem.attr("id"), self);
					//toggle the maximize icon into minimize icon
					$(e.currentTarget).toggleClass("sDashboard-circle-minus-icon");
					//change the tooltip on the maximize/minimize icon buttons
					if ($(e.currentTarget).attr("title") === "Maximize") {
						$(".sDashboard-overlay").show();
						$(e.currentTarget).attr("title", "Minimize");
						self._trigger("widgetMaximized", null, {
							"widgetDefinition" : widgetDefinition
						});
					} else {
						$(".sDashboard-overlay").hide();
						$(e.currentTarget).attr("title", "Maximize");
						self._trigger("widgetMinimized", null, {
							"widgetDefinition" : widgetDefinition
						});
					}
					// added from rosdash1
					if (widgetDefinition.widgetType === "chart") {
						var chartArea = widgetContainer.find(" div.sDashboardChart");
						Flotr.draw(chartArea[0], widgetDefinition.widgetContent.data, widgetDefinition.widgetContent.options);
						if (!widgetDefinition.getDataBySelection) {
							//when redrawing the widget, the click event listner is getting destroyed, we need to re-register it here again
							//need to find out if its a bug on flotr2 library.
							self._bindChartEvents(chartArea[0], widgetListItem.attr("id"), widgetDefinition, self);
						}
					}
				});
				//click event for minimize button
				this.element.on("click",".sDashboardWidgetHeader span.ui-icon.ui-icon-circle-arrow-s",function(e) {
					//get the widget List Item Dom
					var widgetListItem = $(e.currentTarget).parents("li:first");
					//get the widget Container
					var widget = $(e.currentTarget).parents(".sDashboardWidget:first");
					//get the widget Content
					var widgetContainer = widget.find(".sDashboardWidgetContent");
					var widgetDefinition = self._getWidgetContentById(widgetListItem.attr("id"), self);
					//toggle the maximize icon into minimize icon
					$(e.currentTarget).toggleClass("ui-icon-circle-arrow-n");
					$(e.currentTarget).toggleClass("ui-icon-circle-arrow-s");
					//toggle the class for widget and inner container
					widget.toggleClass("sDashboardWidgetContainerMaximized");
					widgetContainer.toggleClass("sDashboardWidgetContentMaximized ");
					//change the tooltip on the maximize/minimize icon buttons
					// added from rosdash1
					if ($(e.currentTarget).attr("title") === "Maximize") {
						$(e.currentTarget).attr("title", "Minimize");
						self._trigger("widgetMaximized", null, {
							"widgetDefinition" : widgetDefinition
						});
					} else {
						$(e.currentTarget).attr("title", "Maximize");
						self._trigger("widgetMinimized", null, {
							"widgetDefinition" : widgetDefinition
						});
					}
					if (widgetDefinition.widgetType === "chart") {
						var chartArea = widgetContainer.find(" div.sDashboardChart");
						Flotr.draw(chartArea[0], widgetDefinition.widgetContent.data, widgetDefinition.widgetContent.options);
						if (!widgetDefinition.getDataBySelection) {
							//when redrawing the widget, the click event listner is getting destroyed, we need to re-register it here again
							//need to find out if its a bug on flotr2 library.
							self._bindChartEvents(chartArea[0], widgetListItem.attr("id"), widgetDefinition, self);
						}
					}
				});

				//refresh widget click event handler
				this.element.on("click", ".sDashboardWidgetHeader div.sDashboard-icon.sDashboard-refresh-icon", function(e) {
					var widget = $(e.currentTarget).parents("li:first");
					var widgetId = widget.attr("id");
					var widgetDefinition = self._getWidgetContentById(widgetId, self);
					var refreshedData = widgetDefinition.refreshCallBack.apply(self, [widgetId]);
					widgetDefinition.widgetContent = refreshedData;
					if (widgetDefinition.widgetType === 'chart') {
						self._renderChart(widgetDefinition);
					} else if (widgetDefinition.widgetType === 'table') {
						self._refreshTable(widgetDefinition, widget);
					} else {
						self._refreshRegularWidget(widgetDefinition, widget);
					}

				});

				//delete widget by clicking the 'x' icon on the widget
				this.element.on("click", ".sDashboardWidgetHeader div.sDashboard-icon.sDashboard-circle-remove-icon ", function(e) {
					var widget = $(e.currentTarget).parents("li:first");
					var widgetId = widget.attr("id");
					var evtData = {
						widgetDefinition : self._getWidgetContentById(widgetId, self)
					};
					//show hide effect
					widget.hide("fold", {}, 300);
					widget.remove();
					self._removeWidgetFromWidgetDefinitions(widgetId);
					$(".sDashboard-overlay").hide();
					//trigger sdashboard widgetremoved event
					self._trigger("widgetremoved", null, evtData);
				});
				// larger
				this.element.on("click", ".sDashboardWidgetHeader span.ui-icon.ui-icon-circle-plus", function (e) {
					var widgetListItem = $(e.currentTarget).parents("li:first");
					widgetListItem.width(widgetListItem.width() * 2);
					widgetListItem.height(widgetListItem.height() * 1.7);
					var widget = $(e.currentTarget).parents(".sDashboardWidget:first");
					var widgetContainer = widget.find(".sDashboardWidgetContent");
					widgetContainer.height(widgetContainer.height() * 2);
				});
				// smaller
				this.element.on("click", ".sDashboardWidgetHeader span.ui-icon.ui-icon-circle-minus", function (e) {
					var widgetListItem = $(e.currentTarget).parents("li:first");
					widgetListItem.width(widgetListItem.width() / 2);
					widgetListItem.height(widgetListItem.height() / 1.7);
					var widget = $(e.currentTarget).parents(".sDashboardWidget:first");
					var widgetContainer = widget.find(".sDashboardWidgetContent");
					widgetContainer.height(widgetContainer.height() / 2);
				});
				//table row click
				this.element.on("click", ".sDashboardWidgetContent table.sDashboardTableView tbody tr", function(e) {
					var selectedRow = $(e.currentTarget);

					if (selectedRow.length > 0) {
						var selectedDataTable = selectedRow.parents('table:first').dataTable();

						var selectedWidget = selectedRow.parents("li:first");
						var selectedRowData = selectedDataTable.fnGetData(selectedRow[0]);
						var selectedWidgetId = selectedWidget.attr("id");
						var evtData = {
							selectedRowData : selectedRowData,
							selectedWidgetId : selectedWidgetId
						};

						//trigger dashboardTableViewRowClick changed event
						self._trigger("rowclicked", null, evtData);
					}
				});
			},

			_constructWidget : function(widgetDefinition) {
				//create an outer list item
				var widget = $("<li/>").attr("id", widgetDefinition.widgetId);
				// specify the height and width
				if (undefined !== widgetDefinition.height)
				{
					widget.height(widgetDefinition.height);
				}
				if (undefined !== widgetDefinition.width)
				{
					widget.width(widgetDefinition.width);
				}
				//create a widget container
				var widgetContainer = $("<div/>").addClass("sDashboardWidget");

				//create a widget header
				var widgetHeader = $("<div/>").addClass("sDashboardWidgetHeader sDashboard-clearfix");
				var maximizeButton = $('<div title="Maximize" class="sDashboard-icon sDashboard-circle-plus-icon "></span>');
				var largerButton = $('<span title="larger" class="ui-icon ui-icon-circle-plus"></span>');
				var smallerButton = $('<span title="smaller" class="ui-icon ui-icon-circle-minus"></span>');
				var deleteButton = $('<div title="Close" class="sDashboard-icon sDashboard-circle-remove-icon"></div>');
				//add widget title
				widgetHeader.append('<span class="header">' + widgetDefinition.widgetTitle + '</span>');
				//add Maximize button
				widgetHeader.append(maximizeButton);
				//add larger button
				widgetHeader.append(largerButton);
				//add smaller button
				widgetHeader.append(smallerButton);
				//add delete button
				widgetHeader.append(deleteButton);

				if (widgetDefinition.hasOwnProperty("enableRefresh") && widgetDefinition.enableRefresh) {
					var refreshButton = $('<div title="Refresh" class="sDashboard-icon sDashboard-refresh-icon "></div>');
					//add refresh button
					widgetHeader.append(refreshButton);
				}
				//add widget title
				//widgetHeader.append(widgetDefinition.widgetTitle);
				//create a widget content
				var widgetContent = $("<div/>").addClass("sDashboardWidgetContent");
				// specify the height for content
				if (undefined !== widgetDefinition.content_height)
				{
					widgetContent.height(widgetDefinition.content_height);
				}

				if (widgetDefinition.widgetType === 'table') {
					var dataTable = $('<table cellpadding="0" cellspacing="0" border="0" class="display sDashboardTableView table table-bordered"></table>');
					widgetContent.append(dataTable);
				} else if (widgetDefinition.widgetType === 'chart') {
					var chart = $('<div/>').addClass("sDashboardChart");
					if (widgetDefinition.getDataBySelection) {
						chart.addClass("sDashboardChartSelectable");
					} else {
						chart.addClass("sDashboardChartClickable");
					}
					widgetContent.append(chart);
				} else {
					// for other types of widgets, the content is the html canvas for them
					widgetContent.append(widgetDefinition.widgetContent);
				}

				//add widgetHeader to widgetContainer
				widgetContainer.append(widgetHeader);
				//add widgetContent to widgetContainer
				widgetContainer.append(widgetContent);

				//append the widgetContainer to the widget
				widget.append(widgetContainer);

				//return widget
				return widget;
			},
			_refreshRegularWidget : function(widgetDefinition, widget) {
				var isMaximized = widget.find(".sDashboardWidgetContent").hasClass('sDashboardWidgetContentMaximized');
				//first remove the content
				widget.find('.sDashboardWidgetContent').empty().remove();
				//then create the content again
				var widgetContent = $("<div/>").addClass("sDashboardWidgetContent");
				//if its maximized add the maximized class
				if (isMaximized) {
					widgetContent.addClass('sDashboardWidgetContentMaximized');
				}
				widgetContent.append(widgetDefinition.widgetContent);
				//then append this to the widget again;
				widget.find(".sDashboardWidget").append(widgetContent);
			},
			_refreshTable : function(widgetDefinition, widget) {
				var selectedDataTable = widget.find('table:first').dataTable();
				selectedDataTable.fnClearTable();
				selectedDataTable.fnAddData(widgetDefinition.widgetContent["aaData"]);
				
			},
			refreshTableById : function(widgetId, dataTable) {
				if (! this._ifWidgetAlreadyExists(widgetId))
				{
					return;
				}
				var widget = this.element.find("li" + "#" + widgetId);
				var selectedDataTable = widget.find('table:first').dataTable();
				selectedDataTable.fnClearTable();
				selectedDataTable.fnAddData(dataTable.aaData);
				
			},
			_renderTable : function(widgetDefinition){
				var id = "li#" + widgetDefinition.widgetId;
				var table
				if(widgetDefinition.widgetType === 'table'){
					table = this.element.find(id + " table.sDashboardTableView");

					var tableDef = {};
					$.extend(tableDef,widgetDefinition.widgetContent);
					
					if (widgetDefinition.setJqueryStyle) {
						tableDef["bJQueryUI"] = true;
					}
					table.dataTable(tableDef);
				}
			},
			_renderChart : function(widgetDefinition) {
				var id = "li#" + widgetDefinition.widgetId;
				var chartArea;
				var data;
				var options;

				if (widgetDefinition.widgetType === 'chart') {
					chartArea = this.element.find(id + " div.sDashboardChart");
					data = widgetDefinition.widgetContent.data;
					options = widgetDefinition.widgetContent.options;
					Flotr.draw(chartArea[0], data, options);
					if (widgetDefinition.getDataBySelection) {
						this._bindSelectEvent(chartArea[0], widgetDefinition.widgetId, widgetDefinition, this);
					} else {
						this._bindChartEvents(chartArea[0], widgetDefinition.widgetId, widgetDefinition, this);
					}
				}

			},
			_bindSelectEvent : function(chartArea, widgetId, widgetDefinition, context) {
				Flotr.EventAdapter.observe(chartArea, "flotr:select", function(area) {
					var evtObj = {
						selectedWidgetId : widgetId,
						chartData : area
					};
					context._trigger("plotselected", null, evtObj);
				});
			},
			_bindChartEvents : function(chartArea, widgetId, widgetDefinition, context) {

				Flotr.EventAdapter.observe(chartArea, 'flotr:click', function(d) {
					//only if a series is clicked dispatch a click event
					if (d.index !== undefined && d.seriesIndex !== undefined) {
						var evtObj = {};
						evtObj.selectedWidgetId = widgetId;
						evtObj.flotr2GeneratedData = d;
						var widgetData = widgetDefinition.widgetContent.data;
						var seriesData = widgetData[d.seriesIndex];
						var selectedData;

						if ($.isArray(seriesData)) {
							selectedData = seriesData[d.index];
						} else {
							selectedData = seriesData;
						}

						evtObj.customData = {
							index : d.index,
							selectedIndex : d.seriesIndex,
							seriesData : seriesData,
							selectedData : selectedData
						};
						context._trigger("plotclicked", null, evtObj);
					}
				});

			},
			_removeWidgetFromWidgetDefinitions : function(widgetId) {
				var widgetDefs = this.options.dashboardData;
				for (var i in widgetDefs) {
					var currentWidgetId = widgetDefs[i].widgetId;
					if (currentWidgetId === widgetId) {
						widgetDefs.splice(i, 1);
						break;
					}
				}
			},

			_ifWidgetAlreadyExists : function(widgetId) {
				if (!widgetId) {
					throw "Expected widgetId to be defined";
				}
				var idSelector = "#" + widgetId;
				//get the dom element
				var widget = this.element.find("li" + idSelector);
				if (widget.length > 0) {
					return true;
				}
				return false;
			},

			/*public methods*/
			//add a widget to the dashbaord
			addWidget : function(widgetDefinition) {
				if (!widgetDefinition.widgetId) {
					throw "Expected widgetId to be defined";
				}

				if (this._ifWidgetAlreadyExists(widgetDefinition.widgetId)) {
					this.element.find("li#" + widgetDefinition.widgetId).effect("shake", {
						times : 3
					}, 800);
				} else {
					this.options.dashboardData.push(widgetDefinition);
					var widget = this._constructWidget(widgetDefinition);
					this.element.prepend(widget);
					this._renderChart(widgetDefinition);
					this._renderTable(widgetDefinition);
				}
				var evtData = {
					widgetDefinition : widgetDefinition
				};
				//trigger sdashboard widgetadded event
				this._trigger("widgetadded", null, evtData);
			},
			//remove a widget from the dashboard
			removeWidget : function(widgetId) {
				if (!widgetId) {
					throw "Expected widgetId to be defined";
				}
				var evtData = {
					widgetDefinition : this._getWidgetContentById(widgetId, this)
				};
				var idSelector = "#" + widgetId;
				//get the dom element
				var widget = this.element.find("li" + idSelector);
				if (widget.length > 0) {
					//delete the dom element
					widget.remove();
					//remove the dom element from the widgetDefinition
					this._removeWidgetFromWidgetDefinitions(widgetId);
				}
				//trigger sdashboard widgetremoved event
				this._trigger("widgetremoved", null, evtData);
			},

			//get the widgetDefinitions
			getDashboardData : function() {
				return this.options.dashboardData;
			},
			// set the widget content
			setContentById : function(id, content) {
				var widget = this.element.find("li#" + id);
				if (widget.length > 0)
				{
					var div = widget.find("div.sDashboardWidget").find("div.sDashboardWidgetContent");
					var old = div.html();
					div.html(content);
					var evtData = {
						widgetDefinition : this._getWidgetContentById(id, this),
						oldContent : old,
						newContent : content
					};
					//trigger sdashboard widgetset event
					this._trigger("widgetset", null, evtData);
				}
			},
			// add the widget content to the original content
			addContentById : function(id, content) {
				var widget = this.element.find("li" + "#" + id);
				if (widget.length > 0)
				{
					var div = widget.find("div.sDashboardWidget").find("div.sDashboardWidgetContent");
					var old = div.html();
					div.html(old + content);
					var evtData = {
						widgetDefinition : this._getWidgetContentById(id, this),
						oldContent : old,
						newContent : content
					};
					//trigger sdashboard widgetset event
					this._trigger("widgetset", null, evtData);
				}
			},
			// set the wiget header
			setHeaderById : function(id, header) {
				var all_data = this.options.dashboardData;
				for (var i = 0; i < all_data.length; i ++)
				{
					if (all_data[i].widgetId === id)
					{
						var widget = this.element.find("li" + "#" + all_data[i].widgetId);
						if (widget.length > 0)
						{
							var div = widget.find("div").find("div:nth-child(1)").find("span:nth-child(1)");
							var old = div.html();
							div.text(header);
							var evtData = {
								widgetDefinition : this._getWidgetContentById(id, this),
								oldContent : old,
								newContent : header
							};
							//trigger sdashboard widgetremoved event
							this._trigger("headerset", null, evtData);
						}
						break;
					}
				}
			},
			destroy : function() {
				//remove the overlay when the dashbaord is destroyed
				$(".sDashboard-overlay").remove();
				// call the base destroy function
				$.Widget.prototype.destroy.call(this);
			}
		});

	}));

