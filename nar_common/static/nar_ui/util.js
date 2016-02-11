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
    
}());
