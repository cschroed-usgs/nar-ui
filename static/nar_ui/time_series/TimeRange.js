/* @requires nar, util, nar.WaterYearUtils
*/
var nar = nar || {};
(function() {
    nar.timeSeries = nar.timeSeries || {};

    /**
     * @class
     * @param {Date|String|Number} startTime - A valid Date Object, an ISO-8601 date string, or a Number timestamp
     * @param {Date|String|Number} endTime -  A valid Date Object, an ISO-8601 date string, or a Number timestamp
     */
    nar.timeSeries.TimeRange = function(startTime, endTime) {
        var self = this;
        self.startTime = nar.util.getTimeStamp(startTime);
        self.endTime = nar.util.getTimeStamp(endTime);
        self.clone = function() {
            return nar.timeSeries.TimeRange.clone(self);
        };
        self.equals = function(otherTimeRange) {
            return nar.timeSeries.TimeRange.equals(self, otherTimeRange);
        };
        self.contains = function(date) {
            var timestamp = nar.util.getTimeStamp(date);
            return (timestamp >= self.startTime && timestamp <= self.endTime);
        };
        self.trimStartTime = function(cutoffDate) {
            var chosenCutoffDate = cutoffDate || nar.timeSeries.TimeRange.START_TIME_CUTOFF;
            self.startTime = Math.max(chosenCutoffDate, self.startTime);
        };
        self.trimEndTime = function(cutoffDate) {
            var chosenCutoffDate = cutoffDate || nar.timeSeries.TimeRange.END_TIME_CUTOFF;
            self.endTime = Math.min(chosenCutoffDate, self.endTime);
        };
    };
    
    nar.timeSeries.TimeRange.START_TIME_CUTOFF = new Date(1992, 9, 1).getTime();
    nar.timeSeries.TimeRange.END_TIME_CUTOFF = new Date(nar.WaterYearUtils.convertDateToWaterYear(Date.now())-1, 8, 30, 23, 59, 59).getTime();
    
    //public static methods
    
    /**
     * Clones the specified time range
     * @param {nar.timeSeries.TimeRange} timeRange
     */
    nar.timeSeries.TimeRange.clone = function(timeRange){
        return new nar.timeSeries.TimeRange(timeRange.startTime,timeRange.endTime);
    };
    nar.timeSeries.TimeRange.equals = function(timeRangeA, timeRangeB){
        var equal = false;
        if(undefined !== timeRangeA && undefined !== timeRangeB){
            if(timeRangeA.constructor === nar.timeSeries.TimeRange &&
               timeRangeB.constructor === nar.timeSeries.TimeRange){
                
                equal = timeRangeA.startTime === timeRangeB.startTime &&
                       timeRangeA.endTime === timeRangeB.endTime;
            }
        }
        return equal;
    };
    
    /**
     * Given a collection of TimeRanges, produce an aggregate TimeRange 
     * whose startTime is the smallest startTime of timeRanges
     * and whose endTime is the largest endTime of timeRanges
     *  
     * @param {array<TimeRange>} timeRanges
     * @returns {TimeRange}
     */
    nar.timeSeries.TimeRange.ofAll = function(timeRanges){
        
        /**
         * @param {nar.timeSeries.TimeRange} init
         * @param {nar.timeSeries.TimeRange} current the current element of iteration
         */
        var timeExtentExtremityFinder = function(init, current){
            init.startTime = Math.min(init.startTime, current.startTime);
            init.endTime = Math.max(init.endTime, current.endTime);
            return init;
        };
        
        var firstTimeRange = timeRanges.first();
        if(firstTimeRange){
            //since reduce modifies the init value, we must create a copy to avoid modifying the
            //original while searching
            var initValue = firstTimeRange.clone();
            var maxExtent = timeRanges.reduce(timeExtentExtremityFinder, initValue);
            return maxExtent;
        }
    };
}());