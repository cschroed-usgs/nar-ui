var nar = nar || {};
nar.loadDefinitions = function(url) {
	nar.definitions = {};
	
	nar.definitionsPromise = $.ajax({
		url : url,
		type : 'GET',
		success : function(data) {
			nar.definitions = data;
		},
		error : function(jqXHR, textStatus, errorThrown) {
			throw Error('Unable to contact the definitions URL service: ' & textStatus);
		}
	});
};