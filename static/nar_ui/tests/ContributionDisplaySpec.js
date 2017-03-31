describe('nar.ContributionDisplay', function() {
	describe('ContributionDisplay', function() {
		var cd = null;
		cd = nar.ContributionDisplay;
		
		var validJSON = {
				"ATCHAFALAYA": null, 
				"LOWERMISS": 0.23824223423423, 
				"ARKANSAS": 0.03408705259186480, 
				"MISSOURI": 0.11010197918440400, 
				"UPPERMIDDLEMISS": 0.18897641055970800, 
				"OHIO": 0.37888351173889300, 
				"UPPERMISS": 0.07959584740201930, 
				"RED": 0.01013644742774410, 
				"LOWERMIDDLEMISS": 0.02045135957764900
				};
		
		it('creates a ContributionDisplay object', function() {
			expect(cd).not.toBe(null);
		});
		
		it('creates a valid result object', function() {
			var result = nar.ContributionDisplay.createLegendData(validJSON, {water_year:'1994'});
			
			expect(result).not.toBe(null);
			expect(result.length).toBe(7);
			
			var item = result.find(function(o){
				return o.label.has('Arkansas River');
				});
			expect(item).not.toBe(null);
			expect(item.data).toBe('3.4');
		});
		
		var missingUpperMissRiverValue = Object.clone(validJSON);
		missingUpperMissRiverValue.UPPERMISS = null;
		
		// For 1993-1994, when only the Upper Mississippi River is missing, change 
		// the legend for the "Upper Middle Mississippi" to "Upper/Upper Middle Mississippi"
		it('changes legend to upper/upper middle mississippi', function() {
			var result = nar.ContributionDisplay.createLegendData(missingUpperMissRiverValue, {water_year : '1993'});
			expect(result).not.toBe(null);
			expect(result.length).toBe(6);
			var item = result.find(function(o){
				return o.label.indexOf('Upper/Upper Middle Mississippi') !== -1;
				});
			expect(item).not.toBe(undefined);
			
			result = nar.ContributionDisplay.createLegendData(missingUpperMissRiverValue, {water_year : '1994'});
			expect(result).not.toBe(null);
			expect(result.length).toBe(6);
			item = result.find(function(o){
				return o.label.indexOf('Upper/Upper Middle Mississippi') !== -1;
				});
			expect(item).not.toBe(undefined);
			
			result = nar.ContributionDisplay.createLegendData(missingUpperMissRiverValue, {water_year : '1995'});
			expect(result).not.toBe(null);
			expect(result.length).toBe(6);
			item = result.find(function(o){
				return o.label.indexOf('Upper/Upper Middle Mississippi') !== -1;
				});
			expect(item).toBe(undefined);
			
			
		});
		
		// For 1995, change the legend for "Lower Middle Mississippi" to 
		// "Upper/Upper Middle/Lower Middle Mississippi".
		it('changes legend to upper/upper middle mississippi', function() {
			var result = nar.ContributionDisplay.createLegendData(missingUpperMissRiverValue, {water_year : '1995'});
			expect(result).not.toBe(undefined);
			expect(result.length).toBe(6);
			var item = result.find(function(o){
				return o.label.indexOf('Upper/Upper Middle/Lower Middle Mississippi') !== -1;
				});
			expect(item).not.toBe(undefined);
			
			result = nar.ContributionDisplay.createLegendData(missingUpperMissRiverValue, {water_year : '1996'});
			expect(result).not.toBe(undefined);
			expect(result.length).toBe(6);
			item = result.find(function(o){
				return o.label.indexOf('Upper/Upper Middle/Lower Middle Mississippi') !== -1;
				});
			expect(item).toBe(undefined);
		});
		
		// For 1996, change the legend for "Lower Middle Mississippi" to "Upper Middle/Lower Middle Mississippi". 
		it('changes legend to upper/upper middle mississippi', function() {
			var result = nar.ContributionDisplay.createLegendData(missingUpperMissRiverValue, {water_year : '1996'});
			expect(result).not.toBe(undefined);
			expect(result.length).toBe(6);
			var item = result.find(function(o){
				return o.label.indexOf('Upper Middle/Lower Middle Mississippi') !== -1;
				});
			expect(item).not.toBe(undefined);
			
			result = nar.ContributionDisplay.createLegendData(missingUpperMissRiverValue, {water_year : '1997'});
			expect(result).not.toBe(undefined);
			expect(result.length).toBe(6);
			item = result.find(function(o){
				return o.label.indexOf('Upper/Upper Middle/Lower Middle Mississippi') !== -1;
				});
			expect(item).toBe(undefined);
		});
		
		
		
	});
});