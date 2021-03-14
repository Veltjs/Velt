const fs = require('fs');
const util = require('util');
const { server, cast, utils: { isJavaInstance } } = require('velt');
const { Inventory } = require('velt-helpers');

const { Location, World } = Java.pkg('org.bukkit');
const { Entity } = Java.pkg('org.bukkit.entity');
const { Vector } = Java.pkg('org.bukkit.util');
const { ItemStack } = Java.pkg('org.bukkit.inventory');

const { Utils } = Java.pkg('xyz.corman.velt');

const { Map, Base64, Arrays } = Java.pkg('java.util');

const writeFile = util.promisify((...args) => fs.writeFile(...args));

class Unevaluated {
	constructor(callback) {
		this.callback = callback;
	}
	evaluate() {
		return this.callback();
	}
}

function serialize(obj) {
	if (Object(obj) !== obj) {
		return {
			type: 'primitive',
			value: obj
		};
	} else if (Array.isArray(obj)) {
		return {
			type: 'array',
			value: obj.map(i => serialize(i))
		};
	} else if (Object.getPrototypeOf(obj) === Object.prototype) {
		const map = {};
		for (let [key, val] of Object.entries(obj)) {
			map[key] = serialize(val);
		}
		return {
			type: 'map',
			value: map
		};
	} else if (isJavaInstance(obj, Location)) {
		return {
			type: 'location',
			value: {
				x: obj.getX(),
				y: obj.getY(),
				z: obj.getZ(),
				yaw: obj.getYaw(),
				pitch: obj.getPitch(),
				world: serialize(obj.getWorld())
			}
		};
	} else if (isJavaInstance(obj, World)) {
		return {
			type: 'world',
			value: obj.getName()
		};
	} else if (isJavaInstance(obj, Entity)) {
		return {
			type: 'entity',
			value: obj.getUniqueId().toString()
		};
	} else if (isJavaInstance(obj, Vector)) {
		return {
			type: 'vector',
			value: {
				x: obj.getX(),
				y: obj.getY(),
				z: obj.getZ()
			}
		};
	} else if (isJavaInstance(obj, ItemStack)) {
		const bytes = obj.serializeAsBytes();
		return {
			type: 'itemstack',
			value: Base64.getEncoder().encodeToString(bytes)
		};
	} else if (obj instanceof Inventory) {
		const value = {
			contents: serialize(obj.contents)
		};
		if (obj.armor) value.armor = serialize(obj.armor);
		return {
			type: 'inventory',
			value
		}
	} 
}

function deserialize({ type, value }) {
	if (type == 'primitive') {
		return value;
	} else if (type == 'array') {
		return value.map(i => deserialize(i));
	} else if (type == 'map') {
		const obj = {};
		for (let [key, val] of Object.entries(value)) {
			obj[key] = deserialize(val);
		}
		return obj;
	} else if (type == 'location') {
		return cast.asLocation({
			...value,
			world: deserialize(value.world)
		});
	} else if (type == 'world') {
		return cast.asWorld(value);
	} else if (type == 'entity') {
		return new Unevaluated(() => {
			for (let world of server.worlds()) {
				let result;
				world.getEntities()
					.stream()
					.forEach(i => {
						if (i.getUniqueId().toString() == value) {
							result = i;
						}
					});
				if (result) {
					return result;
				}
			}
		});
	} else if (type == 'vector') {
		return new Vector(value.x, value.y, value.z);
	} else if (type == 'itemstack') {
		const bytes = Base64.getDecoder().decode(Utils.toBytes(value));
		return ItemStack.deserializeBytes(bytes);
	} else if (type == 'inventory') {
		const extra = value.armor ? [ deserialize(value.armor) ] : [];
		const inv = new Inventory(deserialize(value.contents), ...extra);
		return inv;
	}
}

function deepClone(obj) {
	if (Object(obj) !== obj) {
		return obj;
	} else if (Array.isArray(obj)) {
		return [ ...obj ].map(i => deepClone(i));
	} else if (Object.getPrototypeOf(obj) === Object.prototype) {
		const map = {};
		for (let [key, val] of Object.entries(obj)) {
			map[key] = deepClone(val);
		}
		return map;
	} else {
		return obj;
	}
}

const defaults = {
	autoSave: true,
	autoSaveDelay: { seconds: 10 }
};

const fieldDefaults = {};

class Item {
	constructor() {}
	item(index, opts = fieldDefaults) {
		return new Field(this, index, opts);
	}
	field(name, ...args) {
		return this.item(name, ...args);
	}
	find(cond) {
		let ind = 0;
		const val = this.get();
		for (let item of val) {
			if (cond(item)) {
				return this.item(ind);
			}
			ind++;
		}
		return Nothing;
	}
	has(cond) {
		const val = this.get();
		for (let item of val) {
			if (cond(item)) {
				return true;
			}
		}
		return false;
	}
	filter(cond) {
		const val = this.get();
		this.set(val.filter(cond));
		return this;
	}
	remove(val) {
		this.filter(i => i !== val);
		return this;
	}
	push(obj) {
		this.set([ ...this.get(), obj ]);
		return this;
	}
	pop(item) {
		const val = this.field(item).get();
		const clone = deepClone(this.get());
		delete clone[item];
		this.set(clone);
		return val;
	}
	setDefault(def) {
		if (def && !this.get()) {
			this.set(def);
		}
		return this;
	}
	get() {
		const val = this._get();
		if (val instanceof Unevaluated) {
			return val.evaluate();
		}
		return val;
	}
	add(num) {
		return this.set(this.get() + num);
	}
	subtract(num) {
		return this.set(this.get() - num);
	}
	multiply(num) {
		return this.set(this.get() * num);
	}
	divide(num) {
		return this.set(this.get() / num);
	}
	pow(num) {
		return this.set(this.get() ^ num);
	}
}

class Nothing extends Item {
	_get() {
		return undefined;
	}
}

class Storage extends Item {
	constructor(path, opts = {}) {
		super();
		opts = { ...defaults, ...opts };
		this.path = path;
		try {
			const text = fs.readFileSync(path);
			this.value = JSON.parse(text);
			const deserialized = deserialize(this.value);
			if (deserialized) this.value = deserialized;
		} catch (e) {
			console.error(`Could not load storage at ${path}`);
		}
		this.autoSave = opts.autoSave;
		this.autoSaveDelay = opts.autoSaveDelay;
		if (this.autoSave) {
			this.updated = false;
			server.schedule(this.autoSaveDelay, () => {
				if (this.updated) {
					try { this.save().catch(console.error); } catch (e) { console.error(e) };
					this.updated = false;
				}
			});
		}
		this.setDefault(opts.default);
	}
	_get() {
		return this.value;
	}
	set(val) {
		if (val !== this.value) {
			this.value = val;
			this.updated = true;
		}
		return this;
	}
	save(path, callback) {
		if (callback) return this.save(path).then(callback);
		if (!path && this.path) path = this.path;
		return writeFile(path, JSON.stringify(serialize(this.value), null, 2));
	}
	static createConfig(path, data, opts = defaults) {
		if (!opts.default) opts.default = data;
		if (!opts.autoSave) opts.autoSave = false;
		return new Storage(path, opts);
	}
}

class Field extends Item {
	constructor(parent, index, opts) {
		super();
		this.parent = parent;
		this.index = index;
		this.setDefault(opts.default);
	}
	_get() {
		const val = this.parent.get();
		return val[this.index];
	}
	set(value) {
		const val = deepClone(this.parent.get());
		val[this.index] = value;
		this.parent.set(val);
		return this;
	}
}

module.exports = { Storage };