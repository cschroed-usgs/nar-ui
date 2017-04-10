var nar = nar || {};

nar.plots = nar.plots || {};

(function() {
	nar.plots.createConcentrationPlot = function(tsViz) {
		var subcategory = tsViz.getComponentsOfId(tsViz.id).subcategory;
		var constituentName;
		var plotConfig;
		if (subcategory === 'mean') {
			constituentName = nar.plots.PlotUtils.getConstituentNameAndColors(tsViz).name.toLowerCase();
			
			plotConfig = {
					yaxisLabel : 'Mean annual ' + constituentName + '<br/>concentration,<br/>in milligrams per liter',
					showLongTermMean : true,
					showLongTermMeanHover : true
			};
		}
		else if (subcategory === 'flow_weighted') {
			constituentName = nar.plots.PlotUtils.getConstituentNameAndColors(tsViz).name.toLowerCase();
			
			plotConfig = {
					yaxisLabel : 'Annual flow-normalized<br/> ' + constituentName + ' concentration,<br/>in milligrams per liter',
					showLongTermMean : true,
					showLongTermMeanHover : true
			};
		}
		
		plotConfig.plotHoverFormatter = function(x, y) {
			return nar.plots.PlotUtils.waterYearPlotHoverFormatter(x, y, 2);
		};
		
		if (plotConfig) {
			return nar.plots.createConstituentBarChart(tsViz, plotConfig);
		}
		else {
			throw Error('No visualization available for this visualization ' + tsViz.id);
		}
	};

}());