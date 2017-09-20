describe('WaterYear', function() {

	it('tests for nar.WaterYearUtils to be defined', function () {
		expect(nar).toBeDefined();
		expect(nar.WaterYearUtils).toBeDefined();
	});
	
	describe('nar.WaterYearUtils.convertDateToWaterYear', function() {
		it('should convert date to correct water year', function() {
			expect(nar.WaterYearUtils.convertDateToWaterYear("1999/01/01")).toBe(1999);
			expect(nar.WaterYearUtils.convertDateToWaterYear("1999/09/30")).toBe(1999);
			expect(nar.WaterYearUtils.convertDateToWaterYear("1999/10/01")).toBe(2000);
			expect(nar.WaterYearUtils.convertDateToWaterYear("1999/11/11")).toBe(2000);
			expect(nar.WaterYearUtils.convertDateToWaterYear("1999/12/31")).toBe(2000);
		});
	});
	
	describe('nar.WaterYearUtils.getWaterYearStart', function() {
		it('should be October 1', function() {
			expect(nar.WaterYearUtils.getWaterYearStart(2000).is("1999/10/01")).toBe(true);
		});
	});
	
	describe('nar.WaterYearUtils.getWaterYearEnd', function() {
		it('should be September 30', function() {
			expect(nar.WaterYearUtils.getWaterYearEnd(2000).is("2000/09/30")).toBe(true);
		});
	});
	
		
	describe('nar.WaterYearUtils.getWaterYearRange',
		function() {
			var range = nar.WaterYearUtils.getWaterYearRange(Date.range('1973/01/01',
					'1995/01/01'));
			it('should start on October 1, 1973', function() {
				expect(range.start.is('1973/10/01')).toBe(true);
			});
			it('should not contain September 30, 1973', function() {
				expect(range.contains('1973/09/30')).toBe(false);
			});
			it('should not contain October 1, 1994', function() {
				expect(range.contains('1994/10/01')).toBe(false);
			});
			it('should end on September 30, 1994', function() {
				expect(range.end.is('1994/09/30')).toBe(true);
			});
		});
	
	describe('nar.WaterYearUtils.getYearsAsArray', function() {
		it('should give you empty array on null input', function() {
			var expected = [];
			var actual = nar.WaterYearUtils.getYearsAsArray(null);
			expect(actual).toBeDefined();
			expect(actual).toEqual(expected);
		});
		
		it('should give you empty array when range is backward', function() {
			var expected = [];
			var actual = nar.WaterYearUtils.getYearsAsArray(nar.WaterYearUtils.getWaterYearRange(Date.range(
					'1979/01/01', '1973/01/01')));
			expect(actual).toBeDefined();
			expect(actual).toEqual(expected);
		});
		
		it('should have 5 years', function() {
			expect(
					nar.WaterYearUtils.getYearsAsArray(nar.WaterYearUtils.getWaterYearRange(Date.range(
							'1973/01/01', '1979/01/01'))).length).toBe(5);
		});
		it('reversed should have 1975 as 2nd element', function() {
			expect(
					nar.WaterYearUtils.getYearsAsArray(nar.WaterYearUtils.getWaterYearRange(Date.range(
							'1973/01/01', '1979/01/01')))[1]).toBe(1975);
		});
		it('reversed should have 1975 as 4th element', function() {
			expect(
					nar.WaterYearUtils.getYearsAsArray(nar.WaterYearUtils.getWaterYearRange(Date.range(
							'1973/01/01', '1979/01/01')), true)[3]).toBe(1975);
		});
	});
});