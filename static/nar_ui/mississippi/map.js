var nar = nar || {};
nar.mississippi = nar.mississippi || {};
nar.mississippi.map = (function() {
	"use strict";
	
	var me = {};
	
	me.mississippiExtent = new OpenLayers.Bounds(-115.5, 28.0, -78.5, 50.5).transform(nar.commons.map.geographicProjection, nar.commons.map.projection);
	me.mississippiCenter = me.mississippiExtent.getCenterLonLat();
	me.maps = {};
	me.topics = {};
	
	me.mapEvents = function(id) {
		var callbacks,
			method,
			topic = id && me.topics[id];
		if (!topic) {
			callbacks = jQuery.Callbacks();
			topic = {
				publish : callbacks.fire,
				subscribe : callbacks.add,
				unsubscribe : callbacks.remove
			};
			if (id) {
				me.topics[id] = topic;
			}
		}
		return topic;
	};
	
	me.createDefaultOptions = function() {
		return {
			projection : nar.commons.map.projection,
			restrictedExtent : me.mississippiExtent,
			maxExtent : me.mississippiExtent,
			maxResolution : 8044.572575737846,
			theme : nar.commons.map.theme,
			controls : [
				new OpenLayers.Control.Navigation(),
				new OpenLayers.Control.ScaleLine({
					geodesic : true
				}), 
				new OpenLayers.Control.Zoom()
				],
			layers : [
				new OpenLayers.Layer.WMS("Lower 48",
					CONFIG.endpoint.geoserver + 'NAR/wms',
					{
						layers:'NAR:statesl48_alb',
						transparent: true,
						styles : 'ms_grey_outline'
					},{
						isBaseLayer: true
					}),
				new OpenLayers.Layer.WMS("Great Lakes",
					CONFIG.endpoint.geoserver + 'NAR/wms',
					{
						layers:'NAR:gtlakes_alb',
						transparent: true,
						styles : 'ms_grey_outline'
					},{
						isBaseLayer: false,
						ratio: 1,
						singleTile: true
					}),
				new OpenLayers.Layer.WMS(
					'Mississippi Basins',
					CONFIG.endpoint.geoserver + 'NAR/wms',
					{
						layers : 'MS_8update',
						transparent: true,
						styles: 'miss8'
					}, {
						isBaseLayer: false,
						ratio: 1,
						singleTile: true
					})
			]
		};
	};

	me.createMap = function(args) {
		var mapDiv = args.div,
			options = args.options || {},
			linkMap = args.linkMap || true,
			mapId = args.mapId || mapDiv.id,
			map;
			
			options = $.extend({}, me.createDefaultOptions(), args.options);
			
			map = new OpenLayers.Map(mapDiv, options);
			map.setCenter(me.mississippiCenter, 4);
			map.options.linkMap = linkMap;
			
			if (linkMap) {
				map.events.register('move', me, function(evt) {
					me.mapEvents(evt.type).publish(evt);
				});
				
				me.mapEvents('move').subscribe(function(evt) {
					for (var key in me.maps) {
						if (me.maps.hasOwnProperty(key)) {
							var map = me.maps[key];
							if (evt.object.id !== map.id && map.options.linkMap) {
								if (map.getExtent() !== evt.object.getExtent()) {
									map.zoomToExtent(evt.object.getExtent(), true);
								}
							}
						}
					}
				});
			}
			me.maps[mapId] = map;
			map.zoomToExtent(me.mississippiExtent, false);
			return map;
	};
	
	return {
		createMap : function(args) {
			return me.createMap.call(me, args);
		},
		maps : me.maps
	};
}());