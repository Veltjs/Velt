const { server, events, cast, plugin, internals: { capitalize, javaArrToJSArr, JSArrToJavaArr, JSArrToJavaList } } = require('velt');
const Utils = Java.type('xyz.corman.velt.Utils');
const { Bukkit, Location, Particle, Sound, SoundCategory, NamespacedKey } = Java.pkg('org.bukkit');
const PotionEffectType = Java.type('org.bukkit.potion.PotionEffectType');
const DisplaySlot = Java.type('org.bukkit.scoreboard.DisplaySlot');
const { Entity, LivingEntity, Player, Projectile } = Java.pkg('org.bukkit.entity');
const { Attribute } = Java.pkg('org.bukkit.attribute');
const { ProjectileSource } = Java.pkg('org.bukkit.projectiles');
const { ShapelessRecipe, ShapedRecipe, FurnaceRecipe, BlastingRecipe, CampfireRecipe, SmokingRecipe, SmithingRecipe, RecipeChoice } = Java.pkg('org.bukkit.inventory');
const { BarStyle, BarColor, BarFlag } = Java.pkg('org.bukkit.boss');

function shoot(entity, proj, {
	dir = undefined,
	speed = 1,
	shooter = undefined
} = {}) {
	let loc;
	let vel;
	if (shooter === undefined) shooter = entity;
	if (dir === undefined) {
		if ((entity instanceof Entity)) {
			dir = entity.getLocation().getDirection();
		} else {
			dir = new Vector();
		}
	} else {
		dir = new Direction(dir).vector;
	}
	loc = entity;
	if ((loc instanceof LivingEntity)) {
		loc = loc.getEyeLocation();
	} else if (!(loc instanceof Location)) {
		loc = cast.asLocation(loc);
	}
	vel = dir.normalize().multiply(speed);
	proj = server.summon(proj, loc);
	if (
		(shooter instanceof ProjectileSource)
		&& (proj instanceof Projectile)
	) {
		proj.setShooter(shooter);
	}
	if (proj !== undefined) {
		proj.setVelocity(vel);
	}
	return proj;
}

function lookingAt(player, range = 30, targetDist = 0.99) {
	let result = Utils.getLookingAt(player, range, targetDist);
	if (result) return result;
	return undefined;
}

function effect(entity, type, {duration = 20, amplifier = 0} = {}) {
	if (typeof type === 'object') {
		return effect(entity, type.type || type.effect, type);
	}
	return PotionEffectType
		.getByName(server.unformat(type))
		.createEffect(cast.asTicks(duration), amplifier)
		.apply(entity);
}
function clearEffects(entity) {
	entity.getActivePotionEffects().forEach(effect => {
		entity.removePotionEffect(effect.getType());
	});
}

function give(entity, ...items) {
	items.forEach(item => {
		entity.getInventory().addItem(cast.asItemStack(item));
	});
}

function attrs(entity) {
	return new Proxy({}, {
		get(target, prop, receiver) {
			try {
				let attr = Attribute.valueOf(server.unformat(prop));
				return entity.getAttribute(attr);
			} catch (e) { console.error(e); }
		}
	});
}

function itemInfo(equip) {
	let item, dropChance;
	if (equip.constructor === Object && equip.item != null && equip.dropChance != null) {
		item = equip.item;
		dropChance = equip.dropChance;
	} else {
		item = equip;
	}
	return { item, dropChance }
}

function equip(entity, equipment) {
	const entityEquipment = entity.getEquipment();
	for (name of ['helmet', 'chestplate', 'leggings', 'boots']) {
		if (equipment[name] != null) {
			const { item, dropChance } = itemInfo(equipment[name]);
			entityEquipment[`set${capitalize(name)}`](cast.asItemStack(item));
			if (dropChance != null) entityEquipment[`set${capitalize(name)}DropChance`](dropChance);
		}
	}
	if (equipment.mainhand != null) {
		const { item, dropChance } = itemInfo(equipment.mainhand);
		entityEquipment.setItemInMainHand(cast.asItemStack(item));
		if (dropChance != null) entityEquipment.setItemInMainHandDropChance(dropChance);
	}
	if (equipment.offhand != null) {
		const { item, dropChance } = itemInfo(equipment.offhand);
		entityEquipment.setItemInOffHand(cast.asItemStack(item));
		if (dropChance != null) entityEquipment.setItemInOffHandDropChance(dropChance);
	}
}

