describe('nar.timeSeries.Visualization, nar.timeSeries.VisualizationRegistry', function(){
	
	describe('getComponentsOfId', function(){
		var getComponentsOfId = nar.timeSeries.Visualization.getComponentsOfId;
		var newTsvRegistry = new nar.timeSeries.VisualizationRegistry();
		var createId = newTsvRegistry.getTimeSeriesVisualizationId;
		var observablePropertyId = 'TP';
		var timestepDensity = 'annual'
		var procedureCategory = 'mass';
		var procedureSubcategory = 'upper_95';
		var modtype = 'REG';
		var simpleProcedureId = [timestepDensity, procedureCategory].join('_') + '/' + modtype;
		var complicatedProcedureId = [timestepDensity, procedureCategory, procedureSubcategory].join('_') + '/' + modtype;
		var simpleTsvId = createId(observablePropertyId, simpleProcedureId);
		var complicatedTsvId = createId(observablePropertyId, complicatedProcedureId);
		
		it('parses correct components from hierarchical ids with a procedure category and NO procedure subcategory', function(){		
			var components = getComponentsOfId(simpleTsvId);
			expect(components.constituent).toBe('phosphorus');
			expect(components.category).toBe(procedureCategory);
			expect(components.subcategory).toBeUndefined();
			expect(components.timestepDensity).toBe(timestepDensity);
		});
		
		it('parses correct components from hierarchical ids with a procedure category, a procedure subcategory', function(){
			var components = getComponentsOfId(complicatedTsvId);
			expect(components.constituent).toBe('phosphorus');
			expect(components.category).toBe(procedureCategory);
			expect(components.subcategory).toBe(procedureSubcategory);
			expect(components.timestepDensity).toBe(timestepDensity);
		});
	});
});