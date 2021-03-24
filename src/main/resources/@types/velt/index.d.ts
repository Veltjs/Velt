// velt.js
/**
 * This is the documentation for the `velt` module.
 * The `velt` module contains all of the core code that makes up Velt.
 * It contains one export, with properties like `server` and `cast` which allow you to provide core functionality to your Velt scripts.
 *
 * @module
 */

/**
 * The Velt `color` function, with multiple aliases. Converts a string (optionally from a template literal) to its colored version.
 */
type Color = ((text: string) => string) | ((text: string[], ...args: string[]) => string);

/**
 * The `Velt` type, returned by the `velt` module, providing you with the core functionality to power your code.
 */
interface Velt {
	/**
	 * The wrapper around events provided by Velt.
	 */
	events: Events;
	/**
	 * The wrapper around commands provided by Velt.
	 */
	commands: Commands;
	/**
	 * The wrapper around the server provided by Velt.
	 */
	server: Server;
	/**
	 * Velt's Scripts Manager
	 */
	scripts: Scripts;
	/**
	 * The Velt Casting Manager, to convert objects to locations, players, items, etc.
	 */
	cast: Cast;
	/**
	 * @deprecated
	 * Velt's Utils Manager.
	 */
	utils: any;
	/**
	 * Internals is generally for handling more specific lower level use-cases. Don't touch it unless you have to.
	 */
	internals: any;
	/**
	 * The Velt plugin instance, generally not needed to be used.
	 */
	plugin: any;
	c: Color;
	color: Color;
	colorize: Color;
	colour: Color;
	colourize: Color;
}

/**
 * The Velt `Time` type.
 */
type Time = number | {};

/**
 * A scheduler object provided by Velt.
 */
interface Scheduler {
	/**
	 * Asynchronously wait for the next time this scheduler repeats
	 * @param callback The optional callback to execute once the next scheduler repeat is done
	 */
	next(): Promise<number>;
	next(callback: (count: number) => any): Promise<number>;
	/**
	 * Adds a callback to be run every time this scheduler repeats
	 * @param callback The callback to be called
	 */
	addCallback(callback: (count: number) => any): void;
	/**
	 * Cancel this scheduler, make it stop repeating.
	 */
	cancel(): void;
}

/**
 * The options used by `server.waitFor` if a callback isn't specified.
 */
interface WaitForOpts {
	callback?: (...args: any[]) => any;
	timeout?: number;
}

/**
 * The `CommandAddon` object, for changing the tab completion method, or command execution method.
 */
interface CommandAddon {
	tabComplete(...args: string[]): string[];
	run(sender: any, ...args: string[]): any;
}

/**
 * The Velt Plugin Manager
 */
interface Plugins {
	/**
	 * Get the plugin manager, equivalent to `Bukkit.getPluginManager()`
	 */
	getManager(): any;
	/**
	 * Get a list of plugins, either their names or the plugin objects themselves from Spigot.
	 * @param names Optionally choose whether to get the plugin names or the plugin objects
	 */
	getPlugins(): string[];
	getPlugins(names: true): string[];
	getPlugins(names: false): any[];
	/**
	 * Find a plugin from its name
	 * @param name The name of the plugin to find
	 */
	fromName(name: string): any;
	/**
	 * Check if a plugin is enabled
	 * @param name The name of the plugin to find
	 */
	isEnabled(name: string): boolean;
	/**
	 * Disable a plugin from its name
	 * @param name The name of the plugin to disable
	 */
	disable(name: string): void;
	/**
	 * Enable a plugin from its name
	 * @param name The name of the plugin to enable
	 */
	enable(name: string): void;
}

/**
 * The wrapper around events provided by Velt.
 */
