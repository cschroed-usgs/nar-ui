//@requires nar.timeSeries.TimeSeriesCollection
var nar = nar || {};
nar.timeSeries  = nar.timeSeries || {};
(function(){
/**
 * @typedef nar.timeSeries .TimeSeriesVisualizationConfig
 * @property {string} id
 * @property {Function} plotter
 * @property {nar.timeSeries.TimeSeriesCollection} timeSeriesCollection
 * @property {String} treeDisplayHierarchy optional param describing location of time series in a tree
 * @property {jQuery} allPlotsWrapperElt
 */

/**
 * @class
 * @param {nar.timeSeries .TimeSeriesVisualizationConfig} config
 */
nar.timeSeries.Visualization = function(config){
    var self = this;
    self.id = config.id;
    self.allPlotsWrapperElt = config.allPlotsWrapperElt;
    self.treeDisplayHierarchy = config.treeDisplayHierarchy || '';
    self.plotter = config.plotter;
    self.ancillaryData = nar.timeSeries.Visualization.getCustomizationById(self.id, 'ancillary', []);
    self.auxData = config.auxData || {};
    self.allowTimeSlider = nar.timeSeries.Visualization.getCustomizationById(self.id, 'allowTimeSlider', true);
    /*
     * @returns {nar.timeSeries.Visualization.IdComponents}
     */
    self.getComponentsOfId = function(){
        //delegate to static method
        return nar.timeSeries.Visualization.getComponentsOfId(self.id);
    };
    self.timeSeriesCollection = config.timeSeriesCollection;
    
    self.plot = undefined;
    self.plotContainer = undefined;
    /**
     * asynchronously retrieves and plots all of the time series in the 
     * `this.timeSeriesCollection` using `this.plotter`
     * @returns {jQuery.promise}
     */
    self.visualize = function(){
        
        var plotContainerId = makePlotContainerId(self.id);
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
                    var plotter = nar.timeSeries.Visualization.getPlotterById(self.id);
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
var plotContainerClass = 'full_report_plot'; 
var plotIdSuffix = '_' + plotContainerClass;

// private static methods:

/**
 * Given a viz id, make a selector for a plot container
 * @param {string} Visualization.id
 * @returns {string} id for a plot
 */
var makePlotContainerId = function(vizId){
    return vizId + plotIdSuffix;
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

nar.timeSeries.Visualization.serverToClientConstituentIdMap = {
    'no3_no2': 'nitrate',
    'ssc':'sediment',
    'tn' : 'nitrogen',
    'tp':'phosphorus',
    'q':'streamflow'
};

/**
 * @typedef nar.timeSeries.Visualization.IdComponents
 * @property {string} constituent
 * @property {string} timestepDensity
 * @property {string} category
 * @property {string} subcategory 
 * @property {string} modtype
 */

/**
 * @param {string} id
 * @returns {nar.timeSeries.Visualization.IdComponents} a simple map of component name to value 
 */
nar.timeSeries.Visualization.getComponentsOfId = function(id) {
    var splitId = id.split('/');

    var serverConstituentId = splitId[0];
    var clientConstituentId = nar.timeSeries.Visualization.serverToClientConstituentIdMap[serverConstituentId
            .toLowerCase()];
    var components = {
	    constituent : clientConstituentId,
	    timestepDensity : splitId[1],
	    category : splitId[2],
	    subcategory : splitId[3],

	};
    return components;
};

/**
 * @param {string} id - a Visualization id
 * @param {string} field - customization field
 * @param {Function|Array} defaultValue - default return if id doesn't have customization
 * @returns {Function|Array} Custom configuration for plot
 */
nar.timeSeries.Visualization.getCustomizationById = function(id, field, defaultValue) {
    var result;
    var components = nar.timeSeries.Visualization.getComponentsOfId(id);
    var vizType = nar.timeSeries.Visualization.types(components);
    if (vizType) {
        result = vizType[field];
    } else {
        result = defaultValue;
    }
    return result;
};

/**
 * @param {string} id - a Visualization id
 * @returns {function} a plot constructor accepting two arguments: 
 *  the element to insert the plot into,
 *  the data to plot
 */
nar.timeSeries.Visualization.getPlotterById = function(id){
    return nar.timeSeries.Visualization.getCustomizationById(id, 'plotter', nar.util.Unimplemented);
};

/**
 * Some configuration for which category of data gets which graph
 */
nar.timeSeries.Visualization.types = function(components) {
		if (components.category === 'concentration') {
			if (components.subcategory === 'mean' || components.subcategory === 'flow_weighted') {
				return {
					plotter : nar.plots.createConcentrationPlot,
					ancillary : [],
					allowTimeSlider : true
				};
			}
			else return {
				plotter : nar.plots.SampleConcentrationPlot,
				ancillary : [],
				allowTimeSlider : true
			};
		}
		else if (components.category === 'mass') {
			return {
				plotter : nar.plots.LoadPlot,
				ancillary : [],
				allowTimeSlider : true
			};
		}
		else { // Must be flow
			if (components.timestepDensity === 'annual') {
				return {
					plotter : nar.plots.createFlowPlot,
					ancillary : [],
					allowTimeSlider : true
				};
			}
			else {
				return {
					plotter : nar.plots.FlowWrapper,

					ancillary : [{
						// @todo We will want to store these somewhere so this can just be nar .discrete.nitrogen
						procedure : "discrete_concentration",
						observedProperty : "NO3_NO2"
					}],
					allowTimeSlider : false
				};
			}
		}
};
}());