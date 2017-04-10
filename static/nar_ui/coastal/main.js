$(document).ready(function() {
	"use strict";
	
	var map = nar.coastal.map.createUS48Map('coastal_map'),
		alaskaMap = nar.coastal.map.createAlaskaMap('coastal_ak_map'),
		$regionLink = $('.link_coastal_region'),
		// When the regional buttons are hovered on, I want to highlight their respective region.
		// When the button is hovered off, I want to remove the highlighting.
		hoverHandler = function (e) {
			var $link = $(this), 
				data = $link.data(),
				regions = data.region.split(','),
				map = nar.coastal.map,
				isHovering = e.type === 'mouseenter';
			
			if (isHovering) {
				map.addHighlightedBasin(regions);
			} else {
				map.removeHighlightedBasin(regions);
			}
		};
	
	$regionLink.hover(hoverHandler);
	
});
