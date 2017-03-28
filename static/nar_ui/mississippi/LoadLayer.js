var nar = nar || {};
nar.mississippi = nar.mississippi || {};

/*
 * @returns object with functions, addToMap and updateLayer.
 */
nar.mississippi.LoadLayer = function() {
	var self = this;
	var loadLayer = new OpenLayers.Layer.WMS(
		'Nutrient Load',
		CONFIG.endpoint.geoserver + 'NAR/wms',
		{
			transparent : true,
		},
		{
			isBaseLayer : false
		}
	);
	var currentLayer = '';
	var currentStyle = '';
	
	var LEGEND_URL = CONFIG.endpoint.geoserver + 'NAR/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image%2Fpng&WIDTH=50&HEIGHT=50&legend_options=forceLabels:on';
	
	self.addToMap = function(map) {
		map.addLayer(loadLayer);
	};
	
	self.updateLayer = function(data) {
		if (data.load && data.chemical && data.year) {
			currentLayer = 'NAR:missrivout_' + data.year;
			currentStyle = data.chemical + '_' + data.load;
			loadLayer.mergeNewParams({
				layers : currentLayer,
				styles : currentStyle
			});
			loadLayer.setVisibility(true);
		}
		else {
			loadLayer.setVisibility(false);
		}		
	};
	
	self.getLegendGraphicUrl = function() {
		return LEGEND_URL + '&layer=' + currentLayer + '&style=' + currentStyle; 
	};
	
	
	return self;
};