require = (function() {
	const Scanner = Java.type('java.util.Scanner');
	const File = Java.type('java.io.File');
	const Utils = Java.type('xyz.corman.velt.Utils');
	const Paths = Java.type('java.nio.file.Paths');
	const Velt = Java.type('xyz.corman.velt.Velt');
	const FileSystem = Java.type('xyz.corman.velt.modules.FileSystem');
	
	const readFile = (...args) => FileSystem.readFileSync(...args);
	const fileExists = path => new File(path).exists();
	const directoryExists = path => {
		const file = new File(path);
		return file.exists() && file.isDirectory();
	}
	
	const cache = {};

	class ModuleError extends Error {
		constructor(message) {
			super(message);
			this.name = this.constructor.name;
		}
	}
	
	class Failure {}
	
	class Module {
		constructor(id, filename, parent) {
			this.id = id;
			this.filename = filename;
			this.path = new File(filename).getParent().toString();
			this.loaded = false;
			this.children = [];
			
			if (parent && parent.children) parent.children.push(this);
			
			this.exports = {};
		}
		
		get exports() {
			return this._exports;
		}
		
		set exports(val) {
			this._exports = val;
			cache[this.filename] = val;
		}
	}
	
	class NodeModule {
		constructor(id, filename) {
			this.id = id;
			this.filename = filename;
			this.loaded = false;
			this.module = new Module(this.id, this.filename);
		}
		load() {
			this.body = readFile(this.filename);
			this.loaded = true;
			return this;
		}
		execute() {
			if (!this.loaded) {
				throw new Error('Module is not yet loaded and cannot be executed');
			}
			const { module } = this;
			if (this.filename.endsWith('.json')) {
				module.exports = JSON.parse(this.body, false);
			} else {
				const name = new File(this.filename).getName();
				try {
					const func = new Function('exports', 'module', 'require', '__filename', '__dirname', this.body);
					Object.defineProperty(func, 'name', {value: name, configurable: true});
					func.apply(module, [ module.exports, module, id => require(id, module), module.filename, module.path ]);
				} catch (e) {
					console.error(`Error in ${this.filename}`);
					console.error(e);
				}
			}
			module.loaded = true;
			return module.exports;
		}
	}
	
	const require = function(id, parent, level = 0) {
		/*
		 * Support Exists for:
		 * - Local JS modules
		 * - Absolute JS modules
		 * - Velt node_modules
		 * Add Support For:
		 * - JSON Modules
		 * - Using require on directories
		 */
		
		let filename = Utils.toAbsolutePath(id, (parent && parent.path && Paths.get(parent.path)) || Paths.get(""));
		
		if (!fileExists(filename)) { //Add in JS or JSON extension
			if (fileExists(`${filename}.js`)) {
				filename = `${filename}.js`;
			} else if (fileExists(`${filename}.json`)) {
				filename = `${filename}.json`;
			}
		}
		
		if (!fileExists(filename)) { //Resolve as a node module, either a core or regular module
			if (level == 0) {
				const modules = Paths.get(Velt.getInstance().getDataFolder().getAbsolutePath().toString(), "node_modules", id).toString();
				const coreModules = Paths.get(Velt.getInstance().getDataFolder().getAbsolutePath().toString(), "node_modules", "core", id).toString();
				let res = require(modules, parent, 1);
				if (res === Failure) res = require(coreModules, parent, 1);
				return res;
			} else {
				return Failure;
			} 
		}
		
		if (directoryExists(filename)) { //Handle module as directory. TODO: Work with package.json
			let main = 'index.js';
			let pkgPath = Paths.get(filename, 'package.json').toString();
			if (fileExists(pkgPath)) {
				const pkg = JSON.parse(readFile(pkgJson), false);
				if (pkg.main) main = pkg.main;
			}
			return require(Paths.get(filename, main).toString(), parent);
		}
		
		if (cache[filename]) {
			return cache[filename];
		}
		
		const module = new NodeModule(id, filename)
			.load();
		
		let val;
		
		val = module.execute();
		
		return val;
	};
	
	return require;
})();