interface Events {
	/**
	 * Run the callback each time the event is found.
	 */
	on(event: string | number | symbol, callback: (...args: any[]) => any): {
		/** Close the given event listener. */
		close(): void
	};
	/**
	 * Wait for the next event to be listened that matches the event type specified and the optional condition.
	 * @param event The event to wait for.
	 * @param condition The condition of the event to wait for.
	 * @param callback Either he callback to run once the event is found, or the options of which callback and timeout.
	 */
	once(event: string | number | symbol): Promise<any>;
	once(event: string | number | symbol, cond: (...args: any[]) => any): Promise<any>;
	once(event: string | number | symbol, cond: (...args: any[]) => any, callback: (...args: any[]) => any): Promise<any>;
	once(event: string | number | symbol, cond: (...args: any[]) => any, callback: WaitForOpts): Promise<any>;
	/**
	 * Wait for the next event to be listened that matches the event type specified and the optional condition.
	 * @param event The event to wait for.
	 * @param condition The condition of the event to wait for.
	 * @param callback Either he callback to run once the event is found, or the options of which callback and timeout.
	 * @alias once
	 */
	waitFor(event: string | number | symbol): Promise<any>;
	waitFor(event: string | number | symbol, cond: (...args: any[]) => any): Promise<any>;
	waitFor(event: string | number | symbol, cond: (...args: any[]) => any, callback: (...args: any[]) => any): Promise<any>;
	waitFor(event: string | number | symbol, cond: (...args: any[]) => any, callback: WaitForOpts): Promise<any>;
	/**
	 * Execute every event listener that matches this event.
	 */
	handleEvent(event: any): void;
}

/**
 * The wrapper around commands provided by Velt.
 */
interface Commands {
	/**
	 * A command type, which has a name, `match` (for checking if an argument matches this type) and `tabComplete` (for tab completing arguments of this type)
	 * @param opts The options to create this command type with
	 */
	createType(opts: {}): this;
	createType(type: string, opts: {}): this;
	/**
	 * A command type with a name that tab completes to a list of items and matches only them.
	 * @param type The name of the new list type
	 * @param items The items in this list type
	 */
	createListType<T extends string[]>(type: string, items: T): this;
	/**
	 * Make a specific sender run the command
	 * @param sender The player (or console) to run the command
	 * @param command The command to run
	 */
	runCommand(sender: any, command: string): void;
	/**
	 * Run a command from console.
	 * @param command The command to run
	 */
	runConsoleCommand(command: string): void;
	/**
	 * Create a command with the given callback, name, and options.
	 */
	create(callback: (...args: string[]) => any): CommandAddon;
	create(opts: {}): CommandAddon;
	create(name: string, callback: (sender: any, ...args: string[]) => any): CommandAddon;
	create(name: string, callback: (sender: any, ...args: string[]) => any, opts: {}): CommandAddon;
	/**
	 * Check if any given sender is the console.
	 * @param sender The sender to check
	 */
	isConsole(sender: any): boolean;
}

/**
 * The wrapper around the server provided by Velt.
 */
