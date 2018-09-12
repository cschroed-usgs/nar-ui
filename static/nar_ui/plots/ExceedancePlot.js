var nar = nar || {};
nar.plots = nar.plots || {};
(function(){

    /**
     * @param {String} plotEltId the id where the plot will be rendered. Do not include a '#'
     * @param {Object} a series specification - an array of objects having the format
     * [
     *      {
     *          constituent: nar.Constituent.nitrogen
     *          data: [75]
     *      },
     *      {
     *          constituent: nar.Constituent.total_phosphorus
     *          data: [33]
     *      },
     *      
     * ]
     * @param {String} title - the title of the graph
     * returns {jquery.flot}
     */
    
   var ExceedancePlot = function(plotEltId, seriesSpecifications, axisLabel){
       
       nar.util.assert_selector_present('#'+plotEltId);
       $.jqplot.config.enablePlugins = true;
       var data = seriesSpecifications.map(function(seriesSpec){return [seriesSpec.data, seriesSpec.constituent.name];});
       var seriesOptions = seriesSpecifications.map(function(seriesSpec){return seriesSpec.constituent.color;});
       var labels = seriesSpecifications.map(function(seriesSpec) { return seriesSpec.label; });
       var plot = $.jqplot(plotEltId, 
       [
        data
       ],
       {
           seriesDefaults:{
               renderer: $.jqplot.BarRenderer,
               rendererOptions: {
                   barDirection: 'horizontal',
                   varyBarColor: true,
                   barWidth: 40,
                   shadowDepth : 0
               },
               pointLabels: {
                   show: true,
                   location: 'e',
                   edgeTolerance: -30,
                   labels : labels
               }
           },
           seriesColors: seriesOptions,
           axes:{
               yaxis: {
                   renderer: $.jqplot.CategoryAxisRenderer,
                   tickRenderer: $.jqplot.AxisTickRenderer,
                   tickOptions:{
                       labelPosition: 'middle',
                       showGridline: false
                   }
               },
               xaxis: {
                   //restrict to percent range
                   max: 100,
                   min: 0,
                   label: axisLabel
                  
               }
           },
           grid: {
    		   drawGridLine: false
    	   },
    	   highlighter: {
    		   show : true,
    		   tooltipLocation : 'n',
    		   tooltipOffset : 15,
    		   formatString : 'EPA MCL = 10 mg/L as N. See Technical Information for details.'
    	   }
       
       });
       //make plots responsive by replotting on window resize event 
       $(window).resize(function() {
           plot.replot();
       });
       
       return plot;
   };
    nar.plots.ExceedancePlot = ExceedancePlot;
}());