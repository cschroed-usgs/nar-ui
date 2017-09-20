var nar = nar || {};

nar.plots = nar.plots || {};

(function() {
	nar.plots.createFlowPlot = function(tsViz) {
		return nar.plots.createConstituentBarChart(tsViz, {
			yaxisLabel : 'Annual streamflow<br/>in millions of acre feet',
			yaxisTickFormatter : function (val) {
				return (val / 1000000).format();
			},
			showLongTermMean : true,
			showLongTermMeanHover : true,
			plotHoverFormatter : function(x, y) {
				y = y / 1000000;
				var yPrecision = 0;
				if(100 >= y && 1 <= y){
					yPrecision = 1;
				}
				else if(y < 1){
					yPrecision = 2;
				}
				return nar.plots.PlotUtils.waterYearPlotHoverFormatter(x, y, yPrecision);
			}
		});
	};
	
}());