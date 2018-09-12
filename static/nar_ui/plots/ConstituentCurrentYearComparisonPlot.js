/**
 * This file depends on:
 * jquery.flot.js
 * jquery.flot.resize.js
 * jquery.flot.categories.js
 * 
 * plugin: jquery.flot.axislabels.js
 * plugin: jquery.flot.tooltip.js
 * 
 */

/**
 * Do not invoke as a constructor (with the 'new' keyword).
 * 
 * @param {String} selector a jquery selector for the plot element
 * @param {Object} series an object of the following format:
 * {
		constituentName: 'Nitrate',
		constituentUnit: 'Million kg',
		displayUnitOnYAxis: true, //optional -- defaults to false
		yearValue: 0,
		yearColor: '#00FF00',
		averageName: 'Average 1990-2000',
		averageValue: 10,
		averageColor: '#FF' //optional -- defaults to ConstituentCurrentYearComparisonPlot.defalutAverageColor
	}
   @param {String} legendSelector a jquery selector for the legend element
 */
var nar = nar || {};
nar.plots = nar.plots || {};
(function(){
    
var ConstituentCurrentYearComparisonPlot = function(plotContainerSelector, series, legendSelector){

	nar.util.assert_selector_present(plotContainerSelector);
	if(legendSelector){
		nar.util.assert_selector_present(legendSelector);
	}
	
	var averageColor = series.averageColor || ConstituentCurrentYearComparisonPlot.defaultAverageColor;
	
	var plotContainer = $(plotContainerSelector);

	var plotClass= ConstituentCurrentYearComparisonPlot.plotClass;
	var plotDiv = $('<div/>', {'class': plotClass});
	var plotDivSelector = plotContainerSelector + ' .' + plotClass;
	plotContainer.append(plotDiv);
	
	
	var legendElt = $('<div/>', {'class': ConstituentCurrentYearComparisonPlot.legendClass});
	var yearLegendClass = ConstituentCurrentYearComparisonPlot.yearLegendClass;
    var yearLegendElt = $('<span/>', {'class': yearLegendClass });
    yearLegendElt.html(CONFIG.currentWaterYear);
    var yearLegendEltSelector = plotContainerSelector + ' .' + yearLegendClass;
    
    var averageLegendClass = ConstituentCurrentYearComparisonPlot.averageLegendClass;
    var averageLegendElt = $('<span/>', {'class': averageLegendClass });
    averageLegendElt.html('Avg');
    legendElt.append(averageLegendElt);
    legendElt.append(yearLegendElt);
    plotContainer.append(legendElt);
	
	var titleClass = ConstituentCurrentYearComparisonPlot.titleClass;
	var titleDiv = $('<div/>', {'class': titleClass });
	titleDiv.html(series.constituentName);
	var titleDivSelector = plotContainerSelector + ' .' + titleClass;
	plotContainer.append(titleDiv);
	
	var yearSeries = {

        data: [['&nbsp;', series.yearValue]],
        label: CONFIG.currentWaterYear,
        bars: {
                show: true,
                barWidth: 4,
                align: "left",
                fillColor: series.yearColor,
                lineWidth: 0
            }
    };
	
	var averageSeries = {
        data : [['&nbsp;', series.averageValue]],
		label : series.averageName,
		bars : {
			show : true,
			barWidth : 4,
			align : "right",
			fillColor: averageColor,
			lineWidth: 0
		}
    };
	
	var flotSeries = [averageSeries, yearSeries];

    var plot = $.plot(plotDivSelector, flotSeries, {
        xaxis: {
            mode: "categories",
            tickLength: 0
        },
        yaxis: {
            axisLabel: series.displayUnitOnYAxis ? series.constituentUnit : null,
            axisLabelUseCanvas: true,
            axisLabelPadding: 1,
            min : 0,
            tickLength: 3,
            tickColor: '#000000',
			tickFormatter : function(val, axis) {
				return val.format(7).replace(/\.?0+$/,"");
			},
            labelWidth: 50
        },
		grid : {
			hoverable : true,
			clickable : true
		},
        colors: [averageColor, series.yearColor],
        tooltip: true,
        tooltipOpts: {
            content: '%s: %y ' + series.constituentUnit 
        },
        legend: {
            show: false
        }
    });
    
    // If no data for year, add a label on the chart.
    if (series.yearValue === 0) {
		var NO_DATA = 'Loads not calculated';

		var ctx = plot.getCanvas().getContext("2d");
		var xaxis = plot.getAxes().xaxis;
		var yaxis = plot.getAxes().yaxis;
		var plotOffset = plot.getPlotOffset();
		var metrics = ctx.measureText(NO_DATA);
		var tx = xaxis.p2c(2) + plotOffset.left;
		var ty = yaxis.p2c(yaxis.max / 2) + plotOffset.bottom;
		
		ctx.save();
		ctx.translate(tx, ty);
		ctx.rotate(-0.5 * Math.PI);
		ctx.fillText(NO_DATA, -metrics.width / 2, 4);
		ctx.restore();
	}
	
    return plot;
};
ConstituentCurrentYearComparisonPlot.defaultAverageColor = '#D8DCDC';
ConstituentCurrentYearComparisonPlot.titleClass = 'currentYearComparisonTitle';
ConstituentCurrentYearComparisonPlot.yearLegendClass = 'currentYearComparisonYearLegend';
ConstituentCurrentYearComparisonPlot.averageLegendClass = 'currentYearComparisonAverageLegend';
ConstituentCurrentYearComparisonPlot.legendClass = 'comparisonLegend';
ConstituentCurrentYearComparisonPlot.plotClass = 'currentYearComparisonPlot';

nar.plots.ConstituentCurrentYearComparisonPlot = ConstituentCurrentYearComparisonPlot;

}());