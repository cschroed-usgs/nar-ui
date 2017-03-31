/**
 * @requires _, nar.commons.Subject
 */
var nar = nar || {};
nar.mississippi = nar.mississippi || {};

(function(){
	/* Wrapper around Subject. The code assumes that all observers take an object containing the filter data with
	 * properties load, chemical, and year.
	 * 
	 * @param $load - jquery element representing the load
	 * @param $chemical - jquery element representing the chemical
	 * @param $year - jquery element representig the year (this can be a range)
	 * @returns object containing functions to addObserver, removeObserver, getFilterData, and to notifyObservers
	 */
	nar.mississippi.FiltersSubject = function($load, $chemical, $year) {
		var self = this;
		
		var subject = new nar.commons.Subject();
		
		
		self.addObserver = function (newObserver) {
			subject.observe(newObserver);
		};
		self.removeObserver = function (deleteObserver) {
			subject.unobserve(deleteObserver);
		};
		
		self.getFilterData = function() {
			return {
				load: $load.val(),
				chemical : $chemical.val(),
				year : $year.val()
			};
		};
		
		self.notifyObservers = function() {
			subject.notify(self.getFilterData());
		};
		
		return self;
	};
	
}());