var nar = nar || {};
nar.ContributionDisplay = (function() {
	"use strict";
	var me = {};
	
	me.plots = {};
	
	me.attributeColorMap = {
		"ATCHAFALAYA" : {
			"color" : "#B3A6A3",
			"title" : "Red/Atchafalaya Rivers",
			"shpAttr" : "atch"
		},
		"MISSOURI" : {
			"color" : "#BFEBA8",
			"title" : "Missouri River",
			"shpAttr" : "missouri"
		},
		"ARKANSAS" : {
			"color" : "#FFCFD5",
			"title" : "Arkansas River",
			"shpAttr" : "missouri"
		},
		"OHIO" : {
			"color" : "#FCEFBE",
			"title" : "Ohio River",
			"shpAttr" : "ohio"
		},
		"UPPERMISS" : {
			"color" : "#00C9E2",
			"title" : "Upper Mississippi",
			"shpAttr" : "upper"
		},
		"UPPERMIDDLEMISS" : {
			"color" : "#00F5FA",
			"title" : "Upper Middle Mississippi",
			"shpAttr" : "upperMiddle"
		},
		"LOWERMIDDLEMISS" : {
			"color" : "#CCE7F0",
			"title" : "Lower Middle Mississippi",
			"shpAttr" : "lowerMiddle"
		},
		"LOWERMISS" : {
			"color" : "#F3F2FB",
			"title" : "Lower Mississippi",
			"shpAttr" : "lower"
		}
	};
	
	me.getConstituentData = function (args) {
		args = args || {};
		var callbacks = args.callbacks,
			parameters = args.parameters;
		
		$.ajax(CONFIG.mrbSubBasinContributionsUrl, {
			data : parameters,
			scope : me,
			success : callbacks.success,
			error : callbacks.error
		});
	};
	
	me.createLegendData = function (data,parameters) {
		var sortedData = [];
		for (var k in data) {
			if (data.hasOwnProperty(k) && data[k] && me.attributeColorMap[k]) {
				var percentage = (data[k] * 100).toFixed(1),
					label = me.attributeColorMap[k].title + ' (' + percentage + '%)',
					color = me.attributeColorMap[k].color,
					year = parameters.water_year,
					ttipSpan = ' <span class="combined-tooltip" title="Portions of the Mississippi River basin were combined because of missing load data">*</span>';
				
				if (percentage >= 0) {
					// For 1993-1994, when only the Upper Mississippi River is missing, change 
					// the legend for the "Upper Middle Mississippi" to "Upper/Upper Middle Mississippi". 
					// For 1995, change the legend for "Lower Middle Mississippi" to 
					// "Upper/Upper Middle/Lower Middle Mississippi". For 1996, change the legend for 
					// "Lower Middle Mississippi" to "Upper Middle/Lower Middle Mississippi". 
					//
					// Include an asterisk on these legend labels and somehow indicate 
					// "Portions of the Mississippi River basin were combined because of missing load data".
					
					if (!data.UPPERMISS && data.LOWERMIDDLEMISS && data.LOWERMISS && data.UPPERMIDDLEMISS) {
						if ((year === '1993' || year === '1994') && k === 'UPPERMIDDLEMISS') {
							label = 'Upper/Upper Middle Mississippi (' + percentage + '%)' + ttipSpan;
						} else if (year === '1995' && k === 'LOWERMISS') {
							label = 'Upper/Upper Middle/Lower Middle Mississippi (' + percentage + '%)' + ttipSpan;
						} else if (year === '1996' && k === 'LOWERMIDDLEMISS') {
							label = 'Upper Middle/Lower Middle Mississippi)' + percentage + '%)' + ttipSpan;
						}
					}
					
					sortedData.push({
						label : label,
						data : percentage,
						color : color
					});
				}
			}
		}
		return sortedData;
	};
	
	me.removePieChart = function(containerSelector) {
		if (me.plots[containerSelector]) {
			me.plots[containerSelector].shutdown();
			delete me.plots[containerSelector];
		}
		$(containerSelector).find('[class^=chart-miss]').remove();
	};
	
	me.createPie = function (args) {
		var data = args.data,
			containerSelector = args.containerSelector,
			$container = $(containerSelector),
			placement = args.placement,
			width = args.width,
			height = args.height,
			zIndex = 1006,
			paddingRight = 5,
			parameters = args.parameters,
			sortedData = me.createLegendData(data,parameters),
			chartContainerClass = 'chart-miss-pie',
			legendContainerClass = 'chart-miss-legend',
			$chartDiv = $('<div />')
				.addClass(chartContainerClass)
				.css({
					width : width,
					height : height,
					'z-index' : zIndex
				}),
			$legendContainer = $('<div />')
				.addClass(legendContainerClass)
				.css({
					width : width,
					height : height,
					'z-index' : zIndex
				});
		
		me.removePieChart(containerSelector);
			
		if (placement === 'bl') {
			$chartDiv.css({
				'left' : 0,
				'bottom' : 0,
				'z-index' : zIndex
			});
			$legendContainer.css({
				'left' : width + 20, // 15 = padding-left, +5. 
				'bottom' : 0,
				'z-index' : zIndex,
				'position' : 'absolute',
			});
			
			$container.append($chartDiv, $legendContainer);
		} else if (placement === 'br') {
			$chartDiv.css({
				'right' : 0 + paddingRight,
				'bottom' : 0,
				'position' : 'absolute',
				'z-index' : zIndex
			});
			$legendContainer.css({
				'left' : $container.width() - (width * 2) + paddingRight - 15, // Container - pie chart width - legend width
				'bottom' : 0,
				'z-index' : zIndex,
				'position' : 'inherit'
			});
			
			$container.append($legendContainer, $chartDiv);
		}
		
		me.plots[containerSelector] = $.plot($chartDiv, sortedData, {
			series : {
				pie : {
					legendContainer : $legendContainer,
					container : $chartDiv,
					show : true,
					radius: 1,
					label : {
						show: false,
					}
				}
			},
			legend : {
				show: true,
				container : $legendContainer
				// The backgroundColor and backgroundOpacity options don't seem 
				// to work here so it's been added to CSS instead
			},
			grid : {
				hoverable : true,
				clickable : true
			}
		});
				
		$chartDiv.on('plothover', function(event, pos, obj) {
			var $legend,
				$label,
				$labels;
			if (obj) {
				$(event.target.getElementsByClassName('pieLabel')).find('div').css('opacity', '0.2');
				obj.series.pie.legendContainer.find('table tr').css('font-weight', '');
				$(obj.series.pie.legendContainer.find('table tr')[obj.seriesIndex]).css('font-weight', 'bold');
				$labels = $(event.target.getElementsByClassName('pieLabel')).find('div');
				$label = $($labels.get(obj.seriesIndex));
				$label.css('opacity', '1');
			} else {
				$legend = $(event.target.nextElementSibling);
				$legend.find('table tr').css('font-weight', '');
				$(event.target.getElementsByClassName('pieLabel')).find('div').css('opacity', '0.2');
			}
		});
		
		$( document ).tooltip();
	};
	
	me.create = function (args) {
		args = args || {};
		
		var containerSelector = args.containerSelector || 'body',
		placement = args.placement,
		width = args.width || 200,
		height = args.height || 200,
		attributeKeys = Object.keys(me.attributeColorMap),
		parameters = args.parameters;
		
		me.getConstituentData({
			parameters : parameters,
			callbacks : {
				success : function(data) {
					me.createPie({
						data : data,
						containerSelector : containerSelector,
						placement : placement,
						width : width,
						height : height,
						parameters : parameters
					});
				},
				error : function() {
					throw Error('Could not find data for constituent combination');
				}
			}
		});
	};
	
	me.isVisible  = function(containerSelector) {
		return $(containerSelector).find('[class^=chart-miss]').length !== 0;
	};
	
	return {
		create : me.create,
		createLegendData : me.createLegendData,
		remove : me.removePieChart,
		isVisible : me.isVisible
	};
	
})();