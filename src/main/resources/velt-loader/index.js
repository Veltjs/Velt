require = (function() {
	const Scanner = Java.type('java.util.Scanner');
	const File = Java.type('java.io.File');
	const Utils = Java.type('xyz.corman.velt.Utils');
	const Paths = Java.type('java.nio.file.Paths');
	const Velt = Java.type('xyz.corman.velt.Velt');
	const FileSystem = Java.type('xyz.corman.velt.modules.FileSystem');
	let fs;
	let ts;

	let libCache;
	const inst = Velt.getInstance();
	if (inst.getLibs() != null) {
		libCache = inst.getLibs();
	} else {
		libCache = {};
		inst.setLibs(libCache);
	}

	const libs = Paths.get(
		Velt.getInstance().getDataFolder().getAbsolutePath(),
		"node_modules",
		"typescript"
	);

	const types = Paths.get(
		Velt.getInstance().getDataFolder().getAbsolutePath(),
		"node_modules",
		"@types"
	);

	const path = Paths.get(
		Velt.getInstance().getDataFolder().getAbsolutePath(),
		"node_modules",
		"typescript",
		"lib",
		"lib.d.ts"
	).toString();

	const compileFull = (file, source) => {
		let output;
		let program = ts.createProgram([file], { allowJs: true }, {
			getSourceFile(fileName, languageVersion) {
				const path = Paths.get(fileName);
				const formatted = path.toString();
				const isLib = path.startsWith(libs);
				if (isLib) {
					console.log('Here:', formatted, !!libCache[formatted], Object.keys(libCache));
					if (libCache[formatted]) {
						return libCache[formatted];
					}
				}
				let sourceText = readFile(fileName);
				if (isLib) {
					console.log('Generating Typescript Lib:', fileName);
				}
				const out = sourceText !== undefined
					? ts.createSourceFile(fileName, sourceText, languageVersion)
					: undefined;
				if (isLib) {
					libCache[formatted] = out;
				}
				return out;
			},
			getDefaultLibFileName: () => path,
			writeFile: (fileName, content) => {
				output = content;
			},
			getCurrentDirectory: () => new File(file).getParentFile().getAbsolutePath(),
			getDirectories: path => [],
			getCanonicalFileName: fileName => fileName,
			getNewLine: () => '\n',
			useCaseSensitiveFileNames: () => false,
			readFile(name) {
				const exists = new File(name).exists();
				if (exists) {
					return fs.readFile(name);
				} else {
					return Promise.resolve(null);
				}
			},
			fileExists(path) {
				return new File(path).exists();
			}
		});
		let emitResult = program.emit();

		let allDiagnostics = ts
			.getPreEmitDiagnostics(program)
			.concat(emitResult.diagnostics);

		let success = true;
		allDiagnostics.forEach(diagnostic => {
			if (!(diagnostic.file)) {
				return;
			}
			const simplified = Paths.get(diagnostic.file.fileName);
			if (!(simplified.startsWith(libs)) && !(simplified.startsWith(types))) {
				let { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
				let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
				console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
				success = false;
			}
		});
		if (success) {
			return output;
		} else {
			return null;
		}
	};
	const compile = (source, config) => {
		return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS }}).outputText;
	}

	const readFile = (...args) => FileSystem.readFileSync(...args);
	const fileExists = path => new File(path).exists();
	const directoryExists = path => {
		const file = new File(path);
		return file.exists() && file.isDirectory();
	}

	const cleanString = input => {
		var output = "";
		for (let i = 0; i < input.length; i++ || input.charCodeAt(i) >= 160 && input.charCodeAt(i) <= 255) {
			if (input.charCodeAt(i) <= 127) {
				output += input.charAt(i);
			}
		}
		return output;
	};

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
					if (!ts) {
						const start = new Date()
						const info = [
							'='.repeat(25),
							'Velt TypeScript Support is Experimental - Please do not use it in production!',
							'TypeScript with Velt only transpiles, it does not type-check your code',
							'='.repeat(25)
						].join('\n');
						console.error(info);
						console.log('Loading Typescript module...');
						ts = require('typescript');
						const end = new Date();
						console.log(`Loaded Typescript compiler in ${Math.abs(start - end) / 1000} seconds.`)
					}
					const configPath = ts.findConfigFile(
						/*searchPath*/ this.filename,
						file => {
							return new File(file).exists();
						},
						"tsconfig.json"
					);
					let config = {};
					if (configPath) {
						config = JSON.parse(require('fs').readFileSync(configPath));
					}
					const options = {
						...config,
						compilerOptions: {
							module: ts.ModuleKind.CommonJS,
							...(config.compilerOptions ?? {})
						}
					}
					const out = compile(this.body, options);
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
					/**const func = new Function('exports', 'module', 'require', '__filename', '__dirname', this.body);
					 Object.defineProperty(func, 'name', {value: name, configurable: true});
					 func.apply(module, [ module.exports, module, id => require(id, module), module.filename, module.path ]);*/
					const source = `(function(exports, module, require, __filename, __dirname) {${this.body}\n})`;
					const evaluated = __context.eval(Velt.fromString(source, module.filename));
					evaluated.apply(module, [module.exports, module, id => require(id, module), module.filename, module.path]);
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