/**
 * @requires sugarjs
 */

/**
 * @class nar.commons.Subject
 * Used to implement the observer pattern.
 */
var nar = nar || {};
nar.commons = nar.commons || {};
nar.commons.Subject = function(){
	var self = this;
	var observers = [];
	
	/**
	 * @param {function} observer
	 */
	self.observe = function (observer) {
		console.log('added new observer');
		observers.push(observer);
	};
	/**
	 * Prevent the specified observer from receiving future notifications
	 * If the observer was registered multiple times, remove all occurrences of it
	 * @param {function} observer
	 * @returns {Boolean} true if the observer was observing, false if it was not observing
	 */
	self.unobserve = function (observerToRemove) {
		var originalLength = observers.length;	
		observers.remove(function(observer){
			if(observer === observerToRemove){
				console.log('removed observer');
				return true;
			}
			else{
				return false;
			}
		});

		return originalLength !== observers.length;
	};
	/**
	 * @param * - any arguments you specify will be 
	 * passed to observers
	 * @return {Integer} the number of observers notified
	 */
	self.notify = function () {
		var args = Array.create(arguments);
		observers.map(function(observer){
			observer.apply(null, args);
		});
		console.log('notified ' + observers.length + ' observers');
		return observers.length;
	};
};

