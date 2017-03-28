var nar = nar || {};
nar.commons = nar.commons || {};
nar.commons.map = nar.commons.map || {};
(function() {
	
	nar.commons.map.projection = new OpenLayers.Projection('EPSG:900913');
	nar.commons.map.geographicProjection = new OpenLayers.Projection('EPSG:4326');
	nar.commons.map.narNamespace = 'http://cida.usgs.gov/NAR';
	nar.commons.map.sitesName = 'JD_NFSN_sites';
	
	nar.commons.map.theme = CONFIG.staticUrl + 'nar_ui/js_lib/OpenLayers/theme/default/style.css';
	
	var DEFAULT_LAYER_OPTIONS = {
        sphericalMercator : true,
        layers : "0",
        isBaseLayer : true,
        projection : nar.commons.map.projection,
        units : "m",
        buffer : 3,
        wrapDateLine : false
    };
	
	nar.commons.mapUtils = {
	    createBaseLayers : function(layerOptions) {
	    	var _layerOptions = layerOptions || DEFAULT_LAYER_OPTIONS;
	        var zyx = '/MapServer/tile/${z}/${y}/${x}';
	        var ArcGisLayer = function(name, identifier) {
	            return new OpenLayers.Layer.XYZ(
	                name,
	                "https://services.arcgisonline.com/ArcGIS/rest/services/" + identifier + zyx,
	                _layerOptions
	            );
	        };
	        var baseLayers = 
	        [ 
	            ArcGisLayer("World Topo Map", 'World_Topo_Map'),
	            ArcGisLayer("World Image", "World_Imagery"),
	            ArcGisLayer("World Shaded Relief", "World_Shaded_Relief"),
	            ArcGisLayer('World Street Map', 'World_Street_Map')
	        ];
	        return baseLayers;
	    },
	    createNlcdLayers : function(layerOptions) {
	    	var _layerOptions = layerOptions || DEFAULT_LAYER_OPTIONS;
	        var nlcdUrl = 'https://raster.nationalmap.gov/arcgis/services/LandCover/USGS_EROS_LandCover_NLCD/MapServer/WMSServer';
	        
	        var nlcdProjection = 'EPSG:3857';
	        
	        var nlcdContiguousUsOptions = Object.clone(_layerOptions);
	        nlcdContiguousUsOptions.displayInLayerSwitcher = true;
	        nlcdContiguousUsOptions.isBaseLayer = false;
	        nlcdContiguousUsOptions.projection = nlcdProjection;
	        nlcdContiguousUsOptions.visibility = false;
	        
	        var nlcdContiguousUsParams = {
	            layers : '24',
	            transparent: true,
	            tiled: true
	        };
	        
	        var nlcdContiguousUsLayer = new OpenLayers.Layer.WMS('NLCD', nlcdUrl, nlcdContiguousUsParams, nlcdContiguousUsOptions); 
	        
	            
	        var nlcdAlaskaOptions = Object.clone(_layerOptions);
	        nlcdAlaskaOptions.displayInLayerSwitcher = false;
	        nlcdAlaskaOptions.isBaseLayer = false;
	        nlcdAlaskaOptions.projection = nlcdProjection;
	        nlcdAlaskaOptions.visibility = false;
	        var nlcdAlaskaParams = {
	            layers : '18',
	            transparent: true,
	            tiled: true
	        };
	        
	        var nlcdAlaskaLayer = new OpenLayers.Layer.WMS('NLCD Alaska', nlcdUrl, nlcdAlaskaParams, nlcdAlaskaOptions); 
	                
	        nlcdContiguousUsLayer.events.register('visibilitychanged', {}, function(){
	             nlcdAlaskaLayer.setVisibility(nlcdContiguousUsLayer.visibility); 
	        });
	        
	        var nlcdLayers = [
	             nlcdContiguousUsLayer,
	             nlcdAlaskaLayer
	        ];
	        return nlcdLayers;
	    },
	    createSitesLayer : function(layerOptions){
	    	var _layerOptions = layerOptions || DEFAULT_LAYER_OPTIONS;
	        var sitesLayerOptions = Object.clone(_layerOptions);
	        sitesLayerOptions.singleTile = true; //If we're not going to cache, might as well singleTile
	        sitesLayerOptions.isBaseLayer = false;
	
	        var sitesLayerParams = {
	            layers : nar.commons.map.sitesName,
	            buffer: 8,
	            transparent: true,
	            styles: 'sites'
	        };
	        
	        var sitesLayer = new OpenLayers.Layer.WMS(
	            'NAWQA Sites',
	            CONFIG.endpoint.geoserver + 'NAR/wms',
	            sitesLayerParams,
	            sitesLayerOptions
	        );
	        
	        return sitesLayer;
	    },
	    createSitesFeatureProtocol : function(protocolOptions) {
	    	// protocolOptions unused for now
	    	var protocol = new OpenLayers.Protocol.WFS({
	    		version: '1.1.0',
	    		url: CONFIG.endpoint.geoserver + 'NAR/wfs',
	    		featureType: nar.commons.map.sitesName,
	    		featureNS: nar.commons.map.narNamespace
	    	});
	    	return protocol;
	    },
	    getData : function(protocol, filter, callback) {
	    	if (protocol) {
	    		protocol.read({
	    			callback : callback,
	    			filter : filter
	    		});
	    	}
	    }
	}
}());