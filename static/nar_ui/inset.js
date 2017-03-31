var nar = nar || {};

(function() {

	var alaskaExtent = new OpenLayers.Bounds(-175.0, 55.0, -135.0, 71.0).transform(nar.commons.map.geographicProjection, nar.commons.map.projection);
    var alaskaCenter = alaskaExtent.getCenterLonLat();
    var id = 'siteMap';
    var puWidth = 500;
    var maxZoomLevel = 3;
    // These need to match @insetWidth and @insetHeight in nar.less
    var insetWidth = 230;
    var insetHeight = 230;
	
	nar.inset = OpenLayers.Class(OpenLayers.Control, {
		type : OpenLayers.Control.TYPE_TOOL,
		displayClass : 'narAlaskaMapInset',
		insetContainerDivId : 'narAlaskaMapInsetInnerContainer',
		allowSelection : true,
		dragStart : null,
		mapInsetContainerElement : null,
		element : null,
		size: new OpenLayers.Size(insetWidth, insetHeight),
		insetMap : null,
		handlers : {},
		initialize : function(options) {
			"use strict";
			options = options || {};
			options.displayClass = this.displayClass;
			options.allowSelection = this.allowSelection;

			OpenLayers.Control.prototype.initialize.apply(this, [options]);
		},
		destroy : function() {
			"use strict";
			OpenLayers.Control.prototype.destroy.apply(this, arguments);
		},
		draw : function() {
			"use strict";
			// Create the primary element
			OpenLayers.Control.prototype.draw.apply(this, arguments);
			this.element = document.createElement('div');
			this.element.className = this.displayClass + 'Element' + ' olScrollable';
			this.element.style.overflow = 'auto';
			this.element.style.display = '';

			// Create the actual container div inside of that div inside of that
			if (!this.mapInsetContainerElement) {
				this.mapInsetContainerElement = document.createElement('div');
				this.mapInsetContainerElement.id = this.insetContainerDivId;
			}

			this.element.appendChild(this.mapInsetContainerElement);
			this.div.appendChild(this.element);
			
			var baseLayers = nar.commons.mapUtils.createBaseLayers();
			var nlcdLayers = nar.commons.mapUtils.createNlcdLayers();
			var sitesLayer = nar.commons.mapUtils.createSitesLayer();

		    var mapLayers = [].add(baseLayers).add(nlcdLayers).add(sitesLayer);

			var insetOptions = {
					extent : alaskaExtent,
					maxExtent : alaskaExtent,
		            restrictedExtent : alaskaExtent,
		            layers : mapLayers,
		            projection : nar.commons.map.projection,
		            size : this.size.clone(),
		            controls : [
                        new OpenLayers.Control.Navigation({
                        	zoomWheelEnabled : true
                        }),
                        new nar.SiteIdentificationControl({
            		    	layers : mapLayers,
            		    	popupWidth : puWidth,
            		    	popupAnchor : '#' + id
            		    })
                    ]
			};
	        
			var insetMap = new OpenLayers.Map(this.mapInsetContainerElement, insetOptions);
			this.insetMap = insetMap; // this is mostly for getting access to this map
			
			insetMap.setCenter(alaskaCenter, 3, true, true);
			var scale = new OpenLayers.Control.ScaleLine({
                geodesic: true,
                displayClass: 'olAlaskaInsetControlScaleLine',
                autoActivate: true,
                allowSelection: true
            });
			insetMap.addControl(scale, new OpenLayers.Pixel(10, this.insetMap.size.h - 35));
			
			if (!this.outsideViewport) {
				this.div.className += " " + this.displayClass + 'Container';
			}
			
		    mapLayers[0].events.register("loadend", this, function() {
		    	insetMap.updateSize();
			});
			
			insetMap.events.register("zoomend", this, function(e) {
				if (insetMap.getZoom() < maxZoomLevel) {
					insetMap.zoomToMaxExtent({restricted: true});
				}
			});
			map.events.register("changebaselayer", this, function(e) {
				var layer = insetMap.getLayersByName(map.baseLayer.name)[0];
				if (layer) {
					insetMap.setBaseLayer(layer);
				}
			});
			map.events.register("changelayer", this, function(e) {
				var name = e.layer.name;
				var visibility = e.layer.getVisibility();
				
				var layer = insetMap.getLayersByName(name)[0];
				if (layer) {
					layer.setVisibility(visibility);
				}
			});
			nar.siteFilter.addChangeHandler(function setupFiltering() {
		    	var cqlFilter = nar.siteFilter.writeCQLFilter();
		    	sitesLayer.mergeNewParams({cql_filter: cqlFilter});
		    });

			return this.div;
		},
		CLASS_NAME: 'NAR.map.inset'
	});
}());