var nar = nar || {};

nar.informativePopup = function(args) {

	"use strict";

	var me = (this === window) ? {} : this,
		bodyText = 'body',
		mouseEnterText = 'mouseenter',
		clickText = 'click',
		selector = args.selector || $(bodyText),
		$anchor = args.$anchor,
		popover,
		show = args.show || function() {
			var popoverObject = $anchor.data('bs.popover');
			popover.off(mouseEnterText, show);
			$anchor.on('shown.bs.popover', function() {
				popoverObject.$tip.find('.popover-close').on(clickText, hide);
			});
			$anchor.popover('show');
		},
		hide = args.hide || function() {
			$anchor.popover('hide');
			popover.on(mouseEnterText, show);
		};

	args.title = args.title || '';
	args.title += '&nbsp;<span class="popover-close glyphicon glyphicon-remove pull-right"></span>';

	// These default args may be overridden by passing them in
	popover = $anchor.popover($.extend({}, {
		html : true,
		content : 'Placeholder content',
		container : bodyText,
		selector : bodyText,
		trigger : 'manual',
		placement : 'auto',
		template : '<div class="popover summary-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
	}, args));

	popover.on(mouseEnterText, show);
	popover.on(clickText, hide);
	$(bodyText).on('resize', hide);
};