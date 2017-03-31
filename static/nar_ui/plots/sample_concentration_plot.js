var nar = nar || {};
nar.plots = nar.plots || {};
(function() {
	/**
	 * @param {TimeSeriesVisualization} tsViz
	 * returns {jquery.flot}
	 */
	nar.plots.SampleConcentrationPlot = function(tsViz) {
		var CENSOR_TYPE = {
			NON : "",
			GREATERTHAN : ">",
			LESSTHAN : "<"
		};

		var plotContainer = tsViz.plotContainer;
		var splitData = nar.plots.PlotUtils.getDataSplitIntoCurrentAndPreviousYears(tsViz.timeSeriesCollection.getDataMerged());
		var censoredSplitData = nar.plots.PlotUtils.getDataSplitByCensored(splitData);
		var miscConstituentInfo = nar.plots.PlotUtils.getConstituentNameAndColors(tsViz);
		var constituentName = miscConstituentInfo.name;
		var previousYearsColor = miscConstituentInfo.colors.previousYears;
		var currentYearColor = miscConstituentInfo.colors.currentYear;
		var criteriaLineColor = miscConstituentInfo.colors.criteriaLine;
		var constituentId = tsViz.getComponentsOfId().constituent;
		// We only show a criteria line on sample reports if the constituent is Nitrate
		var useCriteriaLine = constituentId === 'nitrate';
		var constituentToCriteria;

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

		if (useCriteriaLine) {
			if (nar.siteHelpInfo && nar.siteHelpInfo.tn_criteria
					&& nar.siteHelpInfo.tp_criteria) {
				constituentToCriteria = {
					nitrogen : nar.siteHelpInfo.tn_criteria,
					phosphorus : nar.siteHelpInfo.tp_criteria,
					nitrate : 10
				};
				var criteriaLineValue = constituentToCriteria[constituentId] || null;
				var criteriaLineSeries = {
					label : constituentName,
					data : [
								[ nar.plots.PlotUtils.YEAR_NINETEEN_HUNDRED,
									criteriaLineValue ],
								[ nar.plots.PlotUtils.ONE_YEAR_IN_THE_FUTURE,
									criteriaLineValue ]
							],
					color : criteriaLineColor,
					lines : {
						show : true,
						fillColor : criteriaLineColor,
						lineWidth : 1
					},
					shadowSize : 0
				};

				series.add(criteriaLineSeries);
			} else {
				nar.util.error('No nutrient criteria available for this site');
			}
		}

		var logBase = 10;
		var logFactor = Math.log(logBase);
		var plot = $
				.plot(
						plotContainer,
						series,
						{
							xaxis : {
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
							}
						});

		var hoverFormatter = nar.plots.PlotUtils.utcDatePlotHoverFormatter;
		nar.plots.PlotUtils.setPlotHoverFormatter(plotContainer, hoverFormatter);

		if (useCriteriaLine && criteriaLineValue) {
			var criteriaLineDescription = 'EPA MCL = '
					+ constituentToCriteria[constituentId]
					+ ' mg/L as N. See technical information for details.';
			nar.plots.PlotUtils.setLineHoverFormatter(plotContainer, criteriaLineValue, criteriaLineDescription);
		}

		return plot;
	};
}());