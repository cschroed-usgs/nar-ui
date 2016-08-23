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
    
    self.timeRange = new nar.timeSeries.TimeRange(
        config.metadata.startTime,
        config.metadata.endTime
    );
    
    self.metadata = Object.clone(config.metadata, true) || {};
    //delete these string attributes so that there is no confusion about whether they
    //are in synch with the TimeRange object or not.
    delete self.metadata.startTime;
    delete self.metadata.endTime;
    
    self.site = config.site;
    self.data = undefined;
    
    /**
     * Get row field names whose values should be joined into a single string
     */
    var getRowFieldsToJoinForMetadata= function(metadata){
    	var rowKeys;
    	if('PESTICIDE' === metadata.constituentCategorization.category && 'DISCRETE' === metadata.timeStepDensity && 'PESTICIDE_CONCENTRATION' === metadata.timeSeriesCategory){
    		rowKeys = ['remark', 'concentration'];
//    		if('AQUATIC_LIFE' === metadata.comparisonCategorization.category){
//    			rowKeys.append(['acuteFish', 'acuteInvert']);
//    		} else if ('HUMAN_HEALTH' === metadata.comparisonCategorization.category){
//    			rowKeys.append(['hhAcute']);
//    		}
    	}
    	return rowKeys;
    };
    
    /**
     * returns an array of field names that should be added
     * as separate array entries in each time step
     */
    var getAdditionalFields= function(metadata){
    	var additionalFields = [];
    	if(metadata.comparisonCategorization && metadata.comparisonCategorization.category) {
    		if('HUMAN_HEALTH' === metadata.comparisonCategorization.category ){
    			if('DISCRETE' === metadata.timeStepDensity){
    				additionalFields = ['hhAcute'];
    			} else if ('ANNUAL' === metadata.timeStepDensity){
    				additionalFields = ['hhChronic']
    			}
    		} else if('AQUATIC_LIFE' === metadata.comparisonCategorization.category){
    			if('DISCRETE' === metadata.timeStepDensity){
    				additionalFields = ['acuteFish', 'acuteInvert', 'plant'];
    			} else if('EVERY_21_DAYS' === metadata.timeStepDensity){
    				additionalFields = ['chronicInvert'];
    			} else if('EVERY_60_DAYS' === metadata.timeStepDensity){
    				additionalFields = ['chronicFish'];
    			}
    		}
    	}
    	return additionalFields;
    };
    /**
     * Some values are flagged with 'E' (Estimated). We want to display them 
     * the same as non-estimated values.
     * @param {String} value - a String representation of a number
     * @returns {String}
     */
    var removeLetterE = function(value){
    	if(Object.isString(value)){
    		return value.replace('E','');
    	}
    	return value;
    };
    self.parseResultRetrievalResponse = function(response){
    	var rowFieldsToJoinTogether = getRowFieldsToJoinForMetadata(self.metadata);
    	var additionalFields = getAdditionalFields(self.metadata);
        var dataToReturn;
        if(Object.isArray(response)){
            dataToReturn = response.map(function(row) {
                var dateAndValues = [
                    nar.util.getTimestampForResponseRow(row),
                    nar.util.concatenatePropertyValues(row, rowFieldsToJoinTogether)
                ].map(removeLetterE);
                var additionalValues = additionalFields.map(function(fieldName){
                	return row[fieldName];
                });
                dateAndValues = dateAndValues.add(additionalValues);
                
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
       var endpoint = 'pestsamp';
       var constit = self.metadata.constit;
       var modtypeFilter = nar.util.getIgnoredModtypeString();

        var deferred = $.Deferred();

        var endpointAndQueryString = endpoint + '/site/' + self.site + '?';
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
