/*
 * HnS JavaScript Library v0.1
 *
 * Andrew Gerst
 *
 * NO IDEA WTF I'M DOING!!
 *
 * Date: Sunday, August 07, 2011
 */

(function( window, document, undefined ) {

var hns = (function() {

	var hns = function( selector, context ) {
		// the hns object is actually just the init constructor 'enhanced'
		return new hns.fn.init( selector, context, rootHnS );
	},

	// map over hns in case of overwrite
	_hns = window.hns,
	
	// map over the $ in case of overwrite
	_$ = window.$,
	
	// a central reference to the root of hns(document)
	rootHnS,

	// a simple way to check for HTML strings or ID strings
	quickExpr = /^(?:[^<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,

	// match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,

	// useragent regexp
	rwebkit = /(webkit)[ \/]([\w.]+)/,
	ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
	rmsie = /(msie) ([\w.]+)/,
	rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,
	
	// keep a useragent string for use with hns.browser
	userAgent = navigator.userAgent,

	// for matching the engine and version of the browser
	browserMatch,

	// the deferred used on DOM ready
	readyList,

	// the ready event handler
	DOMContentLoaded,

	// save a reference to some core methdos
	toString = Object.prototype.toString,
	hasOwn = Object.prototype.hasOwnProperty,
	push = Array.prototype.push,
	slice = Array.prototype.slice,
	trim = String.prototype.trim,
	indexOf = Array.prototype.indexOf,

	// [[class]] -> type pairs
	class2type = {};

hns.fn = hns.prototype = {
	constructor: hns,
	init: function( selector, context, rootHnS ) {
		var match, elem, ret, doc;

		// Handle: $(""), $(null), or $(undefined)
		if ( !selector ) { console.log(this);
			return this;
		}

		// Handle: $(DOMElement)
		if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;
		}

		// the body element only exists once, optimize finding it
		if ( selector === "body" && !context && document.body ) {
			this.context = document;
			this[0] = document.body;
			this.selector = selector;
			this.length = 1;
			return this;
		}

		// Handle: HTML strings
		if ( typeof selector === "string" ) {
			// are we dealing with HTML string or an ID?
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];
			} else {
				match = quickExpr.exec( selector );
			}

			// verify a match, and that no context was specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof hns ? context[0] : context;
					doc = (context ? context.ownerDocument || context : document);

					// if a single string is passed in and it's a single tag
					// just do a createElement and skip the rest
					ret = rsingleTag.exec( selector );

					if ( ret ) { alert("init ret");
						if ( hns.isPlainObject( context ) ) {
							selector = [ document.createElement( ret[1] ) ];
							hns.fn.attr.call( selector, context, true );
						} else {
							selector = [ doc.createElement( ret[1] ) ];
						}
					}

					return hns.merge( this, selector );

				// HANDLE: $("#id")
				} else {
					elem = document.getElementById( match[2] );

					if ( elem && elem.parentNode ) {
						// handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootHnS.find( selector );
						}

						// otherwise, we inject the element directly into the hns object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.hns ) {
				return (context || rootHnS).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(function)
		// shortcut for document ready
		} else if ( hns.isFunction( selector ) ) {
			return rootHnS.ready( selector );
		}

		if (selector.selector !== undefined) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return hns.makeArray( selector, this );
	},
	
	// start with an empty selector
	selector: "",
	
	// the current version of hns being used
	hns: "0.1",
	
	// the default length of a hns object is 0
	length: 0,

	// take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems, name, selector ) {
		// build a new hns matched element set
		var ret = this.constructor();

		if ( hns.isArray( elems ) ) {
			push.apply( ret, elems );
		} else {
			hns.merge( ret, elems );
		}

		// add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		if ( name === "find" ) {
			ret.selector = this.selector + (this.selector ? " " : "") + selector;
		} else if ( name ) {
			ret.selector = this.selector + "." + name + "(" + selector + ")";
		}

		// return the newly-formed element set
		return ret;
	},

	// execute a callback for every element in the matched set
	each: function( callback, args ) {
		return hns.each( this, callback, args );
	},
	
	ready: function( fn ) { alert("1ready");
		// attach the listeners
		hns.bindReady();
		
		// add the callback
		// readyList.done( fn );
		
		return this;
	}
};

// give the init function the hns prototype for later instantiation
hns.fn.init.protoype = hns.fn;

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
	// is the DOM ready to be used? set to true once it occurs
	isReady: false,

	// handle when the DOM is ready
	ready: function() {
		alert("ready");
		if ( !hns.isReady ) {
			if ( !document.body ) {
				return setTimeout( hns.ready, 1 );
			}

			// remember that the DOM is ready
			hns.isReady = true;
			
			
		}
	},

	bindReady: function() {
		alert("bindReady");

		// catch cases where $(document).ready() is called after the
		// browser event has already occurred.
		if ( document.readyState === "complete" ) {
			// handle it asynchronously to allow scripts the opportunity to delay ready
			return setTimeout( hns.ready, 1 );
		}

		// mozilla, opera and webkit nightlies currently support this event
		if ( document.addEventListener ) {
			// use the handy event callback
			document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

			// a fallback to window.onload, that will always work
			window.addEventListener( "load", hns.ready, false );

		// if IE event model is used
		} else if ( document.attachEvent ) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", DOMContentLoaded );

			// a fallback to window.onload, that will always work
			window.attachEvent( "onload", hns.ready );

			// if IE and not a frame
			// continually check to see if the document is ready
			var toplevel = false;

			try {
				toplevel = window.frameElement == null;
			} catch(e) {}

			if ( document.documentElement.doScroll && toplevel ) {
				doScrollCheck();
			}
		}
	},

	isFunction: function( obj ) {
		return hns.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return hns.type(obj) === "array";
	},

	isWindow: function( obj ) {
		return obj && typeof obj === "object" && "setInterval" in obj;
	},

	type: function( obj ) {
		return obj == null ? String( obj ) : class2type[ toString.call(obj) ] || "object";
	},

	isPlainObject: function( obj ) {
		// must be an object.
		// because of IE, we also have to check the presence of the constructor property.
		// make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || hns.type(obj) !== "object" || obj.nodeType || hns.isWindow( obj ) ) {
			return false;
		}

		// not own constructor property must be object
		if ( obj.constructor &&
			!hasOwn.call(obj, "constructor") &&
			!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
			return false;
		}

		// own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.

		var key;
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	},

	// args is for internal usage only
	each: function( object, callback, args ) {
		var name, i = 0,
			length = object.length,
			isObj = length === undefined || hns.isFunction( object );

		if ( args ) {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.apply( object[ name ], args ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.apply( object[ i++ ], args ) === false ) {
						break;
					}
				}
			}

		// a special, fast, case for the most common use of each
		} else {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.call( object[ name ], name, object[ name ] ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.call( object[ i ], i, object[ i++ ] ) === false ) {
						break;
					}
				}
			}
		}

		return object;
	},

	// results is for internal usage only
	makeArray: function( array, results ) {
		var ret = results || [];

		if ( array != null ) {
			var type = hns.type( array );

			if ( array.length == null || type === "string" || type === "function" || type === "regexp" || hns.isWindow( array ) ) {
				push.call( ret, array );
			} else {
				hns.merge( ret, array );
			}
		}

		return ret;
	},

	merge: function( first, second ) {
		var i = first.length,
			j = 0;

		if ( typeof second.length === "number" ) {
			for ( var l = second.length; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}

		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	}
});

// populate the class2type map
hns.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

// all hns objects should point back to these
rootHnS = hns(document);

// cleanup functions for the document ready method
if ( document.addEventListener ) {
	DOMContentLoaded = function() { alert("DOM");
		document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
		hns.ready();
	};
} else if ( document.attachEvent ) {
	DOMContentLoaded = function() {
		// make sure body exists, at least, in case IE gets a little overzealous
		if ( document.readyState === "complete" ) {
			document.detachEvent( "onreadystatechange", DOMContentLoaded );
			hns.ready();
		}
	};
}

// the DOM ready check for IE
function doScrollCheck() {
	if ( hns.isReady ) {
		return;
	}

	try {
		document.documentElement.doScroll("left");
	} catch(e) {
		setTimeout( doScrollCheck, 1 );
		return;
	}

	// and execute any waiting functions
	hns.ready();
}

// expose hns to the global object
return hns;
})();

window.hns = window.$ = hns;
})(this,this.document);