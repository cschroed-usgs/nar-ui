describe('nar.timeSeries.TimeSeriesCollection', function(){
	//avoid typing namespace

	var timeSeries = nar.timeSeries;
	var TimeRange = timeSeries.TimeRange;
	var TimeSeries = timeSeries.TimeSeries;
	var TimeSeriesCollection = timeSeries.Collection;
	//initialize dependent objects
	var timeRangeA = new TimeRange(0, 10000);
	var timeRangeB = new TimeRange(10, 100000);
	var timeRangeC = new TimeRange(timeRangeA.startTime + 1, timeRangeB.endTime + 100);
	var makeConfig = function(timeRange){
		return {
			observedProperty: 'mockPropertyUrl',
			procedure: 'mockProcedureUrl',
			timeRange : timeRange
		};
	};
	var timeSeriesA = new TimeSeries(makeConfig(timeRangeA));
	var timeSeriesB = new TimeSeries(makeConfig(timeRangeB));
	var timeSeriesC = new TimeSeries(makeConfig(timeRangeC));
	var tsCollection = new TimeSeriesCollection();
	describe('add() and getTimeRange()', function(){
		//...it's hard to test one without the other
		tsCollection.add(timeSeriesA);
		tsCollection.add(timeSeriesB);
		it('correctly calculates the aggregate time series range', function(){
			CONFIG.msFor1993 = new Date(1993,0,1).getTime();
			var calculatedTimeRange = tsCollection.getTimeRange();
			var alternateWayToCalculateRange = timeSeries.TimeRange.ofAll([timeRangeA, timeRangeB]);
			expect(calculatedTimeRange.equals(alternateWayToCalculateRange)).toBe(true);
		});
		it('re-calculates a new time range if a new time series has been added', function(){
			tsCollection.add(timeSeriesC);
			var calculatedTimeRange = tsCollection.getTimeRange();
			var alternateWayToCalculateRange = timeSeries.TimeRange.ofAll([timeRangeA, timeRangeB, timeRangeC]);
			expect(calculatedTimeRange.equals(alternateWayToCalculateRange)).toBe(true);
		});
		it('returns a clone of the aggregate time range, so that the calling code cannot unintentionally modify internal logic', function(){
			var firstTimeRange = tsCollection.getTimeRange();
			var secondTimeRange = tsCollection.getTimeRange();
			expect(firstTimeRange).not.toBe(secondTimeRange);
			expect(firstTimeRange.equals(secondTimeRange)).toBe(true);
		});
	});
	describe('getTimeSeriesByObservedProperty', function(){
		it('finds the desired time series', function(){
			var observablePropertyToSearchFor = 'veryUnique';
			var specialTimeSeries = new TimeSeries({
				observedProperty: observablePropertyToSearchFor,
				procedure: 'mockProc',
				timeRange: timeRangeA
			});
			
			tsCollection.add(specialTimeSeries);
			var foundTimeSeries = tsCollection.getTimeSeriesByObservedProperty(observablePropertyToSearchFor);
			expect(specialTimeSeries).toBe(foundTimeSeries);
		});
	});
});