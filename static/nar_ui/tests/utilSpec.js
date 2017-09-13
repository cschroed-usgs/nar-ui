describe('Tests for nar.util', function() {
	
	it('Expects utility functions to be defined', function() {
		expect(nar.util.assert_selector_present).toBeDefined();
		expect(nar.util.getTimeStamp).toBeDefined();
		expect(nar.util.objectHasAllKeysAndValues).toBeDefined();
	});
	describe('getTimeStamp', function(){
		var getTimeStamp = nar.util.getTimeStamp;
		it('gets the correct timestamp for a date object', function(){
			expect(getTimeStamp(Date.utc.create(0))).toBe(0);
		});
		it('gets the correct timestamp for an ISO-8601 date string', function(){
			var unixEpoch = '1970-01-01T00:00:00Z';
			expect(getTimeStamp(unixEpoch)).toBe(0);
		});
		it('gets the correct timestamp for a number', function(){
			expect(getTimeStamp(0)).toBe(0);
		});
	});
	describe('assert_selector_present', function(){
		var assert_selector_present = nar.util.assert_selector_present;
		it('throws an exception if called with a selector that does not match an existing element', function(){
			var bogusSelector = '#noWayJoseYouArentEvenThere';
			expect(function(){assert_selector_present(bogusSelector);}).toThrow();
		});
		it('does not throw an exception if called with a selector that matches an existing element', function(){
			
			var id = 'myAwesomeId';
			var selector = '#' + id;
			//this is appending script tag to the head because 'body' is not always loaded when the spec runner
			//has loaded
			$('head').append($('<script></script>', {id: id}));
			expect(
				function(){assert_selector_present(selector);}
			).not.toThrow();
		});
	});
	describe('nar.util.objectHasAllKeysAndValues', function(){
		var objectHasKeysAndValues = nar.util.objectHasAllKeysAndValues; 
		var base = {a: 1, b:undefined, c:null, d:'blah'};
		var noSharedBase = {w:'', x:'', y:'', z:''};
		
		it('should return true when both objects are identical', function(){
			expect(objectHasKeysAndValues(base, base)).toBe(true);
		});
		it('should return true when one object is a clone of the other', function(){
			var baseClone = {a: 1, b:undefined, c:null, d:'blah'};
			expect(objectHasKeysAndValues(base, baseClone)).toBe(true);
		});
		it('should return true when keysAndValues is a subset of obj', function(){
			var baseSubset1 = {a: 1, b:undefined, c:null};
			var baseSubset2 = {b:undefined, c:null, d: 'blah'};
			expect(objectHasKeysAndValues(base, baseSubset1)).toBe(true);
			expect(objectHasKeysAndValues(base, baseSubset2)).toBe(true);
		});
		it('should return false when keysAndValues is a superset of obj', function(){
			//superset cases
			var baseSuperset1 ={a: 1, b:undefined, c:null, d:'blah', e: '34'};
			var baseSuperset2 ={a: 1, b:undefined, c:null, d:'blah', e: '34', f: 42};
			expect(objectHasKeysAndValues(base, baseSuperset1)).toBe(false);
			expect(objectHasKeysAndValues(base, baseSuperset2)).toBe(false);
		});
		it('should return false when the objects have matching keys but have different primitive values', function(){
			//case where objects have matching keys but no matching values
			var sharedKeysButDifferentValues = {a: 42, b:235, c:3456, d:302498}
			expect(objectHasKeysAndValues(base, noSharedBase)).toBe(false);
		});
		it('should return false when the objects have matching keys, but non-primitive values fail to be strictly equal', function(){
			var a = {d:[]};
			var b = {d:[]};
			var e = {g:{}};
			var f = {g:{}};
			expect(objectHasKeysAndValues(a, b)).toBe(false);
			expect(objectHasKeysAndValues(e, f)).toBe(false);
		});
		it('should return false when obj and keysAndValues share no keys', function(){
			expect(objectHasKeysAndValues(base, noSharedBase)).toBe(false);
		});
	});
	describe('stringContainsIgnoredModtype', function(){
		it('should return false if string does not contain any ignored modtypes', function(){
			expect(nar.util.stringContainsIgnoredModtype('a')).toBe(false);
		});
		it('should return true if string does contain any ignored modtypes', function(){
			//it should detect strings containing only the ignored modtypes
			var dataWithIgnoredModtypes = [].concat(nar.util.IGNORED_MODTYPES);
			dataWithIgnoredModtypes.each(function(aString){
				expect(nar.util.stringContainsIgnoredModtype(aString)).toBe(true);
			});
			//it should detect the ignored modtypes even if they are embedded in other strings
			dataWithIgnoredModtypes = nar.util.IGNORED_MODTYPES.map(function(ignoredModtype){
				return 'a' + ignoredModtype + 'b';
			});
			dataWithIgnoredModtypes.each(function(aString){
				expect(nar.util.stringContainsIgnoredModtype(aString)).toBe(true);
			});
		});
	});
	describe('getSosProcedureForTimeSeriesCategoryAndTimeStepDensity', function(){
		it('should correctly convert "load" timeSeriesCategory values to "mass" in the sos procedure', function(){
			var expected = 'annual_mass';
			var result = nar.util.getSosProcedureForTimeSeriesCategoryAndTimeStepDensity('LOAD', 'ANNUAL')
			expect(expected).toBe(result);
		});
		it('should put timeSeriesCategory values that aren\'t "load" into the sos procedure without conversion', function(){
			var expected = 'daily_concentration_flow_weighted';
			var result = nar.util.getSosProcedureForTimeSeriesCategoryAndTimeStepDensity('CONCENTRATION_FLOW_WEIGHTED', 'DAILY');
			expect(expected).toBe(result);
		});
	});
	describe('translateToSosGetDataAvailability', function(){
		it('should create a "mass", "yield", and a "flow_weighted_concentration" sos data availability object for each response entry with timeSeriesCategory=="load"', function(){
			
			//construct input
			
			var featureOfInterest = '007', 
			firstConstituent = 'firsty',
			firstTimeStepDensity = 'annual',
			firstStartTime = '1916-02-17T20:39:56.053Z',
			firstEndTime = '2016-02-17T20:39:56.053Z',
			secondConstituent = 'secondy',
			secondTimeStepDensity = 'daily'
			secondStartTime = '1915-02-17T20:39:56.053Z',
			secondEndTime = '2015-02-17T20:39:56.053Z',
			timeSeriesCategory = 'load',
			firstExtraProcedure = 'concentration_flow_weighted',
			secondExtraProcedure = 'yield';
				
			
			var narAvailabilityResponse = [
			                               {
			                            	   timeSeriesCategory : timeSeriesCategory,
			                            	   timeStepDensity : firstTimeStepDensity,
			                            	   constit : firstConstituent,
			                            	   startTime : firstStartTime,
			                            	   endTime : firstEndTime,
			                            	   featureOfInterest: featureOfInterest
			                               },
			                               {
			                            	   timeSeriesCategory : timeSeriesCategory,
			                            	   timeStepDensity : secondTimeStepDensity,
			                            	   constit : secondConstituent,
			                            	   startTime : secondStartTime,
			                            	   endTime : secondEndTime,
			                            	   featureOfInterest: featureOfInterest,
			                               }
            ];
			
			//construct expected output
			var expectedSosGetDataAvailability = [
                  {
                	  featureOfInterest: featureOfInterest,
                	  procedure : firstTimeStepDensity + '_mass',
                	  observedProperty: firstConstituent,
                	  phenomenonTime : [
    	                    firstStartTime,
    	                    firstEndTime
                      ],
                  },
                  {
                	  featureOfInterest: featureOfInterest,
                	  procedure : firstTimeStepDensity + '_' + firstExtraProcedure,
                	  observedProperty: firstConstituent,
                	  phenomenonTime : [
    	                    firstStartTime,
    	                    firstEndTime
                      ],
                  },
                  {
                	  featureOfInterest: featureOfInterest,
                	  procedure : firstTimeStepDensity + '_' + secondExtraProcedure,
                	  observedProperty: firstConstituent,
                	  phenomenonTime : [
    	                    firstStartTime,
    	                    firstEndTime
                      ],
                  },
                  {
                	  featureOfInterest: featureOfInterest,
                	  procedure : secondTimeStepDensity + '_mass',
                	  observedProperty: secondConstituent,
                	  phenomenonTime : [
    	                    secondStartTime,
    	                    secondEndTime
                      ],
                  },
                  {
                	  featureOfInterest: featureOfInterest,
                	  procedure : secondTimeStepDensity + '_' + firstExtraProcedure,
                	  observedProperty: secondConstituent,
                	  phenomenonTime : [
    	                    secondStartTime,
    	                    secondEndTime
                      ],
                  },
                  {
                	  featureOfInterest: featureOfInterest,
                	  procedure : secondTimeStepDensity + '_' + secondExtraProcedure,
                	  observedProperty: secondConstituent,
                	  phenomenonTime : [
    	                    secondStartTime,
    	                    secondEndTime
                      ],
                  }
            ];
			
			//get actual
			var actualSosGetDataAvailability = nar.util.translateToSosGetDataAvailability(narAvailabilityResponse);
			
			//verify
			expect(expectedSosGetDataAvailability.length).toBe(actualSosGetDataAvailability.length);
			expectedSosGetDataAvailability.zip(actualSosGetDataAvailability).each(function(expectedActualPair){
				var expected = expectedActualPair[0],
				actual = expectedActualPair[1];
				expect(Object.equal(expected, actual)).toBe(true);
			});
		});
	});
	describe('getTimestampForResponseRow', function(){
		it('should create the correct timestamp when only a numeric water year is provided', function(){
			var input = {wy: 1990};
			var expected = new Date(1990, 0, 1).getTime();
			var actual = nar.util.getTimestampForResponseRow(input);
			expect(expected).toBe(actual);
		});
		
		it('should create the correct timestamp when a numeric water year and month are provided', function(){
			var input = {wy: 1990, month: 1};
			var expected = new Date(1990, 0, 1).getTime();
			var actual = nar.util.getTimestampForResponseRow(input);
			expect(expected).toBe(actual);
		});
		
		it('should create the correct timestamp when a full string date is provided', function(){
			var input = {date: "1990-01-01"};
			var expected = new Date(1990, 0, 1).getTime();
			var actual = nar.util.getTimestampForResponseRow(input);
			expect(expected).toBe(actual);
		});
	});
});