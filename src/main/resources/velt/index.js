const { Vector } = Java.pkg('org.bukkit.util');
const { Bukkit, ChatColor, Location , Material, World } = Java.pkg('org.bukkit');
const { ItemStack, ItemFlag } = Java.pkg('org.bukkit.inventory');
const BukkitRunnable = Java.type('org.bukkit.scheduler.BukkitRunnable');
const { EntityType, Entity, Player, Projectile, LivingEntity } = Java.pkg('org.bukkit.entity');
const { Enchantment } = Java.pkg('org.bukkit.enchantments');

const { Paths } = Java.pkg('java.nio.file');

const { Events, Utils } = Java.pkg('xyz.corman.velt');

const { ArrayList, Arrays, UUID } = Java.pkg('java.util');

const Index = Java.type('xyz.corman.velt.Velt');

const nearley = require('nearley');

// Generated automatically by nearley, version 2.19.3
// http://github.com/Hardmath123/nearley
const grammar = (function () {
	function id(x) {
		return x[0];
	}

	const grammar = {
		Lexer: undefined,
		ParserRules: [
			{ name: "main$ebnf$1", symbols: ["args"], postprocess: id },
			{
				name: "main$ebnf$1",
				symbols: [],
				postprocess: function (d) {
					return null;
				},
			},
			{
				name: "main",
				symbols: ["cmd", "main$ebnf$1"],
				postprocess: ([cmd, args]) => ({
					cmd,
					args,
				}),
			},
			{ name: "cmd$ebnf$1", symbols: [/[a-zA-Z]/] },
			{
				name: "cmd$ebnf$1",
				symbols: ["cmd$ebnf$1", /[a-zA-Z]/],
				postprocess: function arrpush(d) {
					return d[0].concat([d[1]]);
				},
			},
			{
				name: "cmd",
				symbols: ["cmd$ebnf$1"],
				postprocess: (i) => i[0].join(""),
			},
			{ name: "type$subexpression$1", symbols: ["simple_type"] },
			{ name: "type$subexpression$1", symbols: ["optional"] },
			{ name: "type$subexpression$1", symbols: ["spread"] },
			{
				name: "type",
				symbols: [{ literal: "(" }, "type$subexpression$1", { literal: ")" }],
				postprocess: (i) => i[1][0],
			},
			{ name: "simple_type$ebnf$1", symbols: [/[a-zA-Z]/] },
			{
				name: "simple_type$ebnf$1",
				symbols: ["simple_type$ebnf$1", /[a-zA-Z]/],
				postprocess: function arrpush(d) {
					return d[0].concat([d[1]]);
				},
			},
			{
				name: "simple_type",
				symbols: ["simple_type$ebnf$1"],
				postprocess: (i) => ({
					type: "simple",
					value: i[0].join(""),
				}),
			},
			{
				name: "optional",
				symbols: ["simple_type", { literal: "?" }],
				postprocess: (i) => ({
					type: "optional",
					value: i[0],
				}),
			},
			{
				name: "spread$string$1",
				symbols: [{ literal: "." }, { literal: "." }, { literal: "." }],
				postprocess: function joiner(d) {
					return d.join("");
				},
			},
			{
				name: "spread",
				symbols: ["spread$string$1", "simple_type"],
				postprocess: (i) => ({
					type: "spread",
					value: i[1],
				}),
			},
			{
				name: "args$ebnf$1$subexpression$1",
				symbols: [{ literal: " " }, "type"],
			},
			{ name: "args$ebnf$1", symbols: ["args$ebnf$1$subexpression$1"] },
			{
				name: "args$ebnf$1$subexpression$2",
				symbols: [{ literal: " " }, "type"],
			},
			{
				name: "args$ebnf$1",
				symbols: ["args$ebnf$1", "args$ebnf$1$subexpression$2"],
				postprocess: function arrpush(d) {
					return d[0].concat([d[1]]);
				},
			},
			{
				name: "args",
				symbols: ["args$ebnf$1"],
				postprocess: (i) => i[0].map((x) => x[1]),
			},
		],
		ParserStart: "main",
	};
	return grammar;
})();


