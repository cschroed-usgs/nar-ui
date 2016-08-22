//@requires nar.util, nar.WaterYearUtils
var nar = nar || {};
(function(){
nar.pestTimeSeries = nar.pestTimeSeries || {};

/**
 * @typedef nar.pestTimeSeries.TimeSeriesConfig
 * @property {Object} metadata - the availability data returned from the server
 * @property {String} site
 * @property {nar.timeSeries.TimeRange} timeRange
 */

/**
 * @class
 * @param {nar.timeSeries.TimeSeriesConfig} config
 */
nar.pestTimeSeries.TimeSeries = function(config){
    var self = this;
    self.metadata = Object.clone(config.metadata, true) || {};
    self.metadata.timeRange = new nar.timeSeries.TimeRange(
          config.metadata.startTime,
          config.metadata.endTime
    );
    //delete these string attributes so that there is no confusion about whether they
    //are in synch or not.
    delete self.metadata.startTime;
    delete self.metadata.endTime;
    
    self.site = config.site;
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
       var endpoint = 'pesticides';
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
