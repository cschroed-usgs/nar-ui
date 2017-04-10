
describe('nar.timeSeries.TimeSeries', function(){
	
	var TimeSeries = nar.timeSeries.TimeSeries;
	var timeSeries = new TimeSeries({
		observedProperty: 'NO3_NO2',
		procedure: 'discrete_concentration',
		timeRange : new nar.timeSeries.TimeRange(0, 10000)
	});
	it('should throw an exception when given a bad response', function(){
		var notAnArray = 'squish';
		var badCall = function(){
			timeSeries.parseResultRetrievalResponse(notAnArray);
		};
		expect(badCall).toThrow();
	});
	it('should correctly parse retrieval responses', function(){
		var firstDate = new Date(1995, 4, 10),
		firstValue = 42,
		secondDate = new Date(1997, 07, 01),
		secondValue = 24;
		
		var mockResponse = [
            {
            	site_qw_id :'007',
            	site_flow_id : '008',
            	constit : 'NO3_NO2',
            	date: firstDate.toISOString(),
            	wy : firstDate.getFullYear(),
            	concentration : firstValue,
            	remark : ''
            },
            {
            	site_qw_id :'007',
            	site_flow_id : '008',
            	constit : 'NO3_NO2',
            	date: secondDate.toISOString(),
            	wy : secondDate.getFullYear(),
            	concentration : secondValue,
            	remark : '<'
            },
        ];
		var resultData = timeSeries.parseResultRetrievalResponse(mockResponse);
		expect(resultData).not.toBe(null);
		expect(resultData.length).toBe(2);
		resultData.every(function(row){
			expect(row.length).toBe(2);
		});
		
		expect(resultData[0][0]).toBe(firstDate.getTime());
		expect(resultData[0][1]).toBe('' + firstValue);
		
		expect(resultData[1][0]).toBe(secondDate.getTime());
		expect(resultData[1][1]).toBe('<' + secondValue);
	});
	
	describe('retrieveData', function() {
		var server, successSpy, errorSpy;
		
		beforeEach(function() {
			timeSeries.parseResultRetrievalResponse = jasmine.createSpy('parseSosGetResultRepsonse');
			server = sinon.fakeServer.create();
			successSpy = jasmine.createSpy('successSpy');
			errorSpy = jasmine.createSpy('errorSpy');
		});
		afterEach(function() {
			server.restore();
		});
	
		it('should return a resolved promise when successfully retrieving data', function() {
			CONFIG = {
					endpoint : {
						sos : 'http://fakesosendpoint'
					}
			};
			var promise = timeSeries.retrieveData().then(successSpy, errorSpy);
			server.requests[0].respond(200, {'Content-type' : 'application/json'}, '{"resultValues": {"prop1" : "Prop1"}}');
			
			expect(successSpy).toHaveBeenCalled();
		});
		it('should return a resolved promise when successfully retrieving data', function() {
			CONFIG = {
					endpoint : {
						sos : 'http://fakesosendpoint'
					}
			};
			var promise = timeSeries.retrieveData().then(successSpy, errorSpy);
			server.requests[0].respond(500, {'Content-type' : 'application/json'}, '{"resultValues": {"prop1" : "Prop1"}}');
			
			expect(errorSpy).toHaveBeenCalled();
		});
	});
});

describe('nar.timeSeries.DataAvailabilityTimeRange', function() {
	var cutoffStartTime = nar.timeSeries.TimeRange.START_TIME_CUTOFF;
	var startTime = new Date(1990, 0, 1).getTime();
	var currentWaterYear = nar.WaterYearUtils.convertDateToWaterYear(Date.create());
	var endTime = new Date(currentWaterYear, 0, 1).getTime();
	var cutoffEndTime = nar.timeSeries.TimeRange.END_TIME_CUTOFF;
	
	it('should give me start and end dates by trimming', function() {
		var result = new nar.timeSeries.DataAvailabilityTimeRange({
			phenomenonTime : [startTime, endTime]
		})
		
		expect(result).not.toBe(null);
		expect(result.startTime).toBe(cutoffStartTime);
		expect(result.startTime).not.toBe(startTime);
		expect(result.endTime).toBe(cutoffEndTime);
		expect(result.endTime).not.toBe(endTime);
	});
	
	it('should give me start and end dates by not trimming', function() {
		var useOriginalStartTime = true;
		
		var result = new nar.timeSeries.DataAvailabilityTimeRange({
			phenomenonTime : [startTime, endTime]
		}, useOriginalStartTime)
		
		expect(result).not.toBe(null);
		expect(result.startTime).not.toBe(cutoffStartTime);
		expect(result.startTime).toBe(startTime);
		expect(result.endTime).not.toBe(cutoffEndTime);
		expect(result.endTime).toBe(endTime);
	});
});
