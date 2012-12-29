(function( window, document, undefined ) {

Function.prototype.bind = function(scope) {
	var _function = this;
	
	return function() {
		return _function.apply(scope, arguments);
	}
}

var hns = (function() {
	var hns = function(selector) {
		return new hns.fn.init(selector);
	};

hns.fn = hns.prototype = {
	init: function (selector) {
		console.log("This: "+this);
		if (!selector) {
			return this;
		}
	}.bind()
};

hns.fn.init.prototype = hns.fn;

hns.extend = hns.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !hns.isFunction(target) ) {
		target = {};
	}

	// extend hns itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// recurse if we're merging plain objects or arrays
				if ( deep && copy && ( hns.isPlainObject(copy) || (copyIsArray = hns.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && hns.isArray(src) ? src : [];
					} else {
						clone = src && hns.isPlainObject(src) ? src : {};
					}

					// never move original objects, clone them
					target[ name ] = hns.extend( deep, clone, copy );

				// don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// return the modified object
	return target;
};

hns.extend({
	find: function(selector) {
		alert(selector);
	}
});

return hns;
})();

window.hns = window.$ = hns;
})(this,this.document);