interface Server {
	waiting: Record<string | number | symbol, any>;
	callbacks: Record<string | number | symbol, any[]>;
	anyEvent: Symbol;
	/**
	 * Broadcast a message to every user, or optionally every user with some specific permission.
	 * @param msg The message to broadcast
	 * @param permission The optional permission users will need to see the broadcast
	 */
	broadcast(msg: string, permission?: string): void;
	/**
	 * Format an enum-like text to be nicer. (Eg. `ZOMBIFIED_PIGLIN` to `zombified piglin`)
	 * @param text The text to format
	 */
	format(text: string): string;
	/**
	 * Convert some normal text to an enum. (Eg. `zombified piglin` to `ZOMBIFIED_PIGLIN`)
	 * @param text The text to un format
	 */
	unformat(text: string): string;
	/**
	 * Summon an entity at any given location
	 * @param name The name of the entity-type (eg. `zombie`) that you'd like to spawn
	 * @param loc The location of where to spawn it
	 */
	summon(name: string, loc: any): any;
	/**
	 * List all worlds in the server
	 */
	worlds(): any[];
	/**
	 * Find a world from a specific name
	 * @param name The name of the world to find
	 */
	world(name: string): any;
	/**
	 * Get the default world of the server
	 */
	defaultWorld(): any;
	/**
	 * Get a material type from its name.
	 * @param name The name of the material (eg. `diamond sword`)
	 */
	material(name: string): any;
	/**
	 * Get an enchantment from its **Spigot** name. For example, `damage all` will work, but not `sharpness`.
	 * @param name The enchantment name (eg. `knockback`)
	 */
	enchantment(name: string): any;
	/**
	 * Get an enchantment from its **Spigot** name. For example, `damage all` will work, but not `sharpness`.
	 * @param name The enchantment name (eg. `knockback`)
	 * @alias enchantment
	 */
	enchant(name: string): any;
	/**
	 * Get an itemflag from its **Spigot** name. For example, `hide enchants'.
	 * @param name The itemflag name (eg. `hide attributes`)
	 */
	itemflag(name: string): any;
	/**
	 * Get an itemstack from the material name and the options.
	 */
	itemstack(material: string, opts?: {} | string): any;
	/**
	 * Get a skull from the UUID of the player  who owned it.
	 * @param uuid The UUID of the player who's skin represents the skull.
	 */
	skullFromUUID(uuid: string): any;
	/**
	 * Get a skull from a player.
	 * @param player The player whose skull to get.
	 * @param opts The options
	 */
	skull(player, opts: {}): any;
	/**
	 * Wait a specific amount of time before doing something else asynchronously.
	 * @param delay The delay to wait.
	 * @param callback The optional callback to call once done waiting.
	 */
	after(delay: Time): Promise<any>;
	after(delay: Time, callback: () => any): void;
	/**
	 * Schedule a task to run repeatedly after a specific amount of time passes
	 * @param time The amount of time that needs to pass for it to repeat
	 * @param callback An optional callback which gets called each time it passes
	 */
	schedule(time: Time): Scheduler;
	schedule(time: Time, callback: (count: number) => any): Scheduler;
	/**
	 * Get a player from their username.
	 * @param name The name of the player.
	 */
	playerFromName(name: string): any;
	/**
	 * An array of all players online.
	 */
	onlinePlayers: any[];
	/**
	 * An array of all players who have ever joined.
	 */
	offlinePlayers: any[];
	/**
	 * Shutdown the server.
	 */
	shutdown(): void;
	/**
	 * Shutdown the server.
	 */
	stop(): void;
	/**
	 * Restart the server.
	 * @alias shutdown
	 */
	restart(): void;
	/**
	 * Restart the server.
	 * @alias restart
	 */
	reboot(): void;
	/**
	 * Check if any entity is of the given mob type.
	 * @param entity The entity to check.
	 * @param type The entity-type to make sure they're of. (eg. `zombie`)
	 */
	isMob(entity: any, type: string): boolean;
	plugins: Plugins;
}

/**
 * Velt's Scripts Manager
 */
interface Scripts {
	/**
	 * Get the location of the Velt scripts folder.
	 */
	location: string;
	/**
	 * Get the location of a script with `scripts.path`
	 * @param paths The paths to addon to the base Scripts folder
	 */
	path(...paths: string[]): string;
}

/**
 * Velt's Casting Manager
 */
interface Cast {
	/**
	 * Cast an object as a world
	 * @param obj The object, generally a string, to cast as a world.
	 */
	asWorld(obj: string | any): any;
	/**
	 * Convert an object to a location
	 * @param obj The object to cast as a location
	 */
	asLocation(obj: any): any;
	/**
	 * Convert an object to a vector
	 * @param obj The object to cast to a vector
	 */
	asVector(obj: any): any;
	/**
	 * Convert an object to an itemstack
	 * @param obj The object to cast to an itemstack
	 */
	asItemStack(obj: any): any;
	/**
	 * Convert an object to a number of ticks
	 * @param obj The object to convert to a number of ticks
	 */
	asTicks(obj: any): number;
	/**
	 * Convert an object (generally a string) to an online player.
	 * @param obj The object to convert to a player
	 */
	asPlayer(obj: string | any): any;
}

/**
 * The `velt` object, returned by the `velt` module, providing you with the core functionality to power your code.
 */
declare const velt: Velt;

export {
	Events,
	Commands,
	Velt,
	Scripts,
	Server,
	Cast,
	Color
};

/**
 * The wrapper around commands provided by Velt.
 */
export const commands: Commands;
/**
 * The wrapper around events provided by Velt.
 */
export const events: Events;
/**
 * Velt's Scripts Manager
 */
export const scripts: Scripts;
/**
 * The wrapper around the server provided by Velt.
 */
export const server: Server;
/**
 * The Velt Casting Manager, to convert objects to locations, players, items, etc.
 */
export const cast: Cast;
/**
 * The Velt `color` function, with multiple aliases. Converts a string (optionally from a template literal) to its colored version.
 */
export const color: Color;

export default velt;