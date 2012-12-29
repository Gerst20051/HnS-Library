/**
 * HnS JavaScript Library v0.1
 * Andrew Gerst
 */

;(function(window, document, undefined){
'use strict';

var hns = (function(){
	var hns = function(selector){
		return new hns.fn.init(selector);
	};
	hns.fn = hns.prototype = {
		constructor: hns,
		init: function(selector){
			var root = bind(hns, function(){
				if (!selector) {
					return this;
				}
				if (typeof selector === "string") {
					hns.fn.selection = document.getElementById(selector.substring(1));
					return this;
				} else if (typeof selector === "function") {
					selector();
					return this;
				} else if (selector.nodeType) {
					hns.fn.selection = selector;
					return this;
				} else {
					return this;
				}
			});
			if (!DomLoaded.ready) DomLoaded.load(root);
			else root();
		}
	};
	hns.fn.init.prototype = hns.fn;
	hns.extend = hns.fn.extend = function(){
		var options = arguments[0] || {};
		forEachIn(options, function(name, value){
			if (!hns.prototype[name]) hns.prototype[name] = value;
		});
	};
	var DomLoaded = {
		ready: false,
		queue: [],
		loaded: function(){
			if (this.ready) return;
			this.ready = true;
			for (var i = 0; i < this.queue.length; i++) this.queue[i]();
		},
		load: function(fireThis){
			this.queue.push(fireThis);
			if (document.addEventListener) 
				document.addEventListener("DOMContentLoaded", DomLoaded.loaded.bind(this), null);
			if (/KHTML|WebKit/i.test(navigator.userAgent)) {
				var _timer = setInterval(function(){
					if (/loaded|complete/.test(document.readyState)) {
						clearInterval(_timer);
						_timer = null;
						DomLoaded.loaded();
					}
				}, 10);
			}
			/*@cc_on @*/
			/*@if (@_win32)
			var proto = "src='javascript:void(0)'";
			if (location.protocol == "https:") proto = "src=//0";
			document.write("<scr"+"ipt id=__ie_onload defer " + proto + "><\/scr"+"ipt>");
			var script = document.getElementById("__ie_onload");
			script.onreadystatechange = function() {
			if (this.readyState == "complete") {
			DomLoaded.loaded();
			}
			};
			/*@end @*/
			window.onload = DomLoaded.loaded.bind(this);
		}
	};
	hns.extend({
		selection: "",
		empty: function(){
			var multiple = this.selection.length > 1;
			if (multiple) {
				for (var i in this.selection) {
					this.selection[i].innerHTML = "";
				}
			} else {
				this.selection.innerHTML = "";
			}
		},
		text: function(text){
			var textMethod = document.body.textContent ? "textContent" : "innerText";
			var multiple = this.selection.length > 1;
			var selection;
			if (multiple) selection = this.selection[0];
			else selection = this.selection;
			if (text === undefined) {
				if (document.body[textMethod]) {
					return selection[textMethod];
				} else {
					return selection.innerHTML.replace(/\&lt;br\&gt;/gi,"\n").replace(/(&lt;([^&gt;]+)&gt;)/gi, "");
				}
			} else {
				if (document.body[textMethod]) {
					if (multiple) {
						for (var i in this.selection) {
							this.selection[i][textMethod] = text;
						}
					} else {
						selection[textMethod] = text;
					}
				} else {
					if (multiple) {
						for (var i in this.selection) {
							this.selection[i].innerHTML = text.replace(/\&lt;br\&gt;/gi,"\n").replace(/(&lt;([^&gt;]+)&gt;)/gi, "");
						}
					} else {
						selection.innerHTML = text;
					}
				}
				return this;
			}
			return this;
		},
		html: function(html){
			if (html === undefined) {
				return this.selection.innerHTML;
			} else {
				this.selection.innerHTML = html;
			}
			return this;
		},
		ajax: function(type, url, data){
			var xhr = requestObject();
			xhr.open(type || "GET", url, true);
		},
		on: function(method, handler){
			addHandler(this.selection, method, handler);
		}
	});


function bind(fnThis, fn){
	var args = Array.prototype.slice.call(arguments, 2);
	return function(){
		if (!args.length) args = arguments;
		return fn.apply(fnThis, args);
	};
}

function registerEventHandler(node, event, handler){
	if (typeof node.addEventListener == "function")
		node.addEventListener(event, handler, false);
	else
		node.attachEvent("on" + event, handler);
}

function unregisterEventHandler(node, event, handler){
	if (typeof node.removeEventListener == "function")
		node.removeEventListener(event, handler, false);
	else
		node.detachEvent("on" + event, handler);
}

function normalizeEvent(event){
	if (!event.stopPropagation) {
		event.stopPropagation = function(){this.cancelBubble = true};
		event.preventDefault = function(){this.returnValue = false};
	}
	if (!event.stop) event.stop = function(){
		this.stopPropagation();
		this.preventDefault();
	};
	if (event.srcElement && !event.target)
		event.target = event.srcElement;
	if ((event.toElement || event.fromElement) && !event.relatedTarget)
		event.relatedTarget = event.toElement || event.fromElement;
	if (event.clientX != undefined && event.pageX == undefined) {
		event.pageX = event.clientX + document.body.scrollLeft;
		event.pageY = event.clientY + document.body.scrollTop;
	}
	if (event.type == "keypress")
		event.character = String.fromCharCode(event.charCode || event.keyCode);
	return event;
}

function addHandler(node, type, handler){
	function wrapHandler(event){
		handler(normalizeEvent(event || window.event));
	}
	registerEventHandler(node, type, wrapHandler);
	return {node: node, type: type, handler: wrapHandler};
}

function removeHandler(object){
	unregisterEventHandler(object.node, object.type, object.handler);
}



function requestObject(){
	if (window.XMLHttpRequest)
		return new XMLHttpRequest();
	else if (window.ActiveXObject)
		return new ActiveXObject(navigator.userAgent.indexOf("MSIE 5") > -1 ? "Microsoft.XMLHTTP" : "Msxml2.XMLHTTP");
	else
		throw new Error("Could not create HTTP request object.");
}

function simpleJSONRequest(url, success, failure){
	var request = requestObject(), data;
	request.open("GET", url, true);
	request.onreadystatechange = function(){
		if (request.readyState == 4) {
			if (window.JSON && window.JSON.parse) {
				data = window.JSON.parse(request.responseText);
			} else {
				data = eval("(" + request.responseText + ")");
			}
			success(data);
		}
	};
	request.send(null);
}

function simpleHttpRequest(url, success, failure){
	var request = requestObject();
	request.open("GET", url, true);
	request.onreadystatechange = function(){
		if (request.readyState == 4) {
			if (request.status == 200 || !failure)
				success(request.responseText);
			else if (failure)
				failure(request.status, request.statusText);
		}
	};
	request.send(null);
}

	return hns;
})();

window.hns = hns;
})(this, this.document);

function forEachIn(object, action){
	for (var property in object) {
		if (Object.prototype.hasOwnProperty.call(object, property))
			action(property, object[property]);
	}
}

function textNode(text){
	return document.createTextNode(text);
}

function dom(name, attributes){
	var node = document.createElement(name);
	if (attributes) {
		forEachIn(attributes, function(name, value) {
			node.setAttribute(name, value);
		});
	}
	for (var i = 2; i < arguments.length; i++) {
		var child = arguments[i];
		if (typeof child == "string")
			child = textNode(child);
		node.appendChild(child);
	}
	return node;
}