const guis = [];

class Gui {
	constructor(name, rows, movable = false) {
		const slots = rows * 9;
		this.inv = Bukkit.createInventory(null, rows * 9, name);
		this.callbacks = {};
		this.movable = {};
		this.slots = slots;
		for (let i = 0; i < slots; i++) {
			this.movable[i] = movable;
		}
		guis.push(this);
	}
	set(slot, item, options) {
		let movable, run, close;
		if (typeof options === 'function') {
			movable = false;
			run = options;
			close = false;
		} else if (options instanceof Gui) {
			movable = false;
			run = options;
			close = false;
		} else if (options === undefined) {
			movable = false;
			run = () => {};
			close = false;
		} else {
			({run = () => {}, movable = false, close = false} = options);
		}
		if (run instanceof Gui) {
		    const _run = run;
		    run = event => _run.open(event.getWhoClicked());
		}
		this.inv.setItem(slot, cast.asItemStack(item));
		this.movable[slot] = movable;
		this.callbacks[slot] = event => {
			const out = run(event);
			if (close) {
				event.getWhoClicked().closeInventory();
			}
			return out;
		};
		return this;
	}
	unset(slot) {
		this.inv.clear(slot);
		delete this.callbacks[slot];
		return this;
	}
	get(slot) {
		return this.inv.getItem(slot);
	}
	show(...players) {
		players.forEach(player => {
			player.closeInventory();
			player.openInventory(this.inv);
		});
		return this;
	}
}

Gui.prototype.format = Gui.prototype.set;
Gui.prototype.unformat = Gui.prototype.unset;
Gui.prototype.open = Gui.prototype.show;

events.on('InventoryClickEvent', event => {
	let clickedInv = event.getClickedInventory();
	let slot = event.getSlot();
	guis.forEach(gui => {
		let { inv } = gui;
		if (clickedInv !== inv) return;
		let callback = gui.callbacks[slot];
		let movable = gui.movable[slot];
		if (callback) {
			event.setCancelled(!movable);
			callback(event);
		}
	});
});


function swap(entity, other) {
	let entityLoc = entity.getLocation();
	let otherLoc = other.getLocation();
	entity.teleport(otherLoc);
	other.teleport(entityLoc);
}

class Pathfinder {
	constructor(entity) {
		this.entity = entity;
	}
	get target() {
		return this.entity.getTarget();
	}
	set target(entity) {
		this.entity.setTarget(entity)
	}
	get path() {
		return this.entity.getPathfinder().getCurrentPath();
	}
	set path(loc) {
		this.pathfind(loc);
	}
	pathfind(loc, speed = 1) {
		try {
			let pathfinder = this.entity.getPathfinder();
			if (!loc) {
				pathfinder.stopPathfinding();
				return;
			}
			pathfinder.moveTo(cast.asLocation(loc), speed);
			return this;
		} catch (e) {
			throw e;
		}
	}
	get aware() {
		return this.entity.isAware();
	}
	set aware(val) {
		this.entity.setAware(val);
	}
}