const createParser = () => {
	return new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
}

const parse = text => {
	const parser = createParser();
	parser.feed(text);
	return parser.results[0];
}

const plugin = Index.getInstance();
let eventsInst = Events.getInstance();

const plugins = {
	getManager() {
		return Bukkit.getPluginManager();
	},
	getPlugins(names = true) {
		let arr = this.getManager().getPlugins();
		if (names) {
			arr = arr.map(i => i.getName());
		}
		return arr;
	},
	fromName(name) {
		return this.getManager().getPlugin(name);
	},
	isEnabled(name) {
		return this.fromName(name).isEnabled();
	},
	disable(name) {
		return this.getManager().disablePlugin(this.fromName(name))
	},
	enable(name) {
		return this.getManager().enablePlugin(this.fromName(name))
	}
};


function isJavaInstance(obj, cls) {
	if (Array.isArray(cls)) {
		for (i of cls) {
			if (obj instanceof i) return true;
		}
		return false;
	}
	return Utils.isInstanceOf(cls, obj);
}


const events = {
	waiting: {},
	callbacks: {},
	anyEvent: Symbol('anyEvent'),
	on(event, callback) {
		if (Array.isArray(event)) {
			const events = event.forEach(ev => this.on(ev, callback));
			return {
				close() {
					events.forEach(ev => event.close());
				}
			}
		} else {
			if (!this.callbacks[event]) this.callbacks[event] = [];
			this.callbacks[event].push(callback);
		}
		return {
			close() {
				let callbacks = events.callbacks[event];
				callbacks.splice(callbacks.indexOf(callback), 1);
			}
		}
	},
	once(event, cond = undefined, options = undefined) {
		if (options === undefined) {
			var callback = undefined;
			var timeout = undefined;
		} else if (typeof options === 'function') {
			var callback = options;
			var timeout = undefined;
		} else {
			var { callback, timeout = undefined } = options;
		}
		if (timeout) {
			return internals.timeout(
				events.waitFor(event, cond, callback), timeout
			);
		}
		if (Array.isArray(event)) {
			event.forEach(ev => this.waitFor(ev, cond, callback));
		} else {
			let condition;
			if (cond) {
				condition = cond;
			} else {
				condition = event => true;
			}
			if (!this.waiting[event]) this.waiting[event] = [];
			if (callback) {
				this.waiting[event].push({event, condition, callback});
			} else {
				return new Promise(resolve => {
					this.waiting[event].push(
						{event, condition, callback: resolve}
					);
				});
			}
		}
	},
	handleEvent(event) {
		let waiting = this.waiting[event.getClass().getSimpleName()];
		if (waiting) {
			waiting.forEach(({event: eventListenedFor, condition, callback}) => {
				if (
					(event.getClass().getSimpleName() !== eventListenedFor) || eventListenedFor === this.anyEvent
				) return;
				if (!condition(event)) return;
				callback(event);
				waiting.splice(waiting.indexOf(callback), 1);
			});
		}
		let handler = this.callbacks[event.getClass().getSimpleName()];
		if (!handler) return;
		for (callback of handler) callback(event);
		if (this.callbacks[this.anyEvent]) {
			this.callbacks[this.anyEvent]
				.forEach(callback => callback(event));
		}
	},
}

events.waitFor = events.once;

