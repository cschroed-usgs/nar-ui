//@requires nar.timeSeries.VisualizationRegistry, nar.timeSeries.Visualization
$(document).ready(
	function() {
		var id = PARAMS.siteId;
		CONFIG.startWaterYear = 1993;
		var currentDataTimeRange = new nar.timeSeries.TimeRange(
				nar.WaterYearUtils.getWaterYearStart(CONFIG.currentWaterYear, true),
				nar.WaterYearUtils.getWaterYearEnd(CONFIG.currentWaterYear, true));
		var averageDataTimeRange = new nar.timeSeries.TimeRange(
				nar.WaterYearUtils.getWaterYearStart(CONFIG.startWaterYear, true),
				nar.WaterYearUtils.getWaterYearEnd(CONFIG.currentWaterYear, true));
		var ConstituentCurrentYearComparisonPlot = nar.plots.ConstituentCurrentYearComparisonPlot;
		var ExceedancePlot = nar.plots.ExceedancePlot;            
		var NUMBER_OF_SIGNIFICANT_FIGURES = 3;
		nar.informativePopup({
			$anchor : $('#link-hover-benchmark-human'),
			content : '<div class="popover-benchmark-content">\
				Measured concentrations in water samples from <br/>\
				streams and rivers are compared to one of three <br/>\
				types of <a href="' + CONFIG.techInfoUrl + '">human-health benchmarks</a> to place the data <br/>\
				in a human-health context. Generally, concentrations <br/>\
				above a benchmark may indicate a potential human-health<br/>\
				concern if the water were to be consumed without <br/>\
				treatment for many years. None of the samples were <br/>\
				collected from drinking-water intakes. Click on each <br/> \
				bar in the graph to obtain specific benchmark <br /> \
				information for each constituent.</div>'
		});
			
			var exceedancesTitle = 'Percent of samples with concentrations greater than benchmarks';
            
			var calculateExceedance = function(tsData) {
				var BENCHMARK_THRESHOLD = 10; // mg/L
				var resultCount = tsData.length;
				//Anything with a remark code (<) should be included in the total number
				//of samples count but not in the values that exceed the benchmark.
				var exceedCount = tsData.exclude(function(value) {
					return value[1].remove('<') <= BENCHMARK_THRESHOLD || value[1].has('<');
				}).length;
				if (exceedCount === 0) {
					return {
						value : 0,
						label : 'No detections above benchmark (' + resultCount + ' samples)'
					};
				}
				else {
					var ans = (exceedCount / resultCount) * 100;
					var precision;
					if (ans >= 10) {
						precision = 0;
					} else if (ans >= 0.1) {
						precision = 1;
					}
					else {
						precision = 2;
					}
					
					return {
						value : ans,
						label : ans.format(precision)
					};
				}
			};
			
			/*
			 * @param {String} - feature for which data should be retrieved
			 * @param {Array} availability of data availability objects to be used to retrieve data
			 * @return TimeSeries.Collection containing a time series for each object in availability
			 */
			var getTimeSeriesCollection = function(availability) {
				var result = new nar.timeSeries.Collection();
				
				availability.each(function(value) {
					var ts = new nar.timeSeries.TimeSeries({
						timeRange : averageDataTimeRange,
						observedProperty : value.observedProperty,
						procedure : value.procedure,
						featureOfInterest : value.featureOfInterest
					});
					result.add(ts);
				});
				return result;
			};
            
			var getPlotValues = function(tsCollections) {			
				var avgData = [];
				var currentYearData = [];
				
				var dataValue = function(dataPoint) {
					return parseFloat(dataPoint[1]);
				};
				
				// Create data series for each collection for the avg up to the current water year and the current year.
				tsCollections.forEach(function(tsC) {
					var sortedData = tsC.getDataMerged();
					var splitData = nar.plots.PlotUtils.getDataSplitIntoCurrentAndPreviousYears(sortedData);
					
					if (splitData.previousYearsData.length === 0) {
						avgData.push(0);
					}
					else {
						avgData.push(splitData.previousYearsData.average(dataValue).toPrecision(NUMBER_OF_SIGNIFICANT_FIGURES));
					}
					if (splitData.currentYearData.length === 0) {
						currentYearData.push(0);
					}
					else {
						currentYearData.push(dataValue(splitData.currentYearData.first()));
					}	
				});
				
				return {
					average : avgData[0]/1000000,
					current : currentYearData[0]/1000000
				};
			};
			
			var graphBar = function(values, name, unit, color, barChart) {						
				var series = {
					constituentName : name,
					constituentUnit : unit,
					yearValue : values.current,
					yearColor : color,
					averageName : 'Average 1993-' + (CONFIG.currentWaterYear - 1),
					averageValue : values.average
				};

				var graph = ConstituentCurrentYearComparisonPlot(
						barChart, series);
			};		
			
			//find out what data is available for the site
			var getDataAvailability = nar.util.getDataAvailability(id);

			var streamflowDataAvailability = [];
			var nitrateDataAvailability = [];
			var phosphorusDataAvailability = [];
			var sedimentDataAvailability = [];
			
			var successfulGetDataAvailability = function(data, textStatus, jqXHR) {
				data = data.map(function(entry){
					entry.featureOfInterest = id;
					return entry;
				});
				var dataAvailability = nar.util.translateToSosGetDataAvailability(data);

				dataAvailability.each(function(dataAvailability) {
					var observedProperty = dataAvailability.observedProperty;
					var procedure = dataAvailability.procedure;
					//ignore some MODTYPEs
					if(nar.util.stringContainsIgnoredModtype(procedure)){
						return;//continue
					}
					else if (procedure.endsWith('discrete_concentration') &&
							observedProperty.endsWith('NO3_NO2')) {

						var timeSeries = new nar.timeSeries.TimeSeries(
						{
							observedProperty : observedProperty,
							procedure : procedure,
							featureOfInterest: id,
							timeRange : currentDataTimeRange
						});
	        					
						timeSeries.retrieveData().then(
							function(response) {
								//warning, this is broken, remark data not being handled! 											
								var result = calculateExceedance(response.data);
								if($('#humanHealthExccendance').length > 0){
									var humanHealthExceedancePlot = ExceedancePlot('humanHealthExceedances', 
											[
												{constituent: nar.Constituents.nitrate, data: result.value, label: result.label},
												{constituent: {color: '', name: ' '}, data: ' ', label: ['']}
											],
											exceedancesTitle
									);
								}
		        			},
	        				function(reject) {
	        					throw Error ('Could not retrieve discrete data');
	        				}
	        			);
					}
					else if (procedure.endsWith('annual_flow') && 
							observedProperty.endsWith('Q')) {

						streamflowDataAvailability.push(dataAvailability);						
                    }
					else if (procedure.endsWith('annual_mass') &&
							(observedProperty.endsWith('NO3_NO2'))) {
						
						nitrateDataAvailability.push(dataAvailability);						
					}	
					else if (procedure.endsWith('annual_mass') &&
							(observedProperty.endsWith('TP'))) {
						
						phosphorusDataAvailability.push(dataAvailability);						
					}	
					else if (procedure.endsWith('annual_mass') &&
							(observedProperty.endsWith('SSC'))) {
						
						sedimentDataAvailability.push(dataAvailability);						
					}
				});
		
				var loadStreamflowTSCollections = [];
				loadStreamflowTSCollections.push(getTimeSeriesCollection(streamflowDataAvailability));
				var loadStreamflowDataPromises = [];
				
				// Retrieve data for each time series collection
				loadStreamflowTSCollections.forEach(function(tsCollection) {
					loadStreamflowDataPromises = loadStreamflowDataPromises.concat(tsCollection.retrieveData());
				});
				
				// Sort the data once received and plot.
				$.when.apply(null, loadStreamflowDataPromises).then(function() {
					var result = getPlotValues(loadStreamflowTSCollections);
					
					var graphStreamflowBar = graphBar(result, 
							nar.Constituents.streamflow.name,
							'Million Acre-Feet',
							nar.Constituents.streamflow.color,
							'#barChart1');					
				});
				
				var loadNitrateTSCollections = [];
				loadNitrateTSCollections.push(getTimeSeriesCollection(nitrateDataAvailability));
				var loadNitrateDataPromises = [];
				
				// Retrieve data for each time series collection
				loadNitrateTSCollections.forEach(function(tsCollection) {
					loadNitrateDataPromises = loadNitrateDataPromises.concat(tsCollection.retrieveData());
				});
				
				// Sort the data once received and plot.
				$.when.apply(null, loadNitrateDataPromises).then(function() {
					var result = getPlotValues(loadNitrateTSCollections);
					
					var graphNitrateBar = graphBar(result, 
							nar.Constituents.nitrate.name,
							'Million Tons',
							nar.Constituents.nitrate.color,
							'#barChart2');						
				});
				
				var loadPhosphorusTSCollections = [];
				loadPhosphorusTSCollections.push(getTimeSeriesCollection(phosphorusDataAvailability));
				var loadPhosphorusDataPromises = [];
				
				// Retrieve data for each time series collection
				loadPhosphorusTSCollections.forEach(function(tsCollection) {
					loadPhosphorusDataPromises = loadPhosphorusDataPromises.concat(tsCollection.retrieveData());
				});
				
				// Sort the data once received and plot.
				$.when.apply(null, loadPhosphorusDataPromises).then(function() {
					var result = getPlotValues(loadPhosphorusTSCollections);
					
					var graphPhosphorusBar = graphBar(result, 
							nar.Constituents.phosphorus.name,
							'Million Tons',
							nar.Constituents.phosphorus.color,
							'#barChart3');											
				});
				
				var loadSedimentTSCollections = [];
				loadSedimentTSCollections.push(getTimeSeriesCollection(sedimentDataAvailability));
				var loadSedimentDataPromises = [];
				
				// Retrieve data for each time series collection
				loadSedimentTSCollections.forEach(function(tsCollection) {
					loadSedimentDataPromises = loadSedimentDataPromises.concat(tsCollection.retrieveData());
				});
				
				// Sort the data once received and plot.
				$.when.apply(null, loadSedimentDataPromises).then(function() {
					var result = getPlotValues(loadSedimentTSCollections);
					
					var graphSedimentBar = graphBar(result, 
							nar.Constituents.sediment.name,
							'Million Tons',
							nar.Constituents.sediment.color,
							'#barChart4');											
				});
				
				Handlebars.registerHelper('pesticideExceed', function(exceed, opt){
					if(exceed > 0){
						return opt.fn(this);	
					}else{
						return opt.inverse(this);
					}
				});
				
				var loadPesticidePromises = [];
				var serviceURL = CONFIG.endpoint.nar_webservice + 'pesticides/summary/site/' + id;
				
				// Retrieve data for each time series collection
				loadPesticidePromises = loadPesticidePromises.concat($.get(serviceURL));
				
				
				// Sort the data once received and plot.
				$.when.apply(null, loadPesticidePromises).then(function(summary) {			
					if(summary.length < 1){
						$('#noPesticideData').css('display', 'block');
						$('#pesticide').css('display', 'none');
						$('#pesticideComparisonContainer').css('display', 'none');
						$('#summaryPesticideToggle').css('display', 'none');
						$('.pesticide_report').css('display', 'none');
						return;
					}else{
						var context = summary[0];
						context.previousWaterYear = CONFIG.currentWaterYear - 1;
						$.get('../../static/nar_ui/handlebars/pesticides.handlebars', function(template){
							var compiledTemplate = Handlebars.compile(template);
							var html = compiledTemplate(context);
							//Places mustache file in correct location
							$('#pesticide').html(html);
							$('#flowChartHeader').text('Pesticides - ' + (CONFIG.currentWaterYear));
							var aquaticExceedancesString = $('#aquaticExceedances').text();
							var aquaticExceedances = aquaticExceedancesString.split(",");
							var humanExceedancesString = $('#humanExceedances').text();
							var humanExceedances = humanExceedancesString.split(",");
							$('#aquaticExceedances').html('');
							$('#humanExceedances').html('');
							$.each(aquaticExceedances, function(i, val){
								$('#aquaticExceedances').append('<p>' + val + '</p>');
							});
							$.each(humanExceedances, function(i, val){
								$('#humanExceedances').append('<p>' + val + '</p>');
							});
						});
						$.get('../../static/nar_ui/handlebars/freqUse.handlebars', function(template){
							var compiledTemplate = Handlebars.compile(template);
							var createFreqChart = function(n){
								var items = {
								            	 pestName: context['ndet' + n + 'Pname'],
								            	 topSample: context['nsamp' + n + '3'],
								            	 bottomSample: context['nsamp' + n + 'Old'],
								            	 upperUgl: context['perc' + n + '3Com'],
								            	 previousWaterYear: context['perc' + n + '3'],
								            	 lowerUgl: context['perc' + n + 'OldCom'],
								            	 oldWaterYear: context['perc' + n + 'Old'] 
								             }
								return items;
							};
							
							
							//Bar math
							var barMath = function(bar, className, ugL){
								$(bar).each(function(){
									var classWidth = $(this).find(className).attr('title');
									var uglWidth = $(this).find(ugL).attr('title');
									
									$(this).find(className).attr('title', classWidth - uglWidth + "%");
									$(this).find(ugL).attr('title', uglWidth + "%");
								});
							}
							
							//No samples analyzed message maker
							var notAnalyzed = function(className){
								$(className).each(function(){
									if($(this).width() === 0){
										$(this).parent().html('<p>Not Analyzed</p>');
									}
								});
							}
							
							//No Detections Label
							var noDetections = function(className, barSample, barText){
							    $('.freqUseChart').each(function(){
							        if($(this).find(barSample).text() !== '0' && $(this).find(className).length === 0){
							            $(this).find(barText).html('<p>No Detections</p>');
							        }
							    });
							}
							
							//Gets rid of ugL border if it does not exist
							var ugLBorder = function(ugL){
								$(ugL).each(function(){
									if($(this).width() === 0){
										$(this).css('border', 'none');
									}
								});
							}; 
							
							//Cycles through the webservice to create the graphs
							var hbarData = [];
							for (var i=1; i<=10; i++) {
								hbarData[i] = createFreqChart(i);
							}
							
							//Handlebars template
							var html = compiledTemplate(hbarData);
							//Places mustache file in correct location
							$('#freqUseGraphContainer').html(html);
							$('#currentWaterYear').text((CONFIG.currentWaterYear));
							
							barMath('.upperBar', '.previousWaterYear', '.ugL');
							barMath('.lowerBar', '.oldWaterYear', '.ugL');
							notAnalyzed('.previousWaterYear');
							notAnalyzed('.oldWaterYear');
							noDetections('.previousWaterYear', '.topSample', '.upperBar');
							noDetections('.oldWaterYear', '.bottomSample', '.lowerBar');
							ugLBorder('.ugL');
						});
					}
					
					//Benchmark Pesticides Comparisons
					var hhBenchmarkComparison = function(selector, summaryData, type, benchmark){
						var getXAxisBounds;
						var getBenchmarkColor;
						
						//Maps type and benchmark to service data
						var crossWalk = function(data, type, benchmark){
							var result = {};
							var mapping = {
									values: [], 
									analyzed: [],
									wBenchmarks: [],
									exceedances: []
							};
							
							if(type === '%' && benchmark === 'human'){
								mapping.values = ['percHhOld', 'percHh3', 'percHh'];
								mapping.analyzed = ['nOldAve', 'n3', 'nNew'];
								mapping.wBenchmarks = ['nOldHh', 'npest3Hh', 'npestNewHh'];
							}
							else if(type === 'number' && benchmark === 'human'){
								mapping.values = ['nHhOld', 'nHh3', 'nHh'];
								mapping.exceedances = ['pestOldExceedHh', 'pest3ExceedHh', 'pestNewExceedHh'];
								mapping.analyzed = ['nOldAve', 'n3', 'nNew'];
								mapping.wBenchmarks = ['nOldHh', 'npest3Hh', 'npestNewHh'];
							}
							else if(type === '%' && benchmark === 'aquatic'){
								mapping.values = ['percAqOld', 'percAq3', 'percAq'];
								mapping.analyzed = ['nOldAve', 'n3', 'nNew'];
								mapping.wBenchmarks = ['nOldAq', 'npest3Aq', 'nNewAq'];
							}
							else if(type === 'number' && benchmark === 'aquatic'){
								mapping.values = ['nAqOld', 'nAq3', 'nAq'];
								mapping.exceedances = ['pestOldExceedAq', 'pest3ExceedAq', 'pestNewExceedAq'];
								mapping.analyzed = ['nOldAve', 'n3', 'nNew'];
								mapping.wBenchmarks = ['nOldAq', 'npest3Aq', 'nNewAq'];
							}
							//Expects an array of an array
							result.values = mapping.values.map(function(slot){
								return data[slot];
							});
							result.analyzed = mapping.analyzed.map(function(slot){
								return data[slot];
							});
							result.wBenchmarks = mapping.wBenchmarks.map(function(slot){
								return data[slot];
							});
							result.exceedances = mapping.exceedances.map(function(slot){
								return data[slot];
							});
							
							return result;
						};
						
						var data = crossWalk(summaryData, type, benchmark);
						
						//Checking For 0 and switching it for message
						$.each(data.values, function(index, value){
							if(value === 0 && index !== 2){
								data.values[index] = 'No Exceedances';
							}
							else if(value === 0 && index === 2){
								data.values[index] = 'No Data Available';
							}
						});
					
						//Sets X axis numbers
						if(type === '%'){
							getXAxisBounds = function(){
								return {min:0, max:100};
							}
						}
						else if(type === 'number'){
							getXAxisBounds = function(){
								var xAxisNumbers = crossWalk(summaryData, type, benchmark);
								if(xAxisNumbers.values.max() < 10){
									return{
										min: 0,
										max: 10
									}
								}else{
									return {
										min:0, 
										max: xAxisNumbers.values.max() + 25
									};
								}
							}
						}
						
						//Deciding which BG and Bar Color a chart will get
						if(benchmark === 'human'){
							getBenchmarkColor = function(){
								return {
									BG: '#eaf1dd',
									Bar:'#b1d274'
								}
							}
						}else if(benchmark === 'aquatic'){
							getBenchmarkColor = function(){
								return {
									BG: '#dae5f1',
									Bar: '#4f81bd'
								}
							}
						}
						
						//Giving the charts their design
						var ticks = ['1992 - 2012 (Annual average)', '2013 - ' + (CONFIG.currentWaterYear - 1), (CONFIG.currentWaterYear)];
						$.jqplot(selector, [data.values],  {
							axesDefaults: {
								tickOptions:{
									formatString: '%d'
								}
							},
							axes:{
								xaxis: getXAxisBounds(),
								yaxis:{
									renderer: $.jqplot.CategoryAxisRenderer,
									ticks: ticks
								}
							},
							grid:{
								background: getBenchmarkColor().BG
							},
							seriesDefaults:{
								renderer:$.jqplot.BarRenderer,
								shadow:false,
								color: getBenchmarkColor().Bar,
								rendererOptions:{
									barDirection:'horizontal',
									barMargin: 25
								},
								pointLabels:{
									show:true, 
									formatString: '%s'
								}
							}		
						});
						
						//Creating the popup for benchmark exceedances
						$.each(data.exceedances, function(index, value){
							var labelClick = $('#' + selector + ' .jqplot-point-' + index);
							var popUpExceedances = value.split(",");
							labelClick.on('click', function(e){
								if(value !== ''){
									$('.yearPopUp').remove();
									$('.comparisonPopUp').remove();
									//Stops Document click preventing popUp appearing
									e.stopPropagation();
									//Appends PopUp
									$('#' + selector).append('<div class="comparisonPopUp ' + 'rowComparison-' + index +'"></div>');
									//Goes through array of strings and splits them into individual paragraph elements
									$.each(popUpExceedances, function(i, val){
										$('.comparisonPopUp').append('<p>' + val + '</p>');
									});
								}
							});
							$(document).on('click', function(){
								if($('.comparisonPopUp').css('display', 'block')){
									$('.comparisonPopUp').remove();
								}
							});
						});
						
						//Creating the popup of pesticides analyzed
						var labelClick = $('#' + selector + ' .jqplot-yaxis-tick');
						$.each(data.analyzed, function(index, value){
							var numAnalyzed = data.analyzed[index];
							var numWBenchmark = data.wBenchmarks[index];
							$(labelClick[index]).on('click', function(e){
								var popUpText = '';
								//Hides any existing popUp
								$('.comparisonPopUp').remove();
								$('.yearPopUp').remove();
								//Stops Document click preventing popUp appearing
								e.stopPropagation();
								//Creates year popup
								if(value !== ''){
									popUpText += '<p>' + numAnalyzed + ' samples analyzed</p>';
									popUpText += '<p>' + numWBenchmark + ' pesticides with acute or chronic ALBs</p>';
									$('#' + selector).append('<div class="yearPopUp ' + 'yearComparison-' + index + '">' + popUpText + '</div>');
								}
							});
							$(document).on('click', function(){
								if($('.yearPopUp').css('display', 'block')){
									$('.yearPopUp').remove();
								}
							});
						});
					
					}
					
					hhBenchmarkComparison('percentHuman', context, '%', 'human');
					
					hhBenchmarkComparison('numberHuman', context, 'number', 'human');
					
					hhBenchmarkComparison('percentAquatic', context, '%', 'aquatic');
					
					hhBenchmarkComparison('numberAquatic', context, 'number', 'aquatic');
					
				});
			};
			
			//Toggles the pesticide graphs
			$('#pesticideToggleButton').on('click', function(){
				$('#pesticideComparisonContainer').toggle();
				$('#freqUseGraphContainer').toggle();
				$('#clearLeft').toggleClass('spotme');
			});
			
			var failedGetDataAvailability = function(data, textStatus,jqXHR) {
				var msg = 'Could not determine data availability for this site';
				// Errors are caught by window and alert is displayed
				throw Error(msg);
			};

			$.when(getDataAvailability).then(
				successfulGetDataAvailability,
				failedGetDataAvailability);	
	});