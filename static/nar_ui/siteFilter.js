var nar = nar || {};
(function() {
	var siteFilterName = "siteFilter";
	var getSelectedTypes = function() {
		var selectedSelector = "input[name='" + siteFilterName + "']:checked";
		selectedTypes = $.makeArray(
			$(selectedSelector).map(function() {
				return $(this).val();
			})
		);
		return selectedTypes;
	};
	var makeTd = function(content) {
		var $td = $('<td />').html(content);
		return $td;
	};
	nar.siteFilter = {
		Site : function(id, name, type) {
			this.id = id;
			this.name = name;
			this.type = type;
		},
		writeCQLFilter : function() {
			var selectedTypes = getSelectedTypes();
			var cqlFilter = "site_type IS NOT NULL";
			if (selectedTypes && 0 < selectedTypes.length) {
				cqlFilter = "site_type IN ('" + selectedTypes.join("','") + "')";
			}
			return cqlFilter;
		},
		writeOGCFilter : function() {
			var selectedTypes = getSelectedTypes();
			var ogcFilter = nar.siteFilter.filterBuilder.notNull("site_type");
			if (selectedTypes && 0 < selectedTypes.length) {
				var filters = [];
				selectedTypes.each(function(type) {
					var filter = nar.siteFilter.filterBuilder.equalTo("site_type", type);
					filters.add(filter);
				});
				ogcFilter = nar.siteFilter.filterBuilder.or(filters);
			}
			return ogcFilter;
		},
		addChangeHandler : function(fn) {
			$("input[name='" + siteFilterName + "']").change(fn);
		},
		buildRow : function(site) {
			var $tableRow = $('<tr />').addClass('clickableRow').attr('href', CONFIG.summarySiteUrl(site.id));
			$tableRow.append(makeTd(site.id)).append(makeTd(site.name)).append(
				makeTd(site.type));
			$tableRow.click(function() {
				window.document.location = $(this).attr("href");
			});
			return $tableRow;
		},
		onEachSite : function(doThis) {
			var protocol = nar.commons.mapUtils.createSitesFeatureProtocol();
			var filter = nar.siteFilter.writeOGCFilter();
			nar.commons.mapUtils.getData(protocol, filter, function(response) {
				if (response.success()) {
					response.features.sortBy(function(feature){
						return feature.data.site_type;
					}).each(function(feature) {
						var site = new nar.siteFilter.Site(feature.data.qw_id,
							feature.data.qw_name, feature.data.site_type);
						doThis(site);
					});
				} else {
					throw Error('Error loading sites - could not retrieve data from feature service.');
				}
			});
		},
		filterFromCQLText : function(text) {
			var cql = new OpenLayers.Format.CQL();
			return cql.read(text);
		},
		loadSitesToDom : function() {
			var $table = $('.site_table');
			nar.siteFilter.onEachSite(function(site) {
				$table.append(nar.siteFilter.buildRow(site));
			});
		},
		clearRows : function() {
			$(".clickableRow").remove();
		}
	};
	/**
	 *  separate functionality for filter building
	 *  only implementing what needed for now, could pull out into
	 *  handy library at some point
	 */
	nar.siteFilter.filterBuilder = {
		/**
		 * {OpenLayers.Filter[]}
		 */
		or : function(filterArray) {
			var filter;
			if (Array.isArray(filterArray)) {
				filter = new OpenLayers.Filter.Logical({
					type : OpenLayers.Filter.Logical.OR,
					// May want to check that each filter is OpenLayers.Filter
					filters : filterArray
				});
			} else {
				// An or of one item is just that item
				filter = Object.clone(filterArray);
			}
			return filter;
		},
		equalTo : function(property, value) {
			var filter;
			filter = new OpenLayers.Filter.Comparison({
				type : OpenLayers.Filter.Comparison.EQUAL_TO,
				property : property,
				value : value
			});
			return filter;
		},
		notNull : function(property) {
			var filter;
			filter = new OpenLayers.Filter.Logical({
				type : OpenLayers.Filter.Logical.NOT,
				filters : [new OpenLayers.Filter.Comparison({
					type : OpenLayers.Filter.Comparison.IS_NULL,
					property : property
				})]
			});
			return filter;
		}
	};
}());