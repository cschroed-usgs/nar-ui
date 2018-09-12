describe('nar.siteFilter.Site', function() {
	var site = new nar.siteFilter.Site(1, 'siteA', 'urban');
	describe('properties', function() {
		it('should have properties set to values from constructor', function() {
			expect(site.id).toBe(1);
			expect(site.name).toBe('siteA');
			expect(site.type).toBe('urban');
		});
	});
});
describe('nar.siteFilter.buildRow', function() {
	var site = new nar.siteFilter.Site(2, 'siteB', 'urban');
	CONFIG = {summarySiteUrl : function(siteid) {
		return 'test/site/' + siteid + '/summaryreport';
	}};
	var $row = nar.siteFilter.buildRow(site);
	describe('row', function() {
		it('should be good dom', function() {
			expect($row.children().is('td')).toBe(true);
			expect($row.children().first().html()).toBe('2');
			expect($row.children().first().next().html()).toBe('siteB');
			expect($row.children().last().html()).toBe('urban');
		});
		it('should have good href', function() {
			expect($row.attr('href')).toBe('test/site/2/summaryreport');
		});
		it('should have necessary attrs', function() {
			expect($row.is('.clickableRow')).toBe(true);
		});
	});
});
describe('nar.siteFilter.filterBuilder', function() {
	var filterBuilder = nar.siteFilter.filterBuilder;
	var equalTo1 = filterBuilder.equalTo('test1', 3);
	var equalTo2 = filterBuilder.equalTo('test2', 4)
	var or1 = filterBuilder.or(equalTo1);
	var or2 = filterBuilder.or([equalTo1, equalTo2]);
	var notNull = filterBuilder.notNull('test3');
	describe('equalTo', function() {
		it('should have property', function() {
			expect(equalTo1.property).toBe('test1');
			expect(equalTo2.property).toBe('test2');
		});
		it('should have value', function() {
			expect(equalTo1.value).toBe(3);
			expect(equalTo2.value).toBe(4);
		});
		it('should have type', function() {
			expect(equalTo1.type).toBe(OpenLayers.Filter.Comparison.EQUAL_TO);
			expect(equalTo2.type).toBe(OpenLayers.Filter.Comparison.EQUAL_TO);
		});
		it('should be equalTo despite attempting or', function() {
			expect(or1.property).toBe('test1');
			expect(or1.value).toBe(3);
			expect(or1.type).toBe(OpenLayers.Filter.Comparison.EQUAL_TO);
			
		});
	});
	describe('or', function() {
		it('should be of type or', function() {
			expect(or2.type).toBe(OpenLayers.Filter.Logical.OR);
		});
		it('should have an array of two filters', function() {
			expect(or2.filters.length).toBe(2);
		});
	});
	describe('notNull', function() {
		it('should be an outer not', function() {
			expect(notNull.type).toBe(OpenLayers.Filter.Logical.NOT);
		});
		it('should have an inner is null', function() {
			expect(notNull.filters[0].type).toBe(OpenLayers.Filter.Comparison.IS_NULL);
			expect(notNull.filters[0].property).toBe('test3');
		});
	})
	
});