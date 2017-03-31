// TODO Fix issues with setting CONFIG in tests. Can't run this at the moment.

xdescribe('Tests for nar.coastalRegion.map', function() {
	
	CONFIG = {
			site_slds : {
				northeast : 'http://fakeservice.com',
				southeast : 'http://fakeservice.com',
				gulf : 'http://fakeservice.com',
				west : 'http://fakeservice.com',
				alaska : 'http://fakeservice.com'
			}
	}
	var mapCommonsMock;
	var server;
	
	var GEOSERVER_ENDPOINT = 'http://fake.com/geoserver';
	beforeEach(function() {	
		CONFIG = {
				site_slds : {
					northeast : 'http://fakeservice.com',
					southeast : 'http://fakeservice.com',
					gulf : 'http://fakeservice.com',
					west : 'http://fakeservice.com',
					alaska : 'http://fakeservice.com'
				}
		}
		mapCommonsMock = jasmine.createSpyObj('mapCommons', ['theme', 'projection', 'geographicProjection']);
		nar.commons.map = mapCommonsMock;
		server = sinon.fakeServer.create();
	});
	
	afterEach(function() {
		server.restore();
	});
	
	it('Expects nar.coastalRegion.map to be defined', function() {
		expect(nar).toBeDefined();
		expect(nar.coastalRegion).toBeDefined();
		expect(nar.coastalRegion.map).toBeDefined();
	});
	
	it('Expects nar.coastalRegion.map function to return object with expected properties', function() {
		var thisMap = nar.coastalRegion.map(GEOSERVER_ENDPOINT, 'northeast');
		expect(thisMap.createRegionMap).toBeDefined();
		expect(thisMap.getBasinFeatureInfoPromise).toBeDefined();
	});
	
	describe('Tests for nar.coastalRegion.map.getBasinFeatureInfoPromise with non west region',function() {
		var thisMap;
		var successSpy, errorSpy;
		beforeEach(function() {
			thisMap = nar.coastalRegion.map(GEOSERVER_ENDPOINT, 'northeast');
			successSpy = jasmine.createSpy('successSpy');
			errorSpy = jasmine.createSpy('errorSpy');
		});
		
		it('Expects a single ajax call to be issued', function() {
			var promise = thisMap.getBasinFeatureInfoPromise(['prop1', 'prop2']);
			expect(server.requests.length).toBe(1);
			expect(server.requests[0].url).toMatch(GEOSERVER_ENDPOINT);
			expect(server.requests[0].url).toMatch('propertyName=' + encodeURIComponent('prop1,prop2'));
		});
		
		it('Expects a successfully request to resolve the returned promise with the feature list', function() {
			var promise = thisMap.getBasinFeatureInfoPromise(['prop1', 'prop2']);
			$.when(promise).then(successSpy).fail(errorSpy);
			expect(successSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();

			server.requests[0].respond(200, '<wfs:FeatureCollection></wfs:FeatureCollection>');
			expect(successSpy).toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});
		
		it('Expects an error to resolve the returned promise to with the error handler', function() {
			var promise = thisMap.getBasinFeatureInfoPromise(['prop1', 'prop2']);
			$.when(promise).then(successSpy).fail(errorSpy);
			expect(successSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
			
			server.requests[0].respond(500, 'Server Error');
			expect(successSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalled();
			
		});
	});
	
	describe('Tests for nar.coastalRegion.map.getBasinFeatureInfoPromise with west region', function() {
		var thisMap;
		var successSpy, errorSpy;
		beforeEach(function() {
			thisMap = nar.coastalRegion.map(GEOSERVER_ENDPOINT, 'west');
			successSpy = jasmine.createSpy('successSpy');
			errorSpy = jasmine.createSpy('errorSpy');
		});
		
		it('Expects that call makes two ajax requests', function() {
			var promise = thisMap.getBasinFeatureInfoPromise(['prop1', 'prop2']);
		
			expect(server.requests.length).toBe(2);
		});
		
		it('Expects that promise is not resolved until both requests are serviced', function() {
			var promise = thisMap.getBasinFeatureInfoPromise(['prop1', 'prop2']);
			$.when(promise).then(successSpy).fail(errorSpy);
			
			server.requests[0].respond(200, '<wfs:FeatureCollection></wfs:FeatureCollection>');
			expect(successSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
			
			server.requests[1].respond(200, '<wfs:FeatureCollection></wfs:FeatureCollection>');
			expect(successSpy).toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
		});
		
		it('Expects that the promise is rejected if one of the requests fails', function() {
			var promise = thisMap.getBasinFeatureInfoPromise(['prop1', 'prop2']);
			$.when(promise).then(successSpy).fail(errorSpy);
			
			server.requests[0].respond(200, '<wfs:FeatureCollection></wfs:FeatureCollection>');
			expect(successSpy).not.toHaveBeenCalled();
			expect(errorSpy).not.toHaveBeenCalled();
			
			server.requests[1].respond(500, 'Internal Server Error');
			expect(successSpy).not.toHaveBeenCalled();
			expect(errorSpy).toHaveBeenCalled();			
		});
	});
});