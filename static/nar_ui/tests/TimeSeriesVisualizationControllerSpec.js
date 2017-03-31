$(document).ready(function(){
	describe('nar.timeSeries.VisualizationController', function(){
		//avoid typing namespaces
		var timeSeries = nar.timeSeries;
		var TimeSlider = timeSeries.TimeSlider;
		var TimeRange = timeSeries.TimeRange;
		var TimeSeriesVisualizationController = timeSeries.VisualizationController;
		//DOM fixtures
		var fixtureContainer = $('<div></div>', {
			css:{
				display: 'none'
			}
		});
		var timeSliderElt = $('<div class="timeSlider"></div>');
		fixtureContainer.append(timeSliderElt);
		//instances:
		var timeSlider, tsvController;

		describe('get currently visible and possible time ranges', function(){
			it('get() should return undefined if nothing has been set yet', function(){
				timeSlider = new TimeSlider(timeSliderElt);
				tsvController= new TimeSeriesVisualizationController(timeSlider);
				var possibleTimeRange = tsvController.getPossibleTimeRange();
				expect(possibleTimeRange).toBeUndefined();
				var visibleTimeRange = tsvController.getCurrentlyVisibleTimeRange();
				expect(visibleTimeRange).toBeUndefined();
			});
		});
		//repeat tests for 'visible' and 'possible' time range accessors and mutators
		['Possible', 'CurrentlyVisible'].each(function(kind){
			describe('get and set ' + kind + ' time range', function(){
				var tsvController, getTimeRange, setTimeRange, timeSlider, originalTimeRange, timeSliderElt;
				beforeEach(function(){
					timeSliderElt = $('<div class="timeSlider"></div>');
					fixtureContainer.append(timeSliderElt);
					timeSlider = new TimeSlider(timeSliderElt);
					tsvController= new TimeSeriesVisualizationController(timeSlider);
					getTimeRange = tsvController['get' + kind + 'TimeRange'];
					setTimeRange = tsvController['set' + kind + 'TimeRange'];
					originalTimeRange = new TimeRange(0, 10000);
					tsvController.setPossibleTimeRange(originalTimeRange);
				});
				afterEach(function(){
					timeSliderElt.remove();
				});
				it('get() should return a time range that .equals() the one stored by set()', function(){
					expect(getTimeRange().equals(originalTimeRange)).toBe(true);
				});
				it('get() should return a clone of the time range stored by set()', function(){
					expect(getTimeRange()).not.toBe(originalTimeRange);
				});
				it('set() should store a clone of the time range passed to it, not an actual reference', function(){
					//modify the original object passed to set
					originalTimeRange.startTime += 10;
					//retrieve a copy, and check that it does not .equals()
					expect(getTimeRange().equals(originalTimeRange)).toBe(false);
				});
			});
		});
		describe('"possible" and "visible" time range interdependence', function(){
			var tsvController, timeSlider, largerTimeRange, smallerTimeRange, timeSliderElt;
			beforeEach(function(){
				timeSliderElt = $('<div class="timeSlider"></div>');
				fixtureContainer.append(timeSliderElt);
				timeSlider = new TimeSlider(timeSliderElt);
				tsvController= new TimeSeriesVisualizationController(timeSlider);
				largerTimeRange = new TimeRange(0, 1e6);
				smallerTimeRange = new TimeRange(0, 1e5);
			});
			it('should set the currently visible time range to the possible time range when the possible time range is first defined', function(){
				expect(tsvController.getCurrentlyVisibleTimeRange()).toBeUndefined();
				tsvController.setPossibleTimeRange(largerTimeRange);
				expect(tsvController.getCurrentlyVisibleTimeRange().equals(largerTimeRange)).toBe(true);
			});
			
			it('should shrink the currently visible time range if the possible time range shrinks to a range smaller than the currently visible time range', function(){
				tsvController.setPossibleTimeRange(largerTimeRange);
				tsvController.setPossibleTimeRange(smallerTimeRange);
				expect(tsvController.getCurrentlyVisibleTimeRange().equals(smallerTimeRange)).toBe(true);
			});
		});
	});
});