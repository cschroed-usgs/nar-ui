//@requires nar.Constituents
var nar = nar || {};
nar.plots = nar.plots || {};
(function(){
	/**
	 * functionality shared between different full report plots 
	 */


	/**
	 * Just to make code more readable
	 * given an array representing a point, give back the x coord
	 */
	var getXcoord = function(point){
		return point[0];
	};
	/**
	 * For symmetry, get the Y coord
	 */
	var getYcoord = function(point) {
		return point[1];
	};
	var log10 = function(val) {
		return Math.log(val) / Math.LN10;
	};

	var getPlotTooltipDiv = function() {
		// create or obtain a div just for chart tooltips
		var toolTipId = 'flot-tooltip';
		var toolTipSelector = '#' + toolTipId;
		var toolTipSelection = $(toolTipSelector);
		var toolTipElt;
		if (0 === toolTipSelection.length) {
			toolTipElt = $('<div></div>', {
				'id' : toolTipId
			});
			toolTipElt.appendTo('body');
		} else {
			toolTipElt = toolTipSelection[0];
		}
		return toolTipElt;
	};

	nar.plots.PlotUtils = {
			YEAR_NINETEEN_HUNDRED: Date.create('1900').getTime(),
			ONE_YEAR_IN_THE_FUTURE: Date.create().addYears(1).getTime(),
			/**
			 * @param {Array} data - sorted by time
			 * @returns {Object} - a map of the data set split into the current year's data, and the 
			 * previous years' data. Previous years' data will be an empty array if last years' data does not 
			 * fall on the last water year. 
			 */
			getDataSplitIntoCurrentAndPreviousYears: function(data) {
				//must use string for year
				var startOfCurrentYearTimestamp = nar.WaterYearUtils.getWaterYearStart(CONFIG.currentWaterYear, true);

				var indexOfFirstDataPointInCurrentYear = data.findIndex(function(dataPoint){
					var timestamp = getXcoord(dataPoint);
					return timestamp >= startOfCurrentYearTimestamp;
				});

				var result = {
					previousYearsData : [],
					currentYearData : []
				};
				if (indexOfFirstDataPointInCurrentYear === -1) {
					result.previousYearsData = data;
				}
				else {
					result.previousYearsData = data.to(indexOfFirstDataPointInCurrentYear);
					result.currentYearData = data.from(indexOfFirstDataPointInCurrentYear);
				}

				return result;
			},
			/**
			 * @param {nar.timeSeries.Visualization}
			 * @returns {Object} - a map of the constituent the time series graphs, and colors
			 * for the current year's data, the previous years' data, and colors for other data that
			 * may be shown on the time series graphs
			 */
			getConstituentNameAndColors: function(timeSeriesVisualization){
				var idComponents = timeSeriesVisualization.getComponentsOfId();
				var constituentId = idComponents.constituent;
				var constituentInfo = nar.Constituents[constituentId];
				var constituentName = constituentInfo.name;
				var currentYearColor = constituentInfo.color;
				var previousYearsColor = tinycolor.lighten(tinycolor(currentYearColor), 30).toRgbString();
				var longTermMeanColor = tinycolor.lighten(tinycolor.gray, 75).toRgbString();
				var criteriaLineColor = tinycolor.lighten(tinycolor.gray, 75).toRgbString();

				return {
					name : constituentName,
					colors:{
						currentYear: currentYearColor,
						previousYears: previousYearsColor,
						longTermMean: longTermMeanColor,
						criteriaLine: criteriaLineColor,
					}
				};
			},
			/**
			 * @callback plotHoverFormatter
			 * @param x
			 * @param y
			 * @returns {string} - The text to be displayed in the hover element
			 */
			/**
			 * Sets the given formatter handler on the specified flotchart plot.
			 * Note that the flotchart must have 'grid{hoverable:true}' in order for this to work.
			 * 
			 * @param {HTMLElement|string} - Either an element or a valid string jquery selector
			 * @param {plotHoverFormatter} - the callback that formats the raw data into human-readable hover text
			 */
			setPlotHoverFormatter : function(plotContainer, formatter){
				var toolTipElt = getPlotTooltipDiv();
				$(plotContainer).bind("plothover", function (event, pos, item) {
					if (item) {
						var x = item.datapoint[0],
						y = item.datapoint[1],
						hoverText;
						if (Object.has(item.series, 'censorLabel')) {
							hoverText = formatter(x, item.series.censorLabel + y);
						}
						else {
							hoverText = formatter(x, y);
						}
						$(toolTipElt).html(hoverText)
						.css({top: item.pageY+5, left: item.pageX+5, 'z-index' : 760})
						.fadeIn(200);
					} else {
						$(toolTipElt).hide();
					}
				});

			},
			setLineHoverFormatter : function(plotContainer, yvalue, text) {
				var toolTipElt = getPlotTooltipDiv();
				var hoverThreshold = 0.05; // Arbitrary for now
				$(plotContainer).bind("plothover", function (event, pos, item) {
					if (!item) {
						if (Math.abs(log10(pos.y) - log10(yvalue)) < hoverThreshold) {
							$(toolTipElt).html(text)
							.css({top: pos.pageY+5, left: pos.pageX+5, 'z-index' : 760})
							.fadeIn(200);
						}
					}
				});
			},
			/**
			 * This is a commonly-used {plotHoverFormatter}.
			 * @param x
			 * @param y
			 * returns {string}
			 */
			utcDatePlotHoverFormatter: function(x, y){
				//use utc(true) to prevent timezone offset from modifying date
				var date = Date.create(x).utc(true);
				var dateStr = date.format(Date.ISO8601_DATE);
				var formatted = dateStr + " : " + y;
				return formatted;
			},
			waterYearPlotHoverFormatter : function(x, y, yPrecision) {
				return nar.WaterYearUtils.convertDateToWaterYear(x) + ' : ' + y.format(yPrecision);
			},
			/**
			 * Pulling out tick formatter for testing it
			 * Note, only works for powers of 10
			 * @param val value to format
			 * @param axis axis being formatted (not used currently)
			 * returns format for which tick should be formatted
			 */
			logTickFormatter: function(val, axis) {
				var roundedLog = Math.round(log10(val));
				var tickDecimals = (roundedLog > 0) ? 0 : -roundedLog;
				return val.toFixed(tickDecimals);
			},
			/**
			 * @param Object axis - the axis object passed to the flots tick function
			 * @param Integer minimumLog - if axis.datamin is 0, this will be the minimum tick.
			 * @returns Array[Array of [Number, String]] - of ticks to use. 
			 * Side effect is that axis.min and axis.max are adjusted to what is used in the returned array.
			 */
			logTicks : function (axis, minimumLog) {
				var minLog, maxLog;
				var ticks = [];
				var i, tickVal;

				if (axis.datamin === 0) {
					minLog = minimumLog;
				}
				else {
					minLog = Math.floor(log10(axis.datamin));
				}
				maxLog = Math.ceil(log10(axis.datamax));
				
				// The following code prevents data points from being plotted on the axis of the graph.
				if (Math.pow(10, minLog) === axis.datamin) {
					minLog = minLog - 1;
				}
				if (Math.pow(10, maxLog) === axis.datamax) {
					maxLog = maxLog + 1;
				}
				
				// Adjust axis.min and axis.max to reflect the axis min and max that we are using.
				axis.min = Math.pow(10, minLog);
				axis.max = Math.pow(10, maxLog);

				for (i = minLog; i <= maxLog; i++) {
					tickVal = Math.pow(10, i);
					ticks.push([tickVal, nar.plots.PlotUtils.logTickFormatter(tickVal)]);
				}
				return ticks;
			},
			/**
			 * Helper function used by other custom tick functions. Updates axis.min to the 
			 * start of the water year and axis.max to the end of the water year.
			 * @param axis
			 * @returns null 
			 */
			alignAxisToWaterYears : function(axis){
				// Adjust axis.min and axis.max so that complete bars are shown.
				var minWy = nar.WaterYearUtils.convertDateToWaterYear(axis.min);
				var maxWy = nar.WaterYearUtils.convertDateToWaterYear(axis.max);
				
				axis.min = nar.WaterYearUtils.getWaterYearStart(minWy, true);
				axis.max = nar.WaterYearUtils.getWaterYearEnd(maxWy, true);
				
				//emphasize that object passed in is modified by returning null
				return null;
			},
			/**
			 * Use to format time series axis when you want the ticks to represent a year,
			 * but offset into may of that year. Can be assigned to the ticks property for an axis.
			 * @return {Array<Number>} of utc timestamps
			 * side effect is that it aligns the axis extremes to water years
			 */
			getMayTicks : function(axis){
				var yearAlignedTicks = nar.plots.PlotUtils.getTicksByYear(axis);
				var MAY = 4;
				var mayAlignedTicks = yearAlignedTicks.map(function(yearTick){
					var offsetDate = (new Date(yearTick)).set({month: MAY}, true);
					return offsetDate.getTime();
				});
				return mayAlignedTicks;
			},
			/**
			 * Use to format time series axis when you want the ticks to represent a year. 
			 * Can be assigned to the ticks property for an axis.
			 * @ return {Array<Number>} of utc timestamps
			 * side effect is that it aligns the axis extremes to water years
			 */
			getTicksByYear : function(axis) {
				var tFirstYear, tLastYear;
				var thisDate, maxDate;

				nar.plots.PlotUtils.alignAxisToWaterYears(axis);

				var result = axis.tickGenerator(axis);
				if (result.length > 1) {
					// If the number of ticks is greater than the range of years
					// need to generate the ticks for just years.
					tFirstYear = (new Date(result[0])).getFullYear();
					tLastYear = (new Date(result[result.length - 1])).getFullYear();

					if (tLastYear - tFirstYear < result.length) {
						thisDate = new Date(tFirstYear, 0, 1);
						maxDate = new Date(axis.max);

						result = [];
						while (thisDate < maxDate) {
							result.push(thisDate.getTime());
							thisDate.setFullYear(thisDate.getFullYear() + 1);
						}
					}
				}
				return result;
			},
			/**
			 * We have point data that we only care about the x is, so pin the y to line
			 * Assumes x is [0] and y is [1] for both series
			 * @todo interpolation
			 * @param {Array} pointData - points to pin
			 * @param {Array} lineData - line to pin to
			 * @return {Array} points pinned to line
			 */
			createPinnedPointData : function(pointData, lineData) {
				var pinnedPoints = pointData.map(function(point) {
					point[1] = nar.plots.PlotUtils.findNearestYValueAtX(lineData, point[0]);
					return point;
				});
				return pinnedPoints;
			},
			/**
			 * This pins the point to the line, can be pulled out and reused, but it
			 * is specific to this relation for now
			 * @todo interpolate
			 * @param {Array} array - array of line points 2d
			 * @param {Number} xvalue - x value of point to pin to line
			 * @param {Number} xindex - index of array to compare against (default 0)
			 * @param {Number} yindex - index of array to get value for (default 1)
			 * @return {Number} yvalue on line near xvalue
			 */
			findNearestYValueAtX : function(array, xvalue, xindex, yindex) {
				var xi = (xindex === undefined) ? 0 : xindex;
				var yi = (yindex === undefined) ? 1 : yindex;
				var point = array.reduce(function(prev, curr) {
					return (Math.abs(curr[xi] - xvalue)) < Math.abs(prev[xi]- xvalue) ? curr : prev;
				});
				return point[yi];
			},
			/**
			 * Get the axis min or max values fitting to traditional log scale
			 * @param {Number} value - actual max of the data
			 * @param {Function} func - Math.ceil for max, Math.floor for min
			 * @returns
			 */
			getLogAxisForValue : function(value, func) {
				var logValue = log10(value);
				var factor = func(logValue);
				return Math.pow(10, factor);
			},
			/**
			 * Split a single series into three, one for non-censored, one for
			 * &gt; one for &lt;
			 * @param {Object} data - object containing arrays of data
			 */
			getDataSplitByCensored : function(data) {
				var finalSplit = {};
				var dataSeries = Object.keys(data);
				dataSeries.each(function(seriesName) {
					finalSplit[seriesName] = {
							noncensored: [],
							lessThan: [],
							greaterThan: []
					};
					data[seriesName].each(function(point) {
						var newPoint = point;
						if (point[1].startsWith('<')) {
							newPoint[1] = point[1].remove('<');
							finalSplit[seriesName].lessThan.push(newPoint);
						} else if (point[1].startsWith('>')) {
							newPoint[1] = point[1].remove('>');
							finalSplit[seriesName].greaterThan.push(newPoint);
						} else {
							finalSplit[seriesName].noncensored.push(newPoint);
						}
					});
				});
				return finalSplit;
			}
	};
}());
