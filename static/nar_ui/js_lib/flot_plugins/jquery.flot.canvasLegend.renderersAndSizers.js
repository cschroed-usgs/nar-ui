/* global $ Math */
(function () {
    "use strict";
    $.plot.canvasLegend = $.plot.canvasLegend || {};

    /**
     * 
     * @param {CanvasRenderingContext2D} context
     * @param {Object} fontOptions
     * @returns {undefined}
     */
    var setupCanvasForText = function (context, fontOptions) {
        context.font = fontOptions.style + " " + fontOptions.variant + " " + fontOptions.weight + " " + fontOptions.size + "px '" + fontOptions.family + "'";
        context.textAlign = "left";
        context.textBaseline = "bottom";
    };
        
    var boxLeftLabelRight = (function () {
        
        /**
         * Estimate the height of the label. Most browsers don't implement
         * a way to calculate actual text height on the canvas.
         *
         * Font options must be set prior to invocation for accurate result
         * 
         * @param {CanvasRenderingContext2D} context
         * @returns {Number}
         */
        var calcLabelHeight = function(context){
            return context.measureText('M').width;
        };
        
        
        var PADDING = 5;
        var BOX_LABEL_SPACE = 10;
        
        var exports = {};
        /**
         * 
         * @param {CanvasRenderingContext2D} legendCtx
         * @param {Object} thisSeries a flot series
         * @param {Object} options - the options in options.canvasLegend
         * @param {Number} entryOriginX
         * @param {Number} entryOriginY
         * @param {Object} fontOptions - options.font merged with the font options from the plot placeholder.
         * @param {Number} maxEntryWidth
         * @param {Number} maxEntryHeight
         * @returns {undefined}
         */
        exports.render = function (legendCtx, thisSeries, options, entryOriginX, entryOriginY, fontOptions, maxEntryWidth, maxEntryHeight) {
            var color = thisSeries.color;
            var label = thisSeries.label;
            setupCanvasForText(legendCtx, fontOptions);
            //calcluate label dims
            var labelHeight = calcLabelHeight(legendCtx);
            var boxSize = labelHeight;//square
            //draw box
            legendCtx.fillStyle = color;
            var boxX = entryOriginX + PADDING;
            var boxY = entryOriginY + PADDING;
            legendCtx.fillRect(boxX, boxY, boxSize, boxSize);
            //draw label
            legendCtx.fillStyle = "#000";
            var textX = boxX + boxSize + BOX_LABEL_SPACE;
            // for textY, we need an additional offset of labelHeight because text 
            // is drawn above and to the right of the coords passed to context.fillText
            var textY = entryOriginY + PADDING  + labelHeight;
            legendCtx.fillText(label, textX, textY);
        };
        /**
         * 
         * @param {CanvasRenderingContext2D} legendCtx
         * @param {Object} oneSeries - a single flot series
         * @param {Object} options - the options passed to canvasLegend
         * @param {Object} fontOptions - options.font merged with the font options from the plot placeholder.
         */
        exports.size = function (legendCtx, oneSeries, options, fontOptions) {
            var label = oneSeries.label;
            setupCanvasForText(legendCtx, fontOptions);
            var labelHeight = calcLabelHeight(legendCtx);
            var labelWidth = legendCtx.measureText(label).width;
            var boxSize = labelHeight;

            return {
                width: PADDING + boxSize + BOX_LABEL_SPACE + labelWidth + PADDING,
                height: PADDING + Math.max(labelHeight, boxSize) + PADDING
            };
        };
        return exports;
    }());

    $.plot.canvasLegend.renderersAndSizers = {
        boxLeftLabelRight: boxLeftLabelRight
    };
}());