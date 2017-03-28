describe('nar.timeSeries.TimeRange', function(){
    
    var TimeRange = nar.timeSeries.TimeRange;
    var globalLowestTime = 0;
    var globalLargestTime = 10000;
    var timeRangeA = new TimeRange(globalLowestTime, globalLargestTime - 1);
    var timeRangeSameAsA = new TimeRange(globalLowestTime, globalLargestTime - 1);
    var timeRangeB = new TimeRange(globalLowestTime + 1, globalLargestTime);
    describe('equals', function(){
        it('should determine that two identically-valued objects are equal', function(){
            //basic case
            expect(timeRangeA.equals(timeRangeA)).toBe(true);
            //less-trivial case
            expect(timeRangeA.equals(timeRangeSameAsA)).toBe(true);
            expect(timeRangeSameAsA.equals(timeRangeA)).toBe(true);
        });
        it('should determine that two non-identically-valued objects are not equal', function(){
            expect(timeRangeA.equals(timeRangeB)).toBe(false);
            expect(timeRangeB.equals(timeRangeA)).toBe(false);
        });
    });
    describe('clone', function(){
        it('should produce clones that .equal() the original', function(){
            expect(timeRangeA.clone().equals(timeRangeA)).toBe(true);
        });
    });
    describe('nar.timeSeries.TimeRange.ofAll', function(){
        it('should include the lowest of lows and highest of highs among multiple time ranges,', function(){
            var copyOfTimeRangeA = timeRangeA.clone();
            aggregateTimeRange = TimeRange.ofAll([timeRangeA, timeRangeB]);
            expect(aggregateTimeRange.startTime).toBe(globalLowestTime);
            expect(aggregateTimeRange.endTime).toBe(globalLargestTime);
            //ensure that the first time range passed in is not modified by the calculation
            expect(timeRangeA.equals(copyOfTimeRangeA)).toBe(true);
        });
    });

    describe('cutoff', function() {
        var cutoffStartTime = nar.timeSeries.TimeRange.START_TIME_CUTOFF;
        var customCutoffStartTime = new Date(1995, 0, 1).getTime();
        var startTime = new Date(1990, 0, 1).getTime();
        var currentWaterYear = nar.WaterYearUtils.convertDateToWaterYear(Date.create());
        var endTime = new Date(currentWaterYear, 0, 1).getTime();
        var cutoffEndTime = nar.timeSeries.TimeRange.END_TIME_CUTOFF;
        var customCutoffEndTime = new Date(2011, 0, 1).getTime();

        it('can cutoff at default times', function() {
            var result = new nar.timeSeries.TimeRange(startTime, endTime);

            expect(result).not.toBe(null);
            expect(result.startTime).toBe(startTime);
            expect(result.endTime).toBe(endTime);

            result.trimStartTime();
            expect(result.startTime).not.toBe(startTime);
            expect(result.endTime).toBe(endTime);
            expect(result.startTime).toBe(cutoffStartTime);

            result.trimEndTime();
            expect(result.endTime).not.toBe(endTime);
            expect(result.endTime).toBe(cutoffEndTime);
            expect(result.startTime).toBe(cutoffStartTime);
        });

        it('can specify custom cutoff dates', function(){
            var result = new nar.timeSeries.TimeRange(startTime, endTime);

            expect(result).not.toBe(null);
            expect(result.startTime).toBe(startTime);
            expect(result.endTime).toBe(endTime);

            result.trimStartTime();
            expect(result.startTime).not.toBe(startTime);
            expect(result.endTime).toBe(endTime);
            expect(result.startTime).toBe(cutoffStartTime);

            result.trimEndTime();
            expect(result.endTime).not.toBe(endTime);
            expect(result.endTime).toBe(cutoffEndTime);
            expect(result.startTime).toBe(cutoffStartTime);

            result.trimStartTime(customCutoffStartTime);
            expect(result.startTime).not.toBe(startTime);
            expect(result.startTime).not.toBe(cutoffStartTime);
            expect(result.startTime).toBe(customCutoffStartTime);

            result.trimEndTime(customCutoffEndTime);
            expect(result.endTime).not.toBe(endTime);
            expect(result.endTime).not.toBe(cutoffEndTime);
            expect(result.endTime).toBe(customCutoffEndTime);
        });

        it("doesn't cutoff if real data is within the time", function() {
            var result = new nar.timeSeries.TimeRange(customCutoffStartTime, customCutoffEndTime);

            expect(result).not.toBe(null);
            expect(result.startTime).toBe(customCutoffStartTime);
            expect(result.endTime).toBe(customCutoffEndTime);
            expect(result.startTime).toBeGreaterThan(cutoffStartTime);
            expect(result.endTime).toBeLessThan(cutoffEndTime);

            result.trimStartTime();
            result.trimEndTime();

            expect(result.startTime).toBe(customCutoffStartTime);
            expect(result.startTime).not.toBe(cutoffStartTime);
            expect(result.startTime).toBeGreaterThan(cutoffStartTime);
            expect(result.endTime).toBe(customCutoffEndTime);
            expect(result.endTime).not.toBe(cutoffEndTime);
            expect(result.endTime).toBeLessThan(cutoffEndTime);
        });
    });
});