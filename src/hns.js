/**
 * HnS JavaScript Library v0.1
 * Andrew Gerst
 */

;(function(window, document, undefined){



})(this, this.document);

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

var DomLoaded = {
	onload: [],
	loaded: function(){
		if (arguments.callee.done) return;
		arguments.callee.done = true;
		for (var i = 0; i < DomLoaded.onload.length; i++) DomLoaded.onload[i]();
	},
	load: function(fireThis){
		this.onload.push(fireThis);
		if (document.addEventListener) 
			document.addEventListener("DOMContentLoaded", DomLoaded.loaded, null);
		if (/KHTML|WebKit/i.test(navigator.userAgent)) { 
			var _timer = setInterval(function(){
				if (/loaded|complete/.test(document.readyState)) {
					clearInterval(_timer);
					delete _timer;
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
		window.onload = DomLoaded.loaded;
	}
};

function forEachIn(object, action){
	for (var property in object) {
		if (Object.prototype.hasOwnProperty.call(object, property))
			action(property, object[property]);
	}
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
			child = document.createTextNode(child);
		node.appendChild(child);
	}
	return node;
}

function requestObject(){
	if (window.XMLHttpRequest)
		return new XMLHttpRequest();
	else if (window.ActiveXObject)
		return new ActiveXObject("Msxml2.XMLHTTP");
	else
		throw new Error("Could not create HTTP request object.");
}

function simpleJSONRequest(url, success, failure){
	var request = requestObject();
	request.open("GET", url, true);
	request.onreadystatechange = function(){
		if (request.readyState == 4) {
			var data = eval("(" + request.responseText + ")");
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