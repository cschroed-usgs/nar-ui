//@requires nar.util, nar.WaterYearUtils
var nar = nar || {};
(function(){
nar.timeSeries = nar.timeSeries || {};

/**
 * @typedef nar.timeSeries.TimeSeriesConfig
 * @property {String} observedProperty - a full url identifier for an SOS observedProperty
 * @property {String} procedure - a full url identifier for an SOS procedure
 * @property {String} featureOfInterest - the sos feature of interest
 * @property {nar.timeSeries.TimeRange} timeRange
 */

/**
 * @class
 * @param {nar.timeSeries.TimeSeriesConfig} config
 */
nar.timeSeries.TimeSeries = function(config){
    var self = this;
    self.procedure= config.procedure;
    self.observedProperty = config.observedProperty;
    self.timeRange = config.timeRange || null;
    self.featureOfInterest = config.featureOfInterest;
    self.data = undefined;

    self.parseResultRetrievalResponse = function(response){
        var dataToReturn;
        if (Object.isArray(response)){
	            dataToReturn = response.map(function(row) {
	                var dateAndValues = [
	                    nar.util.getTimestampForResponseRow(row),
	                    nar.util.getValueForResponseRow(row, self.procedure)
	                ];
	                return dateAndValues;
	            });
        } else {
            throw 'error retrieving data';
        }
        return dataToReturn;
    };

    /**
     * Retrieve data and run callback. Does not check to see if data is already present.
     * @returns {jQuery.promise} -- the promise callbacks are called with this TimeSeries
     */
    self.retrieveData = function() {
       var endpoint = nar.util.translateSosProcedureToRetrievalEndpoint(self.procedure);
       var constit = nar.util.getConstituentForSosObservedProperty(self.observedProperty);
       var modtypeFilter = nar.util.getIgnoredModtypeString();

        var deferred = $.Deferred();

        var endpointAndQueryString = endpoint + '/site/' + self.featureOfInterest + '?';
        if (constit){
               endpointAndQueryString += 'constit=' + constit + '&';
        }

        endpointAndQueryString += modtypeFilter;
        
        if(self.timeRange){
 	       var startTime = nar.util.toISODate(self.timeRange.startTime);
	       var endTime = nar.util.toISODate(self.timeRange.endTime);
        	endpointAndQueryString  += '&startTime=' + startTime + '&endTime=' + endTime;
        }

        var dataRetrieval = $.ajax({
            url : CONFIG.endpoint.nar_webservice + 'timeseries/' + endpointAndQueryString,
            type : 'GET',
            contentType : 'application/json',
            success : function(response, textStatus, jqXHR) {
                self.data = self.parseResultRetrievalResponse(response);
                if (!self.timeRange) {
                    self.timeRange = new nar.timeSeries.TimeRange(self.data[0][0], self.data[self.data.length - 1][0]);
                }
                // pass this entire object to the callback
                deferred.resolve(self);
            },
            error: function(data, textStatus, jqXHR){
                deferred.reject(data);
            }
        });
        var promise = deferred.promise();
        return promise;
    };

};

nar.timeSeries.DataAvailabilityTimeRange = function(dataAvailability, useOriginalTimes) {
    var startTimeIndex = 0;
    var endTimeIndex = 1;
    var timeRange = new nar.timeSeries.TimeRange(
        dataAvailability.phenomenonTime[startTimeIndex],
        dataAvailability.phenomenonTime[endTimeIndex]
    );

    // Unless otherwise specified, cut off the start date to the
    if (!useOriginalTimes) {
       timeRange.trimStartTime();
        timeRange.trimEndTime();
    }

    return timeRange;
};

nar.timeSeries.WaterYearTimeRange = function(wy) {
    // Back up and forward just a bit because during is not inclusive
    var startTime = nar.WaterYearUtils.getWaterYearStart(wy, true).rewind('1 minute');
    var endTime = nar.WaterYearUtils.getWaterYearEnd(wy, true).advance('1 minute');
    var yearRange = new nar.timeSeries.TimeRange(
        startTime,
        endTime
    );
    return yearRange;
};

}());
