var nar = nar || {};
nar.plots = nar.plots || {};

/* @typedef config
 * @property {String} plotDivId - id of div to create plot
 * @property {Array of TimeSeries.Collection} tsCollections
 * @property {Array of tick labels} tickLabels - Each element in tickLabels is represented by matching element in tsCollections
 * @property {String} yaxisLabel (optional)
 * @property {String} title (optional)
 * @property {Function} yaxisFormatter (optional) - function takes a floating point number and returns a string.
 * 
 * @return jqplot
 */
nar.plots.createCoastalBasinPlot = function (config){
	// For the Rio Grande river we are showing the value in the label if it is not null. This is 
	// because the Rio Grande data values are so small compared to the other gulf rivers that they
	// do not render any pixels on the bar graph.
	
	var RIO_GRANDE = '08475000';
	var avgData = [];
	var currentYearData = [];
	
	var dataValue = function(dataPoint) {
		return parseFloat(dataPoint[1]);
	};
	
	var yTickOptions = {};
	var avgLabels = [];
	var curLabels = [];
	
	// This is highly specific to the values that are being displayed for RIO Grande. When
	// data changes or is updated this may need to be changed.
	var formatRioGrande = function(value) {
		if (value < 1.0) {
			return value.format(3);
		}
		else {
			return value.toPrecision(3);
		}
	};
	
	if (Object.has(config, 'yaxisFormatter')) {
		yTickOptions.formatter = config.yaxisFormatter;
	}
	
	// Create data series for each collection for the avg up to the current water year and the current year.
	config.tsCollections.forEach(function(tsC) {
		var sortedData = tsC.getDataMerged();
		var timeSeries = tsC.getAll();
		
		var splitData = nar.plots.PlotUtils.getDataSplitIntoCurrentAndPreviousYears(sortedData);
		
		if (splitData.previousYearsData.length === 0) {
			avgData.push(0);
			avgLabels.push('NA');
		}
		else {
			avgData.push(splitData.previousYearsData.average(dataValue));
			if (timeSeries.first().featureOfInterest === RIO_GRANDE) {
				avgLabels.push(formatRioGrande(splitData.previousYearsData.average(dataValue)));
			}
			else {
				avgLabels.push('');
			}
		}
		
		if (splitData.currentYearData.length === 0) {
			currentYearData.push(0);
			curLabels.push('NA');
		}
		else {
			currentYearData.push(dataValue(splitData.currentYearData.first()));
			if (timeSeries.first().featureOfInterest === RIO_GRANDE) {
				curLabels.push(formatRioGrande(dataValue(splitData.currentYearData).first()));
			}
			else {
				curLabels.push('');
			}
		}
	});
	
	// Create bar plot
	$.jqplot(config.plotDivId, [avgData, currentYearData], {
		seriesDefaults : {
			renderer: $.jqplot.BarRenderer,
			rendererOptions :  {
				barPadding: 0,
				barMargin: 20,
				barDirection: 'vertical'
			},
			shadow : false
		},
		series: [
		         {
		        	 label : 'Average: ' + CONFIG.startWaterYear + '-' + (CONFIG.currentWaterYear - 1), 
		        	 color : "#A0A0A0",
		        	 pointLabels : {
		        		 show : true,
		        		 labels : avgLabels,
		        		 location : 'n'
		        	 }
		         },
		         {
		        	 label : CONFIG.currentWaterYear, 
		        	 color: nar.Constituents.nitrate.color,
		        	 pointLabels : {
		        		 show : true,
		        		 labels : curLabels,
		        		 location : 'n'
		        	 }
		         }
		],
		legend: {
			show: true,
			placement: 'insideGrid',
			location : 'nw'
		},
		title: {
			text: config.title,
			show : Object.has(config, 'title')
		},
		grid: {
			drawGridlines : false,
			shadow : false
		},
		axes : {
			xaxis: {
				renderer: $.jqplot.CategoryAxisRenderer,
				ticks: config.tickLabels,
			},
			yaxis: {
				label : config.yaxisLabel,
				showLabel : Object.has(config, 'yaxisLabel'),
				labelRenderer : $.jqplot.CanvasAxisLabelRenderer,
				tickOptions : yTickOptions
			}
		},
		highlighter : {
			show : true,
			showMarker: false,
			showToolTip : true,
			tooltipLocation : 'n',
			tooltipAxes : 'y',
		}
		
	});
};
