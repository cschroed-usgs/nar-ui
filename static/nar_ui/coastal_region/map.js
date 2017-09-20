var nar = nar || {};
nar.coastalRegion = nar.coastalRegion || {};

nar.coastalRegion.map = function(geoserverEndpoint, region) {
	var me = {};
	
	var WMS_URL = geoserverEndpoint + 'NAR/wms';
	var WFS_URL = geoserverEndpoint + 'NAR/wfs';
		
	var REGION = {
			northeast : {
				inset : 'ne_inset', 
				streams : 'ne_streams', 
				sites_sld : CONFIG.site_slds.northeast,
				extent : new OpenLayers.Bounds(-79.2, 37.2,  -70.5, 44.5).transform(nar.commons.map.geographicProjection, nar.commons.map.projection),
				resolution : 2300
			},
			southeast : {
				inset : 'se_inset', 
				streams : 'se_streams', 
				sites_sld : CONFIG.site_slds.southeast,
				extent : new OpenLayers.Bounds(-84.0, 32.0, -78.0, 36.0).transform(nar.commons.map.geographicProjection, nar.commons.map.projection),
				resolution: 1600
			},
			gulf : {
				inset : 'gulf_inset', 
				streams : 'gulf_streams', 
				sites_sld : CONFIG.site_slds.gulf,
				resolution: 7400,
				extent : new OpenLayers.Bounds(-114.0, 24.5, -78.0, 50.5).transform(nar.commons.map.geographicProjection, nar.commons.map.projection),
			},
			west : {
				inset : 'west_inset', 
				streams : 'west_streams',
				sites_sld : CONFIG.site_slds.west,
				extent : new OpenLayers.Bounds(-136.0, 26.0, -104.0, 54.5).transform(nar.commons.map.geographicProjection, nar.commons.map.projection),
				resolution: 6300
			},
			alaska : {
				inset : 'westAKonly_inset', 
				streams : 'westAKonly_streams', 
				sites_sld : CONFIG.site_slds.alaska,
				extent : new OpenLayers.Bounds(-177.0, 54.0, -134.0, 71.0).transform(nar.commons.map.geographicProjection, nar.commons.map.projection),
				resolution: 9000
			}
	};
	var NAR_NS = 'NAR:';
	
	var getFeatureBoundingBox = $.Deferred();
	
	var createStatesBaseLayer = function() {
		return new OpenLayers.Layer.WMS(
				"United States",
				WMS_URL,
				{
					layers : NAR_NS + 'statesl48_alb',
					transparent : true,
					styles : 'ms_grey_outline'
				},
				{
					isBaseLayer : true
				}
		);
	};
	
	var createAlaskaOutlineLayer = function() {
		return new OpenLayers.Layer.WMS(
				"Alaska",
				WMS_URL,
				{
					layers : NAR_NS + 'ak_alb',
					transparent : true,
					styles : 'ms_grey_outline'
				},
				{
					isBaseLayer : false
				}
		);
	};
	
	var createSitesLayer = function(sld) {
		return new OpenLayers.Layer.WMS(
			"Sites",
			WMS_URL,
			{
				layers : [NAR_NS + 'JD_NFSN_sites'],
				transparent : true,
				version: '1.1.1',
				'SLD_BODY' : sld,
				'CQL_FILTER' : "site_type = 'Coastal Rivers' AND coast_repo = '" + region + "'"
			}, {
				isBaseLayer : false,
				singleTile : true,
				tileOptions: {
					// http://www.faqs.org/rfcs/rfc2616.html
					// This will cause any request larger than this many characters to be a POST
					maxGetUrlLength: 1024
				}
			}
		);
	};
	
	var createBasinLayers = function() {
		return [
	        new OpenLayers.Layer.WMS(
	        		region + ' Basin',
					WMS_URL,
					{
						layers: NAR_NS + REGION[region].inset,
						transparent: true,
						styles : 'coastal_basins'
					},
					{
						isBaseLayer : false,
						singleTile : true
					}
	        ),
	        new OpenLayers.Layer.WMS(
	        		region + ' Streams',
					WMS_URL,
					{
						layers: NAR_NS + REGION[region].streams,
						transparent: true,
						styles : 'streams'
					},
					{
						isBaseLayer : false,
						singleTile : true
					}
	        )
	        ];
	};
	
	var createAlaskaBasinLayers = function() {
		return [
		        new OpenLayers.Layer.WMS(
		        		'Alaska Basin',
						WMS_URL,
						{
							layers: NAR_NS + REGION.alaska.inset,
							transparent: true,
							styles : 'coastal_basins'
						},
						{
							isBaseLayer : false,
							singleTile : true
						}
		        		
		        ),
		        new OpenLayers.Layer.WMS(
		        		region + ' Basin',
						WMS_URL,
						{
							layers: NAR_NS + REGION.alaska.streams,
							transparent: true,
							styles : 'streams'
						},
						{
							isBaseLayer : false,
							singleTile : true
						}
				)
		        ];
	};
		
	var createDefaultMapOptions = function() {
		return {
			projection : nar.commons.map.projection,
			theme : nar.commons.map.theme,
			restrictedExtent : REGION[region].extent,
			maxExtent : REGION[region].extent,
			maxResolution: REGION[region].resolution,
			controls : [],
			layers : [createStatesBaseLayer()].concat(createBasinLayers())
		};
	};
	
	var createDefaultAlaskaMapOptions = function() {
		return {
			projection : nar.commons.map.projection,
			theme : nar.commons.map.theme,
			restrictedExtent : REGION.alaska.extent,
			maxExtent : REGION.alaska.extent,
			controls : [],
			layers : [createStatesBaseLayer()].concat([createAlaskaOutlineLayer()]).concat(createAlaskaBasinLayers())
		};
	};
	
	me.createRegionMap = function(mapDiv, akInsetMapDiv) {
		// Retrieve sld
		var map = new OpenLayers.Map(mapDiv, createDefaultMapOptions());
		$.ajax({
			url : REGION[region].sites_sld,
			type : 'GET',
			dataType : 'text',
			success : function(data) {
				var sitesLayer = createSitesLayer(data);
				map.addLayer(sitesLayer);
				map.addControl(new nar.SiteIdentificationControl({
					layers : [sitesLayer],
					popupAnchor : '#' + mapDiv,
					popupWidth : '400',
					vendorParams : {
						buffer : 8,
						'CQL_FILTER' : "site_type = 'Coastal Rivers' AND coast_repo = '" + region + "'"
					}
				}));
			}
		});
		var akMap;
		if (region === 'west') {
			$('#' + akInsetMapDiv).parent().show();
			akMap = new OpenLayers.Map(akInsetMapDiv, createDefaultAlaskaMapOptions());
			$.ajax({
				url : REGION.alaska.sites_sld,
				type : 'GET',
				dataType : 'text',
				success : function(data) {
					var sitesLayer = createSitesLayer(data);
					akMap.addLayer(sitesLayer);
					akMap.addControl(new nar.SiteIdentificationControl({
						layers : [sitesLayer],
						popupAnchor : '#' + mapDiv,
						popupWidth : '400',
						vendorParams : {
							buffer : 8,
							'CQL_FILTER' : "site_type = 'Coastal Rivers' AND coast_repo = '" + region + "'"
						}
					}));
				}
			});
			
			akMap.zoomToExtent(REGION.alaska.extent);
		}
		else { // Make sure inset map is not visible
			$('#' + akInsetMapDiv).parent().hide();
		}
		map.zoomToExtent(REGION[region].extent);
			
		return map;
	};
	
	/*
	 * @param {Array of String} properties - name of properties to retrieve. If not specified will retrieve all properties
	 * @return promise which when successful resolved returns the list of features.
	 */
	me.getBasinFeatureInfoPromise = function(properties) {
		var regionDeferred = $.Deferred();
		var alaskaDeferred = $.Deferred();
		
		var deferred = $.Deferred();
		
		if (!properties) {
			properties = [];
		}
		
		$.ajax({
			url: WFS_URL,
			method: 'GET',
			data : {
				service: 'wfs',
				version: '1.1.0',
				dataType: 'text',
				request: 'GetFeature',
				typeNames : NAR_NS + REGION[region].inset,
				propertyName : properties.join(',')
			},
			success : function(response) {
				var gmlReader = new OpenLayers.Format.GML.v3();
				regionDeferred.resolve(gmlReader.read(response));
			},
			error : function () {
				regionDeferred.reject();
			}
		});
		
		if (region === 'west') {
			alaskaDeferred = $.Deferred();
			$.ajax({
				url: WFS_URL,
				method: 'GET',
				data : {
					service: 'wfs',
					version: '1.1.0',
					dataType: 'text',
					request: 'GetFeature',
					typeNames : NAR_NS + REGION.alaska.inset,
					propertyName : properties.join(',')
				},
				success : function(response) {
					var gmlReader = new OpenLayers.Format.GML.v3();
					alaskaDeferred.resolve(gmlReader.read(response));
				},
				error : function () {
					alaskaDeferred.reject();
				}
			});
		}
		else {
			alaskaDeferred.resolve([]);
		}
		
		$.when(regionDeferred, alaskaDeferred).then(function(f1, f2) {
			deferred.resolve(f1.concat(f2));
		}).fail(function() {
			deferred.reject();
		});
		
		return deferred;
	};
	
	return me;
};
