var nar = nar || {};
nar.plots = nar.plots || {};

(function() {
	/**
	 * 
	 * @typedef nar.plot.ConstituentBarChartConfig
	 * @property {String} yaxisLabel - 
	 * @property {Boolean} showLongTermMean
	 * @property {Boolean} showLongTermMeanHover
	 * @property {Function} plotHoverFormatter - function takes an x,y and returns String to be used for the plot hover. 
	 * @property {Array of data series Object} auxData - for each series, should set yaxis to 1 if plotted on the same access as the
	 * 		timeSeries data or 2 if plotted on a separate axis
	 * @property {jqueryFlot axis } secondaryYaxis - Only used if auxData is defined
	 * @property {Function} yaxisTickFormatter - function takes tick val and axis object, return String. (optional)
	 * @property {Function} xticks - function for flotChart option 'xaxis.ticks'. Function accepts a flot axis as an arg 
	 * and returns an array of tick values. If no function is specified, nar.plots.PlotUtils.getTicksByYear is used. 
	 * @param {TimeSeriesVisualization} tsViz
	 * @param {nar.plotConstituentBarChartConfig} config
	 */
	nar.plots.createConstituentBarChart = function(tsViz, config) {
		var plotContainer = tsViz.plotContainer;
		
        var splitData = nar.plots.PlotUtils.getDataSplitIntoCurrentAndPreviousYears(tsViz.timeSeriesCollection.getDataMerged());
        var previousYearsData = splitData.previousYearsData;
        var currentYearData = splitData.currentYearData;
        
        var constituentInfo = nar.plots.PlotUtils.getConstituentNameAndColors(tsViz);
        
        var yaxisTickFormatter;
        
        if (config.yaxisTickFormatter) {
        	yaxisTickFormatter = config.yaxisTickFormatter;
        }
        else {
        	yaxisTickFormatter = function(val) {
				// The automatic tick formatter was producing val with very large precisions when val was less than one. 
				// This will limit it.
				if (val < 1) {
					return (val).floor(3).format();
				}
				// Use Sugar to properly format numbers with commas
				// http://sugarjs.com/api/Number/format
				else {
					return (val).format();
				}
        	}
        }
        
        var yaxes = [{
			axisLabel: config.yaxisLabel,
			axisLabelPadding: 10,
			tickLength: 10,
			tickFormatter : yaxisTickFormatter
		}];
        
        var makeBarChartSeries = function(dataSet, color, label) {
			return {
				label: label || '',
				data: dataSet,
				bars: {
					barWidth: 1e10,
					align: 'center',
					show: true,
					fill: true,
					fillColor: color,
					lineWidth : 1
				},
				yaxis : 1,
				color : '#0F0F0F'
			};
        };
        
        var makeLongTermMeanSeries = function(mean, color, label) {
			return {
				label : label || '',
				data : [ [ nar.plots.PlotUtils.YEAR_NINETEEN_HUNDRED, mean ],
						[ nar.plots.PlotUtils.ONE_YEAR_IN_THE_FUTURE, mean ] ],
				lines : {
					show : true,
					fillColor : color,
					lineWidth : 1
				},
				shadowSize : 0,
				yaxis : 1, 
				color : color
			};
		};
	
		var previousYearsSeries = makeBarChartSeries(previousYearsData, constituentInfo.colors.previousYears);
		var currentYearSeries = makeBarChartSeries(currentYearData, constituentInfo.colors.currentYear);
		var longTermMean;
		
		var series = [previousYearsSeries, currentYearSeries];
		
		
		if (config.showLongTermMean) {
			longTermMean = tsViz.timeSeriesCollection.getDataMerged().average(function(point){
				return parseFloat(point[1]);//y-value
			});
			series.push(makeLongTermMeanSeries(longTermMean, constituentInfo.colors.longTermMean, 'Long-term mean'));
		}
		
		if (config.auxData) {
			series = series.concat(config.auxData);
		}
		
		if (config.secondaryYaxis) {
			yaxes.push(config.secondaryYaxis);
		}
		
		var plot = $.plot(plotContainer, series, {
            xaxis: {
                mode: 'time',
                timeformat: "%Y",
                tickLength: 10,
                ticks : config.xticks || nar.plots.PlotUtils.getTicksByYear
            },
            yaxes : yaxes,
            legend: {
                show: false
            },
            grid:{
                hoverable: true
            },
        });
		
		var hoverFormatter = (config.plotHoverFormatter) ? config.plotHoverFormatter : nar.plots.PlotUtils.utcDatePlotHoverFormatter;
        nar.plots.PlotUtils.setPlotHoverFormatter(plotContainer, hoverFormatter);
        if (config.showLongTermMean && config.showLongTermMeanHover) {
			nar.plots.PlotUtils.setLineHoverFormatter(plotContainer, longTermMean, nar.definitions.longTermMean.short_definition);
        }
        
        return plot;
	};
}());