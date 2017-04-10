(function() {
	CONFIG.startWaterYear = 1993;
	CONFIG.siteIdAttribute = 'STAID',
	CONFIG.riverNameAttribute = 'River';
	
	var coastalRegionMap = nar.coastalRegion.map(CONFIG.endpoint.geoserver, CONFIG.region);
	var getBasinFeatureInfoPromise = coastalRegionMap.getBasinFeatureInfoPromise([CONFIG.siteIdAttribute, CONFIG.riverNameAttribute]);
	
	var dataTimeRange = new nar.timeSeries.TimeRange(
			nar.WaterYearUtils.getWaterYearStart(CONFIG.startWaterYear, true),
			nar.WaterYearUtils.getWaterYearEnd(CONFIG.currentWaterYear, true));

	$(document).ready(function() {
		"use strict";
		
		var map = coastalRegionMap.createRegionMap('region_coast_map', 'region_coast_ak_inset_map');
		
		/*
		 * @param {String} - feature for which data should be retrieved
		 * @param {Array} availability of data availability objects to be used to retrieve data
		 * @return TimeSeries.Collection containing a time series for each object in availability
		 */
		var getTimeSeriesCollection = function(forFeature, availability) {
			var result = new nar.timeSeries.Collection();
			
			var thisFeatureAvailability = availability.filter(function (value) {
				return value.featureOfInterest === forFeature;
			});
			
			thisFeatureAvailability.each(function(value) {
				var ts = new nar.timeSeries.TimeSeries({
					timeRange : dataTimeRange,
					observedProperty : value.observedProperty,
					procedure : value.procedure,
					featureOfInterest : value.featureOfInterest
				});
				result.add(ts);
			});
			return result;
		};

		// After basin info is retrieved, determine data availability, and then retrieve the
		// desired data
		getBasinFeatureInfoPromise.then(function(response) {
			// Need to do this to collapse basins that are using the same site id for the graphs.
			var basinFeatures = response.unique (function(obj) {
				return obj.attributes[CONFIG.siteIdAttribute];
			});
			var basinSiteIds = basinFeatures.map(function(value) {
				return value.attributes[CONFIG.siteIdAttribute];
			});
			var tickLabels = basinFeatures.map(function(value) {
				return value.attributes[CONFIG.riverNameAttribute].replace('River', '\nRiver');
			});
			
			// Make dataAvailability call for all sites for nitrate and nitrite
			var getDataAvailabilityDeferreds = basinSiteIds.map(function(basinSiteId){
				var getDataAvailabilityDeferred = nar.util.getDataAvailability(basinSiteId, 'NO3_NO2');
				
				//Add a siteId property to the request so that handlers can know which 
				//site a response is associated with.
				getDataAvailabilityDeferred.customData = {};
				getDataAvailabilityDeferred.customData.siteId = basinSiteId;
				return getDataAvailabilityDeferred;
			});

			$.when.apply(null, getDataAvailabilityDeferreds)
				.then(
					function() {
						
						var availability = Array.create(arguments).map(function(argument){
							var response = argument[0],
							request = argument[2],
							siteId = request.customData.siteId;
							var sosResponse = nar.util.translateToSosGetDataAvailability(response);
							sosResponse.each(function(singleAvailabilityEntry){
								singleAvailabilityEntry.featureOfInterest = siteId;
							});
							return sosResponse;
						}).flatten();
						
						var loadDataAvailability = availability.filter(function(value) {
							return (value.procedure.has('annual_mass') && !nar.util.stringContainsIgnoredModtype(value.procedure));
						});
						
						var yieldDataAvailability = availability.filter(function(value) {
							return (value.procedure.has('annual_yield') && !nar.util.stringContainsIgnoredModtype(value.procedure));
						});
						
						var loadTSCollections = [];
						var yieldTSCollections = [];
						// Create a time series collection for each basin
						basinSiteIds.forEach(function(id) {
							loadTSCollections.push(getTimeSeriesCollection(id, loadDataAvailability));
							yieldTSCollections.push(getTimeSeriesCollection(id, yieldDataAvailability));
						});
						
						// 
						var loadDataPromises = [];
						var yieldDataPromises = [];
						
						// Retrieve data for each time series collection
						loadTSCollections.forEach(function(tsCollection) {
							loadDataPromises = loadDataPromises.concat(tsCollection.retrieveData());
						});
						yieldTSCollections.forEach(function(tsCollection) {
							yieldDataPromises = yieldDataPromises.concat(tsCollection.retrieveData());
						});
						
						// Sort the data once received and plot.
						$.when.apply(null, loadDataPromises).then(function() {
							nar.plots.createCoastalBasinPlot({
								plotDivId : 'load_plot_div', 
								tsCollections : loadTSCollections, 
								tickLabels : tickLabels, 
								yaxisLabel : 'Tons', 
								title : 'Load',
								yaxisFormatter : function(format, value) {
									if (Object.isNumber(value)) {
										return value.toPrecision(3).toNumber() + '';
									}
									else {
										return value;
									}
								}
							});
						});
						
						$.when.apply(null, yieldDataPromises).then(function() {
							nar.plots.createCoastalBasinPlot({
									plotDivId : 'yield_plot_div', 
									tsCollections : yieldTSCollections, 
									tickLabels : tickLabels, 
									yaxisLabel : 'Tons per square mile', 
									title : 'Yield',
									yaxisFormatter : function(format, value) {
										if (Object.isNumber(value)) {
											return value.format(2);
										}
										else {
											return value;
										}
									}
							});
						});
					})
				.fail(
					function() {
						throw Error('Unable to contact the SOS server');
					}
				);
		});
	});
}());