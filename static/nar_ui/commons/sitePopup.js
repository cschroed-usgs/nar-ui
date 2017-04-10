var nar = nar || {};
nar.sitePopup = (function() {
	"use strict";
	
	var DIALOG_ID = 'nar-dialog-container',
		POPUP_ID = 'nar-dialog-content',
		dialogJQSelector = '#' + DIALOG_ID,
		dialog,
		destroyDialog = function () {
			if (dialog) {
				dialog.dialog('destroy').remove();
				$(dialogJQSelector).remove();
				dialog = null;
			}
		},
		createPopup = function(args) {
			args = args || {};
			
			var $appendableElement = args.$appendableElement,
				content = args.content,
				title = args.title || '',
				appendToSelector = args.appendTo || 'body',
				width = args.width || null,
				maxHeight = args.maxHeight || null,
				minHeight = args.minHeight || null,
				dialogClass = args.dialogClass || 'nar-popup-dialog',
				popupAnchor = args.popupAnchor || 'body',
				$dialog,
				$container,
				$closeButtonContent = $('<span />').addClass('glyphicon glyphicon-remove nar-popup-dialog-close-icon'),
				open = args.onOpen,
				close = args.onClose;
			
			if (content) {
				// First, destroy any dialog that may exist
				destroyDialog();
				
				// Create a new dialog container
				$container = $('<div />').attr('id', DIALOG_ID).addClass('hidden');
				
				// Create the dialog div that goes into the container.
				$dialog = $('<div />').attr('id', POPUP_ID).append(content);
							
				// Append the dialog content to the container
				$container.append($dialog);
				
				// Append the container to the body
				$('body').append($container);
				
				// Show the dialog
				dialog = $container.children().first().dialog({
					close : destroyDialog,
					appendTo : appendToSelector,
					title : title,
					resizable : false,
					width: width || 'auto',
					maxHeight : maxHeight || false,
					minHeight : minHeight || false,
					open : open,
					dialogClass : dialogClass,
					position : {
						my: 'center top',
						at: 'center top',
						of: popupAnchor
					}
				});
				
				// Replace the orange button icon with a bootstrap glyphicon
				dialog.parent().find('button').empty().append($closeButtonContent);
				
				return dialog;
			}
		};

	return {
		createPopup : createPopup,
		destroyDialog : destroyDialog
	};
}());