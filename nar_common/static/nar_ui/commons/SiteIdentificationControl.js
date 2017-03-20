var nar = nar || {};
nar.SiteIdentificationControl = OpenLayers.Class(OpenLayers.Control.WMSGetFeatureInfo, {
	title : 'site-identify-on-hover-control',
	popupAnchor : null,
	hover : true,
	layers : [ ],
	queryVisible : true,
	output : 'object',
	drillDown : false,
	infoFormat : 'application/vnd.ogc.gml',
	popupWidth : null,
	vendorParams : {
		buffer : 8
	},
	handlerOptions : {
		hover : {
			delay: 500
		}
	},
	autoActivate : true,
	initialize: function (options) {
		"use strict";
		options = options || {};
		options.handlerOptions = options.handlerOptions || {};

		OpenLayers.Control.WMSGetFeatureInfo.prototype.initialize.apply(this, [options]);
		this.siteIdentificationPopupContainerId = 'site-identification-popup-content-container';
		this.events.register("getfeatureinfo", this, this.onHoverIdentificationHandler);
	},
	
	onHoverIdentificationHandler: function (response) {
		"use strict";
		
		var features = response.features,
	    	$featureDescriptionHTML = $('<div />').addClass('container-fluid').attr('id', this.siteIdentificationPopupContainerId),
	    	feature,
	    	popup,
	    	popupPixel,
	    	mapWidth = this.map.size.w,
	    	mapHeight = this.map.size.h,
	    	popupWidth,
	    	popupHeight,
	    	popupTop,
	    	popupLeft,
	    	newLeft,
	    	newTop,
	    	newPx,
	    	newLonLat,
	    	$popupDiv,
	    	createSiteDisplayWell = this.createSiteDisplayWell || function (feature) {
				var $container = $('<div />').addClass('well well-sm text-center'),
					$titleRow = $('<div />').addClass('row site-identification-popup-content-title'),
					$stationIdRow = $('<div />').addClass('row site-identification-popup-content-station-id'),
					$reportsAndGraphsRow = $('<div />').addClass('row site-identification-popup-content-links-and-graphs'),
					$summaryGraphsLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-summary-graph-link'),
					$detailedGraphsLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-detailed-graph-link'),
					$detailedPesticideGraphsLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-detailed-pesticides-graph-link'),
					$downloadLinkContainer = $('<div />').addClass('col-xs-6 col-md-4 site-identification-popup-content-download-link'),
					$summaryGraphsLink = $('<a />').append($('<span />').addClass('glyphicon glyphicon-th-list'),' Summary Graphs'),
					$detailedGraphsLink = $('<a />').append($('<span />').addClass('glyphicon glyphicon-stats'), ' Nutrient and Sediment Graphs'),
					$downloadLink = $('<a />').append($('<span />').addClass('glyphicon glyphicon-save'),' Download Data'),
					$detailedPesticdeGraphsLink = $('<a />').append($('<span />').addClass('glyphicon glyphicon-stats'), ' Pesticide Graphs'),
					// query-ui has a hierarchy of things it tries to auto-focus on. This hack has it auto-focus on a hidden span.
					// Otherwise it trues to focus on the first link, which in some browsers will draw an outline around it. (ugly)
					// http://api.jqueryui.com/dialog/
					$hiddenAutoFocus = $('<span />').addClass('hidden').attr('autofocus', ''),
					data = feature.data,
					title = data.qw_name,
					downloadURL = feature.data.sb_web,
					id = data.staid || data.qw_id;
				
				$titleRow.html(title);
				$stationIdRow.html('Station ID: ' + id);
				
				$summaryGraphsLink.attr('href', CONFIG.summarySiteUrl(id));
				$detailedGraphsLink.attr('href', CONFIG.detailSiteUrl(id));
				$downloadLink.attr({
					href: downloadURL,
					target: '_blank'
				});
				$detailedPesticdeGraphsLink.attr('href', CONFIG.detailPesticideSiteUrl(id));
				
				$summaryGraphsLinkContainer.append($summaryGraphsLink);
				$detailedGraphsLinkContainer.append($detailedGraphsLink);
				$downloadLinkContainer.append($downloadLink);
				//checks to see if its a reference site and if it is, does not put the pesticide button in pop up
				if(data.site_type !== 'Reference'){
					$detailedPesticideGraphsLinkContainer.append($detailedPesticdeGraphsLink);
				}
				
				$reportsAndGraphsRow.append($summaryGraphsLinkContainer, $detailedGraphsLinkContainer, $downloadLinkContainer, $detailedPesticideGraphsLinkContainer, $hiddenAutoFocus);
				
				$container.append($titleRow, $stationIdRow, $reportsAndGraphsRow);
				return $container;
			};

    	// Only care about this if user hovered over an actual feature
    	if (features.length > 0) {
    		// If more than one feature, create a list. Otherwise, just create a single div
	    	for (var fInd = 0;fInd < features.length;fInd++) {
	    		feature = features[fInd];
	    		var displayWell = createSiteDisplayWell.call(this, feature);
	    		$featureDescriptionHTML.append(displayWell);
	    	}
	    
	    	return nar.sitePopup.createPopup({
	    		content : $featureDescriptionHTML,
	    		width : this.popupWidth || this.map.size.w / 1.5,
	    		title : '',
	    		popupAnchor : this.popupAnchor,
	    		onOpen : function (evt, ui) {
	    			// The container may have more than one item in it. If so, 
	    			// resize to the height of the first well (+ padding) 
	    			var $container = $(this),
	    				wellPaddingHeight = 5;
	    			
    				$container.dialog().height($container.find('.well').first().outerHeight(true) + wellPaddingHeight);
    				
    				// Reattach a handler to the checbox filter list to remove the dialog 
    				$('form').children('input').off('change', nar.sitePopup.destroyDialog);
    				$('form').children('input').on('change', nar.sitePopup.destroyDialog);
    				
    				// Reattach a handler to the 
    				$('button.site_view').off('click', nar.sitePopup.destroyDialog);
    				$('button.site_view').on('click', nar.sitePopup.destroyDialog);
	    		}
	    	});
    	}
	},
	CLASS_NAME: "OpenLayers.Control.WMSGetFeatureInfo"
});