class Scoreboard {
	constructor(opts) {
		// name = undefined, slot = 'sidebar', type = 'dummy'
		let { name, slot, type, scores, board } = opts;
		if (!name) name = type;
		if (board == null) board = Scoreboard.createBoard();
		this.board = board;
		this.obj = this.board.registerNewObjective(name, type);
		if (slot) this.slot = slot;
		if (scores) this.set(scores);
	}
	static createBoard() {
		return Bukkit.getScoreboardManager().getNewScoreboard();
	}
	set slot(slot) {
		this.setSlot(slot);
	}
	setSlot(slot) {
		this.obj.setDisplaySlot(DisplaySlot.valueOf(server.unformat(slot)));
		return this;
	}
	set name(name) {
		this.setName(name);
	}
	setName(name) {
		this.obj.setDisplayName(name);
		return this;
	}
	setScore(index, text) {
		this.obj.getScore(text).setScore(index);
		return this;
	}
	set(...args) {
		if (args.length == 2) {
			this.setScore(...args);
			return this;
		}
		let [ scores ] = args;
		if (Array.isArray(scores)) {
			Object.entries(scores).forEach((ind, item) => {
				if (Array.isArray(item)) {
					this.setScore(...item);
				} else {
					this.setScore(parseInt(ind), item);
				}
			});
		} else {
			return this.set(
				Object.entries(scores).map(([key, val]) => [parseInt(key), val])
			);
		}
	}
	show(...players) {
		players.forEach(player => {
			player.setScoreboard(this.board);
		});
	}
}

class EntityWrapper extends Pathfinder {
	constructor(entity) {
		super(entity);
		this.entity = entity;
	}

	// Entity getters and setters

	get dead() {
		return this.entity.isDead();
	}
	get alive() {
		return !this.dead;
	}

	// Helper methods

	distTo(loc) {
		return distBetween(this.entity, cast.asLocation(loc));
	}
	shoot(...args) {
		shoot(this.entity, ...args);
		return this;
	}
	shootAndGet(...args) {
		return shoot(this.entity, ...args);
	}
	effect(...args) {
		effect(this.entity, ...args);
		return this;
	}
	equip(equipment) {
		equip(this.entity, equipment);
		return this;
	}
}

class Inventory {
	constructor(contents, armor) {
		if (!armor && (contents instanceof Entity)) {
			const inv = contents.getInventory();
			contents = javaArrToJSArr(inv.getContents()).map(i => i && i.clone());
			if (inv.getHelmet) {
				armor = javaArrToJSArr(inv.getArmorContents()).map(i => i && i.clone());
			}
		}
		this.contents = contents;
		if (armor) this.armor = armor;
	}
	give(entity, opts = { clear: true }) {
		const inv = entity.getInventory();
		if (opts.clear) {
			inv.clear();
		}
		inv.setContents(JSArrToJavaArr(this.contents));
		if (inv.getHelmet) {
			inv.setArmorContents(JSArrToJavaArr(this.armor));
		}
	}
}

class CustomMob {
	constructor(opts) {
		this.opts = {
			type: this.type || 'skeleton',
			...opts
		};
	}
	apply(entity) {
		const { opts } = this;

		const { genericMaxHealth } = attrs(entity);
		const maxHealth = opts.maxHealth || opts.health;
		const entityEquipment = entity.getEquipment();
		if (maxHealth != null) genericMaxHealth.setBaseValue(maxHealth)
		if (opts.health != null) entity.setHealth(opts.health);
		if (opts.name) entity.setCustomName(opts.name);
		if (opts.adult != null) {
			entity.setBaby(!opts.adult);
		} else if (opts.baby != null) {
			entity.setBaby(opts.baby);
		}
		if (opts.equipment) {
			equip(entity, opts.equipment);
		}
		if (opts.attrs !== undefined) {
			const attributes = attrs(entity);
			for (const [ attr, val ] of Object.entries(opts.attrs)) {
				attributes[attr].setBaseValue(val);
			}
		}
		if (opts.effects) {
			for (const applied of opts.effects) {
				effect(entity, applied);
			}
		}
		if (opts.cycle) {
			opts.cycle.call(new EntityWrapper(entity), entity);
		}
		return entity;
	}
	summon(loc) {
		const entity = server.summon(this.opts.type, loc);
		return this.apply(entity);
	}
}

