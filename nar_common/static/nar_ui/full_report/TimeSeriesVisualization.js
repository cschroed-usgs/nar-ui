//@requires nar.fullReport.TimeSeriesCollection
var nar = nar || {};
nar.fullReport = nar.fullReport || {};
(function(){
/**
 * @typedef nar.fullReport.TimeSeriesVisualizationConfig
 * @property {string} id
 * @property {Function} plotter
 * @property {nar.fullReport.TimeSeriesCollection} timeSeriesCollection
 */

/**
 * @class
 * @param {nar.fullReport.TimeSeriesVisualizationConfig} config
 */
nar.fullReport.TimeSeriesVisualization = function(config){
    var self = this;
    self.id = config.id;
    self.getComponentsOfId = function(){
        //delegate to static method
        return nar.fullReport.TimeSeriesVisualization.getComponentsOfId(self.id);  
    };
    self.timeSeriesCollection = config.timeSeriesCollection;
    self.plotter = config.plotter;
    self.plot = undefined;
    self.plotContainer = undefined;
    /**
     * asynchronously retrieves and plots all of the time series in the 
     * `this.timeSeriesCollection` using `this.plotter`
     * @returns {jQuery.promise}
     */
    self.visualize = function(){
        //if no plots are currently visualized, but one has been
        //requested to be added.
        if(0 === numberOfPlots){
            instructionsElt.addClass(hiddenClass);            
        }
        
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
            allPlotsWrapper.prepend(plotContainer);
            self.plotContainer = plotContainer;
            var retrievalPromises = self.timeSeriesCollection.retrieveData();
            //after all retrieval promises have been resolved
            $.when.apply(null, retrievalPromises).then(                
                function(){
                    var plotter = nar.fullReport.TimeSeriesVisualization.getPlotterById(self.id);
                    var plotContent;
                    if(plotter){
                        self.plot = plotter(self);
                        plotContent = self.plot;
                        //storePlotAtTypePath(plotContent, typePath);
                    }
                    else{
                        plotContent = $('<h2/>', {
                            text:self.id
                        });
                        plotContainer.append(plotContent); 
                    }
                    numberOfPlots++;
                    vizDeferred.resolve(self);
                },
                function(){
                    vizDeferred.reject(self);
                    alert('data retrieval failed');
                    throw Error();
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

        //update counter
        numberOfPlots--;
        
        var noPlotsRemain = 0 === numberOfPlots; 
        if(noPlotsRemain){
            instructionsElt.removeClass(hiddenClass);                
        }
    };
};

// private static properties:
var numberOfPlots = 0;
var plotContainerClass = 'data'; 
var plotIdSuffix = '_' + plotContainerClass;
var hiddenClass = 'hide';

// private static methods:
var get_or_fail = function(selector){
    var jqElt = $(selector);
    nar.util.assert_selector_present(jqElt);
    return jqElt;
};

/**
 * Given a viz id, make a selector for a plot container
 * @param {string} TimeSeriesVisualization.id
 * @returns {string} id for a plot
 */
var makePlotContainerId = function(vizId){
    return vizId+plotIdSuffix;
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

// public static methods:

nar.fullReport.TimeSeriesVisualization.fromId = function(id){
    
    //@todo: select plot constructor based on id
    
    return new nar.fullReport.TimeSeriesVisualization({
        id: id,
        plotter: function(){
            throw Error('not implemented yet');
        },
        timeSeriesCollection: new nar.fullReport.TimeSeriesCollection()
    }); 
};

var keyToIndex ={
        constituent : 0,
        category : 1,
        subcategory : 2
};
/**
 * @param {string} id
 * @returns {Object} a simple map of component name to value 
 */
nar.fullReport.TimeSeriesVisualization.getComponentsOfId = function(id){
    var splitId = id.split('/');
    
    var components = {};
    
    Object.keys(keyToIndex, function(key, indexInArray){
        components[key] = splitId[indexInArray]; 
    });
    
    return components;
};

/**
 * @param {string} id - a TimeSeriesVisualization id
 * @returns {function} a plot constructor accepting two arguments: 
 *  the element to insert the plot into,
 *  the data to plot
 */
nar.fullReport.TimeSeriesVisualization.getPlotterById = function(id){
    var plotter;
    var components = nar.fullReport.TimeSeriesVisualization.getComponentsOfId(id);
 
    if (components.subcategory === 'sample'){
        plotter = nar.fullReport.SampleConcentrationPlot; 
    }
    else{
        var idToPlotConstructor = {
                //empty for now 
        };
        plotter = idToPlotConstructor[id];
    }
    
    return plotter;
};

//static initialization
var instructionsSelector = '#instructions';
var instructionsElt;

var allPlotsWrapperSelector = '#plotsWrapper';
var allPlotsWrapper;

$(document).ready(function(){
    instructionsElt = get_or_fail(instructionsSelector);
    allPlotsWrapper = get_or_fail(allPlotsWrapperSelector);
});

}());