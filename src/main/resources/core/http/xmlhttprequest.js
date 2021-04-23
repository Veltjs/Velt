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

const FORBIDDEN_HEADER_NAMES = [
    "Accept-Charset",
    "Accept-Encoding",
    "Access-Control-Request-Headers",
    "Access-Control-Request-Method",
    "Connection",
    "Content-Length",
    "Cookie",
    "Cookie2",
    "Date",
    "DNT",
    "Expect",
    "Host",
    "Keep-Alive",
    "Origin",
    "Referer",
    "TE",
    "Trailer",
    "Transfer-Encoding",
    "Upgrade",
    "Via",
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

        this.sendFlag = null;
        this.timeout = 0;
        this.withCredentials = null;

        this.requestMethod = "GET";
        this.requestURL = null;
        this.requestHeaders = {};
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

    /**
     * @param {string} method
     * @param {string} url
     * @param {boolean} async
     * @param {string} username
     * @param {string} password
     */
    open(method, url, async, username = null, password = null) {
        if (method === undefined || url === undefined)
            throw new TypeError("Too few arguments.");

        this.method = method;
        this.requestURL = url;
        this.synchronous = !async;

        if (typeof method !== "string" || !METHODS.includes(method.toUpperCase()))
            throw new SyntaxError(`'${method}' is not a valid HTTP method.`);
        if (typeof url !== "string" || !url.match(urlRegex))
            throw new SyntaxError(`'${url}' is not a valid URL.`);
        if (["CONNECT", "TRACE", "TRACK"].includes(method.toUpperCase()))
            throw new Error(`'${method}' HTTP method is unsupported.`);
        if (
            !async &&
            typeof window !== "undefined" &&
            (this.timeout !== 0 || this.responseType !== "")
        )
            throw new Error("");

        method = method.toUpperCase();

        const URL = Java.pkg("java.net.URL");

        const parsedURL = new URL(url);

        if (async === undefined) {
            async = true;
            username = null;
            password = null;
        }

        // TODO AUTH STUFF
        // if (parsedURL.getHost()) {
        // 	if (username) {
        // 	}
        // }

        if (
            async === false &&
            typeof window !== "undefined" &&
            (this.timeout !== 0 || this.responseType !== "")
        )
            throw new DOMException("Invalid access.");

        this.uploadListener = null;
        this.requestMethod = method;
        this.requestURL = parsedURL;
        this.synchronous = async ? null : true;
        this.requestHeaders = {};
        this.response = new Error("Network error.");
        this.responseBytes = [];
        this.responseObject = null;

        if (this.readyState !== XMLHttpRequest.OPENED) {
            this.state = XMLHttpRequest.OPENED;
            if (
                this.onreadystatechange &&
                typeof this.onreadystatechange === "function"
            )
                this.onreadystatechange();
        }
    }

    /**
     * @param {string} name
     * @param {string} value
     */
    setRequestHeader(name, value) {
        if (this.state !== XMLHttpRequest.OPENED) throw new Error("Invalid state.");
        if (this.sendFlag) throw new Error("Invalid state.");
        value = value.trim();
        if (typeof name !== "string" || typeof value !== "string")
            throw new SyntaxError("Invalid type(s).");
        if (FORBIDDEN_HEADER_NAMES.includes("name")) return;
        if (this.requestHeaders[name] !== undefined) {
            this.requestHeaders[name] =
                this.requestHeaders[name] +
                String.fromCharCode(0x2c) +
                String.fromCharCode(0x20) +
                value;
        } else this.requestHeaders[name] = value;
    }

    get timeout() {
        return this.timeout;
    }

    set timeout(value) {
        if (typeof window !== "undefined" && this.synchronous)
            throw new Error("Invalid access.");
        this.timeout = value;
    }

    get withCredentials() {
        return this.withCredentials;
    }

    set withCredentials(value) {
        if (
            this.readyState !== XMLHttpRequest.UNSENT &&
            this.readyState !== XMLHttpRequest.OPENED
        )
            throw new Error("Invalid state.");
        if (this.sendFlag) throw new Error("Invalid state.");
        this.withCredentials = value;
    }

    get upload() {
        return this.upload;
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

module.exports = {
    XMLHttpRequest,
};