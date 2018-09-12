(function(){
    "use strict";
    $.plot.canvasLegend = $.plot.custom_canvas_legend || {};
    /**
     * 
     * @param {Number} seriesIndex
     * @param {Number} previousEntryOriginX
     * @param {Number} previousEntryOriginY
     * @param {Number} previousEntryWidth
     * @param {Number} previousEntryHeight
     * @param {Number} maxEntryWidth
     * @param {Number} maxEntryHeight
     * @returns {Object} - {nextEntryOriginX: {Number}, nextEntryOriginY: {Number}}
     */
    function vertical (seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntryWidth, maxEntryHeight){
        //simple vertical layout
        var nextEntryOriginY = previousEntryOriginY + previousEntryHeight;
        return {
            nextEntryOriginX: previousEntryOriginX, 
            nextEntryOriginY: nextEntryOriginY
        };	
    };
    /**
     * 
     * @param {Number} seriesIndex
     * @param {Number} previousEntryOriginX
     * @param {Number} previousEntryOriginY
     * @param {Number} previousEntryWidth
     * @param {Number} previousEntryHeight
     * @param {Number} maxEntryWidth
     * @param {Number} maxEntryHeight
     * @returns {Object} - {nextEntryOriginX: {Number}, nextEntryOriginY: {Number}}
     */
    function horizontal (seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntryWidth, maxEntryHeight){
        //simple vertical layout
        var nextEntryOriginX = previousEntryOriginX + previousEntryWidth;
        return {
            nextEntryOriginX: nextEntryOriginX, 
            nextEntryOriginY: previousEntryOriginY
        };
    };
    /**
     * 
     * @param {Number} numColumns
     * @param {Number} seriesIndex
     * @param {Number} previousEntryOriginX
     * @param {Number} previousEntryOriginY
     * @param {Number} previousEntryWidth
     * @param {Number} previousEntryHeight
     * @param {Number} maxEntryWidth
     * @param {Number} maxEntryHeight
     * @returns {Object} - {nextEntryOriginX: {Number}, nextEntryOriginY: {Number}}
     */
    function table (numColumns, seriesIndex, previousEntryOriginX, previousEntryOriginY, previousEntryWidth, previousEntryHeight, maxEntryWidth, maxEntryHeight){
        return {
            nextEntryOriginX: maxEntryWidth * (seriesIndex % numColumns),
            nextEntryOriginY: maxEntryHeight * (Math.floor(seriesIndex / numColumns))
        };
    };
    /**
     * This function is not a layout function. This function returns a layout 
     * function when called. This function should always be called, not simply 
     * referenced.
     * @param {Number} n
     * @returns {Function} the layout function that will be referenced.
     */
    function tableWithNColumns(n){
        if(1 !== arguments.length){
            throw Error('You wrote "tableWithNColumns", you should write "tableWithNColumns(42)" or any integer');
        }
        else{
            return function(){
                var args = $.makeArray(arguments);
                args.unshift(n);
                return table.apply(undefined, args);
            };
        }
    };
    $.plot.canvasLegend.layouts = {
        vertical: vertical,
        horizontal: horizontal,
        tableWithNColumns:tableWithNColumns
    };
}());