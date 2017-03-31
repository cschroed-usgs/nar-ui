// copy and paste this into a browser console to run.
// requires sugarjs
    /**
     * @param {string} frequency - a singularized string representing a unit of time ex :'year', 'month', 'day' 
     */
    var mockData = function(minYear, maxYear, minValue, maxValue, frequency){
        var mockDataSet = [];
        var minYearDate = Date.create(''+minYear);
        var maxYearDate = Date.create(''+maxYear); 
        Date.range(minYearDate, maxYearDate).every(frequency, function(date){
            var value = Number.random(minValue, maxValue);
            var timestamp = date.getTime();
            mockDataSet.push([timestamp, value]);
        });
        //remove the last month -- it is in the next year.
        mockDataSet.pop();
        return mockDataSet;
    };
    
    var mockDataParameters = [
                              [1983, 2000, 0, 100, 'month'],
                              [1992, 2012, 0, 1000, 'month'],
                              [1993, 2010, 0, 50, 'year'],
                              [1985, 2005, 0, 25, 'year']
                              ];
    var mockDataSets = mockDataParameters.map(function(parameters){
        return {
            data: mockData.apply({}, parameters)
        };
    });
    
    mockDataSets.each(function(dataSet){
        console.log(JSON.stringify(dataSet));
    });