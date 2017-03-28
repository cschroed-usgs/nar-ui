//@requires nar.fullReport.Tree, nar.timeSeries.VisualizationRegistry, nar.timeSeries.Visualization
$(document).ready(function() {
	var siteId = PARAMS.siteId;
	var selectorElementPair = function(selector) {
		var jqElt = $(selector);
		nar.util.assert_selector_present(jqElt);
		return {
			selector : selector,
			element : jqElt
		};
	};

	// dom setup
	var selectorElementPairs = {
		instructions : selectorElementPair('#instructions'),
		allPlotsWrapper : selectorElementPair('#plotsWrapper'),
		timeSlider : selectorElementPair('#timeSlider'),
		graphToggle : selectorElementPair('#plotToggleTree')
	};
	var tsvRegistry = new nar.pestTimeSeries.VisualizationRegistry();
	nar.pestTimeSeries.VisualizationRegistryInstance = tsvRegistry;
	
	var getDataAvailabilityRequest = nar.util.getDataAvailability(siteId);
	
	
	var LAST_WATER_YEAR_RANGE = Date.range(nar.WaterYearUtils.getWaterYearStart(CONFIG.currentWaterYear), nar.WaterYearUtils.getWaterYearEnd(CONFIG.currentWaterYear));

	var successfulGetDataAvailability = function(data,
			textStatus, jqXHR) {
		//exclude pesticides
		var dataAvailability = data.filter(function(datumAvailability){
			return datumAvailability.constituentCategorization && datumAvailability.constituentCategorization.category && 'PESTICIDE' === datumAvailability.constituentCategorization.category;
		});
		//populate the tsvRegistry with tsvs created from the GetDataAvailability response 
		dataAvailability.each(function(dataAvailability) {
					var timeSeriesViz = new nar.pestTimeSeries.Visualization(
								{
									allPlotsWrapperElt : selectorElementPairs.allPlotsWrapper.element,
									timeSeriesCollection : new nar.timeSeries.Collection(),
									metadata: dataAvailability,
									plotter : nar.util.Unimplemented
								});
					tsvRegistry.register(timeSeriesViz);
					var timeSeries = new nar.pestTimeSeries.TimeSeries(
						{
							metadata: dataAvailability,
							site: PARAMS.siteId
						});
					timeSeriesViz.timeSeriesCollection
							.add(timeSeries);
		});
		
		var allTimeSeriesVizualizations = tsvRegistry.getAll();
		var timeSlider = nar.timeSeries.TimeSlider(selectorElementPairs.timeSlider.element);
		var tsvController = new nar.timeSeries.VisualizationController(
				timeSlider, selectorElementPairs.instructions.element);

		var tree = new nar.pesticideReport.Tree(
				allTimeSeriesVizualizations, tsvController,
				selectorElementPairs.graphToggle.element);
	};
	var failedGetDataAvailability = function(data, textStatus,
			jqXHR) {
		var msg = 'Could not determine data availability for this site';
		// Errors are caught by window and alert is displayed
		throw Error(msg);
	};

	// Wait for definitions and site_info to load.
	$.when(nar.definitionsPromise, nar.siteHelpInfoPromise).always(function(){
		// Create links
		var addLink = function(el, link) {
			if (link) {
				el.attr('href', link);
			}
			else {
				el.parent().hide();
			}
		};
		
		var addHelpPopover = function(id, additionalContent) {
			var $link = $('#' + id);
			
			additionalContent = additionalContent || '';
			$link.find('a').popover({
				content : nar.definitions[id].short_definition + additionalContent,
				trigger : 'hover',
				container : '.summary_info'
			});
		};
		
		addLink($('#realtime_link'), nar.siteHelpInfo.realtime_streamflow_link);
		addLink($('#nwisweb_link'), nar.siteHelpInfo.nwisweb_link);
		addLink($('#daily_flows_link'), nar.siteHelpInfo.flow_compared_to_historic_link);
		
		// Add help popovers
		addHelpPopover('sampleConcentrations', '. Open circle symbols in the graphs are samples with concentrations less than the laboratory reporting level.');
		addHelpPopover('annualFlowNormalizedConcentrations');
		addHelpPopover('annualLoad');
		
		$.when(getDataAvailabilityRequest).then(
			successfulGetDataAvailability,
			failedGetDataAvailability);
		selectorElementPairs.allPlotsWrapper.element.sortable();
		selectorElementPairs.allPlotsWrapper.element.disableSelection();
	});
});