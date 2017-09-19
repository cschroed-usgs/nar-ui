//@requires nar.timeSeries.Visualization, nar.timeSeries.TimeSlider
var nar = nar || {};

(function(){

nar.timeSeries = nar.timeSeries || {};

//private static properties:
var hiddenClass = 'hide';

/**
 * 
 * This class handles updating the time slider when 
 * time series are added or removed from view. 
 * 
 * @class
 * @param {nar.timeSeries.TimeSlider}
 */
nar.timeSeries.VisualizationController = function(timeSlider, instructionsElt){
    var self = this;
    self.instructionsElt = instructionsElt;
    timeSlider.on('slidechange', function(event, ui){
        var timeRange = new nar.timeSeries.TimeRange(
                ui.values[0],
                ui.values[1]
        );
        
        self.setCurrentlyVisibleTimeRange(timeRange);
    });
    self.timeSlider = timeSlider;
    
    //During initial implementation, difficulties arose from accidentally modifying
    //TimeRange objects instead of modifying copies of TimeRange objects. To avoid these bugs 
    //we force everyone, including class members, to use accessors and setters that deal in clones.
    //We hide the inner variables from class members using closures and function-scoping
    (function(){
        var currentlyVisibleTimeRange;
        
        /**
         * @returns {nar.timeSeries.TimeRange|undefined} a copy of the currently visible time range,
         * or undefined if no range is currently visible
         */
        self.getCurrentlyVisibleTimeRange = function(){
            var timeRange = undefined;
            if(currentlyVisibleTimeRange){
                timeRange = currentlyVisibleTimeRange.clone();
            }
            return timeRange;
        };
        /**
         * Sets the currently visible time range to a copy of the time range passed in
         * @param {nar.timeSeries.TimeRange} timeRange
         * 
         */
        self.setCurrentlyVisibleTimeRange = function(timeRange){
            if(undefined === timeRange){
                currentlyVisibleTimeRange = undefined;
            }
            //prevent cyclic event triggering, expensive updates
            else if(!timeRange.equals(currentlyVisibleTimeRange)){
                currentlyVisibleTimeRange = timeRange.clone();
                
                Object.values(self.currentlyVisibleTimeSeriesVisualizations, function(tsv){
                    zoomTsvToTimeRange(tsv, currentlyVisibleTimeRange);
                });
                self.timeSlider.slider('option', 'values', [currentlyVisibleTimeRange.startTime, currentlyVisibleTimeRange.endTime]);
            }
        };
    }());
    var zoomTsvToTimeRange = function(tsv, timeRange){
        var plot = tsv.plot;
        var allowTimeSlider = tsv.allowTimeSlider;
        //plot may not be defined yet. In that case, skip it --
        //zooming on that plot will be handled by a subsequent 
        //asynchronous call
        if (plot){
            var options = plot.getOptions();
			if (allowTimeSlider) {
				options.xaxes.each(function(axis) {
					axis.min = timeRange.startTime;
			        axis.max = timeRange.endTime;
			    });
			}
            plot.setupGrid();
            plot.draw();
        }
    };
    (function(){
       var possibleTimeRange;
       /**
        * @returns {nar.timeSeries.TimeRange|undefined} a copy of the possible time range,
        * or undefined
        */
       self.getPossibleTimeRange = function(){
           var timeRange = undefined;
           if(possibleTimeRange){
               timeRange = possibleTimeRange.clone();
           }
           return timeRange;
       };
       /**
        * Sets the possible time range to a copy of the time range passed in
        * @param {nar.timeSeries.TimeRange} timeRange
        * 
        */
       self.setPossibleTimeRange = function(timeRange){
           if(undefined === timeRange){
               possibleTimeRange = undefined;
               self.timeSlider.slider('option', 'disabled', true);
           }
           else{
               possibleTimeRange = timeRange.clone();
               self.timeSlider.slider('option', 'disabled', false);
               self.timeSlider.slider('option', 'min', possibleTimeRange.startTime);
               self.timeSlider.slider('option', 'max', possibleTimeRange.endTime);
               var visibleTimeRange = self.getCurrentlyVisibleTimeRange();
               //if visible time range has not yet been set 
               if(undefined === visibleTimeRange){
                   self.setCurrentlyVisibleTimeRange(possibleTimeRange);
               }
               else {
                   //the possible time range could have shrunk so that it is smaller
                   //than the visible time range. In this case, restrict the visible 
                   //time range to bounds the new possible time range
                   var clampedTimeRange = new nar.timeSeries.TimeRange(
                       Math.max(possibleTimeRange.startTime, visibleTimeRange.startTime),
                       Math.min(possibleTimeRange.endTime, visibleTimeRange.endTime)
                   );
                   self.setCurrentlyVisibleTimeRange(clampedTimeRange);
               }
               timeSlider.updateLabels();
           }
       };
    }());
    
    /*
     * Map<String, TimeSeriesVisualizations>
     */
    self.currentlyVisibleTimeSeriesVisualizations = {};
    /**
     * @param {array<TimeSeriesVisualization>} tsvsToVisualize 
     */
	self.visualizeAll = function(tsvsToVisualize){
		var tsvsForTimeSlider = tsvsToVisualize.filter(function(tsv) {
			return tsv.allowTimeSlider;
		});
        var incomingTimeRanges = tsvsForTimeSlider.map(function(tsv){return tsv.timeSeriesCollection.getTimeRange();});

        var vizPromises = tsvsToVisualize.map(function(tsv){
            self.currentlyVisibleTimeSeriesVisualizations[tsv.id] = tsv;
            
            var promise = tsv.visualize();
			promise.done(function(){
				self.instructionsElt.addClass(hiddenClass);
			});
            return promise;
        });
        
		$.when.apply(null, vizPromises).done(function(){
			// This needs to be done after promises have resolved so that possibleTimeRange is the current one.
            var timeRangesToSearch;
            var possibleTimeRange = self.getPossibleTimeRange();
            if(possibleTimeRange){
                timeRangesToSearch = incomingTimeRanges.concat(possibleTimeRange);
            }
            else{
                timeRangesToSearch = incomingTimeRanges;
            }
            var aggregateTimeRange = nar.timeSeries.TimeRange.ofAll(timeRangesToSearch);
            
            self.setPossibleTimeRange(aggregateTimeRange);//might adjust currently visible range
            //now zoom recently added plots to the currently visible range
            var recentlyVisualizedTimeSeriesVisualizations = Array.create(arguments).filter(function(arg){
                return ((arg !== undefined) && arg.allowTimeSlider);
            });
            var currentTimeRange = self.getCurrentlyVisibleTimeRange();
            recentlyVisualizedTimeSeriesVisualizations.each(function(tsv){
                zoomTsvToTimeRange(tsv, currentTimeRange);
            });
        });
    };
    
    /**
     * @param {array<TimeSeriesVisualization>} tsvsToVisualize 
     */
	self.removeAll = function(tsvsToRemove){
		tsvsToRemove.each(function(tsv){
			tsv.remove();
			delete self.currentlyVisibleTimeSeriesVisualizations[tsv.id];
			if(Object.keys(self.currentlyVisibleTimeSeriesVisualizations).length == 0){
				self.instructionsElt.removeClass(hiddenClass);
			}
		});

		var remainingTimeRanges = [];
		Object.values(
				self.currentlyVisibleTimeSeriesVisualizations, 
				function(tsv){
					if (tsv.allowTimeSlider) {
						remainingTimeRanges.push(tsv.timeSeriesCollection.getTimeRange());
					}
				}
		);
		//the only case where we modify the user's selection on removal is if we have .removed() all
		//time series visualizations -- in that case we undefine the currently visible time range
		if(remainingTimeRanges.isEmpty()){
			self.setCurrentlyVisibleTimeRange(undefined);
		}
		
		var aggregateTimeRange = nar.timeSeries.TimeRange.ofAll(remainingTimeRanges);
		self.setPossibleTimeRange(aggregateTimeRange);

	};   
};

}());
