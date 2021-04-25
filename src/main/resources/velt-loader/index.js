require = (function() {
	const Scanner = Java.type('java.util.Scanner');
	const File = Java.type('java.io.File');
	const Utils = Java.type('xyz.corman.velt.Utils');
	const Paths = Java.type('java.nio.file.Paths');
	const Velt = Java.type('xyz.corman.velt.Velt');
	const FileSystem = Java.type('xyz.corman.velt.modules.FileSystem');
	let fs;

	let loadedTS = false;

	const compile = (source, config) => {
		return __tscompiler.transpile(source);
	}

	const readFile = (...args) => FileSystem.readFileSync(...args);
	const fileExists = path => new File(path).exists();
	const directoryExists = path => {
		const file = new File(path);
		return file.exists() && file.isDirectory();
	}

	const cache = {};

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
			this.body = (readFile(this.filename));
			this.loaded = true;
			return this;
		}
		execute() {
			if (!this.loaded) {
				throw new Error('Module is not yet loaded and cannot be executed');
			}
			const { module } = this;
			const extensions = this.filename.split('.');
			const extension = extensions[extensions.length - 1];
			switch (extension) {
				case 'json': {
					module.exports = JSON.parse(this.body, false);
					break;
				}
				case 'ts': {
					if (!fs) {
						fs = require('fs');
					}
					if (!loadedTS) {
						const info = [
							'='.repeat(25),
							'Velt TypeScript Support is Experimental - Please do not use it in production!',
							'TypeScript with Velt only transpiles, it does not type-check your code',
							'='.repeat(25)
						].join('\n');
						loadedTS = true;
					}
					const out = compile(this.body);
					if (out == null) {
						console.error(`Could not succesfully compile ${this.filename}`);
					}
					this.body = out;
					break;
				}
			}
			if (extension !== 'json') {
				const name = new File(this.filename).getName();
				try {
					const func = __runtime.eval(`(function (exports, module, require, __filename, __dirname) {${this.body} \n})`, module.filename);
					func.apply(module, [ module.exports, module, id => require(id, module), module.filename, module.path ]);

				} catch (e) {
					console.error(`Error in ${this.filename}`);
					console.error(e);
					throw `Error in ${this.filename}\n${e}`;
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
		 * - JSON Modules
		 * - Using require on directories
		 */

		let filename = Utils.toAbsolutePath(id, (parent && parent.path && Paths.get(parent.path)) || Paths.get(""));

		if (!fileExists(filename)) { //Add in JS or JSON extension
			if (fileExists(`${filename}.js`)) {
				filename = `${filename}.js`;
			} else if (fileExists(`${filename}.json`)) {
				filename = `${filename}.json`;
			} else if (fileExists(`${filename}.ts`)) {
				filename = `${filename}.ts`;
			}
		}

		if (!fileExists(filename)) { //Resolve as a node module, either a core or regular module
			if (level == 0) {
				/*const modules = Paths.get(Velt.getInstance().getDataFolder().getAbsolutePath().toString(), "node_modules", id).toString();
				const coreModules = Paths.get(Velt.getInstance().getDataFolder().getAbsolutePath().toString(), "node_modules", "core", id).toString();*/
				const modules = Paths.get(__runtime.getModulesFolder(), id).toString();
				const coreModules = Paths.get(__runtime.getModulesFolder(), 'core', id).toString();
				let res = require(modules, parent, 1);
				if (res === null) res = require(coreModules, parent, 1);
				return res;
			} else {
				return null;
			}
		}

		if (directoryExists(filename)) { //Handle module as directory. TODO: Work with package.json
			let main = 'index.js';
			let pkgPath = Paths.get(filename, 'package.json').toString();
			if (fileExists(pkgPath)) {
				const pkg = JSON.parse(readFile(pkgPath), false);
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