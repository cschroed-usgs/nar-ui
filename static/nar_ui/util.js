var nar = nar || {};
nar.util = {};
(function(){
    var selectorNotPresentMessagePrefix ='Could not find element with jquery selector "';
    var selectorNotPresentMessageSuffix = '".';
    /**
     * @param {selector} mixed jquery selection string or jquery object that results from a selection
     * @throws Error if selector is not present
     */
    nar.util.assert_selector_present = function(selector){
        if($(selector).length === 0){
            throw Error( selectorNotPresentMessagePrefix + selector + selectorNotPresentMessageSuffix);
        }
    };
    /**
     * {Date|String|Number} dateLike - A valid Date Object, an ISO-8601 date string, or a Number timestamp
     */
    nar.util.getTimeStamp = function(dateLike){
        var dateObj = Date.create(dateLike);
        var timestamp = dateObj.getTime();
        return timestamp;
    };
    /**
     * sugar doesn't let me leave out millis and n52 doesn't like millis
     */
    nar.util.toISOString = function(dateLike) {
        var dateObj = Date.create(dateLike);
        return dateObj.getUTCFullYear().pad(4) + '-' +
            (dateObj.getUTCMonth() + 1).pad(2) + '-' +
            dateObj.getUTCDate().pad(2) + 'T' +
            dateObj.getUTCHours().pad(2) + ':' +
            dateObj.getUTCMinutes().pad(2) + ':' +
            dateObj.getUTCSeconds().pad(2) + 'Z';
    };
    
    nar.util.toISODate = function(dateLike) {
    	var dateObj = Date.create(dateLike);
    	return dateObj.format(Date.ISO8601_DATE);
    };
    
    nar.util.Unimplemented = function() {
        throw Error('This functionality is not yet implemented');
    };
    
    nar.util.MILLISECONDS_IN_YEAR = 365 *24 * 60 * 60 * 1000;

	/**
	 * Determines if 'obj' has all the keys and values in keysAndValues.
	 * @param {Object} obj
	 * @param {Object} keysAndValues
	 * returns {Boolean} true if all the keys in 'keysAndValues' are in 'obj' and 
	 * all of the values in the matching keys are strictly equal. false otherwise   
	 * 
	 */
	nar.util.objectHasAllKeysAndValues = function(obj, keysAndValues){
		var containsKeysAndValues = true;
		for(key in keysAndValues){
			//prototype filtering
			if(Object.has(keysAndValues, key)){
				if(!(Object.has(obj, key) && obj[key] === keysAndValues[key])){
					containsKeysAndValues = false;
					break;
				}
			}
		}
		return containsKeysAndValues;
	};
    nar.util.error = function(message){
    	  $('#alert').html(message).show().alert();
          $('#alert').delay(5000).fadeOut();
    };
    window.onerror = function(errorMsg, url, lineNumber) {
        var msg = errorMsg.replace(/Uncaught .*Error: /, '');
        nar.util.error(msg);
    };
	nar.util.IGNORED_MODTYPES = ['COMP', 'CONTIN'];
	nar.util.stringContainsIgnoredModtype = function(myString){
		return nar.util.IGNORED_MODTYPES.some(function(ignoredModtype){
			return myString.has(ignoredModtype);
		});
	};
	nar.util.getIgnoredModtypeString = function (){
		return nar.util.IGNORED_MODTYPES.map(function(ignoredModtype){
			return $.param({'excludeModtype':ignoredModtype});
		}).join('&');
	}
	nar.util.getHashCode = function(str) {
		var hash = 0, i, chr, len;
		if (str.length === 0) return hash;
		for (i = 0; i < str.length; i++) {
			chr   = str.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	};
    
	/**
	 * Given members from a nar custom web service availability response,
	 * create an sos procedure url that represents the same thing.
	 * @param timeSeriesCategory
	 * @param timeStepDensity
	 * @returns {String}
	 */
	nar.util.getSosProcedureForTimeSeriesCategoryAndTimeStepDensity = function (timeSeriesCategory, timeStepDensity) {
		var procedure = timeStepDensity.toLowerCase() + '_';
		timeSeriesCategory = timeSeriesCategory.toLowerCase();
		if('load' === timeSeriesCategory){
			procedure += 'mass';
		} else {
			procedure += timeSeriesCategory;
		}
		return procedure;
	};
	
	/**
	 * Given a constituent from a nar custom web service availability response,
	 * create an sos observed property url that represents the same thing.
	 * @param constit
	 * @returns {String}
	 */
	nar.util.getSosObservedPropertyForConstituent = function (constit) {
		return constit || 'Q';
	};
	
	/**
	 * The inverse of nar.util.getSosObservedPropertyForConstituent
	 */
	nar.util.getConstituentForSosObservedProperty = function(sosObservedProperty) {
		return sosObservedProperty == 'Q' ? undefined : sosObservedProperty;
	};
	
	/**
	 * 
	 * Given a response from a nar custom web service availability call,
	 * translate it to a SosGetDataAvailability Response
	 * @param response
	 */
	nar.util.translateToSosGetDataAvailability = function(response){
		var sosGetDataAvailabilityResponse = [];
		
		//some responses from the NAR availability API will generate multiple
		//SOS Data Availability objects
		response.each(function(entry){
			sosGetDataAvailabilityResponse.push({
				observedProperty : nar.util.getSosObservedPropertyForConstituent(entry.constit),
				procedure : nar.util.getSosProcedureForTimeSeriesCategoryAndTimeStepDensity(entry.timeSeriesCategory, entry.timeStepDensity),
				phenomenonTime : [entry.startTime, entry.endTime],
				featureOfInterest : entry.featureOfInterest
			});
			if('load' === entry.timeSeriesCategory.toLowerCase()){
				sosGetDataAvailabilityResponse.push({
					observedProperty : nar.util.getSosObservedPropertyForConstituent(entry.constit),
					procedure : nar.util.getSosProcedureForTimeSeriesCategoryAndTimeStepDensity('concentration_flow_weighted', entry.timeStepDensity),
					phenomenonTime : [entry.startTime, entry.endTime],
					featureOfInterest : entry.featureOfInterest
				});
				sosGetDataAvailabilityResponse.push({
					observedProperty : nar.util.getSosObservedPropertyForConstituent(entry.constit),
					procedure : nar.util.getSosProcedureForTimeSeriesCategoryAndTimeStepDensity('yield', entry.timeStepDensity),
					phenomenonTime : [entry.startTime, entry.endTime],
					featureOfInterest : entry.featureOfInterest
				});
			}
		});
		return sosGetDataAvailabilityResponse;
	}
	

	var sosProcedureToCustomRetrievalEndpoint = {
			'annual_mass' : 'aloads',
			'annual_concentration_flow_weighted' : 'aloads',
			'annual_yield' : 'aloads',
			'monthly_mass' : 'mloads',
			'monthly_flow' : 'mflow',
			'daily_flow' : 'dflow',
			'annual_flow' : 'aflow',
			'discrete_concentration' : 'discqw'
	};
	nar.util.translateSosProcedureToRetrievalEndpoint = function(sosProcedure) {
		return sosProcedureToCustomRetrievalEndpoint[sosProcedure];
	};
	
	//specify the names of the value properties. They are joined together as strings from left to right in order of listing.
	var sosProcedureToValueProperties = {
			'annual_mass' : ['tons'],
			'annual_concentration_flow_weighted' : ['fwc'],
			'annual_yield' : ['yield'],
			'monthly_mass' : ['tons'],
			'monthly_flow' : ['flow'],
			'daily_flow' : ['flow'],
			'annual_flow' : ['flow'],
			'discrete_concentration' : ['remark', 'concentration']
	};
	
    nar.util.getValueForResponseRow = function(responseRow, procedure){
        var valueProperties = sosProcedureToValueProperties[procedure];
        //value can be comprised of multiple fields. Join fields together in order.
        var values = nar.util.concatenatePropertyValues(responseRow, valueProperties);
        return values;
    };
    
	nar.util.concatenatePropertyValues = function(object, propertyKeys){
        var values = propertyKeys.reduce(function(accumulation, current){
            //if attribute is missing, use blank string
            return accumulation + '' + (object[current] || '');
        }, '');
        return values;
	};
	
	nar.util.getTimestampForResponseRow = function(responseRow){
		var theDate;
		if(responseRow.date){
			theDate = Date.create(responseRow.date);
		} else {
			if(responseRow.month) {
				theDate = Date.create(responseRow.wy + '-' + responseRow.month);
			} else {
				theDate = Date.create('' + responseRow.wy);
			} 
		}
		return theDate.getTime();
	};
	
	/**
	 * 
	 * @param siteId {String} mandatory site id
	 * @param constit {String} optional constituent
	 * @returns $.Deferred
	 */
	nar.util.getDataAvailability = function(siteId, constit){
		var queryString = 'timeseries/availability/' + siteId + "?" + nar.util.getIgnoredModtypeString();
		if(constit){
			queryString += '&constit=' + constit;
		}

		//find out what data is available for the site
		var getDataAvailability = $.ajax({
			url : CONFIG.endpoint.nar_webservice + queryString,
			contentType : 'application/json',
			type: 'GET'
		});

		return getDataAvailability;
	};
	
}());
