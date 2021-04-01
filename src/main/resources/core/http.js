const http = (module.exports = {});

const METHODS = [
	"GET",
	"HEAD",
	"POST",
	"PUT",
	"DELETE",
	"CONNECT",
	"OPTIONS",
	"TRACE",
	"PATCH",
	"TRACK",
];

const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

const XMLHttpRequestResponseType = {
	"": 0,
	arraybuffer: 1,
	blob: 2,
	document: 3,
	json: 4,
	text: 5,
};

class XMLHttpRequestEventTarget {
	constructor() {
		this.onloadstart = null;
		this.onprogress = null;
		this.onabort = null;
		this.onerror = null;
		this.onload = null;
		this.ontimeout = null;
		this.onloadend = null;
	}

	addEventListener(event, handler) {}

	removeEventListener(event, handler) {}

	dispatchEvent(event) {}
}

class XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
	constructor() {
		super();
	}
}

class XMLHttpRequest extends XMLHttpRequestEventTarget {
	constructor() {
		super();

		this.onreadystatechange = () => {};

		this.readyState = XMLHttpRequest.UNSENT;

		this.timeout = 0;
		this.withCredentials = null;

		this.requestMethod = "GET";
		this.requestURL = null;
		this.requestHeaders = null;
		this.requestBody = null;

		this.synchronous = null;
		this.uploadComplete = null;
		this.uploadListener = null;
		this.timedOut = null;

		this.upload = new XMLHttpRequestUpload();

		this.responseURL = null;
		this.status = null;
		this.statusText = null;

		this.responseType = "";

		this.response = null;
		this.responseBytes = null;
		this.responseText = null;
		this.responseObject = null;
		this.responseXML = null;
		this.mimeType = null;
	}

	open(method, url, async, username = null, password = null) {
		this.method = method;
		this.requestURL = url;
		this.synchronous = !async;

		if (!METHODS.includes(method.toUpperCase()))
			throw new SyntaxError(`'${method}' is not a valid HTTP method.`);
		if (!url.match(urlRegex))
			throw new SyntaxError(`'${url}' is not a valid URL.`);
		if (["CONNECT", "TRACE", "TRACK"].includes(method))
			throw new Error(`'${method}' HTTP method is unsupported.`);
		if (
			!async &&
			typeof window !== "undefined" &&
			(this.timeout !== 0 || this.responseType !== "")
		)
			throw new Error("");

		method = method.toUpperCase();

		const parsedURL = url;

		if (async === undefined) {
			async = true;
			username = null;
			password = null;
		}
	}

	send(body = null) {}

	abort() {}

	getResponseHeader(name) {}

	getAllResponseHeaders() {}

	overrideMimeType(mime) {}
}

XMLHttpRequest.UNSENT = 0;
XMLHttpRequest.OPENED = 1;
XMLHttpRequest.HEADERS_RECEIVED = 2;
XMLHttpRequest.LOADING = 3;
XMLHttpRequest.DONE = 4;
