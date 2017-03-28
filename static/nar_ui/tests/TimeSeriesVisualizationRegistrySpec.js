$(document).ready(function(){
	describe('nar.timeSeries.VisualizationRegistry', function(){
		CONFIG = {
				sosDefsBaseUrl : 'http://test/nar/'
		};
		var tsvRegistry,
		tsv,
		tsvId,
		elements;
		beforeEach(function(){
			tsvRegistry = new nar.timeSeries.VisualizationRegistry();
		});
		
		var instructionsElement = $('<div class="instructions"></div>');
		var allPlotsWrapperElement = $('<div class="plotsWrapper"></div>');
		elements = [instructionsElement, allPlotsWrapperElement];
		$('body').append(elements);
		tsvId = 'purple';
		tsv = new nar.timeSeries.Visualization({
			id: tsvId,
			plotter: function(){
				throw Exception('not yet implemented');
			},
			timeSeriesCollection: new nar.timeSeries.Collection(),
			instructionsElt: instructionsElement,
			allPlotsWrapperElement: allPlotsWrapperElement
		});

			it('should register() previously unregistered TSVs without error', function(){
				expect(function(){tsvRegistry.register(tsv);}).not.toThrow();
			});
			it('should throw exceptions if a user attempts to register() a previously registered TSV', function(){
				tsvRegistry.register(tsv);
				expect(function(){tsvRegistry.register(tsv);}).toThrow();
			});
			it('gets() undefined if an unknown id is requested', function(){
				expect(tsvRegistry.get('totallyBogusId!')).toBeUndefined();
			});
			it('gets() a TSV if a known id is requested', function(){
				tsvRegistry.register(tsv);
				expect(tsvRegistry.get(tsvId)).toBe(tsv);
			});
			it('returns the correct number of TSVs when calling getAll()', function(){
				var assertLength = function(length){
					expect(tsvRegistry.getAll().length).toBe(length);
				};
				assertLength(0);
				tsvRegistry.register(tsv);
				assertLength(1);
			});
			it('strips url prefixes', function(){
				var urlSuffix = 'a';
				var mockUrl = self.urlPrefix + urlSuffix;
				expect(tsvRegistry.stripUrlPrefix(mockUrl)).toBe(urlSuffix);
			});
			it('correctly parses the tail end of an sos procedure url into a TSV ID fragment', function(){
				
				var inputToExpectedOutput = {
						//category, no subcategory, modtype with underscore:
						'annual_mass/REG_4' : 'annual/mass',
						//category, no subcategory, modtype without underscore
						'annual_mass/DAILY' : 'annual/mass',
						//category, no subcategory, no modtypes:
						'daily_flow' : 'daily/flow',
						'discrete_concentration' : 'discrete/concentration',
						'monthly_flow' : 'monthly/flow',
						//category, subcategory, modtype without underscore:
						'annual_concentration_flow_weighted/COMP' : 'annual/concentration/flow_weighted',
						//category, subcategory, modtype with underscore:
						'annual_concentration_flow_weighted/REG_4' : 'annual/concentration/flow_weighted'
				};
				Object.keys(inputToExpectedOutput, function(input, expectedOutput){
					var output = tsvRegistry.strippedProcedureToTsvIdFragment(input); 
					expect(output).toBe(expectedOutput);
				});
			});
			it('returns false if user calls deregister() with a key that has not yet been registered', function(){
				expect(tsvRegistry.deregister('mockId')).toBe(false);
			});
			it('returns true if user calls deregister() with a key that has been registered', function(){
				tsvRegistry.register(tsv);
				var wasRegistered = tsvRegistry.deregister(tsv.id);
				expect(wasRegistered).toBe(true);
			});
			it('"get()" should return undefined for an id after "deregister()" is called with that id', function(){
				tsvRegistry.register(tsv);
				tsvRegistry.deregister(tsv.id);
				expect(tsvRegistry.get(tsv.id)).toBeUndefined();
			});
	});
});