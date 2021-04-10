const { Vector } = Java.pkg('org.bukkit.util');
const { Bukkit, ChatColor, Location , Material, World } = Java.pkg('org.bukkit');
const { ItemStack, ItemFlag } = Java.pkg('org.bukkit.inventory');
const BukkitRunnable = Java.type('org.bukkit.scheduler.BukkitRunnable');
const { EntityType, Entity, Player, Projectile, LivingEntity } = Java.pkg('org.bukkit.entity');
const { Enchantment } = Java.pkg('org.bukkit.enchantments');

const { Paths } = Java.pkg('java.nio.file');

const { Utils } = Java.pkg('xyz.corman.velt');

const { Arrays, UUID } = Java.pkg('java.util');

const Index = Java.type('xyz.corman.velt.Velt');

const plugin = Index.getInstance();

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

const events = require('./events');
const internals = require('./internals');
const commands = require('./commands');

const colorize = internals.handleStringFunc( (text, char = '&') => ChatColor.translateAlternateColorCodes(char, text));

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
        let {
            count = null,
            name = undefined,
            lore = undefined,
            durability = undefined,
            unbreakable = undefined,
            custommodeldata = undefined,
            enchantments = [],
            itemflags = []
        } = opts;
        if (count == null && opts.amount) {
            count = opts.amount;
        } else {
            count = 1;
        }
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

const c = colorize;

server.after(1, () => require('./setup'));

module.exports = {
    events,
    commands,
    server,
    scripts,
    cast,
    internals,
    plugin,
    c: colorize,
    color: colorize,
    colorize: colorize,
    colour: colorize,
    colourize: colorize
};