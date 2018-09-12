var nar = nar || {};
nar.coastal = nar.coastal || {};

nar.coastal.map = (function() {
	"use strict";
	
	var GEOSERVER_URL = CONFIG.endpoint.geoserver + 'NAR/wms';
	var me = {};
	var alaskaSitesLayer;
	var coastalMapId = 'coastal_map';
	
	// This is used to build the CONUS layers as well as identifying
	// the layers to highlight. Mostly copied from coastal_region map.
	me.REGION_LAYER = {
			northeast : {inset : 'ne_inset'},
			southeast : {inset : 'se_inset'},
			gulf : {inset : 'gulf_inset'},
			west : {inset : 'west_inset'},
			alaska : {inset : 'westAKonly_inset'}
	};
	me.NAR_NS = 'NAR:';
	
	// I memoize the maps created from the create* calls exposed by this object.
	// At least the conus map is used to perform highlighting
	me.us48Map = undefined;
	me.alaskaMap = undefined;
	
	me.mapUS48Extent = new OpenLayers.Bounds(-136.5, 20.7, -66.4, 53.2).transform(nar.commons.map.geographicProjection, nar.commons.map.projection);
	me.mapUS48Center = me.mapUS48Extent.getCenterLonLat();
	
	me.alaskaExtent = new OpenLayers.Bounds(-175.0, 55.0, -135.0, 71.0).transform(nar.commons.map.geographicProjection, nar.commons.map.projection);
	me.alaskaCenter = me.alaskaExtent.getCenterLonLat();
	
	// Create a layer in a highlighted color and add it to the map, covering the basin
	// it's supposed to be highlighting
	me.addHighlightedBasin = function (insetNames) {
		if (insetNames && insetNames.length) {
			insetNames.forEach(function (insetName) {
				[me.us48Map, me.alaskaMap].forEach(function (map) {
					var basinLayers = map.getLayersByName(insetName),
						highlightedBasinLayers = map.getLayersByName(insetName + '_hl'),
						highlightedLayer;
				
					// I only want to highlight if the basin layer I am trying to highlight:
					// - exists
					// - is not currently loading (I don't want to highlight blank space)
					// - no highlighted layer already exists for this basin
					if (basinLayers.length && !highlightedBasinLayers.length) {
						highlightedLayer = basinLayers[0].clone();
						highlightedLayer.name = insetName + '_hl';
						highlightedLayer.mergeNewParams({
							STYLES : 'coastal_basins_highlighted'
						});
						map.addLayer(highlightedLayer);
					}
				});
			});
			
		}
	};
	
	// I want to remove the highlighted basin layer from the map, if it exists
	me.removeHighlightedBasin = function (insetNames) {
		if (insetNames && insetNames.length) {
			insetNames.forEach(function(insetName) {
				[me.us48Map, me.alaskaMap].forEach(function (map) { 
					var highlightedBasinLayers = map.getLayersByName(insetName + '_hl');
					if (highlightedBasinLayers.length) {
						map.removeLayer(highlightedBasinLayers[0]);
					}
				});
			});
		}
	};
	
	me.createBaseLayer = function() {
		return new OpenLayers.Layer.XYZ(
				"World Topo Map",
				"https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}",
				{
					sphericalMercator : true,
					layers: "0",
					isBaseLayer : true,
					units : "m",
					buffer : 3,
				}
		);		
	};
	
	// Sets up all the conus basin layers
	me.createBasinLayers = function() {
		var layers = [];
		Object.keys(me.REGION_LAYER, function (k,v) {
			var inset = v.inset;
			var layer =  new OpenLayers.Layer.WMS(
					inset,
					GEOSERVER_URL,
					{
						layers: inset,
						transparent: true,
						styles : 'coastal_basins'
					},
					{
						isBaseLayer : false,
						singleTile : true
					}
			);
			layers.push(layer);
		});
		
		return layers;
	};
	
	// Sets up the Alaska basin layer
	me.createAlaskaBasinLayer = function () {
		return new OpenLayers.Layer.WMS(
				me.REGION_LAYER.alaska.inset,
				GEOSERVER_URL,
				{
					layers: me.NAR_NS + me.REGION_LAYER.alaska.inset,
					transparent: true,
					styles : 'coastal_basins'
				},
				{
					isBaseLayer : false,
					singleTile : true
				}
        );
	};
	
	me.createSitesLayer = function() {
		return new OpenLayers.Layer.WMS(
			"Sites",
			GEOSERVER_URL,
			{
				layers : me.NAR_NS + 'JD_NFSN_sites',
				transparent : true,
				styles: 'sites13',
				'CQL_FILTER' : "site_type = 'Coastal Rivers'"
			}, {
				isBaseLayer : false,
				singleTile : true
			}
		);
	};
	

	me.createStreamsLayer = function() {
		return new OpenLayers.Layer.WMS('Major Streams', GEOSERVER_URL, {
			layers : me.NAR_NS + 'USA48_major_alb',
			transparent : true,
			styles : 'streams'
		}, {
			isBaseLayer : false
		});
	};
	

	me.createStatesLayer = function() {
		return new OpenLayers.Layer.WMS("Lower 48", GEOSERVER_URL, {
			layers : me.NAR_NS + 'statesl48_alb',
			transparent : true,
			styles : 'ms_grey_outline'
		}, {
			visibility : false,
			isBaseLayer : false
		});
	};
	
	me.defaultMapOptions = {
			projection : nar.commons.map.projection,
			theme : nar.commons.map.theme,
	};
	
	me.createDefaultUSMapOptions = function() {
		return Object.merge(me.defaultMapOptions, {
			restrictedExtent : me.mapUS48Extent,
			maxExtent : me.mapUS48Extent,
			maxResolution: 8041.067668,
			controls : [
						new OpenLayers.Control.ScaleLine({
							geodesic: true
						}),
						new OpenLayers.Control.Navigation(),
						new OpenLayers.Control.Zoom()
					],
			layers : [
				me.createBaseLayer(),
				me.createStatesLayer(),
				me.createStreamsLayer(),
			].concat(me.createBasinLayers()).concat([me.createSitesLayer()])
		});
	};

	alaskaSitesLayer = me.createSitesLayer();
	me.createDefaultAlaskaMapOptions = function() {
		return Object.merge(me.defaultMapOptions, {
			extent : me.alaskaExtent,
			restrictedExtent : me.alaskaExtent,
			maxExtent : me.alaskaExtent,
			maxResolution : 10000.0,
			projection : nar.commons.map.projection,
			controls : [
					new OpenLayers.Control.ScaleLine({
						geodesic : true
					})
			],
			layers : [
				me.createBaseLayer(),
				new OpenLayers.Layer.WMS(
					"Alaska",
					GEOSERVER_URL,
					{
						layers : me.NAR_NS + 'AK_AKalb',
						transparent : true,
						styles: 'ms_grey_outline',
					}, {
						visibility : false,
						isBaseLayer : false,			
					}
				),
				new OpenLayers.Layer.WMS(
						"Alaska Major Streams",
						GEOSERVER_URL,
						{
							layers: me.NAR_NS + 'AK_major_AKalb',
							transparent : true,
							styles : 'streams'
						},
						{
							isBaseLayer : false,
						}
				),
				me.createAlaskaBasinLayer(),
				alaskaSitesLayer
			]
		});
	};
	
	me.createUS48Map = function(mapDiv) {
		var map = new OpenLayers.Map(mapDiv, me.createDefaultUSMapOptions());
		map.zoomToExtent(me.mapUS48Extent, false);
		return map;
	};
	
	me.createAlaskaMap = function(mapDiv) {
		var map = new OpenLayers.Map(mapDiv, me.createDefaultAlaskaMapOptions());
		map.zoomToExtent(me.alaskaExtent, true);
		
		return map;
	};
	
	return {
		createUS48Map : function(mapDiv) {
			me.us48Map = me.createUS48Map.call(me, mapDiv);
			return me.us48Map;
		},
		createAlaskaMap : function(mapDiv) {
			me.alaskaMap = me.createAlaskaMap.call(me, mapDiv);
			return me.alaskaMap;
		},
		addHighlightedBasin : me.addHighlightedBasin,
		removeHighlightedBasin : me.removeHighlightedBasin
	};
	
}());