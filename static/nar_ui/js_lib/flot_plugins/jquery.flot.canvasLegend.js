/* global jQuery Math */
//based on https://raw.githubusercontent.com/lukesampson/flot/5922045d8bc233073ef3d102703aa74a037c7e54/jquery.flot.legendoncanvas.js
/**
 * user specifies canvas legend configuration by modifying the canvasLegend options object
 * {
 * .
 * .
 * .
 * canvasLegend: {
 * 			show: optional {boolean}, defaulting to true
 * 			position: {String} "ne" or "nw" or "se" or "sw". Ignored if "container" option is specified.
 * 			entrySize: {width: Number, height: Number} or (function(legendCtx, oneSeries, options, fontOptions)->{width:Number, height:Number}).
 * 					If a function, the function is called on each series. The plugin uses this return value of the function to calculate the width of the overall legend.
 * 					The function's parameters are as follows:
 * 					@param {CanvasRenderingContext2D} legendCtx,
 * 					@param {Object} oneSeries - a single flot series
 * 					@param {Object} options - the options passed to canvasLegend
 * 					@param {Object} fontOptions - options.font merged with the font options from the plot placeholder.
 * 			margin: optional {Number} of pixels or array of {Number}s: [x margin, y margin]. Ignored if "container" option is specified.
 * 			container: optional {jQuery} object wrapping a canvas element, or an actual canvas element, or null, defaulting to null.
 * 					If null, legend will be drawn on the plot's canvas. Else, legend will be drawn in the specified canvas and the "margin" and "position" options will be ignored.
 * 			sorted: optional null, false, true, "ascending", "descending", "reverse", or (function(seriesA, seriesB)->Number), defaulting to null.
 * 					If null or false, series are displayed in whatever order flot provides. If a function, the function is used to sort the order 
 * 					in which the series' legend entries are passed to the "render" function based on whether the function returns a positive or negative number.
 *         				Legend entries appear in the same order as their series by default. If "sorted" is "reverse" then they appear in the opposite order from their series. To sort them alphabetically, you can specify true, "ascending" or "descending", where true and "ascending" are equivalent.
 * 			layout: (function(seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntryWidth, maxEntryHeight)->{nextEntryOriginX: Number, nextEntryOriginY: Number}) or null, defaulting to null.
 *       				The properties of the object that this function returns will be passed as entryOriginX and entryOriginY to the "render" function.
 * 					The function's parameters are as follows:
 *                                      @param {Number} seriesIndex
 *                                      @param {Number} previousEntryOriginX
 *                                      @param {Number} previousEntryOriginY
 *                                      @param {Number} previousEntryWidth
 *                                      @param {Number} previousEntryHeight
 *                                      @param {Number} maxEntryWidth
 *                                      @param {Number} maxEntryHeight
 *                                      @returns {Object} - {nextEntryOriginX: {Number}, nextEntryOriginY: {Number}}
 *
 *          backgroundOpacity : optional Number between 0 and 1, defaulting to 1
 * 			backgroundColor: optional String color, defaulting to white.
 * 			entryRender: (function(legendCtx, series, options, entryOriginX, entryOriginY, fontOptions, maxEntryWidth, maxEntryHeight)->undefined).
 *                          This function is called to perform custom rendering of the legend entry for each series. 
  *                          The function's parameters are as follows:
 *                          @param {CanvasRenderingContext2D} legendCtx
 *                          @param {Object} thisSeries a flot series
 *                          @param {Object} options - the options in options.canvasLegend
 *                          @param {Number} entryOriginX
 *                          @param {Number} entryOriginY
 *                          @param {Object} fontOptions - options.font merged with the font options from the plot placeholder.
 *                          @param {Number} maxEntryWidth - the maximum width of any entry for all series in the plot
 *                          @param {Number} maxEntryHeight - the maximum height of any entry for all series in the plot
 *                          @returns {undefined}
 *
 * 			font: optional object describing any desired font options for the canvas legend. This object is passed to the entryRender and entrySize function as "fontOptions". 
 *                          Any options not specified will default to the value that the main plot container's css dictates.
                              
 * 			
 * 		}
 * }
 * 
 * example:
 * 
 *      canvasLegend: {
 * 			show: true,
 * 			entrySize: function(legendCtx, series, options, fontOptions){
 * 					//assume constant symbol width and height
 * 					var symbolWidth = 40;
 * 					var symbolHeight = 15;
 * 
 * 					var textWidth = legendCtx.measureText(label).width;
 * 					var textHeight = legendCtx.meaureText('M').width;
 * 					var entryWidth = symbolWidth + textWidth;
 * 					var entryHeight = Math.max(symbolHeight, textHeight);
 * 
 * 					
 * 					return {width:entryWidth, height:entryHeight};
 * 				  },
 * 			container: $('#myCanvas'),
 * 			sorted: function(seriesA, seriesB){.
 * 				if(seriesA.text > seriesB.text){
 * 					return 1;
 * 				}
 * 				else{
 *					return -1; 
 * 				}
 * 			}		  
 * 			layout: function(seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntryWidth, maxEntryHeight){
 *				 //simple vertical layout
 *				var nextEntryOriginY = previousEntryOriginY + previousEntryHeight; 
 * 				return {nextEntryOriginX: previousEntryOriginX, nextEntryOriginY: nextEntryOriginY};
 * 			}
 * 			entryRender: function(legendCtx, series, options, entryOriginX, entryOriginY, fontOptions, maxEntryWidth, maxEntryHeight){
 *				legendCtx.fillStyle = series.someProperty.indicating.theSeries.color;
 *				var symbolHeight = 15;
 *				var symbolWidth = 40; 
 *				legendCtx.fillRect(entryOriginX, entryOriginY, symbolWidth, symbolHeight);
 *				legendCtx.legendCtx.fillText(series.text, entryOriginX + symbolWidth, entryOriginY + symbolHeight);
 * 			}
 * 		}
 * }
 * 
 */