const ending = num => {
	switch (num) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

const commands = {
	types: [],
	handleType(obj) {
		if (typeof obj === 'string') {
			return { type: 'simple', value: obj };
		}
		return obj;
	},
	createType(...args) {
		switch (args.length) {
			case 1:
				const [ opts ] = args;

				commands.types.push(opts);
				break;
			case 2:
				return this.createType({
					type: args[0],
					...args[1]
				})
		}
		return this;
	},
	createListType(name, arr) {
		return this.createType({
			type: name,
			tabComplete: () => arr,
			match: (sender, arg) => arr.toLowerCase().includes(arg.toLowerCase())
		});
	},
	getType(type) {
		switch (type.type) {
			case 'simple':
				return this.types.find(i => {
					return i.type === type.value;
				});
			case 'optional': {
				const { value } = type;
				const val = this.findType(value);
				return {
					type: `${val.type}?`,
					tabComplete: val.tabComplete,
					match: (sender, arg) => arg == null ? null : val.match == null ? null : val.match(sender, arg)
				};
			}
			case 'spread': {
				const { value } = type;
				const val = this.findType(value);
				return {
					type: `...${val.type}`,
					tabComplete: val.tabComplete,
					match(sender, args) {
						const matched = args.map(arg => val.match(sender, arg));
						if (matched.some(i => i === undefined)) {
							return;
						}
						return matched;
					}
				}
			}
		}
	},
	findType(type) {
		const handledType = this.handleType(type);
		const out = this.getType(handledType);
		return out;
	},
	runCommand(sender, command) {
		Bukkit.dispatchCommand(sender, command);
	},
	runConsoleCommand(command) {
		this.runCommand(Bukkit.getServer().getConsoleSender(), command);
	},
	delegateTab(subs, tab, sender, args, current = null) {
		args = args ?? [];
		subs = subs ?? [];
		if (args == null) {
			return [];
		}
		const [ arg ] = args;
		if (arg != null) {
			for (const sub of subs) {
				if (sub.name === arg) {
					return commands.delegateTab(sub.subs, sub.tabComplete, sender, args.slice(1), sub);
				}
			}
		}

		const extras = args.length <= 1 ? subs.map(i => i.name) : [];

		if (current?.args != null) {
			const index = args.length === 0 ? 0 : args.length - 1;
			const argType = current.args[index];
			if (argType) {
				const arg = this.findType(argType);
				if (arg.tabComplete) {
					try {
						extras.push(...arg.tabComplete(sender, args[index]));
					} catch (e) {
						console.error(e);
					}
				}
			} else {
				const finalType = current.args[current.args.length - 1];
				if (finalType.type === 'spread') {
					const arg = this.findType(finalType);
					if (arg.tabComplete) {
						try {
							extras.push(...arg.tabComplete(sender, args[index]));
						} catch (e) {
							console.error(e);
						}
					}
				}
			}
		}

		if (tab) {
			return [ ...extras, ...tab(sender, ...args) ];
		} else {
			return [ ...extras ];
		}
	},
	delegateRun(subs, run, sender, args, current = null) {
		args = args ?? [];
		const arg = args?.[0];
		if (arg != null) {
			for (const sub of subs) {
				if (sub.name === arg) {
					return commands.delegateRun(sub.subs ?? [], sub.run, sender, args.slice(1), sub);
				}
			}
		}

		if (current != null) {
			if (current.playerOnly && commands.isConsole(sender)) {
				if (typeof current.playerOnly === 'string') {
					sender.sendMessage(current.playerOnly);
				}
				return true;
			}
			if (current.permission && !sender.hasPermission(current.permission)) {
				if (current.permissionMessage) {
					sender.sendMessage(current.permissionMessage);
				}
				return true;
			}
		}

		const newArgs = [ ...args ];

		if (current?.args != null) {
			let index = 0;
			for (const arg of args) {
				const argType = current.args[index];
				if (argType) {
					let val;
					if (argType.type === 'spread') {
						val = args.slice(index).filter(i => i !== '');
					} else {
						val = args[index];
					}
					const argument = this.findType(argType);
					if ((val == null || val.length === 0) && !([ 'spread', 'optional' ].includes(argType?.type))) {
						const end = ending(index + 1)
						sender.sendMessage(c`&fThe &b${index + 1}${end} &fargument is required, but wasn't specified.`);
						return;
					}
					const matched = argument.match(sender, val);
					if (matched !== false && matched !== undefined) {
						newArgs[index] = matched;
					} else {
						const end = ending(index + 1);
						switch (argType.type) {
							case 'spread':
								sender.sendMessage(c`&fOne of the arguments from the &b${index + 1}${end} &fspot to the final spot isn't a &b${argument.type}&f, which is the type it has to be.`);
								return;
							default:
								sender.sendMessage(c`&fYour &b${index + 1}${end} &fargument must be a &b${argument.type}&f, not &b${val}`);
								return;
						}
					}
				}
				index++;
			}
			if (args.length > current.args.length) {
				const final = current.args[current.args.length - 1];
				if (final.type !== 'spread') {
					sender.sendMessage(c`&6Unfortunately, you have put &c${args.length} &6args when the maximum is &c${current.args.length}`);
					return;
				}
			}
		}

		if (run) {
			return run(sender, ...newArgs);
		} else {
			throw new Error('No run or subcommand found');
		}
	},
	subCommand(cmd) {
		if (typeof cmd === 'function') {
			return {
				name: cmd.name,
				run: cmd
			};
		} else {
			if (cmd.args == null) {
				const { cmd: cmdName, args: parsedArgs } = parse(cmd.name);
				if (parsedArgs != null) {
					cmd.args = parsedArgs;
				}
				cmd.name = cmdName;
			}
			if (cmd.subs) {
				const subCommands = [];
				for (const [ sub, actual ] of Object.entries(cmd.subs)) {
					let extra = {};
					if (typeof actual === 'function') {
						extra.run = actual;
					} else {
						extra = { ...actual };
					}
					subCommands.push(commands.subCommand({ name: sub, ...extra }));
				}
				cmd.subs = subCommands;
			}
			return cmd;
		}
	},
	create(...args) {
		if (args.length === 1) {
			if (typeof args[0] == 'function') {
				return commands.create({ run: args[0] });
			}

			const [ opts ] = args;

			let {
				description = 'A velt command',
				usage = 'No given usage',
				aliases = [],
				subs = [],
				label = 'velt',
				run = undefined,
				tabComplete = undefined,
				name = undefined,
				permission = undefined,
				permissionMessage = undefined,
				playerOnly = undefined,
				args: cmdArgs = undefined,
				tabCondition = (sender, completions, args) => completions.filter(i => i.toLowerCase().startsWith(args[args.length - 1].toLowerCase())),
				argParser =  str => str.match(/\\?.|^$/g)
					.reduce((p, c) => {
						if (c === '"'){
							p.quote ^= 1;
						} else if (!p.quote && c === ' '){
							p.a.push('');
						} else {
							p.a[p.a.length-1] += c.replace(/\\(.)/,"$1");
						}
						return p;
					}, {a: ['']}).a
			} = opts;

			if (cmdArgs === undefined) {
				const { cmd: cmdName, args: parsedArgs } = parse(name);
				if (parsedArgs != null) {
					cmdArgs = parsedArgs;
					opts.args = cmdArgs;
				}
				name = cmdName;

			}

			if (tabCondition == null) {
				tabCondition = (sender, completions) => completions;
			}

			if (argParser == null) {
				argParser = str => str.split(' ');
			}

			if (name === undefined) {
				name = run.name;
			}

			const subCommands = [];

			const handleCommand = (sender, label, args) => {
				let parsed = argParser(internals.javaArrToJSArr(args).join(' '));
				if (run || subCommands.length > 0) {
					try {
						if (playerOnly && commands.isConsole(sender)) {
							sender.sendMessage(playerOnly);
							return true;
						} else {
							const res = commands.delegateRun(subCommands, run, sender, parsed, opts);
							if (res === false) {
								return false;
							}
							if (typeof res === 'string') {
								sender.sendMessage(res);
							}
						}
					} catch (e) {
						console.error(e);
						return false;
					}
					return true;
				}
				return false;
			};
			const handleTabComplete = (sender, alias, args) => {
				let parsed = argParser(internals.javaArrToJSArr(args).join(' '));
				if (tabComplete || subCommands.length > 0 || cmdArgs != null) {
					out = commands.delegateTab(subCommands, tabComplete, sender, parsed, opts);
				} else {
					out = [];
				}
				return internals.JSArrToJavaList(tabCondition(sender, out, args));
			}

			let cmd = Utils.makeVeltCommand(label, name, internals.JSArrToJavaList(aliases), description, usage, handleCommand, handleTabComplete, plugin);
			if (permission) {
				cmd.setPermission(permission);
			}
			if (permissionMessage) {
				cmd.setPermissionMessage(permissionMessage);
			}

			Utils.getCommandMap().register(cmd.getName(), "velt", cmd);
			Bukkit.getServer().syncCommands();

			for (const [ sub, actual ] of Object.entries(subs)) {
				let extra = {};
				if (typeof actual === 'function') {
					extra.run = actual;
				} else {
					extra = { ...actual };
				}
				subCommands.push(commands.subCommand({ name: sub, ...extra }));
			}

			return {
				tabComplete(call) {
					tabComplete = call;
				},
				run(call) {
					run = call;
				}
			};
		} else if (args.length == 2) {
			if (typeof args[0] == 'string') {
				let opts;
				if (typeof args[1] == 'function') {
					opts = {run: args[1]};
				} else {
					opts = args[1];
				}
				return commands.create({
					name: args[0],
					...opts
				});
			}
			return commands.create({ run: args[0], ...args[1] });
		} else if (args.length == 3) {
			return commands.create({
				name: args[0],
				run: args[2],
				...args[1]
			});
		}
	},
	isConsole(sender) {
		return !sender instanceof Player;
	},
};

commands
	.createType('text', {
		match(sender, arg) {
			if (arg == null) return;
			return arg;
		}
	})
	.createType('integer', {
		match(sender, arg) {
			if (arg == null) return;
			const parsed = parseInt(arg);
			if (isNaN(parsed)) return;
			return parsed;
		}
	})
	.createType('number', {
		match(sender, arg) {
			if (arg == null) return;
			const parsed = parseFloat(arg);
			if (isNaN(parsed)) return;
			return parsed;
		}
	})
	.createType('boolean', {
		tabComplete: () => [ 'true', 'false' ],
		match(sender, arg) {
			if (arg == null) return;
			const bools = { true: true, false: false };
			const val = bools[arg.toLowerCase()];
			if (val == null) return;
			return val;
		}
	})
	.createType('player', {
		tabComplete: () => server.onlinePlayers.map(i => i.getName()),
		match(sender, arg) {
			if (arg == null) return;
			const casted = cast.asPlayer(arg);
			if (!casted) return;
			return casted;
		}
	});

const server = {
	broadcast(msg, permission = undefined) {
		if (permission !== undefined) {
			Bukkit.broadcast(msg, permission);
		} else {
			Bukkit.broadcastMessage(msg);
		}
	},
	format(text) {
		return text
			.toUpperCase()
			.split('_')
			.map(i => i.toLowerCase())
			.join(' ');
	},
	unformat(text) {
		return internals.camelCaseToEnum(text)
			.split(' ')
			.join('_')
			.toUpperCase();
	},
	summon(name, loc) {
		const castedLoc = cast.asLocation(loc);
		return castedLoc
			.getWorld()
			.spawnEntity(castedLoc, EntityType.valueOf(
				this.unformat(name)
			));
	},
	worlds() {
		return internals.javaListToJSArr(Bukkit.getWorlds());
	},
	world(name) {
		return this.worlds()
			.find(i => i.getName().toLowerCase() === name.toLowerCase());
	},
	defaultWorld() {
		return this.worlds()[0];
	},
	material(name) {
		return Material.valueOf(server.unformat(name));
	},
	enchantment(name) {
		return Enchantment[server.unformat(name)];
	},
	itemflag(name) {
		return ItemFlag.valueOf(server.unformat(name));
	},
	itemstack(material, opts = {}) {
		const {
			count = 1,
			name = undefined,
			lore = undefined,
			durability = undefined,
			unbreakable = undefined,
			custommodeldata = undefined,
			enchantments = [],
			itemflags = []
		} = opts;
		let item;
		let meta;
		if (material instanceof ItemStack) {
			item = material.clone();
		} else if (Object.getPrototypeOf(material) === Object.prototype) {
			return server.itemstack(material.material ? material.material : material.type, material);
		} else if (typeof material === 'string') {
			return server.itemstack(
				server.material(material),
				{ count, name, lore, durability, unbreakable, custommodeldata, enchantments, itemflags }
			);
		} else {
			item = new ItemStack(material);
		}
		item.setAmount(count);
		if (durability !== undefined) {
			item.setDurability(durability);
		}
		meta = item.getItemMeta();
		if (name !== undefined) {
			meta.setDisplayName(name);
		}
		if (lore !== undefined) {
			let loreArray;
			if (typeof lore === 'string') {
				loreArray = lore.split('\n');
			} else {
				loreArray = lore;
			}

			meta.setLore(Arrays.asList(loreArray));
		}
		if (unbreakable !== undefined) {
			meta.setUnbreakable(unbreakable);
		}
		if (custommodeldata !== undefined) {
			meta.setCustomModelData(custommodeldata);
		}
		if (itemflags.length > 0) {
			let flags = [];
			for (const itemflag of itemflags) {
				const flag = typeof itemflag === 'string' ? server.itemflag(itemflag) : itemflag;
				flags.push(flag);
			}
			meta.addItemFlags(...flags);
		}
		for (const enchantment of enchantments) {
			const type = enchantment.type || enchantment.enchant || enchantment.enchantment;
			const enchant = typeof type === 'string' ? server.enchant(type) : type;
			meta.addEnchant(enchant, enchantment.level, true);
		}
		item.setItemMeta(meta);
		return item;
	},
	skullFromUUID(uuid, {
		count = 1,
		name = undefined,
		lore = undefined
	} = {}) {
		return server.skull(
			Bukkit.getServer().getOfflinePlayer(UUID.fromString(uuid)),
			{ count, name, string }
		);
	},
	skull(player, {
		count = 1,
		name = undefined,
		lore = undefined
	} = {}) {
		let item = new ItemStack(Material.PLAYER_HEAD, count);
		let meta = item.getItemMeta();
		if (typeof player !== 'string') {
			meta.setOwningPlayer(player);
		} else if (player.includes('-')) {
			return server.skullFromUUID(player, count, name, lore);
		} else {
			meta.setOwner(player);
		}
		if (name !== undefined) {
			meta.setDisplayName(name);
		}
		if (lore !== undefined) {
			var loreArr;
			if (typeof lore === 'string') {
				loreArr = lore.split('\n');
			}
			loreArr = internals.JSArrToJavaList(loreArr);
			meta.setLore(lore);
		}
		item.setItemMeta(meta);
		return item;
	},
	after(delay = 1, callback) {
		let out = new Promise((resolve, reject) => {
			let Runnable = Java.extend(BukkitRunnable, {
				run() {
					resolve(this);
				}
			});
			let runnable = new Runnable();
			runnable.runTaskLater(plugin, cast.asTicks(delay));
		});
		if (callback) {
			return out.then(callback);
		}
		return out;
	},
	schedule(period, ...args) {
		let callback;
		let delay = 1;
		let count = 0;
		let out;
		if (args.length == 1) {
			if (typeof args[0] == 'function') {
				callback = args[0];
			} else {
				delay = args[0];
			}
		} else if (args.length == 2) {
			([ delay, callback ] = args);
		}
		const callbacks = [];
		if (callback) {
			callbacks.push(callback);
		}
		let Runnable = Java.extend(BukkitRunnable, {
			run() {
				for (const call of [ ... callbacks ]) {
					if (call.type == 'promise') {
						call.resolve(count);
						callbacks.splice(callbacks.indexOf(call), 1);
					} else {
						call.apply(out, [ count ]);
					}
				}
				count++;
			}
		});
		let runnable = new Runnable();
		let task = runnable.runTaskTimer(plugin, cast.asTicks(delay), cast.asTicks(period));
		out = {
			next(call) {
				const out = new Promise(resolve => {
					callbacks.push({ type: 'promise', resolve })
				});
				if (call) {
					return out.then(call);
				} else {
					return out;
				}
			},
			addCallback(call) {
				callbacks.push(call);
				return this;
			},
			cancel() {
				task.cancel();
			}
		};
		return out;
	},
	playerFromName(name) {
		return Bukkit.getServer().getPlayer(name);
	},
	get onlinePlayers() {
		return internals.javaListToJSArr(
			Bukkit.getServer().getOnlinePlayers()
		);
	},
	get offlinePlayers() {
		return internals.javaListToJSArr(
			Bukkit.getServer().getOfflinePlayers()
		);
	},
	shutdown() {
		Bukkit.getServer().shutdown();
	},
	restart() {
		Bukkit.getServer().spigot().restart();
	},
	isMob(entity, type) {
		return entity instanceof Java.type(`org.bukkit.entity.${type}`);
	}
};

server.stop = server.shutdown;
server.reboot = server.restart;
server.enchant = server.enchantment;

server.plugins = plugins;

const scripts = {
	get location() {
		return plugin.getScriptsFolder();
	},
	path(...paths) {
		return Paths.get(plugin.getScriptsFolder(), ...paths).toString();
	},
	get dataLocation() {
		return plugin.getScriptDataFolder();
	},
	dataPath(...paths) {
		return Paths.get(plugin.getScriptDataFolder(), ...paths).toString();
	},
	get pluginLocation() {
		return plugin.getPluginDataFolder();
	},
	pluginPath(...paths) {
		return Paths.get(plugin.getPluginDataFolder(), ...paths).toString();
	}
};

let internals = {
	reconstructTemplate(text, args) {
		out = [];
		for ([count, i] of args.entries()) {
			out.push(text[count]);
			out.push(i);
		}
		out.push(text[args.length]);
		return out.join('');
	},
	handleStringFunc(func) {
		return function(text, ...args) {
			if (typeof text === 'string') return func(text);
			return func(internals.reconstructTemplate(text, args));
		}
	},
	enumToCamelCase(text) {
		let words = text.split('_');
		words = [words[0], ...words.slice(1)
			.map(i => internals.capitalize(i))];
		return words.join('');
	},
	camelCaseToEnum(text) {
		return text
			.replace(/([a-z])([A-Z])/g, `$1_$2`)
			.toUpperCase()
	},
	javaArrToJSArr(arr) {
		return internals.javaListToJSArr(Arrays.asList(arr));
	},
	javaListToJSArr(arr) {
		let out = [];
		arr.forEach(item => out.push(item));
		return out;
	},
	JSArrToJavaList(arr) {
		let out = new ArrayList();
		arr.forEach(item => out.add(item));
		return out;
	},
	JSArrToJavaArr(arr) {
		return internals.JSArrToJavaList(arr).toArray();
	},
	timeout(promise, ticks) {
		let timeout = new Promise(resolve => {
			server.after(ticks, () => {
				resolve(undefined);
			});
		});

		return Promise.race([
			promise,
			timeout
		]);
	},
	capitalize(str) {
		if (typeof str === 'string') {
			return str.replace(/^\w/, c => c.toUpperCase());
		} else {
			return '';
		}
	}
};

let cast = {
	asWorld(obj) {
		if (obj instanceof World) {
			return obj;
		} else if (typeof obj == 'string') {
			return server.world(obj);
		}
	},
	asLocation(obj) {
		let result;
		if (obj instanceof Location) {
			result = obj;
		} else if (Array.isArray(obj)) {
			result = cast.asLocation(
				{
					x: obj[0],
					y: obj[1],
					z: obj[2],
					world: obj[3],
					yaw: obj[4],
					pitch: obj[5]
				}
			);
		} else if (obj.getLocation) {
			result = obj.getLocation();
		} else if (obj.toLocation) {
			result = obj.toLocation();
		} else if (Object(obj) === obj) {
			let {
				x,
				y,
				z,
				world = server.defaultWorld(),
				yaw = 0,
				pitch = 0
			} = obj;
			result = new Location(cast.asWorld(world), x, y, z, yaw, pitch);
		}
		return result;
	},
	asVector(obj) {
		if (obj === undefined) {
			return new Vector();
		} else if (obj instanceof Vector) {
			return obj.clone();
		} else if (obj instanceof Entity) {
			return obj.getLocation().getDirection();
		} else if (obj.getLocation) {
			return obj.getLocation().toVector();
		} else if (obj.toLocation) {
			return obj.toLocation().toVector();
		} else if (obj.toVector) {
			return obj.toVector();
		} else if (obj.constructor === Object) {
			const { x, y, z } = obj;
			return new Vector(x, y, z);
		}
	},
	asItemStack(obj) {
		if (obj instanceof ItemStack) {
			return obj;
		}
		return server.itemstack(obj, {});
	},
	asTicks(obj) {
		if (Number.isInteger(obj)) return obj;
		let time = 0;
		if (obj.ticks) {
			time += obj.ticks;
		}
		if (obj.seconds) {
			time += obj.seconds * 20;
		}
		if (obj.minutes) {
			time += obj.minutes * 20 * 60;
		}
		if (obj.hours) {
			time += obj.hours * 20 * 60 * 60;
		}
		if (obj.days) {
			time += obj.days * 20 * 60 * 60 * 60;
		}
		return time;
	},
	asPlayer(obj) {
		if (obj instanceof Player) {
			return obj;
		}
		if (typeof obj === 'string') {
			return Bukkit.getServer().getPlayer(obj);
		}
	}
}

let utils = {
	isJavaInstance,
	colorize: internals.handleStringFunc(
		(text, char = '&') => ChatColor.translateAlternateColorCodes(
			char, text
		)
	),
	printErrorTrace: Utils.printErrorTrace
};

utils.color = utils.colorize;
utils.colour = utils.colorize;
utils.colourize = utils.colorize;
utils.c = utils.colorize;

eventsInst.listen(event => events.handleEvent(event));

const c = utils.color;

const infoMsg = c`
&5&lVelt Help
&8-----------
&b/velt &8| &b/velt info &8| &b/velt help &8| &fGet info on how to use Velt
&b/velt reload &8| &fReload all of your Velt scripts
&b/velt eval &8| &fEvaluate JavaScript code in-game
&8-----------`;


commands.create('velt', {
	argParser: null,
	subs: {
		info: () => infoMsg,
		help: () => infoMsg,
		reload: () => c`&5&lVelt &8| &b/velt reload &fis not yet implemented.`,
		eval(sender, ...args) {
			if (!sender.hasPermission('velt.eval')) return;
			const evaluate = args.join(' ');
			sender.sendMessage(c`&5&lVelt &8| &b${evaluate}`)
			try {
				sender.sendMessage(`${eval(evaluate)}`)
			} catch (err) {
				sender.sendMessage(c(`&c${err}`))
			}
		}
	},
	run: () => infoMsg
});

module.exports = {
	events,
	commands,
	server,
	scripts,
	cast,
	utils,
	internals,
	plugin,
	c: utils.color,
	color: utils.color,
	colorize: utils.color,
	colour: utils.color,
	colourize: utils.color,
};