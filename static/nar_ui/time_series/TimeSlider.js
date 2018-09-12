//@requires nar.WaterYearUtils
var nar = nar || {};
(function(){
nar.timeSeries = nar.timeSeries || {};
/**
 * @param {jquery Element}
 */
nar.timeSeries.TimeSlider = function(timeSliderElt){
    //Do not initialize any event handlers here;
    //event handling is added when you
    //pass a TimeSlider instance to the
    //TimeSeriesVisualizationController constructor
    var slider = timeSliderElt.slider({
        range: true,
        disabled: true
    });
    slider = slider.slider('float', {
        formatLabel: function(timeStamp){
            return nar.WaterYearUtils.convertDateToWaterYear(timeStamp);
        }
    });
    
    var labelsClass= 'slider_label_container';
    var labelsSelector = '.' + labelsClass; 
    var labelClass = 'slider_label';
    var labelSelector = '.' + labelClass;
    
    var labelsContainer = $('<div></div>', {
        class: labelsClass
    });
    var labels = [];
    timeSliderElt.append(labelsContainer);
    slider.updateLabels = function(){
        labels.each(function(label){label.remove();});
        var possibleMin = slider.slider('option', 'min');
        var possibleMax = slider.slider('option', 'max');
        var years = nar.timeSeries.TimeSlider.getYearTicks(possibleMin, possibleMax);
        
        labels = years.map(function(year, index){
            var percent = index * 10;
            var label = $('<label>' + year + '</label>',{
            });
            label.css('left', percent + '%');
            label.addClass(labelClass);
            return label;
        });
        labelsContainer.append(labels);
    };

    return slider;
};

nar.timeSeries.TimeSlider.getYearTicks = function(possibleMin, possibleMax){
    var years = [];
    var possibleRange = Number.range(possibleMin, possibleMax);
    var possibleDifference = possibleMax - possibleMin;
    var stepTotal = 10;
    var stepIncrement = possibleDifference / stepTotal;
    var offset = possibleMin;
    var percentRange = Number.range(0, 100);
    percentRange.every(10, function(percent){
        var year = nar.WaterYearUtils.convertDateToWaterYear(((percent / 100)*possibleDifference) + possibleMin);
        years.push(year);
    });
    return years;
};

}());