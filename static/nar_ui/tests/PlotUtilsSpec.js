describe('nar.plots.PlotUtils', function() {
	describe('logTickFormatter', function() {
		var testFunc = nar.plots.PlotUtils.logTickFormatter;
		it('numbers greater than 0 should have no decimals', function() {
			expect(testFunc(1000)).toBe('1000');
			expect(testFunc(100)).toBe('100');
			expect(testFunc(10)).toBe('10');
			expect(testFunc(1)).toBe('1');
		});
		it('numbers less than zero should have the correct significance', function() {
			expect(testFunc(0.1)).toBe('0.1');
			expect(testFunc(0.01)).toBe('0.01');
			expect(testFunc(0.001)).toBe('0.001');
		});
		it('weird inputs should be handled properly', function() {
			expect(testFunc(1000.001)).toBe('1000');
			expect(testFunc(0.0100)).toBe('0.01');
		});
	});
	describe('logTicks', function() {
		var testFunc = nar.plots.PlotUtils.logTicks;
		
		it('Expects an array of log ticks returned', function() {
			var axis = {min : 0.026, max : 20.2, datamin : 0.02, datamax : 22.2};
			expect(testFunc(axis, -3)).toEqual([[0.01, '0.01'], [0.1, '0.1'], [1.0, '1'], [10.0, '10'], [100.0, '100']]);
			expect(axis.min).toEqual(0.01);
			expect(axis.max).toEqual(100.0);
			
			axis = {min : 0, max : 80.43, datamin : 1.2, datamax : 85.5};
			expect(testFunc(axis, -3)).toEqual([[1.0, '1'], [10.0, '10'], [100.0, '100']]);
			expect(axis.min).toEqual(1.0);
			expect(axis.max).toEqual(100.0);
		});
		
		it('Expects the minimumLog parameter to be used if axis.data is zero', function() {
			var axis = {min : 0.0, max : 54.3, datamin: 0, datamax : 85.0};
			expect(testFunc(axis, -3)).toEqual([[0.001, '0.001'], [0.01, '0.01'], [0.1, '0.1'], [1.0, '1'], [10.0, '10'], [100.0, '100']]);
			expect(axis.min).toEqual(0.001);
			expect(axis.max).toEqual(100.0);
		});
		
		it('Expects the ticks returned to not have ticks mapped to axis.datamin or axis.datamx', function() {
			var axis = {min : 0.09, max : 10.1, datamin : 0.1, datamax : 10};
			expect(testFunc(axis, -3)).toEqual([[0.01, '0.01'], [0.1, '0.1'], [1.0, '1'], [10.0, '10'], [100.0, '100']]);
			expect(axis.min).toEqual(0.01);
			expect(axis.max).toEqual(100);
		});
	});
	describe('utcDatePlotHoverFormatter', function() {
		var testFunc = nar.plots.PlotUtils.utcDatePlotHoverFormatter;
		it('should be ISO date with correct value', function() {
			expect(testFunc('01/01/2010', 17)).toBe('2010-01-01 : 17');
			expect(testFunc('12/11/1929', 0.13)).toBe('1929-12-11 : 0.13');
		});
	});
	
	describe('waterYearLoadPlotHoverFormatter', function() {
		var testFunc = nar.plots.PlotUtils.waterYearPlotHoverFormatter;
		it('Expects the water year followed by the data formatted using commas and rounded', function() {
			expect(testFunc('09/30/2010', 1567.23, 2)).toBe('2010 : 1,567.23');
			expect(testFunc('10/01/2010', 989.54, 0)).toBe('2011 : 990');
		});
	});

	describe('getDataSplitIntoCurrentAndPreviousYears using dates not up to current date', function () {
		CONFIG = {
				currentWaterYear : 2014
		};
		var yearAndRndRandomNumber = [];
		for (var year = 1980;year < CONFIG.currentWaterYear ;year++) {
			yearAndRndRandomNumber.push([new Date(year,'0','1','0','0','0').getTime(), Math.floor(Math.random() * 10) + 1]);
		}
		
		var allYearsExceptFewMostCurrent = [yearAndRndRandomNumber.slice(0, yearAndRndRandomNumber.length - 2)];
		
		
		var result = nar.plots.PlotUtils.getDataSplitIntoCurrentAndPreviousYears(yearAndRndRandomNumber);
		
		it('should return the expected result object with two properties', function () {
			expect(result).not.toBe(null);
			expect(Object.keys(result).length).toBe(2);
		});
		
		it('should have a currentYearDataElement array of length 0', function () {
			expect(result.currentYearData.length).toBe(0);
		});
		it('should have a previousYearsData array of length > 1', function () {
			expect(result.previousYearsData.length).not.toBe(0);
		});
		
	});
	
	describe('getDataSplitIntoCurrentAndPreviousYears using dates including current date', function () {
		CONFIG = {
				currentWaterYear : 2014
		};
		
		var yearAndRndRandomNumber = [];
		for (var year = 1980;year <= CONFIG.currentWaterYear ;year++) {
			yearAndRndRandomNumber.push([new Date(year - 1,'10','1','0','0','0').getTime(), Math.floor(Math.random() * 10) + 1]);
		}

		var result = nar.plots.PlotUtils.getDataSplitIntoCurrentAndPreviousYears(yearAndRndRandomNumber);
		it('should have a currentYearDataElement array of length 1', function () {
			expect(result.currentYearData.length).toBe(1);
		});
		it('should have a previousYearsData array of length == 1', function () {
			expect(result.previousYearsData.length).not.toBe(0);
		});
		
	});
	
	describe('longTermMean', function() {
		var start = nar.plots.PlotUtils.YEAR_NINETEEN_HUNDRED;
		var end = nar.plots.PlotUtils.ONE_YEAR_IN_THE_FUTURE;
		it('start should be before end', function() {
			expect(start).toBeLessThan(end);
		});
		it('values should be reasonable', function() {
			expect(start).toBeLessThan(0);
			expect(end).toBeGreaterThan(0);
			// Now restrict further, these may need to change
			expect(start).toBe(-2208967200000);
			expect(end).toBeGreaterThan(1438723569000);
		});
	});
	
	describe('getTimeByYearTicks', function() {
		var tickGenerator;
		var getUtcTime;
		
		beforeEach(function() {
			getUtcTime = function(year, month, day) {
				return (new Date(year, month, day)).getTime();
			};
			tickGenerator = jasmine.createSpy('tickGenerator');			
		});
		
		it('Should use the results from tickGenerator if the range of years if larger than the number of results', function() {
			var axis;
			var results = [getUtcTime(2000, 0, 1), getUtcTime(2002, 0, 1), getUtcTime(2004, 0, 1), getUtcTime(2006, 0, 1), getUtcTime(2008, 0, 1)];
			tickGenerator.andReturn(results);
			
			axis = {
				min : (new Date(2000, 0, 1)).getTime(),
				max : (new Date(2008, 0, 1)).getTime(),
				tickGenerator : tickGenerator
			};
			expect(nar.plots.PlotUtils.getTicksByYear(axis)).toEqual(results);
		});
		
		it('Should generate ticks on the year if the range of years is less than the number of results', function() {
			var axis;
			var results = [getUtcTime(2008, 4, 1), getUtcTime(2008, 10, 1), getUtcTime(2009, 4, 1), getUtcTime(2009, 10, 1)];
			tickGenerator.andReturn(results);
			
			axis = {
				min : (new Date(2008, 0, 1)).getTime(),
				max : (new Date(2009, 0, 1)).getTime(),
				tickGenerator : tickGenerator
			};
			expect(nar.plots.PlotUtils.getTicksByYear(axis)).toEqual([getUtcTime(2008, 0, 1), getUtcTime(2009, 0, 1)]);
		});
	});
	
	describe('createPinnedPointData', function() {
		it('Should be point with adjusted Y value', function() {
			var point = [[2,2]];
			var line = [[0,10], [3,20], [7,30]];
			expect(nar.plots.PlotUtils.createPinnedPointData(point, line)).toEqual([[2,20]]);
		});
	});
	
	describe('findNearestYValueAtX', function() {
		it('Should return y on line of nearest x', function() {
			var line = [[0,10], [3,20], [7,30]];
			expect(nar.plots.PlotUtils.findNearestYValueAtX(line, 0)).toBe(10);
			expect(nar.plots.PlotUtils.findNearestYValueAtX(line, 1)).toBe(10);
			expect(nar.plots.PlotUtils.findNearestYValueAtX(line, 2)).toBe(20);
			// this one is indeterminate
			expect(nar.plots.PlotUtils.findNearestYValueAtX(line, 5)).toBe(20);
			expect(nar.plots.PlotUtils.findNearestYValueAtX(line, 7)).toBe(30);
		});
	});
});
