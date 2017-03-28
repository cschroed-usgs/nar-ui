describe('Tests for nar.plots.createCoastalBasinPlot', function() {
	CONFIG = {
			currentWaterYear : 2014,
			startWaterYear : 1993
	};
	beforeEach(function() {
		spyOn($, 'jqplot');
	});
	
	it('Expects jqplot to show the specified title', function(){
		nar.plots.createCoastalBasinPlot({
			plotDivId : 'test-div',
			tsCollections : [],
			tickLabels : [],
			title : 'This is a title'
		});
		expect($.jqplot).toHaveBeenCalled();
		expect($.jqplot.calls[0].args[2].title).toEqual({text : 'This is a title', show : true});
	});
	
	it('Expects jqplot to not show a title if one is not in config', function() {
		nar.plots.createCoastalBasinPlot({
			plotDivId : 'test-div',
			tsCollections : [],
			tickLabels : []
		});
		
		expect($.jqplot.calls[0].args[2].title.show).toBe(false);
	});
	
	it('Expects jqplot to show a yaxis label if in config', function() {
		nar.plots.createCoastalBasinPlot({
			plotDivId : 'test-div',
			tsCollections : [],
			tickLabels : [],
			yaxisLabel : 'This is a label'
		});
		
		expect($.jqplot.calls[0].args[2].axes.yaxis.showLabel).toBe(true);
		expect($.jqplot.calls[0].args[2].axes.yaxis.label).toEqual('This is a label');
	});
	
	it('Expects jqplot to not show a yaxs label if not in config', function() {
		nar.plots.createCoastalBasinPlot({
			plotDivId : 'test-div',
			tsCollections : [],
			tickLabels : []
		});
		
		expect($.jqplot.calls[0].args[2].axes.yaxis.showLabel).toBe(false);
	});
	
	it('Expects the ytick formatter set if specified in config', function() {
		var mockFormatter = jasmine.createSpy('mockFormatter');
		nar.plots.createCoastalBasinPlot({
			plotDivId : 'test-div',
			tsCollections : [],
			tickLabels : [],
			yaxisFormatter : mockFormatter
		});
		
		expect($.jqplot.calls[0].args[2].axes.yaxis.tickOptions).toEqual({formatter : mockFormatter});
	});
	
	it('Expects the ytick formatter to not be set if not specified in config', function() {
		nar.plots.createCoastalBasinPlot({
			plotDivId : 'test-div',
			tsCollections : [],
			tickLabels : []
		});
		
		expect($.jqplot.calls[0].args[2].axes.yaxis.tickOptions).toEqual({});
	});
});