function drop(item, loc) {
	item = cast.asItemStack(item);
	loc = cast.asLocation(loc);
	const center = loc.add(.5, .5, .5);
	loc.getWorld().dropItemNaturally(center, item);
}

function distBetween(start, end) {
	return cast.asLocation(start).distance(cast.asLocation(end));
}

class Item {
    constructor(...args) {
        let item, opts;
        if (args.length == 1) {
            item = args[0];
            opts = args[0];
        } else if (args.length == 2) {
            item = { material: args[0], ...args[1] };
            opts = args[1];
        }
        this.itemstack = server.itemstack(item);
        if (opts.interact) {
            events.on('PlayerInteractEvent', event => {
            	const item = event.getItem();
                if (!item) return;
                if (!item.isSimilar(this.itemstack)) return;
                opts.interact(event);
            });
        } else if (opts.attack) {
            events.on('EntityDamageByEntityEvent', event => {
                const player = event.getDamager();
                if (!(player instanceof Player)) {
                    return;
                }
                const item = player.getInventory().getItemInMainHand();
                if (!item) return;
                if (!item.isSimilar(this.itemstack)) return;
                opts.attack(event);
            });
        }
    }
    give(...players) {
        for (const player of players) {
            give(player, this.itemstack);
        }
    }
    isItem(other) {
    	return other.isSimilar(this.itemstack);
	}
}

class Direction {
	constructor(...args) {
		if (args.length == 1) {
			const [ arg ] = args;
			this.vector = arg instanceof Direction ? arg.vector.clone() : cast.asVector(arg);
		} else if (args.length == 2) {
			if (typeof args[0] == 'number') {
				let [ pitch, yaw ] = args;
		        pitch = ((pitch + 90) * Math.PI) / 180;
		        yaw = ((yaw + 90) * Math.PI) / 180;
				this.vector = new Vector(
					Math.sin(pitch) * Math.cos(yaw),
					Math.sin(pitch) * Math.sin(yaw),
					Math.cos(pitch)
				);
			} else {
				this.vector = cast.asLocation(args[0]).toVector().subtract(cast.asLocation(args[1]).toVector());
			}
		}
	}
	clone() {
		return new Direction(this.vector.clone());
	}
	reverse() {
		return new Direction(this.vector.clone().multiply(-1));
	}
	apply(loc, amount = 1) {
		return loc.add(this.vector.clone().multiply(amount));
	}
	push(entity, speed = 1) {
		entity.setVelocity(this.vector.subtract(entity.getLocation().toVector()).normalize().multiply(speed));
	}
	setDirection(entity, speed = 1) {
		entity.setVelocity(this.vector.normalize().multiply(speed));
	}
}

