// copy and paste this into a browser console to run.
// requires sugarjs

    var mockObservedProperties = function(){
        
        var wqConcentrationSuffixes = [
             'mean_annual',
             'flow_weighted',
             'sample'
        ];
        var wqConcentrations = wqConcentrationSuffixes.map(function(suffix){
            return 'conc/' + suffix;
        });
        var getWqConstituentSuffixes = function(constituentName){
            var wqConstituentSuffixes = wqConcentrations.map(function(concentration){
                return constituentName + '/' + concentration;
            });
            wqConstituentSuffixes.push(constituentName + '/loads');
            return wqConstituentSuffixes;
        };
        
        var wqConstituents = [
            'nitrogen',
            'nitrate',
            'phosphorus',
            'sediment'
        ];
        
        var waterQualitySuffixes = wqConstituents.map(getWqConstituentSuffixes).flatten();
        var streamflowSuffixes = [
                                  'real_time',
                                  'annual',
                                  'hydrograph',
                                  'flow_duration'
                                  ].map(function(subcategory){
                                      return 'streamflow/' + subcategory;
                                  });
        var root = 'https://cida.usgs.gov/def/nar/';
        var finalUrls = ([].concat(waterQualitySuffixes)).concat(streamflowSuffixes).map(function(suffix){
            return root + suffix;
        });
        
        return finalUrls;
    };
    var observedPropertyToTimeRange = {
            monthly: { 
                0 : [
                   "1983-01-01T00:00:00.000Z",
                   "2000-01-01T00:00:00.000Z"
                 ],
                1 : [
                    "1992-01-01T00:00:00.000Z",
                    "2012-01-01T00:00:00.000Z"
                  ]
            },
            annual : {
                0 : [
                     "1983-01-01T00:00:00.000Z",
                     "2010-01-01T00:00:00.000Z"
                   ],
                  1 : [
                      "1985-01-01T00:00:00.000Z",
                      "2005-01-01T00:00:00.000Z"
                    ]
            }
    };
    var mockGetDataAvailabilityResponse = function(observedProperties){
        var featureOfInterest = 'https://waterdata.usgs.gov/nwis/nwisman/?site_no=03303280';
        var createEntry = function(observedProperty){
            var oddOrEven = observedProperty.length % 2;
            var monthlyOrAnnual;
            if(observedProperty.has('sample')){
                monthlyOrAnnual = 'monthly';            
            }
            else{
                monthlyOrAnnual = 'annual';
            }
            
            var timeRange = observedPropertyToTimeRange[monthlyOrAnnual][oddOrEven];
            return {
                 "procedure" : observedProperty,
                 "observedProperty" : observedProperty,
                 "featureOfInterest" : featureOfInterest,
                  "phenomenonTime" : timeRange,
                  "valueCount" : 78// presently unused, so ok to be wrong and hardcoded
            };
        };    
        
        var entries = observedProperties.map(createEntry);
        var mockResponse = {
                "request" : "GetDataAvailability",
                "version" : "2.0.0",
                "service" : "SOS",
                "dataAvailability" : entries
        };
        return mockResponse;
    };
    observedProperties = mockObservedProperties(); 
    console.log(observedProperties.join('\n'));
    var mockResponse = mockGetDataAvailabilityResponse(observedProperties);
    console.dir(mockResponse);
    console.log(JSON.stringify(mockResponse));