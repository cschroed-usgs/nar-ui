//@requires nar.timeSeries.TimeSeriesCollection, objectHash
var nar = nar || {};
nar.pestTimeSeries  = nar.pestTimeSeries || {};
(function(){
/**
 * @typedef nar.pestTimeSeries.TimeSeriesVisualizationConfig
 * @property {Object} metadata - metadata about the time series viz as returned by the server
 * @property {Function} plotter
 * @property {nar.timeSeries.TimeSeriesCollection} timeSeriesCollection
 * @property {jQuery} allPlotsWrapperElt
 */

/**
 * @class
 * @param {nar.pestTimeSeries.TimeSeriesVisualizationConfig} config
 */
nar.pestTimeSeries.Visualization = function(config){
    var self = this;
    self.metadata = Object.clone(config.metadata, true);
    self.allPlotsWrapperElt = config.allPlotsWrapperElt;
    self.plotter = config.plotter;
    self.auxData = config.auxData || {};
    self.allowTimeSlider = true;
    self.timeSeriesCollection = config.timeSeriesCollection;
    self.plot = undefined;
    self.plotContainer = undefined;
    self.id = nar.pestTimeSeries.Visualization.makeId(self);
    
    /**
     * asynchronously retrieves and plots all of the time series in the 
     * `this.timeSeriesCollection` using `this.plotter`
     * @returns {jQuery.promise}
     */
    self.visualize = function(){
        
        var plotContainerId = makePlotContainerId(self);
        var plotContainer = getPlotContainer(plotContainerId);
        var plotContainerMissing = plotContainer.length === 0;
        var vizDeferred = $.Deferred();
        var vizPromise = vizDeferred.promise(); 
        
        if(plotContainerMissing){
            plotContainer = $('<div/>', {
                id: plotContainerId,
                class: plotContainerClass
            });
            self.allPlotsWrapperElt.prepend(plotContainer);
            self.plotContainer = plotContainer;
            var retrievalPromises = self.timeSeriesCollection.retrieveData();
            //after all retrieval promises have been resolved
            $.when.apply(null, retrievalPromises).then(
                function(){
                    var plotter = nar.pestTimeSeries.Visualization.getPlotter(self.metadata);
                    var plotContent;
                    if(plotter){
                    	try{
                    		self.plot = plotter(self);
                            plotContent = self.plot;
                    	}
                    	catch(e){
                    		var message = "Error plotting " + self.id + ". Details logged to the browser console";
                    		nar.util.error(message);
                    		console.error(e);
                    	}

                        //storePlotAtTypePath(plotContent, typePath);
                    }
                    else{
                        plotContent = $('<h2/>', {
                            text:self.id
                        });
                        plotContainer.append(plotContent); 
                    }
                    vizDeferred.resolve(self);
                },
                function(){
                	plotContainer.remove();
                    vizDeferred.reject(self);
                    throw Error('data retrieval failed');
                }
            );
        }
        else{
            vizDeferred.resolve();
        }
        return vizPromise;
    };
    self.remove = function(){
        var plotContainer = self.plotContainer;
        plotContainer.remove();
        var plot = self.plot; 
        if(plot){
            plot.shutdown();
        }
    };
};

// private static properties:
var plotContainerClass = 'pesticide_report_plot'; 
var plotIdSuffix = '_' + plotContainerClass;

// private static methods:

/**
 * Given vizId, make a selector for a plot container
 * 
 * @param {nar.pestTimeSeries.Visualization}
 * @returns {string} id for a plot
 */
var makePlotContainerId = function(tsv){	
	return tsv.id + plotIdSuffix;
};

/**
 * Given a plot container id (NOT a viz ID), safely look up
 * the plot container. See also: makePlotContainerId()
 * @param {string} plotContainerId
 * @return {jQuery} 
 */
var getPlotContainer = function(plotContainerId){
    //use this selector syntax to enable id attributes with slashes in them
    var selector = "div[id*='" + plotContainerId + "']";
    var plotContainer = $(selector);
    return plotContainer;
};

// public static properties:

nar.pestTimeSeries.Visualization.serverToClientConstituentIdMap = {
    'no3_no2': 'nitrate',
    'ssc':'sediment',
    'tn' : 'nitrogen',
    'tp':'phosphorus',
    'q':'streamflow'
};


/**
 * @param {nar.pestTime.TimeSeriesVisualization.metadata} id - a Visualization id
 * @param {string} field - customization field
 * @param {Function|Array} defaultValue - default return if id doesn't have customization
 * @returns {Function|Array} Custom configuration for plot
 */
nar.pestTimeSeries.Visualization.getCustomization = function(metadata, field, defaultValue) {
    var result;
    var vizType = nar.pestTimeSeries.Visualization.types(metadata);
    if (vizType) {
        result = vizType[field];
    } else {
        result = defaultValue;
    }
    return result;
};

/**
 * @param {nar.pestTimeSeries.Visualization.metadata} id - a Visualization id
 * @returns {function} a plot constructor accepting two arguments: 
 *  the element to insert the plot into,
 *  the data to plot
 */
nar.pestTimeSeries.Visualization.getPlotter = function(metadata){
    return nar.pestTimeSeries.Visualization.getCustomization(metadata, 'plotter', nar.util.Unimplemented);
};

/**
 * Some configuration for which category of data gets which graph
 * @param {nar.pestTimeSeries.Visualization.metadata}
 * @return {Object} of viz types
 */
nar.pestTimeSeries.Visualization.types = function(metadata) {
	
	if('PESTICIDE' === metadata.constituentCategorization.category && 'DISCRETE' === metadata.timeStepDensity && 'PESTICIDE_CONCENTRATION' === metadata.timeSeriesCategory){
		return {
			plotter : nar.plots.SampleConcentrationComparisonPlot,
			ancillary: [],
			allowTimeSlider : true
		}
	}
};

/**
 * Given a tsv, create an id
 * @param {nar.pestTimeSeries.TimeSeriesVisualization}
 * @return {String} id
 */
nar.pestTimeSeries.Visualization.makeId = function(tsv){
	return objectHash(tsv.metadata);
};
}());