const crafting = {
    createShapedRecipe(options, namespace = (output.material || output)) {
        const key = namespacedKey(`shaped_${namespace}`);
        const recipe = new ShapedRecipe(key, server.itemstack(options.result));

        recipe.shape(options.patterns[0], options.patterns[1], options.patterns[2]);

        Object.entries(options.items).forEach(([key, value]) => {
            recipe.setIngredient(key, server.material(value));
        });

        Bukkit.addRecipe(recipe);

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    },
    createShapelessRecipe(input, output, namespace = (output.material || output)) {
        const key = namespacedKey(`shapeless_${namespace}`);
        const recipe = new ShapelessRecipe(key, server.itemstack(output));
        input.forEach(item => recipe.addIngredient(server.itemstack(item)));

        Bukkit.addRecipe(recipe);

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    },
    createFurnaceRecipe(input, output, xp = 0, cookingTime = 20, namespace = (output.material || output)) {
        const key = namespacedKey(`furnace_${namespace}`);

        Bukkit.addRecipe(new FurnaceRecipe(key, server.itemstack(output), server.material(input), xp, cookingTime));

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    },
    createBlastingRecipe(input, output, xp = 0, cookingTime = 20, namespace = (output.material || output)) {
        const key = namespacedKey(`blast_${namespace}`);

        Bukkit.addRecipe(new BlastingRecipe(key, server.itemstack(output), server.material(input), xp, cookingTime));

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    },
    createCampfireRecipe(input, output, xp = 0, cookingTime = 20, namespace = (output.material || output)) {
        const key = namespacedKey(`camp_${namespace}`);

        Bukkit.addRecipe(new CampfireRecipe(key, server.itemstack(output), server.material(input), xp, cookingTime));

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    },
    createSmokingRecipe(input, output, xp = 0, cookingTime = 20, namespace = (output.material || output)) {
        const key = namespacedKey(`smoke_${namespace}`);

        Bukkit.addRecipe(new SmokingRecipe(key, server.itemstack(output), server.material(input), xp, cookingTime));

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    },
    createSmithingRecipe(input, input2, output, namespace = (output.material || output)) {
        const key = namespacedKey(`smith_${namespace}`);

        Bukkit.addRecipe(new SmithingRecipe(key, server.itemstack(output), new RecipeChoice.MaterialChoice(server.material(input)), new RecipeChoice.MaterialChoice(server.material(input2)) ));

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    }/*,
    createStonecuttingRecipe(input, output, namespace = (output.material || output)) {
        const key = new NamespacedKey(plugin, `stone_${(namespace.replaceAll(' ', '_'))}`);

        Bukkit.addRecipe(new StonecuttingRecipe(key, server.itemstack(output), server.material(input)));

        return {
            delete() {
                Bukkit.removeRecipe(key);
            }
        }
    },*/
}

const bossbar = {
    getBar(bar) {
		const bossbar = Bukkit.getServer().getBossBar(namespacedKey(`bar_${bar}`));

        return bossBar(bossbar);
    },
    getBars() { 
        const bossbars = Bukkit.getServer().getBossBars();

        return {
            forEach(callback) { return bossbars.forEachRemaining(callback) }
        }
    },
    create(options, namespace = options.title) {
        const bossbar = Bukkit.getServer().createBossBar(namespacedKey(`bar_${namespace}`), options.title, BarColor.valueOf(server.unformat(options.color)), BarStyle.valueOf(server.unformat(options.style)));
        const methods = bossBar(bossbar);

        if (options.flags) options.flags.forEach(flag => methods.addFlag(flag));
        if (options.progress) methods.setProgress(options.progress);

        return methods;
    },
}

function bossBar(bossbar) {
    return {
        addFlag(flag) {
            bossbar.addFlag(BarFlag.valueOf(server.unformat(flag)));
            return this;
        },
        show(player) {
            if (!player) return bossbar.setVisible(true);
			if (Array.isArray(player)) {
				player.forEach(p => bossbar.addPlayer(p));
			} else {
				bossbar.addPlayer(player);
			}
            return this;
        },
        hide(player) {
            if (!player) return bossbar.setVisible(false);
			if (Array.isArray(player)) {
				player.forEach(p => bossbar.removePlayer(p));
			} else {
				bossbar.removePlayer(player);
			}
            return this;
        },
        removeAll() {
            bossbar.removeAll();
            return this;
        },
        removeFlag(flag) {
            bossbar.removeFlag(BarFlag.valueOf(server.unformat(flag)));
            return this;
        },
        setProgress(progress) {
            bossbar.setProgress(progress);
            return this;
        },
        setTitle(title) {
            bossbar.setTitle(title);
            return this;
        },
        setColor(color) {
            bossbar.setColor(BarColor.valueOf(server.unformat(color)));
            return this;
        },   
        setStyle(style) {
            bossbar.setStyle(BarStyle.valueOf(server.unformat(style)));
            return this;
        },
        get color() {
            return bossbar.getColor();
        },
        get players() {
            return bossbar.getPlayers();
        },
        get progress() {
            return bossbar.getProgress();
        },
        get style() {
            return bossbar.getStyle();
        },
        get title() {
            return bossbar.getTitle();
        },
        get visible() {
            return bossbar.isVisible();
        }
    }
}

