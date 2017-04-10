var nar = nar || {};
nar.plots = nar.plots || {};
(function() {

	var FLOW_DATA_CLASS = 'flow_data_inner_plot';
	var HYDROGRAPH_ID = 'hydrograph';
	var FLOW_DURATION_ID = 'flowDuration';
	
	var sharedFlowData;
	
	nar.plots.FlowWrapper = function(tsViz) {
		var plotContainer = tsViz.plotContainer;
		var displayedPlots = 
			[
				nar.plots.Hydrograph(tsViz),
				nar.plots.FlowDuration(tsViz)
			];
		var remove = function() {
			displayedPlots.each(function(plot) {
				plot.remove();
			});
		};
		var shutdown = function() {
			displayedPlots.each(function(plot) {
				plot.shutdown();
			});
		};
		var getOptions = function() {
			// no modifying options from outside
			return undefined;
		};
		var setupGrid = function() {
			displayedPlots.each(function(plot) {
				plot.setupGrid();
			});
		};
		var draw = function() {
			displayedPlots.each(function(plot) {
				plot.draw();
			});
		};
		return {
			getOptions : getOptions,
			setupGrid : setupGrid,
			draw : draw,
			remove : remove,
			shutdown : shutdown
		};
	};

	var LEGEND_PADDING = 5,
	LEGEND_SPACE_BETWEEN_SYMBOL_AND_LABEL = 5,
	LEGEND_SYMBOL_WIDTH = 5;
	var symbolEntryRenderer = function(legendCtx, thisSeries, options, entryOriginX, entryOriginY, fontOptions, maxEntryWidth, maxEntryHeight){
		var textHeight = legendCtx.measureText('M').width;
		
		var symbolX = entryOriginX + LEGEND_PADDING,
			symbolY = entryOriginY + LEGEND_PADDING + 0.6*textHeight;//it must be offset by a little more than half of the text height to appear aligned
		
		var symbolRenderer = thisSeries.points.symbol;
		var originalFillStyle = legendCtx.fillStyle;
		legendCtx.fillStyle = thisSeries.color;
		symbolRenderer(legendCtx, symbolX, symbolY, thisSeries.points.radius);
		legendCtx.fill();
		var textX = symbolX + LEGEND_SYMBOL_WIDTH + LEGEND_SPACE_BETWEEN_SYMBOL_AND_LABEL,
			textY = entryOriginY + LEGEND_PADDING + textHeight; 
		legendCtx.fillText(thisSeries.label, textX, textY);
		legendCtx.fillStyle = originalFillStyle;
	};
	var roughSymbolLegendSize = {height: 15, width: 125};
	var canvasLegendOptions = {
		show : true,
		entrySize : roughSymbolLegendSize,
		entryRender : symbolEntryRenderer,
		layout : $.plot.canvasLegend.layouts.horizontal,
		backgroundOpacity : 0,
		position : 'ne'
	};
	/**
	 * @param {TimeSeriesVisualization}
	 *            tsViz returns {jqPlot}
	 */
	nar.plots.Hydrograph = function(tsViz) {
		
		var plot;
		var plotContainer = tsViz.plotContainer;
		var hydrographDiv = $('#' + HYDROGRAPH_ID);
		if (hydrographDiv.length == 0) {
			hydrographDiv = $('<div>').attr('id', HYDROGRAPH_ID).addClass(FLOW_DATA_CLASS);
			plotContainer.append(hydrographDiv);
		}
		sharedFlowData = sharedFlowData || tsViz.timeSeriesCollection.getData();
		// get the last x value from hydrograph data as year
		var waterYear = Date.create(sharedFlowData[0].last()[0]).getFullYear();
		var series = [];
		var flowSeries = {
			data: sharedFlowData[0],
			color: 'black',
			lines: {
				show: true,
				fill: true,
				lineWidth: 1,
				fillColor: 'lightgrey'
			}
		};
		series.push(flowSeries);
		
		var sampleDates = nar.plots.PlotUtils.createPinnedPointData(sharedFlowData[1], sharedFlowData[0]);
		
		if(0 !== sampleDates.length){
		var sampleSeries = {
			label: 'Water-quality sample',
			data: sampleDates,
			color: 'red',
			points: {
				show: true,
				fill: true,
				fillColor: 'red',
				radius: 3,
				symbol: 'triangle'
			}
		};
		series.push(sampleSeries);
		}

		plot = $.plot(hydrographDiv, series, {
			canvas : true,
			xaxis : {
				axisLabel : waterYear,
				axisLabelUseCanvas : true,
				axisLabelFontSizePixels : 12,
				axisLabelFontFamily : "Verdana, Arial, Helvetica, Tahoma, sans-serif",
				axisLabelPadding : 5,
				mode : 'time',
				timeformat : "%b",
				tickLength : 10,
				minTickSize : [ 1, 'month' ]
			},
			yaxis : {
				axisLabel : 'Daily mean streamflow, in cubic feet per second',
				axisLabelUseCanvas : true,
				axisLabelFontSizePixels : 10,
				axisLabelFontFamily : "Verdana, Arial, Helvetica, Tahoma, sans-serif",
				axisLabelPadding : 5,
				tickLength : 10
			},
			grid : {
				hoverable : true,
				autoHighlight : true
			},
			legend : {
				show : false,
			},
			canvasLegend: canvasLegendOptions
		});
		var hoverFormatter = nar.plots.PlotUtils.utcDatePlotHoverFormatter;
		nar.plots.PlotUtils.setPlotHoverFormatter(hydrographDiv, hoverFormatter);
		
		return plot;
	};
	
	nar.plots.FlowDuration = function(tsViz) {
		var plot;
		var plotContainer = tsViz.plotContainer;
		var flowDurationDiv = $('#' + FLOW_DURATION_ID);
		if (flowDurationDiv.length == 0) {
			flowDurationDiv = $('<div>').attr('id', FLOW_DURATION_ID).addClass(FLOW_DATA_CLASS);
			plotContainer.append(flowDurationDiv);
		}
		
		sharedFlowData = sharedFlowData || tsViz.timeSeriesCollection.getData();
		
		var sortedFlowData = sharedFlowData[0].sortBy(function(point) {
			return point[1];
		}, true);
		
		var maxFlow = sortedFlowData.first()[1];
		var minFlow = sortedFlowData.last()[1];
		
		var exceedanceWithDates = sortedFlowData.map(function(point, index) {
			var exceedance = 100 * ((index + 1) / sortedFlowData.length);
			return [exceedance, point[1], point[0]];
		});
		
		var swappedSampleDates = sharedFlowData[1].map(function(point) {
			return [nar.plots.PlotUtils.findNearestYValueAtX(exceedanceWithDates, point[0], 2, 0), point[1]];
		});
		
		var exceedanceDatesRemoved = exceedanceWithDates.map(function(point) {
			return [point[0], point[1]];
		});
		
		var sampleDates = nar.plots.PlotUtils.createPinnedPointData(swappedSampleDates, exceedanceDatesRemoved);
		var series = [];
		
		var flowSeries = {
			data: exceedanceDatesRemoved,
			color: 'black',
			lines: {
				show: true,
				lineWidth: 1
			}
		};
		series.push(flowSeries);
		if(0 !== sampleDates.length){
			var sampleSeries = {
				label: 'Water-quality sample',
				data: sampleDates,
				color: 'red',
				points: {
					show: true,
					fill: true,
					fillColor: 'red',
					radius: 3,
					symbol: 'triangle'
				}
			};
			series.push(sampleSeries);
		}
		
		plot = $.plot(flowDurationDiv, series, {
			canvas : true,
			xaxis : {
				axisLabel : 'Percent of time exceeded in ' + CONFIG.currentWaterYear,
				axisLabelUseCanvas : true,
				axisLabelFontSizePixels : 12,
				axisLabelFontFamily : "Verdana, Arial, Helvetica, Tahoma, sans-serif",
				axisLabelPadding : 5,
				ticks: [[.01,.01],
					[.1,''],
					[1,''],
					[5,''],
					[10,10],
					[20,20],
					[30,30],
					[40,40],
					[50,50],
					[60,60],
					[70,70],
					[80,80],
					[90,90],
					[95,''],
					[99,99],
					[99.9,''],
					[99.99,'']],
				tickLength : 10,
				min: 0,
				max: 100
			},
			yaxis : {
				transform : function(y) {
					if(y > 0){
						return Math.log(y);
					} else if ( y < 0) {
						return -1 * Math.log(-1 * y);
					} else {
						return 0;
					}
				},
				inverseTransform : function(y) {
					return Math.exp(y);
				},
				axisLabel : 'Daily mean streamflow, in cubic feet per second',
				axisLabelUseCanvas : true,
				axisLabelFontSizePixels : 10,
				axisLabelFontFamily : "Verdana, Arial, Helvetica, Tahoma, sans-serif",
				axisLabelPadding : 5,
				tickLength : 10,
				ticks : function(axis) {
					var result = [];
					var tick
					
					if (axis.min > 0.0) {
						tick = axis.min;
					}
					else {
						// set it to something other zero to prevent infinite loop
						tick = 0.01;
					}
					
					while (tick <= axis.max) {
						if (tick < 1) {
							result.push([tick, tick.toString()]); // This assumes we don't have values less than 0.1
						}
						else {
							result.push([tick, tick.format()]);
						}
						tick = tick * 10.0;
					}
					return result;
				},
				
				min: nar.plots.PlotUtils.getLogAxisForValue(minFlow, Math.floor),
				max: nar.plots.PlotUtils.getLogAxisForValue(maxFlow, Math.ceil),
			},
			grid : {
				hoverable : true,
				autoHighlight : true
			},
			legend : {
				show : false
			},
			canvasLegend: canvasLegendOptions
		});
		var hoverFormatter = function(x, y) {
			return x.toFixed(2) + '% - ' + y 
		};
		nar.plots.PlotUtils.setPlotHoverFormatter(flowDurationDiv, hoverFormatter);
		return plot;
	};
})();