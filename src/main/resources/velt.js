const { CommandExecutor, defaults: { BukkitCommand }, SimpleCommandMap} = Java.pkg('org.bukkit.command');
let TabExecutor;
try {
	TabCompleter = Java.type('org.bukkit.command.TabCompleter');
} catch {
	TabCompleter = undefined;
}
const { Vector, BlockIterator } = Java.pkg('org.bukkit.util');
const { Bukkit, ChatColor, Location , Material, World } = Java.pkg('org.bukkit');
const ProjectileSource = Java.type('org.bukkit.projectiles.ProjectileSource');
const { ItemStack, ItemFlag } = Java.pkg('org.bukkit.inventory');
const PotionEffectType = Java.type('org.bukkit.potion.PotionEffectType');
const BukkitRunnable = Java.type('org.bukkit.scheduler.BukkitRunnable');
const { EntityType, Entity, Player, Projectile, LivingEntity } = Java.pkg('org.bukkit.entity');
const { Enchantment } = Java.pkg('org.bukkit.enchantments');

const { Paths } = Java.pkg('java.nio.file');

const String = Java.type('java.lang.String');

const { Events, Utils } = Java.pkg('xyz.corman.velt');

const { ArrayList, Arrays, UUID } = Java.pkg('java.util');
const Collectors = Java.type('java.util.stream.Collectors');

const Velt = Java.type('xyz.corman.velt.Velt');

const util = require('util');

const plugin = Velt.getInstance();
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
	broadcast(msg, permission = undefined) {
		if (permission !== undefined) {
			Bukkit.broadcast(msg, permission);
		} else {
			Bukkit.broadcastMessage(msg);
		}
	},
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

const commands = {
	runCommand(sender, command) {
		Bukkit.dispatchCommand(sender, command);
	},
	runConsoleCommand(command) {
		this.runCommand(Bukkit.getServer().getConsoleSender(), command);
	},
	delegateTab(subs, tab, sender, args) {
		args = args ?? [];
		subs = subs ?? [];
		if (args == null) {
			return [];
		}
		const [ arg ] = args;
		if (arg != null) {
			for (const sub of subs) {
				if (sub.name === arg) {
					return commands.delegateTab(sub.subs, sub.tabComplete, sender, args.slice(1));
				}
			}
		}
		const extras = args.length <= 1 ? subs.map(i => i.name) : [];
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
			if (current.permission && !sender.hasPermission(current.permission)) {
				if (current.permissionMessage) {
					sender.sendMessage(current.permissionMessage);
				}
				return true;
			}
		}
		if (run) {
			return run(sender, ...args);
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
			if (cmd.subs) {
				const subCommands = [];
				for (const [ sub, actual ] of Object.entries(cmd.subs)) {
					subCommands.push({ name: sub, ...commands.subCommand(actual) });
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
			} = args[0];
			
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
							const res = commands.delegateRun(subCommands, run, sender, parsed);
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
				if (tabComplete || subCommands.length > 0) {
					out = commands.delegateTab(subCommands, tabComplete, sender, parsed);
				} else {
					out = [];
				}
				return internals.JSArrToJavaList(out);
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
				subCommands.push({ name: sub, ...commands.subCommand(actual) });
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

const server = {
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
&b/velt eval &8| &fRun JavaScript ingame
&8-----------`;


commands.create('velt', {
    subs: {
        info: () => infoMsg,
        help: () => infoMsg,
        reload: () => c`&5&lVelt &8| &b/velt reload &fis not yet implemented.`,
        eval(sender, ...args) {
		if (!sender.hasPermission("velt.eval")) return;
		const evaluate = args.join(' ');
		sender.sendMessage(c`&5&lVelt &8| &b${evaluate}`)
		try { 
			sender.sendMessage(`${eval(evaluate)}`) 
		} 
		catch (error) { 
			sender.sendMessage(c(`&c${error}`))
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
