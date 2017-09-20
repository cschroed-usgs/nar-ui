var nar = nar || {};
nar.GraphPopup = (function() {
	"use strict";
	var me = {};
	
	var DIALOG_ID = 'miss-graph-dialog-container';
	var POPUP_ID = 'miss-graph-dialog-content';
	
	var tsvRegistry = new nar.timeSeries.VisualizationRegistry();
	me.popup = undefined;
	me.timeSeriesViz = undefined;
	var mrbToSos = {
			constituentToConstituentId : {
				'tn' : 'TN',
				'no3_no2': 'NO3_NO2',
				'tp' : 'TP',
			},
			loadTypeToDataType : {
				'annual' : 'annual_mass',
				'may' : 'monthly_mass'
			}
	};
	
	/**
	 * Creates the load graph  
	 * @param {Object} args - with properties
	 *     siteId : String - the id of the site represented on the graph
	 *     constituent : String - the constituent to graph
	 *     loadType : String - the load type (annual or may)
	 *     target : The div element where the graph will be created.
	 * @ return a promise. The promise is resolved when the visualization has been created.
	 */
	me.createLoadGraphDisplay = function(args){
		var siteId = args.siteId,
		isVirtual = args.isVirtual,
		mrbConstituent = args.constituent,
		loadType = args.loadType,
		target = args.target;
		var vizDeferred = $.Deferred();
		var promise = vizDeferred.promise();
		var partialHeightClass = 'partial_height';
		if(isVirtual){
			target.addClass(partialHeightClass);
		}
		else{
			target.removeClass(partialHeightClass);
		}
		var constituentId = mrbToSos.constituentToConstituentId[mrbConstituent];
		var observedProperty = constituentId;
		
		var getDataAvailability = nar.util.getDataAvailability(siteId, constituentId);
		
		$.when(getDataAvailability).then(function(dataAvailability){
			dataAvailability = nar.util.translateToSosGetDataAvailability(dataAvailability);
			
			var relevantDataAvailability = dataAvailability.filter(function(datumAvailability){
				return datumAvailability.procedure.has(mrbToSos.loadTypeToDataType[loadType]) && !nar.util.stringContainsIgnoredModtype(datumAvailability.procedure); 
			});
			if(0 === relevantDataAvailability.length){
				throw Error('No data available for this constituent at this site');
			}
			
			var timeSeriesVizId = tsvRegistry.getTimeSeriesVisualizationId(relevantDataAvailability[0].observedProperty, relevantDataAvailability[0].procedure);
			var timeSeriesCollection = new nar.timeSeries.Collection();
			relevantDataAvailability.each(function(dataAvailability) {
				var observedProperty = dataAvailability.observedProperty;
				var procedure = dataAvailability.procedure;
				
			
				var basicTimeSeries = new nar.timeSeries.TimeSeries({
					observedProperty: observedProperty,
					procedure: procedure,
					featureOfInterest: siteId,
				});
				timeSeriesCollection.add(basicTimeSeries);					
			});				
	
			// Generate additional time series for baseline average, 45% reduction targets, and baseline-average
			var siteDataDeferred = $.Deferred();
			if (isVirtual && (loadType === "annual")) {
				$.ajax({
					url : CONFIG.siteAveTargetUrl,
					data : {
						site_id : siteId,
						constituent : mrbToSos.constituentToConstituentId[mrbConstituent]
					},
					contentType : 'application/json',
					success : function(response) {
						var data = {
							mean : response[loadType + '_mean'],
							target : response[loadType + '_target'],
							movingAverage : []
						};
						var i;
						for (i = 0; i < response.moving_average.length; i++) {
							var movAve = response.moving_average[i];
							if (movAve[loadType + '_moving_average']) {
								data.movingAverage.push({
									waterYear : movAve.water_year,
									ave : movAve[loadType + '_moving_average']
								});
							}
						}
	
						siteDataDeferred.resolve(data);
					},
					error : function(data) {
						siteDataDeferred.resolve({});
						throw Error('Unable to retrieve average and targets');
					}
				});
			} 
			else if (isVirtual && (loadType === 'may')) {
				// In this case we will be graphing the observed hypoxic area on the
				// graph so need to retrieve it.
				$.ajax({
					url : CONFIG.gulfHypoxicExtentUrl,
					contentType : 'application/json',
					success : function(response) {
						var i;
						var data = {
							gulfHypoxicExtent : response
						};
						siteDataDeferred.resolve(data);
					},
					error : function(data) {
						siteDataDeferred.resolve({});
						throw Error('Unable to retrieve Gulf hypoxic extent data');
					}
				});
			}
			else {
				siteDataDeferred.resolve({});
			}
			
			// Wait until the siteData has been retrieved before creating the visualization
			$.when(siteDataDeferred).then(function(response) {
				me.timeSeriesViz = new nar.timeSeries.Visualization({
					id : timeSeriesVizId,
					allPlotsWrapperElt : target,
					timeSeriesCollection : timeSeriesCollection,
					auxData : response
				});
				$.when(me.timeSeriesViz.visualize()).then(function(data) {
					vizDeferred.resolve(data);
				}, function(data) {
					vizDeferred.reject(data);
				});
			});
	});
        return promise;
		
	};

	me.create = function(args) {
		var appendToSelector = args.appendToSelector || 'body',
			popupAnchor = args.popupAnchor,
			type = args.type,
			width = args.width || null,
			height = args.height || null,
			minHeight = args.minHeight || null,
			maxHeight = args.maxHeight || null,
			constituent = args.constituent,
			contentDiv = $('<div />').addClass('miss-content-div'),
			title = args.title || '',
			feature = args.feature,
			$container = $('<div />').attr('id', DIALOG_ID).addClass('hidden'),
			$dialog = $('<div />').attr('id', POPUP_ID),
			$closeButtonContent = $('<span />').addClass('glyphicon glyphicon-remove nar-popup-dialog-close-icon'),
			dialog;
		if (me.popup) {
			me.popup.dialog('close');
		}
		
		$dialog.append(contentDiv);
		$container.append($dialog);
		$('body').append($container);
		
		dialog = $container.children().first().dialog({
			close : me.destroyPopup,
			appendTo : appendToSelector,
			title : title,
			resizable : false,
			width: width || 'auto',
			height : height || 'auto',
			minHeight : minHeight || false,
			maxHeight : maxHeight || false,
			dialogClass : args.dialogClass || 'miss-popup-dialog',
			$closeButtonContent : $('<span />').addClass('glyphicon glyphicon-remove nar-popup-dialog-close-icon'),
			position : {
				my: 'left top',
				at: 'left top',
				of: popupAnchor
			}
		});
		
		dialog.updateConstituent = function(constituent){
			var innerContent, title;
            var YEAR_MS = nar.util.MILLISECONDS_IN_YEAR;

			innerContent = $('<div />').addClass('graph-info well well-sm text-center').append($('<div />').addClass('row mississippi-grap-pup-content-graph'));
			if(constituent){
				innerContent.html('Loading...');
				contentDiv.html('');
				me.createLoadGraphDisplay({
					siteId: feature.siteId,
					isVirtual : feature.isVirtual,
					constituent: constituent,
					target: contentDiv,
					loadType: type
				}).then(
				function() {
					// Adjust axis to match time range
					var options, timeRange;
					var graphInfoElt = $('.graph-info');
					if(!feature.isVirtual){
						graphInfoElt.remove();
					}
					if (me.timeSeriesViz.plot) {
						graphInfoElt.html('');
						var canvas = $('<canvas/>');
						var popupWidth = dialog.width();
						var canvasWidth, fontSize;
						if(popupWidth > 400){
							canvasWidth = 360;
							fontSize = 10;
						}
						else if (popupWidth < 340){
							canvasWidth = 300;
							fontSize = 8;
						}
						else{
							canvasWidth = 250;
							fontSize = 6;
						}
						
						var canvasHeight;
						if('annual' === type){
							canvasHeight = 40;
						}
						else if('may' === type){
							canvasHeight = 20;
						}
						else{
							throw Error('Unrecognized load graph type: ' + type);
						}
						canvas.attr({width: canvasWidth, height: canvasHeight});
						canvas.css({
							width: canvasWidth + 'px',
							'margin-left':'auto',
							'margin-right':'auto',
							display:'block'
						});
						graphInfoElt.append(canvas);
						options = me.timeSeriesViz.plot.getOptions();
						timeRange = me.timeSeriesViz.timeSeriesCollection.getTimeRange();
						// Adjust the axis so the bars are inside the plot
						options.xaxes.each(function(axis) {
							axis.min = timeRange.startTime;
							axis.max = timeRange.endTime;
						});
						options.legend.show = false;

						var LEGEND_PADDING = 5;
						var LEGEND_SPACE_BETWEEN_LINE_AND_LABEL = 10;
						var LEGEND_SPACE_FOR_LINE = 50;
						options.canvasLegend= {
							show: true,
							container : canvas,
							font:{
								style: '',
					            size: fontSize,
					            variant: '',
					            weight: '',
					            family: 'arial'
							},
							entrySize:
								/**
						         * 
						         * @param {CanvasRenderingContext2D} legendCtx
						         * @param {Object} oneSeries - a single flot series
						         * @param {Object} options - the options passed to canvasLegend
						         * @param {Object} fontOptions - options.font merged with the font options from the plot placeholder.
						         */
						      function (legendCtx, oneSeries, options, fontOptions) {
								var label = oneSeries.label;
								legendCtx.font = fontOptions.style + " " + fontOptions.variant + " " + fontOptions.weight + " " + fontOptions.size + "px '" + fontOptions.family + "'";
					            legendCtx.textAlign = "left";
					            legendCtx.textBaseline = "bottom";
								var labelHeight = legendCtx.measureText('M').width;
								var labelWidth = legendCtx.measureText(label).width;
								return {
									width: LEGEND_PADDING + LEGEND_SPACE_FOR_LINE + LEGEND_SPACE_BETWEEN_LINE_AND_LABEL + labelWidth + LEGEND_PADDING, 
									height: LEGEND_PADDING + labelHeight + LEGEND_PADDING
								};
							},
							entryRender: 
							/**
					         * 
					         * @param {CanvasRenderingContext2D} legendCtx
					         * @param {Object} thisSeries a flot series
					         * @param {Object} options - the options in options.canvasLegend
					         * @param {Number} entryOriginX
					         * @param {Number} entryOriginY
					         * @param {Object} fontOptions - options.font merged with the font options from the plot placeholder.
					         * @param {Number} maxEntryWidth
					         * @param {Number} maxEntryHeight
					         * @returns {undefined}
					         */
					        function (legendCtx, thisSeries, options, entryOriginX, entryOriginY, fontOptions, maxEntryWidth, maxEntryHeight) {
					            var color = thisSeries.color;
					            var label = thisSeries.label;
					            legendCtx.font = fontOptions.style + " " + fontOptions.variant + " " + fontOptions.weight + " " + fontOptions.size + "px '" + fontOptions.family + "'";
					            legendCtx.textAlign = "left";
					            legendCtx.textBaseline = "bottom";
					            
					            //calcluate label dims
					            var labelHeight = legendCtx.measureText('M').width;
					            
					            //draw dashed line if available
					            if(thisSeries.dashes){
					            	if(thisSeries.dashes.show && thisSeries.dashes.dashLength){
					            		legendCtx.lineWidth = thisSeries.dashes.lineWidth;
						            	var dashLength = thisSeries.dashes.dashLength;
						            	if('undefined' === typeof dashLength[0]){//if not array
						            		dashLength = [dashLength, dashLength];//make into array
						            	}
						            	legendCtx.setLineDash(dashLength);
					            	}
					            	else if (thisSeries.lines && thisSeries.lines.lineWidth){
					            		legendCtx.lineWidth = thisSeries.lines.lineWidth;
					            	}
					            }
				            	legendCtx.strokeStyle = color;

				            	legendCtx.beginPath();
				            	var startX = entryOriginX + LEGEND_PADDING;
				            	var startAndEndY = entryOriginY + LEGEND_PADDING + 0.5 * labelHeight;
				            	legendCtx.moveTo(startX, startAndEndY);
				            	legendCtx.lineTo(startX + LEGEND_SPACE_FOR_LINE, startAndEndY);
				            	legendCtx.stroke();
				            	legendCtx.setLineDash([1,0]);
					            //draw label
					            legendCtx.fillStyle = "#000";
					            var textX = entryOriginX + LEGEND_PADDING + LEGEND_SPACE_FOR_LINE + LEGEND_SPACE_BETWEEN_LINE_AND_LABEL;
					            // for textY, we need an additional offset of labelHeight because text 
					            // is drawn above and to the right of the coords passed to context.fillText
					            var textY = entryOriginY + LEGEND_PADDING  + labelHeight;
					            legendCtx.fillText(label, textX, textY);
					        },
							layout: $.plot.canvasLegend.layouts.tableWithNColumns(2)
						};

						
						me.timeSeriesViz.plot.setupGrid();
						me.timeSeriesViz.plot.draw();
					}
					
					title = type.capitalize() + ' Load for ' + 
                    nar.Constituents[me.timeSeriesViz.getComponentsOfId().constituent].name + 
                    ' at ' + feature.staname;
					dialog.dialog('option', 'title', title);
				},
				function(reason) {
					innerContent.html('Error retrieving the data');
				}) ;
			}
			else{
				title = 'Error';
				innerContent.html('Error - Select a nutrient type from the dropdown above the opposite map');
			}
			// query-ui has a hierarchy of things it tries to auto-focus on. This hack has it auto-focus on a hidden span.
			// Otherwise it trues to focus on the first link, which in some browsers will draw an outline around it. (ugly)
			// http://api.jqueryui.com/dialog/
			var $hiddenAutoFocus = $('<span />').addClass('hidden').attr('autofocus', '');
			contentDiv.append($hiddenAutoFocus, innerContent);
			dialog.dialog('option', 'title', title);
			return dialog;
		};
		dialog.updateConstituent(constituent);
		// Replace the orange button icon with a bootstrap glyphicon
		dialog.parent().find('button').empty().append($closeButtonContent);
		
		me.popup = dialog;
		
		return dialog;
	};

	/**
	 * Remove the current popup
	 */
	me.destroyPopup = function () {
		if (me.timeSeriesViz) {
			me.timeSeriesViz.remove();
			me.timeSeriesViz = null;
		}
		if (me.popup) {
			me.popup.dialog('destroy');
			$('#' + DIALOG_ID).remove();
			me.popup = null;			
		}
	};
	
	return {
		create : me.create,
		destroyPopup : me.destroyPopup
	};
})();