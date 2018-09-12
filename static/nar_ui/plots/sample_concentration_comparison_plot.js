var nar = nar || {};
nar.plots = nar.plots || {};
(function() {
	/**
	 * @param {nar.pestTimeSeries.Visualization} tsViz
	 * returns {jquery.flot}
	 */
	nar.plots.SampleConcentrationComparisonPlot = function(tsViz) {
		var CENSOR_TYPE = {
			NON : "",
			GREATERTHAN : ">",
			LESSTHAN : "<"
		};

		var plotContainer = tsViz.plotContainer;
		var allData = tsViz.timeSeriesCollection.getDataMerged();
		var splitData = nar.plots.PlotUtils.getDataSplitIntoCurrentAndPreviousYears(allData);
		var censoredSplitData = nar.plots.PlotUtils.getDataSplitByCensored(splitData);
		
		var constituentName = tsViz.metadata.constit;
		var currentYearColor = '#e87928';
		var previousYearsColor = tinycolor.lighten(tinycolor(currentYearColor), 20).toRgbString();
		var benchmarkLineColor = tinycolor.lighten(tinycolor.gray, 75).toRgbString();

		var constituentId = tsViz.metadata.constit;
		// We only show a benchmark line on sample reports if the constituent is Nitrate
		var useBenchmarkLines = 'HUMAN_HEALTH' === tsViz.metadata.comparisonCategorization.category || 'AQUATIC_LIFE' === tsViz.metadata.comparisonCategorization.category; 

		var makeSeriesConfig = function(dataSet, color, censorType) {
			var fill = (censorType === CENSOR_TYPE.NON);
			return {
				label : constituentName,
				data : dataSet,
				color : color,
				points : {
					radius : 3,
					show : true,
					fill : fill,
					fillColor : color
				},
				shadowSize : 0,
				censorLabel : censorType
			};
		};

		var previousYearsSeriesNoncensored = makeSeriesConfig(
				censoredSplitData.previousYearsData.noncensored,
				previousYearsColor, CENSOR_TYPE.NON);
		var previousYearsSeriesLessThan = makeSeriesConfig(
				censoredSplitData.previousYearsData.lessThan,
				previousYearsColor, CENSOR_TYPE.LESSTHAN);
		var previousYearsSeriesGreaterThan = makeSeriesConfig(
				censoredSplitData.previousYearsData.greaterThan,
				previousYearsColor, CENSOR_TYPE.GREATERTHAN);
		var currentYearSeriesNoncensored = makeSeriesConfig(
				censoredSplitData.currentYearData.noncensored,
				currentYearColor, CENSOR_TYPE.NON);
		var currentYearSeriesLessThan = makeSeriesConfig(
				censoredSplitData.currentYearData.lessThan, currentYearColor,
				CENSOR_TYPE.LESSTHAN);
		var currentYearSeriesGreaterThan = makeSeriesConfig(
				censoredSplitData.currentYearData.greaterThan,
				currentYearColor, CENSOR_TYPE.GREATERTHAN);
		var series = [ previousYearsSeriesNoncensored,
				previousYearsSeriesLessThan, previousYearsSeriesGreaterThan,
				currentYearSeriesNoncensored, currentYearSeriesLessThan,
				currentYearSeriesGreaterThan ];

		if (useBenchmarkLines) {
			var benchmarks = tsViz.timeSeriesCollection.getAll()[0].benchmarks;
			Object.keys(benchmarks).map(function(humanName){
				var benchmarkLineValue = benchmarks[humanName];

				var benchmarkLineSeries = {
					label : constituentName,
					data : [
								[ nar.plots.PlotUtils.YEAR_NINETEEN_HUNDRED,
								  benchmarkLineValue ],
								[ nar.plots.PlotUtils.ONE_YEAR_IN_THE_FUTURE,
								  benchmarkLineValue ]
							],
					color : benchmarkLineColor,
					lines : {
						show : true,
						fillColor : benchmarkLineColor,
						lineWidth : 1
					},
					shadowSize : 0
				};

				series.add(benchmarkLineSeries);
				var benchmarkLineDescription = humanName + ' Benchmark Value: ' + benchmarkLineValue;
				nar.plots.PlotUtils.setLineHoverFormatter(plotContainer, benchmarkLineValue, benchmarkLineDescription);
			});
			
		}
		/**
		 * Create the 'nth' version of a number.
		 * But return blank for 1
		 * @param {Number} 1, 2, 3, etc
		 * @returns {String} '', '2nd', '3rd', etc
		 */
		var ordinalize = function(num){
			var map = {
					'1' : '',
					'2' : '2nd-',
					'3' : '3rd-'
			};
			var strNum = '' + num;
			var result = map[strNum];
			return result;
		};
		
		/**
		 * @param {nar.pestTimeSeries.Visualization.metadata} 
		 * @returns {String}
		 */
		var getPlotTitle = function(metadata){
			var title = '';
			if(metadata.constituentCategorization){
				if(metadata.constituentCategorization.category === 'PESTICIDE'){
					if(metadata.comparisonCategorization){
						if( 'ABSOLUTE' === metadata.comparisonCategorization.category){
							title = 'Most Frequently Detected ';
							var constituentSubcategory = metadata.constituentCategorization.subcategory.replace('_', '-').toLowerCase().capitalize();
							title += constituentSubcategory;
							title += ' in ' + CONFIG.currentWaterYear;
						} else if ('HUMAN_HEALTH' === metadata.comparisonCategorization.category){
							var orderStr = ordinalize(metadata.comparisonCategorization.order); 
							title = orderStr + 'Closest Pesticide to Acute Human Health Benchmarks';
						} else if ('AQUATIC_LIFE' === metadata.comparisonCategorization.category){
							var orderStr = ordinalize(metadata.comparisonCategorization.order); 
							title = orderStr + 'Closest Pesticide to Acute Aquatic Life Benchmarks';
						}
					}
				}
				//likely will add more
			}
			return title;
		};
		var title = getPlotTitle(tsViz.metadata);
		
		var getPlotOverlayHandler = function(title){
			return function(plot, context) {
				var offset = plot.getPlotOffset();
				var cx = (plot.width() / 2) + offset.left;
				var text = title;
				context.font="15px Arial";
				context.textAlign = 'center';
				context.fillText(text,cx,25);
			};
		}
		var logBase = 10;
		var logFactor = Math.log(logBase);

		var plot = $
				.plot(
						plotContainer,
						series,
						{
							xaxis : {
//								axisLabel: title,
//								axisLabelFontSizePixels : 10,
//								axisLabelFontFamily : "Verdana, Arial, Helvetica, Tahoma, sans-serif",
//								axisLabelPadding : 5,
								mode : 'time',
								timeformat : "%m/%Y",
								tickLength : 10,
								minTickSize : [ 1, 'month' ]
							},
							yaxis : {
								axisLabel : constituentName
										+ ",<br /> in milligrams per liter",
								axisLabelFontSizePixels : 10,
								axisLabelFontFamily : "Verdana, Arial, Helvetica, Tahoma, sans-serif",
								axisLabelPadding : 5,
								ticks : function(axis) {
									return nar.plots.PlotUtils.logTicks(axis,
											-3);
								},
								tickLength : 10,
								transform : function(value) {
									if (0 >= value) {
										return 0;
									} else {
										return Math.log(value) / logFactor;
									}
								},
								inverseTransform : function(value) {
									return Math.pow(logBase, value);
								}
							},
							grid : {
								hoverable : true,
								autoHighlight : true
							},
							legend : {
								show : false
							},
							grid : {
								hoverable : true
							},
							hooks : {
								'drawOverlay' : [getPlotOverlayHandler(title)]
							}
						});

		var hoverFormatter = nar.plots.PlotUtils.utcDatePlotHoverFormatter;
		nar.plots.PlotUtils.setPlotHoverFormatter(plotContainer, hoverFormatter);
		
		return plot;
	};
}());