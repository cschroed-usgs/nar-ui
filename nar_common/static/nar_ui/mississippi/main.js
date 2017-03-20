$(document).ready(function() {
	"use strict";
	
	var leftFiltersName = '.left_filter';
	var $leftFilters = $(leftFiltersName);
	var $leftLoad = $leftFilters.find('select[name="load"]');
	var $leftChemical = $leftFilters.find('select[name="chemical"]');
	var $leftYear = $leftFilters.find('select[name="year"]');
	
	var rightFiltersName = '.right_filter';
	var $rightFilters= $(rightFiltersName);
	var $rightLoad = $rightFilters.find('select[name="load"]');
	var $rightChemical = $rightFilters.find('select[name="chemical"]');
	var $rightYear = $rightFilters.find('select[name="year"]');
	
	var leftFiltersSubject = new nar.mississippi.FiltersSubject($leftLoad, $leftChemical, $leftYear);
	var rightFiltersSubject = new nar.mississippi.FiltersSubject($rightLoad, $rightChemical, $rightYear);
	
	// Default the selection menu
	$leftFilters.find('option[value="wy"]').prop('selected', true);
	$leftFilters.find('option[value="no3_no2"]').prop('selected', true);
	$leftFilters.find('option[value="1993_' + (CONFIG.currentWaterYear - 1) +'"]').prop('selected', true);
	
	$rightFilters.find('option[value="wy"]').prop('selected', true);
	$rightFilters.find('option[value="no3_no2"]').prop('selected', true);
	$rightFilters.find('option[value="' + CONFIG.currentWaterYear + '"]').prop('selected', true);
	
	//Call observers when filters change
	$leftFilters.find(':input').change(function() {
		leftFiltersSubject.notifyObservers();
	});
	$rightFilters.find(':input').change(function() {
		rightFiltersSubject.notifyObservers();
	});
	
	// Tie the right and left load filters together so that they always show the same selected option.
	$leftLoad.change(function() {
		$rightLoad.val($(this).val());
		rightFiltersSubject.notifyObservers();
	});
	$rightLoad.change(function() {
		$leftLoad.val($(this).val());
		leftFiltersSubject.notifyObservers();
	});
	
	// Updates contribution display with selections
	var updateContributionDisplay = function(containerSelector, placement, selections) {
		if (selections.parameter_type && 'may' !== selections.parameter_type && selections.constituent && selections.water_year) {
			nar.ContributionDisplay.create({
				containerSelector : containerSelector,
				placement : placement,
				parameters : selections
			});
		}
		else {
			nar.ContributionDisplay.remove(containerSelector);
		}
	};
	
	var updateLeftContributionDisplay = function(data) {
		updateContributionDisplay ('#left-pie-chart-container', 'bl', {
			parameter_type : data.load,
			constituent : data.chemical,
			water_year : data.year
		});
	};
	
	var updateRightContributionDisplay = function(data) {
		updateContributionDisplay('#right-pie-chart-container', 'br', {
			parameter_type : data.load,
			constituent : data.chemical,
			water_year : data.year
		});
	};
	
	updateLeftContributionDisplay (leftFiltersSubject.getFilterData());
	updateRightContributionDisplay(rightFiltersSubject.getFilterData());

	// Code which creates maps and controls
	var leftMapName = 'left-map',
		rightMapName = 'right-map',
		leftMap = nar.mississippi.map.createMap({
			div : document.getElementById(leftMapName)
		}),
		rightMap = nar.mississippi.map.createMap({
			div : document.getElementById(rightMapName)
		}),
		cqlFilter = {
				'CQL_FILTER' : "msloads = 'MSL'"
		},
		createMarblayer = function() {
			var layer = new OpenLayers.Layer.WMS(
					"MARB",
					CONFIG.endpoint.geoserver + 'NAR/wms',
					{
						layers : 'NAR:JD_NFSN_sites',
						transparent : true,
						styles: 'sites'
					}, {
						isBaseLayer : false,
						visibility : false,
						singleTile : true
					});
			layer.mergeNewParams(cqlFilter);
			return layer;
		},
		createFakeLayer = function() {
			return new OpenLayers.Layer.WMS("FAKE",
					CONFIG.endpoint.geoserver + 'NAR/wms', {
						layers : 'NAR:MS_ATCH_delta',
						transparent : true,
						styles : 'sites'
					}, {
						isBaseLayer : false,
						visibility : false
					});
		},
		createSiteIdentificationControl = function (args) {
			var layer = args.layer,
				popupAnchor = args.popupAnchor,
				width = args.width,
				graphContainer = args.graphContainer,
				filtersSubject = args.filtersSubject,
				virtualSite = args.virtualSite || false,//is it a virtual site or a physical site
				makeGraphClickHandler = function(type, feature, chemical){
					return function () {
						
						var filtersChangeHandler = function(filtersState){
							dialog.updateConstituent(filtersState.chemical);
						};
						filtersSubject.addObserver(filtersChangeHandler);
						var onClose = function(){
							filtersSubject.removeObserver(filtersChangeHandler);
						};
						var dialog = nar.GraphPopup.create({
							feature : feature,
							width : width,
							popupAnchor : graphContainer,
							type : type,
							constituent: chemical
						}).on('dialogclose', onClose);

					};
				},
				loadGraphLinkClass = 'load-graph-link',
				mayLoadGraphLinkClass = 'may-load-link',
				annualLoadGraphLinkClass = 'annual-load-link',
				control = new nar.SiteIdentificationControl({
					vendorParams : virtualSite ? undefined : cqlFilter,
					layers : [ layer ],
					popupAnchor : popupAnchor,
					popupWidth : width,
					updateConstituent: function(constituent, linkParent){
						var loadGraphLinks = linkParent.find('.' + loadGraphLinkClass);
						if(loadGraphLinks.length){
							
							loadGraphLinks.off('click');
							var mayGraphLinks = linkParent.find('.' + mayLoadGraphLinkClass);
							mayGraphLinks.each(function(index, link){
								link = $(link);
								var feature = link.data('feature');
								link.click(
									makeGraphClickHandler('may', feature, filtersSubject.getFilterData().chemical)
								);
							});
							var annualGraphLinks = linkParent.find('.' + annualLoadGraphLinkClass);
							annualGraphLinks.each(function(index, link){
								link = $(link);
								var feature = link.data('feature');
								link.click(
									makeGraphClickHandler('annual', feature, filtersSubject.getFilterData().chemical)
								);
							});
						}
					},
					createSiteDisplayWell : function(feature) {
						var $container = $('<div />').addClass('well well-sm text-center'),
							$titleRow = $('<div />').addClass('row site-identification-popup-content-title'),
							$reportsAndGraphsRow = $('<div />').addClass('row site-identification-popup-content-links-and-graphs'),
							$relevantLinksRow = $('<div />').addClass('row site-identification-popup-content-relevant-links'),
							$summaryGraphsLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-summary-graph-link'),
							$annualLoadGraphsLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 col-md-offset-2 site-identification-popup-content-annual-load-link'),
							$mayLoadGraphsLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-may-load-link'),
							$detailedGraphsLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-detailed-graph-link'),
							$downloadLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-download-link'),
							$annualLoadGraphsLink = $('<a />').addClass(loadGraphLinkClass).addClass(annualLoadGraphLinkClass),
							$mayLoadGraphsLink = $('<a />').addClass(loadGraphLinkClass).addClass(mayLoadGraphLinkClass),
							$summaryGraphsLink = $('<a />').append($('<span />').addClass('glyphicon glyphicon-th-list'),' Summary Graphs'),
							$detailedGraphsLink = $('<a />').append($('<span />').addClass('glyphicon glyphicon-stats'), ' Nutrient Graphs'),
							$downloadLink = $('<a />').append($('<span />').addClass('glyphicon glyphicon-save'),' Download Data'),
							$hiddenAutoFocus = $('<span />').addClass('hidden').attr('autofocus', ''),
							data = feature.data,
							title = virtualSite ? data.staname : data.qw_name,
							id = virtualSite ? 'GULF': data.qw_id,
							loadGraphData = {staname : title, siteId : id, isVirtual : virtualSite};
						$mayLoadGraphsLink.data('feature', loadGraphData);
						$mayLoadGraphsLink.append($('<span />').addClass('glyphicon glyphicon-stats'),' May Load');
						$annualLoadGraphsLink.data('feature', loadGraphData);
						$annualLoadGraphsLink.append($('<span />').addClass('glyphicon glyphicon-stats'),' Annual Load');
						
						$titleRow.html(title);
						
						$annualLoadGraphsLink.
							attr('href', '#').
							click('click', makeGraphClickHandler('annual', loadGraphData, filtersSubject.getFilterData().chemical));
						$mayLoadGraphsLink.
							attr('href', '#').
							on('click', makeGraphClickHandler('may', loadGraphData, filtersSubject.getFilterData().chemical));
						$summaryGraphsLink.attr('href', CONFIG.summarySiteUrl(id));
						$detailedGraphsLink.attr('href', CONFIG.detailSiteUrl(id));
						$downloadLink.attr({
							href: data.sb_web,
							target: '_blank'
						});
						
						$annualLoadGraphsLinkContainer.append($annualLoadGraphsLink);
						$mayLoadGraphsLinkContainer.append($mayLoadGraphsLink);
						$downloadLinkContainer.append($downloadLink);

						if (virtualSite) {
							$annualLoadGraphsLinkContainer.removeClass('col-md-offset-2');
							$reportsAndGraphsRow.append($annualLoadGraphsLinkContainer, $mayLoadGraphsLinkContainer, $downloadLinkContainer, $hiddenAutoFocus);
						}
						else {
							$summaryGraphsLinkContainer.append($summaryGraphsLink);
							$detailedGraphsLinkContainer.append($detailedGraphsLink);
							$reportsAndGraphsRow.append($summaryGraphsLinkContainer, $detailedGraphsLinkContainer, $downloadLinkContainer, $annualLoadGraphsLinkContainer, $mayLoadGraphsLinkContainer, $hiddenAutoFocus);
						}
						
						$container.append($titleRow);
						if(!virtualSite){
							var $stationIdRow = $('<div />').addClass('row site-identification-popup-content-station-id');
							$stationIdRow.html('Station ID: ' + id);
							$container.append($stationIdRow);
						}
						$container.append($reportsAndGraphsRow);
						this.$container = $container;
						return $container;
					}
				});
			
			return control;
		},
		leftMarbLayer = createMarblayer(),
		leftFakeLayer = createFakeLayer(),
		rightMarbLayer = createMarblayer(),
		rightFakeLayer = createFakeLayer(),
		rightSiteIdentificationControl,rightFakeSiteIdentificationControl,
		leftSiteIdentificationControl, leftFakeSiteIdentificationControl;	
		
	// Now that the layers have been created, add the identification
	// control for them
	rightSiteIdentificationControl = createSiteIdentificationControl({
		layer : rightMarbLayer,
		popupAnchor : '#' + rightMapName,
		width : rightMap.size.w,
		graphContainer : '#' + leftMapName,
		filtersSubject: rightFiltersSubject
	});
	
	leftSiteIdentificationControl = createSiteIdentificationControl({
		layer : leftMarbLayer,
		popupAnchor : '#' + leftMapName,
		width : leftMap.size.w,
		graphContainer : '#' + rightMapName,
		filtersSubject: leftFiltersSubject,
	});
	
	rightFakeSiteIdentificationControl = createSiteIdentificationControl({
		popupAnchor : '#' + rightMapName,
		layer : rightFakeLayer,
		width : rightMap.size.w,
		graphContainer : '#' + leftMapName,
		filtersSubject: rightFiltersSubject,
		virtualSite: true
	});
	
	leftFakeSiteIdentificationControl = createSiteIdentificationControl({
		popupAnchor :  '#' + leftMapName,
		layer : leftFakeLayer,
		width : leftMap.size.w,
		graphContainer : '#' + rightMapName,
		filtersSubject: leftFiltersSubject,
		virtualSite: true
	});
	
	// Create load layers and add observers to update the load layer and the contribution display	
	var leftLoadLayer = new nar.mississippi.LoadLayer();
	leftFiltersSubject.addObserver(function(filterData) {
		leftLoadLayer.updateLayer(filterData);
		// This assumes that the sld only varies with load type and that the left and right always have the same load type.
		$('#map-legend-container img').each(function() {
			$(this).attr('src', leftLoadLayer.getLegendGraphicUrl() + '&RULE=' + $(this).data('rule'));
		});
		updateLeftContributionDisplay(filterData);
	});
	
	var rightLoadLayer = new nar.mississippi.LoadLayer();
	rightFiltersSubject.addObserver(function(filterData) {
		rightLoadLayer.updateLayer(filterData);
		updateRightContributionDisplay(filterData);
	});
	
	// Initialize observers for the filter data
	leftFiltersSubject.notifyObservers();
	rightFiltersSubject.notifyObservers();
	
	leftLoadLayer.addToMap(leftMap);
	rightLoadLayer.addToMap(rightMap);
	
	rightMap.addControls([rightSiteIdentificationControl, rightFakeSiteIdentificationControl]);
	leftMap.addControls([leftSiteIdentificationControl, leftFakeSiteIdentificationControl]);
	
	// Add the site layers to the map
	leftMap.addLayers([leftMarbLayer,leftFakeLayer]);
	rightMap.addLayers([rightMarbLayer,rightFakeLayer]);
	
	// Initialize sites layer toggle to off.
	var $msInfo = $('#mississippi_info');
	var $toggle = $('#toggle');
	$msInfo.hide();
	$toggle.attr('title', 'Show');
	
	$toggle.click(function() {
		$msInfo.toggle('5000', function() {
			var on = $(this).is(':visible');
			leftMarbLayer.setVisibility(on);
			leftFakeLayer.setVisibility(on);
			rightMarbLayer.setVisibility(on);
			rightFakeLayer.setVisibility(on);
			if (on) {
				$toggle.attr('title', 'Hide');
			} else {
				$toggle.attr('title', 'Show');
			}
		});
	});
	
	// Add legend help
	$('#map-legend-container a').popover({
		trigger : "hover",
		container : '#auxillary-info'
	});
	
});