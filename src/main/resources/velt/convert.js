const { internals } = require('velt');
const { HashMap } = Java.pkg('java.util');

const arrays = {
	fromJavaArray: internals.javaArrToJSArr,
	fromJavaList: internals.javaListToJSArr,
	toJavaArray: internals.JSArrToJavaArr,
	toJavaList: internals.JSArrToJavaList,
	toJava(obj, { type = 'list' } = {}) {
		if (type === 'list') {
			return this.toJavaList(obj);
		} else {
			return this.toJavaArray(obj);
		}
	},
	fromJava(obj) {
		if (obj.forEach) {
			return this.fromJavaList(obj);
		} else {
			return this.fromJavaArray(obj);
		}
	}
};

const maps = {
	toJava(obj) {
		const map = new HashMap();
		for (const [ key, val ] of Object.entries(obj)) {
			map.put(key, val);
		}
		return map;
	},
	fromJava(map) {
		const obj = {};
		map.entries().forEach(entry => {
			const key = entry.getKey();
			const val = entry.getValue();
			obj[key] = val;
		});
		return obj;
	}
};

module.exports = { arrays, maps };