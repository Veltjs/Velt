const { server, events, cast, internals: { capitalize, javaArrToJSArr, JSArrToJavaArr, JSArrToJavaList } } = require('velt');
const Utils = Java.type('xyz.corman.velt.Utils');
const { Bukkit, Location } = Java.pkg('org.bukkit');
const PotionEffectType = Java.type('org.bukkit.potion.PotionEffectType');
const DisplaySlot = Java.type('org.bukkit.scoreboard.DisplaySlot');
const { Entity, LivingEntity, Player, Projectile } = Java.pkg('org.bukkit.entity');
const { Attribute } = Java.pkg('org.bukkit.attribute');
const { ProjectileSource } = Java.pkg('org.bukkit.projectiles');

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

function lookingAt(player, range = 30) {
	let result = Utils.getLookingAt(player, range);
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
			
		} else if (options === undefined) {
			movable = false;
			run = () => {};
			close = false;
		} else {
			({run = () => {}, movable = false, close = false} = options);
		}
		this.inv.setItem(slot, cast.asItemStack(item));
		this.movable[slot] = movable;
		this.callbacks[slot] = event => {
			const out = run(event);
			if (close) {
				event.getWhoClicked().getInventory().closeInventory();
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
	constructor(...args) {
		// name = undefined, slot = 'sidebar', type = 'dummy'
		let name, slot, type, scores;
		if (args.length == 1) {
			if (typeof args[0] == 'string') {
				name = args[0];
			} else {
				({ name, scores, slot, type } = args[0]);
			}
		} else if (args.length == 2) {
			name = args[0];
			if (typeof args[1] == 'string') {
				slot = args[1];
			} else {
				({ slot, type, scores } = args[1]);
				if (args[1].name) name = args[1].name;
			}
		} else if (args.length == 3) {
			[ name, slot ] = args;
			if (typeof args[2] == 'string') {
				type = args[2];
			} else {
				({ type, scores } = args[2]);
				if (args[2].name) name = args[2].name;
				if (args[2].scores) scores = args[2].scores;
				if (args[2].slot) slot = args[2].slot;
			}
		} else {
			[ name, slot, type, scores ] = args;
		}
		if (!name) name = type;
		let manager = Bukkit.getScoreboardManager();
		this.board = manager.getNewScoreboard();
		this.obj = this.board.registerNewObjective(name, type);
		if (slot) this.slot = slot;
		if (scores) this.set(scores);
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
		const entity = server.summon(opts.type, loc);
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

module.exports = {
	shoot,
	lookingAt,
	effect,
	clearEffects,
	give,
	attrs,
	Gui,
	swap,
	Pathfinder,
	Scoreboard,
	EntityWrapper,
	Inventory,
	CustomMob,
	drop,
	distBetween,
	Item,
	Direction
};