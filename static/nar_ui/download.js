var nar = nar || {};
nar.downloads = (function() {
	"use strict";
	var pubMembers = {};
	
	var NUMBER_OF_YEARS_BACK = 100;
	var SITE_LAYER_NAME = "NAR:JD_NFSN_sites";
	var STATION_ID_PROPERTY = "qw_id";
	var STATION_NAME_PROPERTY = "qw_name";
	var SITE_TYPE_PROPERTY = "site_type";
	var STATE_PROPERTY = "state";
	var MRB_VALUE = "Mississippi River Basin";
	var MS_SITE_ATTR_NAME = 'mssite';
	var MS_SITE_VALUE = 'MS';
	var STATE_LIST = {
		"AL": "Alabama",
		"AK": "Alaska",
		"AS": "American Samoa",
		"AZ": "Arizona",
		"AR": "Arkansas",
		"CA": "California",
		"CO": "Colorado",
		"CT": "Connecticut",
		"DE": "Delaware",
		"DC": "District Of Columbia",
		"FM": "Federated States Of Micronesia",
		"FL": "Florida",
		"GA": "Georgia",
		"GU": "Guam",
		"HI": "Hawaii",
		"ID": "Idaho",
		"IL": "Illinois",
		"IN": "Indiana",
		"IA": "Iowa",
		"KS": "Kansas",
		"KY": "Kentucky",
		"LA": "Louisiana",
		"ME": "Maine",
		"MH": "Marshall Islands",
		"MD": "Maryland",
		"MA": "Massachusetts",
		"MI": "Michigan",
		"MN": "Minnesota",
		"MS": "Mississippi",
		"MO": "Missouri",
		"MT": "Montana",
		"NE": "Nebraska",
		"NV": "Nevada",
		"NH": "New Hampshire",
		"NJ": "New Jersey",
		"NM": "New Mexico",
		"NY": "New York",
		"NC": "North Carolina",
		"ND": "North Dakota",
		"MP": "Northern Mariana Islands",
		"OH": "Ohio",
		"OK": "Oklahoma",
		"OR": "Oregon",
		"PW": "Palau",
		"PA": "Pennsylvania",
		"PR": "Puerto Rico",
		"RI": "Rhode Island",
		"SC": "South Carolina",
		"SD": "South Dakota",
		"TN": "Tennessee",
		"TX": "Texas",
		"UT": "Utah",
		"VT": "Vermont",
		"VI": "Virgin Islands",
		"VA": "Virginia",
		"WA": "Washington",
		"WV": "West Virginia",
		"WI": "Wisconsin",
		"WY": "Wyoming"
	};
	
	pubMembers.updateSelect2Options = function(select2El, values, placeHolderText, displayKey, triggerChange, sortKeys) {
		var previousValues = select2El.select2('val');
		select2El.find('option') .remove();
		if (!select2El.prop('multiple')) {
			select2El.append('<option></option>');
		}
		
		// Need to do this so that the pick list can be sorted by the keys when desired. Specifically
		// TODO: consider sending in values as an array of objects with id and text properties.
		var keys = Object.keys(values);
		if (sortKeys) {
			keys.sort();
		}
		
		for(var i = 0; i < keys.length; i++) {
			var val = keys[i];
			var opt = $('<option>');
			
			opt.attr('value', val);
			if(displayKey) {
				opt.html(val + " - " + values[val]);
			} else {
				opt.html(values[val]);
			}
			select2El.append(opt);
		}
		select2El.select2('destroy');
		select2El.select2({
			placeholder: placeHolderText,
			allowClear: true
		});
		if (triggerChange) {
			select2El.select2('val', previousValues).trigger("change");
		}
	};
	
	pubMembers.getFilteredStates = function(stationData) {
		var i;
		var addList = [];
		var thisState;
		
		for (i = 0; i < stationData.features.length; i++) {
			thisState = stationData.features[i].properties.state;
			if (Object.has(STATE_LIST, thisState) && (addList.indexOf(thisState) === -1)) {
				addList.push(thisState);
			}
		}
				
		return Object.select(STATE_LIST, addList);
	};
	
	pubMembers.getFilteredSiteTypeOptions = function(stationData, selectedStates){
		//loop through features collecting  site types
		var siteTypes = {};
		
		var mrbIncluded = false;
		for(var i = 0; i < stationData.features.length; i++) {
			var props = stationData.features[i].properties;
			//only add to values object if property hasn't already been added
			if(!selectedStates || selectedStates.length <= 0 || selectedStates.some(props[STATE_PROPERTY])) { 
				if(!siteTypes[props[SITE_TYPE_PROPERTY]]){ //only add station if it is flagged as MS
					siteTypes[props[SITE_TYPE_PROPERTY]] = props[SITE_TYPE_PROPERTY];
				}
				
				if(props[MS_SITE_ATTR_NAME] === MS_SITE_VALUE) {
					mrbIncluded = true;
				}
			}
		}
		
		//Add in MRB, a special case not part of the database
		if(!selectedStates || selectedStates.length <= 0 || mrbIncluded) {
			siteTypes[MRB_VALUE] = MRB_VALUE;
		}
		
		return siteTypes;
	};
	
	pubMembers.getFilteredStationIdsOptions = function(stationData, selectedStates, selectedSiteTypes) {
		//loop through features collecting stations
		var stations = {};
		
		var mrbSelected = false; //used to detect if we have to filter down to Mississipi sites
		if(selectedSiteTypes && selectedSiteTypes.some(MRB_VALUE)) {
			mrbSelected = true;
			selectedSiteTypes.remove(MRB_VALUE); //remove so stations are not expected to have type MRB, which doesn't exist as a real site type
		}
		for(var i = 0; i < stationData.features.length; i++) {
			var props = stationData.features[i].properties;
			if(!stations[props[STATION_ID_PROPERTY]] //only add to values object if property hasn't already been added
				&& (!selectedStates || selectedStates.length <= 0 || selectedStates.some(props[STATE_PROPERTY])) //only add if has state prop in state list (if state list exists)
				&& (!selectedSiteTypes || selectedSiteTypes.length <= 0 || selectedSiteTypes.some(props[SITE_TYPE_PROPERTY])) //only add if site type prop in site type list (if site type list exists)
				) {
				if(mrbSelected) {
					//only add station if it is flagged as MS
					if(props[MS_SITE_ATTR_NAME] === MS_SITE_VALUE) {
						stations[props[STATION_ID_PROPERTY]] = props[STATION_NAME_PROPERTY];
					}
				} else {
					stations[props[STATION_ID_PROPERTY]] = props[STATION_NAME_PROPERTY];
				}
			}
		}
		
		return stations;
	};
	
	// Utility function to enable/disable elements
	pubMembers.toggleElement = function($el, enable) {
		if (enable) {
			$el.removeAttr('disabled');
		} else {
			$el.attr('disabled', 'disabled');
		}
	};
	
	pubMembers.toggleDownloadButton = function(){
		pubMembers.toggleElement($('#download-button'), $('input[name="dataType"]').is(':checked'));
	};
	
	pubMembers.toggleWaterQuality = function() {
		var on = $('#waterQuality').is(':checked');
		var $constituent = $('#constituent');
		var $qwDataType = $('#qwDataType');
		
		pubMembers.toggleElement($constituent, on);
		pubMembers.toggleElement($qwDataType, on);
		if (!on) {
			$constituent.select2('val', []);
			$qwDataType.select2('val', []);
		}
	};
	
	pubMembers.toggleStreamFlow = function() {
		var on = $('#streamFlow').is(':checked');
		var $streamFlow = $('#streamFlowType');
		
		pubMembers.toggleElement($streamFlow, on);
		if (!on) {
			$streamFlow.select2('val', []);
		}
	};
	
	pubMembers.filterSiteTypesByState = function(stationData, selectedStates) {
		pubMembers.updateSelect2Options(
				$("#siteType"), 
				pubMembers.getFilteredSiteTypeOptions(stationData, selectedStates), 
				"Select a Site Type (optional)",
				false
				);
	};
	
	pubMembers.filterStationsByStateAndType = function(stationData, selectedStates, selectedSiteTypes) {
		pubMembers.updateSelect2Options(
				$("#stationId"), 
				pubMembers.getFilteredStationIdsOptions(stationData, selectedStates, selectedSiteTypes), 
				"Select a Station (optional)",
				true,
				false,
				true
				);
	};
	
	pubMembers.loadAndRenderSiteFilters = function() {
		var STATION_DATA;
		$.ajax({
			url: CONFIG.endpoint.geoserver +
			"ows?service=WFS&version=1.0.0&request=GetFeature&typeName=" + SITE_LAYER_NAME + 
			"&outputFormat=json",
			async: false,
			dataType: "json",
			success: function(data) {
				STATION_DATA = data; //save to singleton
				// Filter states to show only those in the data
				//get initial drop down of states to render
				pubMembers.updateSelect2Options($("#state"), pubMembers.getFilteredStates(STATION_DATA), "Select a State (optional)", true);

				var selectedStates = $("#state").select2('val');
				var selectedSiteTypes = $("#siteType").select2('val');
				pubMembers.filterSiteTypesByState(STATION_DATA, selectedStates);
				pubMembers.filterStationsByStateAndType(STATION_DATA, selectedStates, $("#siteType").select2('val'));
				
				//wire filters
				$("#state").on('change', function() {
					var selectedStates = $("#state").select2('val');
					pubMembers.filterSiteTypesByState(STATION_DATA, selectedStates);
					pubMembers.filterStationsByStateAndType(STATION_DATA, selectedStates, $("#siteType").select2('val'));
				});
				$("#siteType").on('change', function() {
					pubMembers.filterStationsByStateAndType(STATION_DATA, $("#state").select2('val'), $("#siteType").select2('val'));
				});
			},
			context: this
		});
	};
	
	pubMembers.initDownloadPage = function() {
		// Create water year lists and initialize select2s. Using the query parameter of select2
		// to limit the selections so that start water year can not exceed end water year and
		// end water year can not be less that start water year.
		var yearLimits = {
			minYear : 1980,
			maxYear: CONFIG.currentWaterYear
		};
		var DEFAULT_START_YEAR = 1993;
		var defaultStartDate = {};
		
		var START_YEARS_LIST = [];
		var END_YEARS_LIST = [];
		var i;
		for (i = yearLimits.minYear; i <= yearLimits.maxYear; i++) {
			START_YEARS_LIST.push({
				id : '10/01/' + (i - 1),
				text : i + ''
			});
			if (i === DEFAULT_START_YEAR) {
				defaultStartDate = START_YEARS_LIST.last();
			}
			END_YEARS_LIST.push({
				id : '09/30/' + i,
				text : i + ''
			});
			
		}
		
		$('#startDateTime').select2({
			data : START_YEARS_LIST,
			width: 'copy',
			query : function(options) {
				var endDate = parseInt($('#endDateTime').select2('data').text);
				var results = [];
						
				var thisValue;
				var i = 0;
				do {
					thisValue = START_YEARS_LIST[i].text;
					if (!(options.term) || thisValue.has(options.term)) {
						results.push(START_YEARS_LIST[i]);
					}
					i = i + 1;
				}
				while (parseInt(thisValue) < endDate);
				
				options.callback ({
					results : results
				});
			}			
		});
		$('#startDateTime').select2('data', defaultStartDate);
		
		$('#endDateTime').select2({
			data : END_YEARS_LIST,
			width: 'copy',
			query : function(options) {
				var startDate = parseInt($('#startDateTime').select2('data').text);;
				var results = [];
						
				var thisValue;
				var i;
				var beginIndex = END_YEARS_LIST.findIndex(function(n) {
					return parseInt(n.text) === startDate;
				});
				for (i = beginIndex; i < END_YEARS_LIST.length; i++){
					thisValue = END_YEARS_LIST[i].text;
					if (!(options.term) || thisValue.has(options.term)) {
						results.push(END_YEARS_LIST[i]);
					}
				}
				
				return options.callback ({
					results : results
				});
			}			
		});
		$('#endDateTime').select2('data', END_YEARS_LIST.last());
		 
		//populate html, then init select 2
		pubMembers.updateSelect2Options($("#state"), STATE_LIST, "Select a State (optional)", true);
		
		//will hold a one time fetch of all station data
		pubMembers.loadAndRenderSiteFilters();
	
		$("#constituent").select2({
			placeholder: "Select a Constituent (optional)",
			allowClear: true
		});
	
		$("#qwDataType").select2({
			placeholder: "Select a Water Quality Data Type (optional)",
			allowClear: true
		});
	
		$('#streamFlowType').select2({
			placeholder : 'Select a Stream Flow Time Series',
			allowClear : true
		});
	
		$('input[name="dataType"]').on('click', pubMembers.toggleDownloadButton);
		pubMembers.toggleDownloadButton();
		
		$('#waterQuality').on('click', pubMembers.toggleWaterQuality);
		pubMembers.toggleWaterQuality();
		
		$('#streamFlow').on('click', pubMembers.toggleStreamFlow);	
		pubMembers.toggleStreamFlow();
		
		$('#clear-filters-button').on('click', function () {
			$('.select2-container').select2('val','');
			$('input[type="checkbox"]').prop('checked', false);
			$('.hasDatepicker').val('');
			$('.hasDatepicker').datepicker('option', defaultDateLimits);
			pubMembers.toggleDownloadButton();
			pubMembers.toggleWaterQuality();
			pubMembers.toggleStreamFlow();
		});
			
		$('#download-button').on('click', function (event) {
			event.preventDefault();
			var url = CONFIG.endpoint.nar_webservice + "download/bundle/zip?" + $('#downloadForm').serialize();
			window.open(url, 'Download');
		});
	};
	
	return pubMembers;
}());
