globalThis.global = globalThis;

const { setTimeout, setInterval, clearTimeout, clearInterval } = require('timers');
const { Buffer } = require('buffer');
const process = require('process');
const util = require('util');

const _then = Promise.then;

Java.package = package => {
	let cls;
	try {
		cls = Java.type(package);
	} catch {
		cls = undefined;
	}
	if (cls) return cls;
	return new Proxy({}, {
		get(target, prop, receiver) {
			return Java.package(`${package}.${prop}`);
		}
	});
}

Java.pkg = Java.package;

const { Arrays } = Java.pkg('java.util');
const { File } = Java.pkg('java.io');

global.setInterval = setInterval;
global.setTimeout = setTimeout;
global.clearTimeout = clearTimeout;
global.clearInterval = clearInterval;

global.Buffer = Buffer;

global.alert = console.log;
global.process = process;

/*Object.defineProperty(global, '__filename', {
	get() {
		return new File('').getAbsolutePath().toString();
	},
	enumerable: true,
	configurable: true
});*/

class Trace extends Error {
	constructor(...args) {
		super(...args);
		this.name = 'Trace';
	}
}

function getStackTrace(err) {
	if (err && err.stack) {
		return err.stack;
	} else if (err && err.getStackTrace) {
		const trace = Arrays.asList(err.getStackTrace());
		const traceArr = [];
		trace.forEach(el => {
			traceArr.push(`\tat ${el}`);
		});
		return `${err}
${traceArr.join("\n")}`
	} else {
		return err;
	}
}

const { error, log } = console;

console.log = (...msgs) => {
	log(...msgs.map(i => {
		if (Object(i) !== i) {
			return `${i}`;
		}
		try {
			const proto = Object.getPrototypeOf(i);
			if (proto !== null) {
				throw new Error();
			}
			return i.toString();
		} catch (e) {
			return util.inspect(i);
		}
	}));
}

console.trace = (...msgs) => {
	const stack = new Trace(...msgs).stack;
	console.log(stack);
}

console.error = (...errors) => {
	errors = errors.map(err => getStackTrace(err));
	error(...errors);
}
console.exception = console.error;

//require('npm');

/*
console
alert (alias of: console.log)
prompt
confirm
module
require
__dirname
__filename
global
clearInterval
clearTimeout
setInterval
setTimeout
queueMicrotask
clearImmediate
setImmediate
*/