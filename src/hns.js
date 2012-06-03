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

var navigator = window.navigator,
	location = window.location;

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

	// check if a string has a non-whitespace character in it
	rnotwhite = /\S/,

	// used for trimming whitespace
	trimLeft = /^\s+/,
	trimRight = /\s+$/,

	// check for digits
	rdigit = /\d/,

	// match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,

	// JSON regexp
	rvalidchars = /^[\],:{}\s]*$/,
	rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
	rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,

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
		if ( !selector ) {
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

					if ( ret ) {
						if ( hns.isPlainObject( context ) ) {
							selector = [ document.createElement( ret[1] ) ];
							hns.fn.attr.call( selector, context, true );
						} else {
							selector = [ doc.createElement( ret[1] ) ];
						}
					} else {
						ret = hns.buildFragment( [ match[1] ], [ doc ] );
						selector = (ret.cacheable ? hns.clone(ret.fragment) : ret.fragment).childNodes;
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
	
	size: function() {
		return this.length;
	},
	
	toArray: function() {
		return slice.call( this, 0 );
	},

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
	
	ready: function( fn ) {
		// attach the listeners
		hns.bindReady();
		
		// add the callback
		readyList.done( fn );
		
		return this;
	},

	eq: function( i ) {
		return i === -1 ? this.slice( i ) : this.slice( i, +i + 1 );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ),
			"slice", slice.call(arguments).join(",") );
	},

	map: function( callback ) {
		return this.pushStack( hns.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	push: push,
	sort: [].sort,
	splice: [].splice
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
		// make sure that the DOM is not already loaded
		if ( !hns.isReady ) {
			// make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
			if ( !document.body ) {
				return setTimeout( hns.ready, 13 );
			}

			// remember that the DOM is ready
			hns.isReady = true;

			// if there are functions bound, to execute
			if ( readyList ) {
				// Execute all of them
				var fn, i = 0;
				while ( (fn = readyList[ i++ ]) ) {
					fn.call( document, hns );
				}

				// reset the list of functions
				readyList = null;
			}

			// trigger any bound ready events
			if ( hns.fn.triggerHandler ) {
				hns( document ).triggerHandler( "ready" );
			}
		}
	},

	bindReady: function() {
		if ( readyBound ) {
			return;
		}

		readyBound = true;

		// aatch cases where $(document).ready() is called after the
		// browser event has already occurred.
		if ( document.readyState === "complete" ) {
			return hns.ready();
		}

		// mozilla, opera and webkit nightlies currently support this event
		if ( document.addEventListener ) {
			// use the handy event callback
			document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
			
			// a fallback to window.onload, that will always work
			window.addEventListener( "load", hns.ready, false );

		// If IE event model is used
		} else if ( document.attachEvent ) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			document.attachEvent("onreadystatechange", DOMContentLoaded);
			
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

	isNaN: function( obj ) {
		return obj == null || !rdigit.test( obj ) || isNaN( obj );
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

	isEmptyObject: function( obj ) {
		for ( var name in obj ) {
			return false;
		}
		return true;
	},
	
	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
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

	// use native String.trim function wherever possible
	trim: trim ?
		function( text ) {
			return text == null ?
				"" :
				trim.call( text );
		} :

		// otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				text.toString().replace( trimLeft, "" ).replace( trimRight, "" );
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

	inArray: function( elem, array ) {
		if ( indexOf ) {
			return indexOf.call( array, elem );
		}

		for ( var i = 0, length = array.length; i < length; i++ ) {
			if ( array[ i ] === elem ) {
				return i;
			}
		}

		return -1;
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
	},

	grep: function( elems, callback, inv ) {
		var ret = [], retVal;
		inv = !!inv;

		// go through the array, only saving the items
		// that pass the validator function
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value, key, ret = [],
			i = 0,
			length = elems.length,
			// hns objects are treated as arrays
			isArray = elems instanceof hns || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || hns.isArray( elems ) ) ;

		// go through the array, translating each of the items to their
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// go through every key on the object,
		} else {
			for ( key in elems ) {
				value = callback( elems[ key ], key, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// flatten any nested arrays
		return ret.concat.apply( [], ret );
	},
	
	// mutifunctional method to get and set values to a collection
	// the value/s can be optionally by executed if its a function
	access: function( elems, key, value, exec, fn, pass ) {
		var length = elems.length;

		// setting many attributes
		if ( typeof key === "object" ) {
			for ( var k in key ) {
				hns.access( elems, k, key[k], exec, fn, value );
			}
			return elems;
		}

		// setting one attribute
		if ( value !== undefined ) {
			// optionally, function values get executed if exec is true
			exec = !pass && exec && hns.isFunction(value);

			for ( var i = 0; i < length; i++ ) {
				fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
			}

			return elems;
		}

		// getting an attribute
		return length ? fn( elems[0], key ) : undefined;
	},
	
	now: function() {
		return (new Date()).getTime();
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
	DOMContentLoaded = function() {
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

var rclass = /[\n\t\r]/g,
	rspace = /\s+/,
	rreturn = /\r/g,
	rtype = /^(?:button|input)$/i,
	rfocusable = /^(?:button|input|object|select|textarea)$/i,
	rclickable = /^a(?:rea)?$/i,
	rspecial = /^(?:data-|aria-)/,
	rinvalidChar = /\:/,
	formHook;

hns.fn.extend({
	attr: function( name, value ) {
		return hns.access( this, name, value, true, hns.attr );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			hns.removeAttr( this, name );
		});
	},
	
	prop: function( name, value ) {
		return hns.access( this, name, value, true, hns.prop );
	},
	
	removeProp: function( name ) {
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	},

	addClass: function( value ) {
		if ( hns.isFunction( value ) ) {
			return this.each(function(i) {
				var self = hns(this);
				self.addClass( value.call(this, i, self.attr("class") || "") );
			});
		}

		if ( value && typeof value === "string" ) {
			var classNames = (value || "").split( rspace );

			for ( var i = 0, l = this.length; i < l; i++ ) {
				var elem = this[i];

				if ( elem.nodeType === 1 ) {
					if ( !elem.className ) {
						elem.className = value;
					} else {
						var className = " " + elem.className + " ",
							setClass = elem.className;

						for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
							if ( className.indexOf( " " + classNames[c] + " " ) < 0 ) {
								setClass += " " + classNames[c];
							}
						}
						elem.className = hns.trim( setClass );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		if ( hns.isFunction(value) ) {
			return this.each(function(i) {
				var self = hns(this);
				self.removeClass( value.call(this, i, self.attr("class")) );
			});
		}

		if ( (value && typeof value === "string") || value === undefined ) {
			var classNames = (value || "").split( rspace );

			for ( var i = 0, l = this.length; i < l; i++ ) {
				var elem = this[i];

				if ( elem.nodeType === 1 && elem.className ) {
					if ( value ) {
						var className = (" " + elem.className + " ").replace(rclass, " ");
						for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
							className = className.replace(" " + classNames[c] + " ", " ");
						}
						elem.className = hns.trim( className );
					} else {
						elem.className = "";
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isBool = typeof stateVal === "boolean";

		if ( hns.isFunction( value ) ) {
			return this.each(function(i) {
				var self = hns(this);
				self.toggleClass( value.call(this, i, self.attr("class"), stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = hns( this ),
					state = stateVal,
					classNames = value.split( rspace );

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space seperated list
					state = isBool ? state : !self.hasClass( className );
					self[ state ? "addClass" : "removeClass" ]( className );
				}

			} else if ( type === "undefined" || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					hns._data( this, "__className__", this.className );
				}

				// toggle whole className
				this.className = this.className || value === false ? "" : hns._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ";
		for ( var i = 0, l = this.length; i < l; i++ ) {
			if ( (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) > -1 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		var hooks, ret,
			elem = this[0];
		
		if ( !arguments.length ) {
			if ( elem ) {
				hooks = hns.valHooks[ elem.nodeName.toLowerCase() ] || hns.valHooks[ elem.type ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				return (elem.value || "").replace(rreturn, "");
			}

			return undefined;
		}

		var isFunction = hns.isFunction( value );

		return this.each(function( i ) {
			var self = hns(this), val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, self.val() );
			} else {
				val = value;
			}

			// treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( hns.isArray( val ) ) {
				val = hns.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = hns.valHooks[ this.nodeName.toLowerCase() ] || hns.valHooks[ this.type ];

			// if set returns undefined, fall back to normal setting
			if ( !hooks || ("set" in hooks && hooks.set( this, val, "value" ) === undefined) ) {
				this.value = val;
			}
		});
	}
});

hns.fn.extend({
	unbind: function( type, fn ) {
		// handle object literals
		if ( typeof type === "object" && !type.preventDefault ) {
			for ( var key in type ) {
				this.unbind(key, type[key]);
			}
			return this;
		}

		return this.each(function() {
			hns.event.remove( this, type, fn );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			hns.event.trigger( type, data, this );
		});
	},

	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
});

hns.fn.extend({
	text: function( text ) {
		if ( hns.isFunction(text) ) {
			return this.each(function(i) {
				var self = hns( this );
				self.text( text.call(this, i, self.text()) );
			});
		}

		if ( typeof text !== "object" && text !== undefined ) {
			return this.empty().append( (this[0] && this[0].ownerDocument || document).createTextNode( text ) );
		}

		return hns.text( this );
	},

	append: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.insertBefore( elem, this.firstChild );
			}
		});
	},

	before: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this );
			});
		} else if ( arguments.length ) {
			var set = hns(arguments[0]);
			set.push.apply( set, this.toArray() );
			return this.pushStack( set, "before", arguments );
		}
	},

	after: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			});
		} else if ( arguments.length ) {
			var set = this.pushStack( this, "after", arguments );
			set.push.apply( set, hns(arguments[0]).toArray() );
			return set;
		}
	},

	// keepData is for internal use only
	remove: function( selector, keepData ) {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			if ( !selector || hns.filter( selector, [ elem ] ).length ) {
				if ( !keepData && elem.nodeType === 1 ) {
					hns.cleanData( elem.getElementsByTagName("*") );
					hns.cleanData( [ elem ] );
				}

				if ( elem.parentNode ) {
					elem.parentNode.removeChild( elem );
				}
			}
		}

		return this;
	},

	empty: function() {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			// remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				hns.cleanData( elem.getElementsByTagName("*") );
			}

			// remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}
		}

		return this;
	},

	html: function( value ) {
		if ( value === undefined ) {
			return this[0] && this[0].nodeType === 1 ?
				this[0].innerHTML.replace(rinlinehns, "") :
				null;

		// see if we can take a shortcut and just use innerHTML
		} else if ( typeof value === "string" && !rnocache.test( value ) &&
			(hns.support.leadingWhitespace || !rleadingWhitespace.test( value )) &&
			!wrapMap[ (rtagName.exec( value ) || ["", ""])[1].toLowerCase() ] ) {

			value = value.replace(rxhtmlTag, "<$1></$2>");

			try {
				for ( var i = 0, l = this.length; i < l; i++ ) {
					// remove element nodes and prevent memory leaks
					if ( this[i].nodeType === 1 ) {
						hns.cleanData( this[i].getElementsByTagName("*") );
						this[i].innerHTML = value;
					}
				}

			// if using innerHTML throws an exception, use the fallback method
			} catch(e) {
				this.empty().append( value );
			}

		} else if ( hns.isFunction( value ) ) {
			this.each(function(i){
				var self = hns( this );
				self.html( value.call(this, i, self.html()) );
			});

		} else {
			this.empty().append( value );
		}

		return this;
	}
});

window.hns = window.$ = hns;
})(this,this.document);