(function ($) {
    "use strict";
    function init(plot) {
        plot.hooks.processOptions.push(addLastDrawHook);
    }

    function addLastDrawHook(plot) {
        plot.hooks.draw.push(drawLegend);
    }
    function ascendingAlphabeticalSort(seriesA, seriesB) {
        var value = seriesA.label > seriesB.label ? 1 : -1;
        return value;
    }
    /**
     * 
     * @param {Object} placeholder - a jQuery element from which to acquire 
     *  default font options.
     * @param {Object} fontOptions - the options a user specifies
     * @returns {Object} - fontOptions merged with placeholder's css, preferring
     *  fontOptions when both have a value for the same property.
     */
    function getFontOptions(placeholder, fontOptions) {
        
        var placeholderOptions = {
            style: placeholder.css("font-style"),
            size: Math.round(+placeholder.css("font-size").replace("px", "") || 13),
            variant: placeholder.css("font-variant"),
            weight: placeholder.css("font-weight"),
            family: placeholder.css("font-family")
        };
       
        return $.extend({}, placeholderOptions, fontOptions);
    }
    /**
     * 
     * If 'container' is undefined, return the plotContext's canvas as 'container' and plotContext as 'context'.
     * If 'container' is defined and is a canvas, return the canvas as 'container' and the canvas' context as 'context'.
     * If 'container' is defined and is not a canvas, create a canvas element in it, return the new canvas element as 'container', and the new canvas element's context as 'context'.
     * 
     * @param {jQuery} container
     * @param {CanvasRenderingContext2D} plotContext
     * @returns {Object} an object with two properties 'container' and 'context'.
     *  The 'context' property's value will be of type 'CanvasRenderingContext2D'. 
     *  The 'container' property's value will be of type 'HTMLCanvasElement'.
     */
    function getLegendContainerAndContext(container, plotContext) {
        var finalContainer, finalContext;
        if (container) {
            if (container.is('canvas')) {
                finalContainer = container;
            }
            else {
                finalContainer = $('<canvas/>');
                container.append(finalContainer);
            }
            finalContext = $(finalContainer)[0].getContext('2d');
        } else {
            finalContainer = $(plotContext.canvas);
            finalContext = plotContext;
        }
        return {
            container: finalContainer,
            context: finalContext
        };
    }
    /**
     * Sort 'series' by 'sortedOption'.
     * See plugin public API documentation for what sortedOption's values mean.
     * @param {falsy|String|function} sortedOption
     * @param {Array} series
     * @returns {Array}
     */
    function getSortedSeries(sortedOption, series) {
        var sortedSeries;
        if (sortedOption) {
            if (true === sortedOption || 'ascending' === sortedOption) {
                sortedSeries = series.sort(ascendingAlphabeticalSort);
            }
            else if ('descending' === sortedOption) {
                sortedSeries = series.sort(ascendingAlphabeticalSort).reverse();
            }
            else if ('reverse' === sortedOption) {
                sortedSeries = series.reverse();
            }
            else if ('function' === typeof sortedOption) {
                sortedSeries = series.sort(sortedOption);
            }
            else {
                throw Error('Unrecognized value for "sorted" option: ' + sortedOption);
            }
        } else {
            sortedSeries = series;
        }
        return sortedSeries;
    }
    /**
     * 
     * @param {Function|Object} entrySize
     * @param {Array} series
     * @param {CanvasRenderContext2D} legendCtx
     * @param {Object} options
     * @param {Object} fontOptions
     * @returns {Object} - {height: {Number}, width: {Number}}
     */
    function getMaxEntrySize(entrySize, series, legendCtx, options, fontOptions){
        var thisEntrySize,
            maxEntryWidth = 0,
            maxEntryHeight = 0;
        if ('function' === typeof entrySize) {
            $.each(series, function (index, thisSeries) {
                thisEntrySize = entrySize(legendCtx, thisSeries, options, fontOptions);
                maxEntryWidth = Math.max(thisEntrySize.width, maxEntryWidth);
                maxEntryHeight = Math.max(thisEntrySize.height, maxEntryHeight);
            });
        }
        else if ('number' === typeof entrySize.height && 'number' === typeof entrySize.width) {
            maxEntryWidth = entrySize.width;
            maxEntryHeight = entrySize.height;
        }
        else{
            throw Error('Unrecognized value for "entrySize" option: ' + entrySize);
        }
        
        return {
            width: maxEntryWidth,
            height: maxEntryHeight
        };
    }
    /**
     * 
     * @param {Object|function} entrySize
     * @param {function} layout
     * @param {Array} sortedSeries
     * @param {CanvasRenderingContext2D} legendCtx
     * @param {Object} options
     * @param {Object} fontOptions
     * @returns {Object} an object with two properties, 'height' and 'width', 
     *  both having values of type 'Number'
     */
    function getLegendSize(entrySize, layout, sortedSeries, legendCtx, options, fontOptions) {
        var seriesIndex;
        var legendWidth = 0;
        var legendHeight = 0;
        var previousEntryOriginX = 0,
                previousEntryOriginY = 0,
                previousEntryWidth = 0,
                previousEntryHeight = 0,
                nextEntryOrigin,
                nextEntryOriginX,
                nextEntryOriginY,
                entryWidth,
                entryHeight,
                potentialXExtremity,
                potentialYExtremity,
                thisEntrySize,
                thisSeries;
        var maxEntrySize = getMaxEntrySize(entrySize, sortedSeries, legendCtx, options, fontOptions);
        
        if ('function' === typeof entrySize) {
            
            $.each(sortedSeries, function(seriesIndex, thisSeries){
                if(0 === seriesIndex){
                    nextEntryOrigin = {
                        nextEntryOriginX : previousEntryOriginX,
                        nextEntryOriginY : previousEntryOriginY,
                    };
                }
                else{
                    nextEntryOrigin = layout(seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntrySize.width, maxEntrySize.height);
                }
                
                nextEntryOriginX = nextEntryOrigin.nextEntryOriginX;
                nextEntryOriginY = nextEntryOrigin.nextEntryOriginY;
                thisEntrySize = entrySize(legendCtx, thisSeries, options, nextEntryOriginX, nextEntryOriginY, fontOptions);
                entryWidth = thisEntrySize.width;
                entryHeight = thisEntrySize.height;
                potentialXExtremity = nextEntryOriginX + entryWidth;
                potentialYExtremity = nextEntryOriginY + entryHeight;
                legendWidth = potentialXExtremity > legendWidth ? potentialXExtremity : legendWidth;
                legendHeight = potentialYExtremity > legendHeight ? potentialYExtremity : legendHeight;
                previousEntryOriginX = nextEntryOriginX;
                previousEntryOriginY = nextEntryOriginY;
                previousEntryWidth = entryWidth;
                previousEntryHeight = entryHeight;
            });
        }
        else if ('number' === typeof entrySize.height && 'number' === typeof entrySize.width) {
            entryWidth = entrySize.width;
            entryHeight = entrySize.height;
            $.each(sortedSeries, function(seriesIndex, thisSeries){
                if(0 === seriesIndex){
                    nextEntryOrigin = {
                        nextEntryOriginX : previousEntryOriginX,
                        nextEntryOriginY : previousEntryOriginY,
                    };
                }
                else{
                    nextEntryOrigin = layout(seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntrySize.width, maxEntrySize.height);
                }
                nextEntryOriginX = nextEntryOrigin.nextEntryOriginX;
                nextEntryOriginY = nextEntryOrigin.nextEntryOriginY;
                potentialXExtremity = nextEntryOriginX + entryWidth;
                potentialYExtremity = nextEntryOriginY + entryHeight;
                legendWidth = potentialXExtremity > legendWidth ? potentialXExtremity : legendWidth;
                legendHeight = potentialYExtremity > legendHeight ? potentialYExtremity : legendHeight;
                previousEntryOriginX = nextEntryOriginX;
                previousEntryOriginY = nextEntryOriginY;
                previousEntryWidth = entryWidth;
                previousEntryHeight = entryHeight;
            });
        }
        else {
            throw Error('Unrecognized value for "entrySize" option: ' + entrySize);
        }
        return {
            height: legendHeight,
            width: legendWidth
        };
    }
    /**
     * draws the legend on the canvas
     * @param {jQuery.plot} plot
     * @param {CanvasRenderingContext2D} plotCtx
     * @returns {undefined}
     */
    function drawLegend(plot, plotCtx) {
        var options = plot.getOptions();
        var canvasLegendOpts = options.canvasLegend;
        if (!(canvasLegendOpts && canvasLegendOpts.show)){
            return;
        }
        var placeholder = plot.getPlaceholder();
        var fontOptions = getFontOptions(placeholder, canvasLegendOpts.font);
        var entryRender = canvasLegendOpts.entryRender;
        var layout = canvasLegendOpts.layout;

        var containerOption = canvasLegendOpts.container;
        var containerAndContext = getLegendContainerAndContext(containerOption, plotCtx);
        var container = containerAndContext.container;
        //the legendCtx will either be plotCtx or the context from an external canvas,
        //depending on what is contained in canvas.container
        var legendCtx = containerAndContext.context;

        var series = $(plot.getData()).filter(function(index, oneSeries){
        	return oneSeries.label && (0 < oneSeries.label.length);
        });
        var plotOffset = plot.getPlotOffset();
        var plotHeight = plot.height();
        var plotWidth = plot.width();

        var sortedSeries = getSortedSeries(canvasLegendOpts.sorted, series);

        var entrySize = canvasLegendOpts.entrySize;
        var layout = canvasLegendOpts.layout;

        var legendSize = getLegendSize(entrySize, layout, sortedSeries, legendCtx, options, fontOptions);

        var legendWidth = legendSize.width;
        var legendHeight = legendSize.height;


        var legendOrigin, legendOriginX, legendOriginY;

        if (canvasLegendOpts.position && !canvasLegendOpts.container) {
            legendOrigin = calculateLegendOrigin(canvasLegendOpts.position, canvasLegendOpts.margin, plotOffset, options.grid.borderWidth, legendWidth, legendHeight, plotWidth, plotHeight);
            legendOriginX = legendOrigin.x;
            legendOriginY = legendOrigin.y;
        }
        else {
            legendOriginX = 0;
            legendOriginY = 0;
        }

        //color background

        //first save context state
        var oldGlobalAlpha = legendCtx.globalAlpha;
        var oldFillStyle = legendCtx.fillStyle;

        //render background
        var backgroundOpacity = canvasLegendOpts.backgroundOpacity;
        if(!isNaN(backgroundOpacity) && 0 <= backgroundOpacity && 1>= backgroundOpacity){
        	legendCtx.globalAlpha = backgroundOpacity;
        }
        else{
        	legendCtx.globalAlpha = 1;
        }
        
        legendCtx.fillStyle = canvasLegendOpts.backgroundColor || '#fff';
        legendCtx.fillRect(legendOriginX, legendOriginY, legendWidth, legendHeight);

        //restore previous context state
        legendCtx.globalAlpha = oldGlobalAlpha;
        legendCtx.fillStyle = oldFillStyle;

        //now do actual rendering of legend entries
        var previousEntryOriginX = legendOriginX,
                previousEntryOriginY = legendOriginY,
                previousEntryWidth = 0,
                previousEntryHeight = 0,
                nextEntryOrigin,
                nextEntryOriginX,
                nextEntryOriginY,
                thisEntrySize,
                entryWidth,
                entryHeight,
                maxEntrySize = getMaxEntrySize(entrySize, series, legendCtx, options, fontOptions);

        $.each(sortedSeries,function(seriesIndex, thisSeries){
            nextEntryOrigin = layout(seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntrySize.width, maxEntrySize.height);
            nextEntryOriginX = nextEntryOrigin.nextEntryOriginX;
            nextEntryOriginY = nextEntryOrigin.nextEntryOriginY;

            entryRender(legendCtx, thisSeries, options, nextEntryOriginX, nextEntryOriginY, fontOptions, maxEntrySize.width, maxEntrySize.height);
            thisEntrySize = 'function' === typeof entrySize ? entrySize(legendCtx, thisSeries, options, nextEntryOriginX, nextEntryOriginY, fontOptions) : entrySize;
            entryWidth = thisEntrySize.width;
            entryHeight = thisEntrySize.height;
            previousEntryOriginX = nextEntryOriginX;
            previousEntryOriginY = nextEntryOriginY;
            previousEntryWidth = entryWidth;
            previousEntryHeight = entryHeight;
        });

    }
    /**
     * @param position {String}, one of (ne, nw, se, sw)
     * @param margin {undefined|null|Array|Number}, if array, must have exactly two elements, both of type Number
     * @param plotOffset {Object}, must have two properties of name "top" and "left", both having values of type Number
     * @param borderWidth {Number}
     * @param legendWidth {Number}
     * @param legendHeight {Number}
     * @param plotWidth {Number}
     * @param plotHeight {Number}
     * @returns {x: Number, y:Number}
     */
    function calculateLegendOrigin(position, margin, plotOffset, borderWidth, legendWidth, legendHeight, plotWidth, plotHeight) {
        var x,y, marginX, marginY;
        margin = margin || 0;
        //if margin is not an array
        if (undefined === margin[0]){
            marginX = marginY = margin;
        }
        else{
            //if margin is an array
            marginX = margin[0];
            marginY = margin[1];
        }
        
        if (position.charAt(0) === "n") {
            y = Math.round(plotOffset.top + borderWidth + marginY);
        }
        else if (position.charAt(0) === "s") {
            y = Math.round(plotOffset.top + borderWidth + plotHeight - marginY - legendHeight);
        }
        else {
            throw Error('Unrecognized value for "position" option: ' + position);
        }
        if (position.charAt(1) === "e") {
            x = Math.round(plotOffset.left + borderWidth + plotWidth - marginX - legendWidth);
        }
        else if (position.charAt(1) === "w") {
            x = Math.round(plotOffset.left + borderWidth + marginX);
        }
        else {
            throw Error('Unrecognized value for "position" option: ' + position);
        }
        return {x: x, y: y};
    }

    $.plot.plugins.push({
        init: init,
        options: {},
        name: 'canvasLegend',
        version: '0.1',
        _private_methods: {
            calculateLegendOrigin: calculateLegendOrigin,
            getFontOptions: getFontOptions,
            getSortedSeries: getSortedSeries,
            getLegendContainerAndContext: getLegendContainerAndContext,
            getLegendSize: getLegendSize,
            getMaxEntrySize: getMaxEntrySize
        }
    });
    
})(jQuery);