/** Internal utility for creating a NamespacedKey. */
function namespacedKey(input) {
    return new NamespacedKey(plugin, input.replace(/((?![a-z0-9._-]+).)*/g, ''));
}

const sound = {
	getSound(sound) {
		if (typeof sound === 'string') {
			return Sound.valueOf(server.unformat(sound));
		} else {
			return sound;
		}
	},
	playSoundFor(obj, loc, effect, opts) {
		if (opts.category) {
			const category = SoundCategory.valueOf(server.unformat(opts.category));
			obj.playSound(loc, effect, category, opts.volume ?? 1, opts.pitch);
		} else {
			obj.playSound(loc, effect, opts.volume ?? 1, opts.pitch);
		}
	},
	play(loc, sound, opts) {
		loc = cast.asLocation(loc);
		const world = loc.getWorld();
		const effect = this.getSound(sound);
		this.playSoundFor(world, loc, effect, opts);
	},
	playForPlayer(...args) {
		if (args.length === 3) {
			const player = cast.asPlayer(args[0]);
			return sound.playForPlayer(player, player.getLocation(), args[2]);
		}
		let [ player, loc, sound, opts ] = args;
		loc = cast.asLocation(loc);
		const effect = this.getSound(sound);
		this.playSoundFor(player, loc, effect, opts);
	}
};

const particles = {
	getParticle(particle) {
		if (typeof particle === 'string') {
			return Particle.valueOf(server.unformat(particle));
		} else {
			return particle;
		}
	},
	show(particle, loc, opts = {}) {
		particle = this.getParticle(particle);
		loc.getWorld().spawnParticle(
			particle,
			loc,
			opts.count ?? opts.amount ?? 1,
			opts.offsetX ?? 0,
			opts.offsetY ?? 0,
			opts.offsetZ ?? 0
		);
	},
	showForPlayer(player, particle, loc, opts) {
		particle = this.getParticle(particle);
		player.spawnParticle(
			particle,
			loc,
			opts.count ?? opts.amount ?? 1,
			opts.offsetX ?? 0,
			opts.offsetY ?? 0,
			opts.offsetZ ?? 0
		);
	}
}

class CooldownManager {
	constructor(time) {
		this.time = cast.asMilliseconds(time);
		this.cooldowns = {};
	}
	cooldownHasPassed(cooldown) {
		return (new Date() - cooldown) > this.time;
	}
	has(name) {
		const cooldown = this.cooldowns[this.format(name)];
		if (cooldown == null) {
			return false;
		}
		if (this.cooldownHasPassed(cooldown)) {
			return false;
		}
		return true;
	}
	timeLeft(name) {
		const cooldown = this.cooldowns[this.format(name)];
		if (cooldown == null) {
			return null;
		}
		if (this.cooldownHasPassed(cooldown)) {
			return null;
		}
		return (this.time - (new Date() - cooldown)) / 1000;
	}
	of(name) {
		return { exists: this.has(name), timeLeft: this.timeLeft(name) };
	}
	reset(name) {
		this.cooldowns[this.format(name)] = new Date();
	}
	remove(name) {
		this.cooldowns[this.format(name)] = null;
	}
	format(name) {
		if (name instanceof Player) {
			return name.getUniqueId().toString();
		} else if (typeof name === 'string') {
			return name;
		}
	}
}

module.exports = {
	shoot,
	lookingAt,
	effect,
	clearEffects,
	give,
	attrs,
	Gui,
	swap,
	equip,
	Pathfinder,
	Scoreboard,
	EntityWrapper,
	Inventory,
	CustomMob,
	drop,
	distBetween,
	Item,
	Direction,
	crafting,
	bossbar,
	sound,
	particles,
	CooldownManager
};
