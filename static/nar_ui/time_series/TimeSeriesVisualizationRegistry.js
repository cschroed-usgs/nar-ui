//@requires nar.timeSeries.TimeSeriesVisualization
var nar = nar || {};

(function(){

nar.timeSeries = nar.timeSeries || {};

/**
 * @class
 * In the application, this should be used as a singleton by constructing a single instance
 * from the onready/main file.
 * 
 * In testing this can be used in non-singleton form.
 * 
 * While the first instantiation of this class proceeds without further ado,
 * a warning is printed during each subsequent instantiation.
 */

//private class variable
var alreadyBeenInstantiated = false;

nar.timeSeries.VisualizationRegistry = function(){
    if(alreadyBeenInstantiated){
    	console.warn(
			'This object should be treated as a singleton unless testing.' + 
			'You are instatiating an object that is meant to be used as a singleton, and it has already been instantiated.'+
    		'Did you mean "nar.timeSeries.VisualizationRegistryInstance" ?.'
		);
    }
    else{
    	alreadyBeenInstantiated = true;
    }
	var self = this;
    
    //registry entries, a map of string ids to instantiations of TimeSeriesVisualizations
    var entries = {};
    
    /**
     * Get the Visualization for a given id if it has already been registered. Return undefined if no such id is registered.
     * @param {string} id - the Visualization id
     * @returns {nar.timeSeries.Visualization|undefined} - undefined if not present 
     */
    self.get = function(id){
        var existingTimeSeriesViz = entries[id]; 
        return existingTimeSeriesViz;
    };
    /**
     * @param {nar.timeSeries.Visualization} timeSeriesVisualization
     * @throws Error if already registered 
     */
    self.register = function(timeSeriesVisualization){
        var id = timeSeriesVisualization.id;
        var existing = self.get(id);
        if(existing){
            throw Error('A Time Series Visualization of id "' + id + '" already exists');
        }
        else{
            entries[id] = timeSeriesVisualization;
        }
    };
    /**
     * @param {String Time Series Visualization Id}
     * @returns Boolean - true if the requested id was registered, false otherwise 
     */
    self.deregister = function(timeSeriesVisualizationId){
    	var wasRegistered = false;
    	if(Object.has(entries, timeSeriesVisualizationId)){
    		wasRegistered = true;
    		delete entries[timeSeriesVisualizationId];
    	}
    	return wasRegistered;
    };
    /**
     * Return all registered time series visualizations
     * @returns {Array<nar.timeSeries.Visualization>}
     */
    self.getAll = function(){
      return Object.values(entries);
    };
    /**
     * Convenience method
     * @param {String} observedProperty
     * @returns {nar.timeSeries.Visualization
     */
    self.getByObservedPropertyAndProcedure = function(observedProperty, procedure){
        var vizId = self.getTimeSeriesVisualizationId(observedProperty, procedure);
        var viz = self.get(vizId);
        return viz;
    };
    
    
    
    var strippedObservedPropertyToVizIdMap = {
            //empty for now
    };
    self.urlPrefix = CONFIG.sosDefsBaseUrl;
    self.stripUrlPrefix = function(url, urlPrefix){
        return url.replace(urlPrefix, '');
    };
    
    /**
     * Parses the tail end of an sos procedure url into a fragment of a TSV id
     * @param {String} strippedProcedure - the end of a url. Can be acquired by passing a full sos 
     * procedure url through TimeSeriesVisualizationRegistry#stripUrlPrefix()
     */
    self.strippedProcedureToTsvIdFragment = function(strippedProcedure){
        
        /**
         * The stripped sos procedure name will contain one or more underscore-delimited tokens. If the 
         * stripped sos procedure name has a modtype, the underscore-delimited tokens will be followed by a '/',
         * followed by a modtype. The modtype may contain any characters, including underscores. Underscores in
         * the modtype are not delimiters.
    	 *
         * for the underscore-delimited tokens: 
         * > The first token is timestep density, one of (discrete, annual, monthly, daily).
    	 * > The second token is category, one of (flow, concentration).
    	 * > The third token, if present, is a subcategory. Subcategories can contain any characters, including
    	 * underscores. Underscores in a subcategory are not delimiters.
    	 */
    	
    	var sourceModtypeDelim = '/';
    	var procedureNameAndModtype = strippedProcedure.split(sourceModtypeDelim);
    	var procedureName = procedureNameAndModtype[0];
    	var modType = procedureNameAndModtype[1];
    	
    	//separates timestep density, category and optional subcategory
    	var procedureNameDelim = '_';
    	var splitProcedureName = procedureName.split(procedureNameDelim);

		//delimeter for the token this function produces
		var targetDelim = '/';

    	if(2 === splitProcedureName.length){
    		return splitProcedureName.join(targetDelim);
    	}
    	else{
    		return procedureName.replace('_', targetDelim).replace('_', targetDelim);
    	}
    	
    };
    /**
     * the Visualization id is a string representative of the visualized time series. 
     * @param {string} observedProperty - the full uri for the SOS observedProperty
     * @param {string} procedure - the full uri for the SOS procedure
     * @returns {string} visualization id
     *  
     */
    self.getTimeSeriesVisualizationId= function(observedProperty, procedure){
        var strippedObservedProperty = self.stripUrlPrefix(observedProperty, self.urlPrefix + 'property/');
        //@todo check striped property id to see if it corresponds to a category
        //where multiple time series correspond to a single visualization
        var strippedProcedure = self.stripUrlPrefix(procedure, self.urlPrefix + 'procedure/');
        //@todo failing id lookup by category, also check strippedObservedPropertyToVizIdMap to see if  
        //it maps to an id
        
        var properlyDelimetedProcedure = self.strippedProcedureToTsvIdFragment(strippedProcedure);
        var timeSeriesVisualizationId = strippedObservedProperty + '/' + properlyDelimetedProcedure; 
        return timeSeriesVisualizationId;
    };
};

}());