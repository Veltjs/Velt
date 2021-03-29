// velt-helpers.js
/**
 * This is the documentation for the `velt/helpers` module.
 * The `velt-helpers` module contains functionality that isn't necessarily part of Velt's core, but is generally still very useful when you need it.
 * It contains one export with plenty of different utility functions and classes.
 *
 * @module
 */

/**
 * The options of the direction, speed, and shooter for the `shoot` call.
 */
interface ShootOpts {
    dir?: Direction | any;
    speed?: number;
    shooter?: any;
}

/**
 * The options for giving an effect to an entity
 */
interface EffectOpts {
    type?: string;
    duration?: number;
    amplifier?: number;
}

/**
 * The equipment options for what equipment to give to an entity
 */
interface Equipment {
    helmet?: EquipItem;
    chestplate?: EquipItem;
    leggings?: EquipItem;
    boots?: EquipItem;
    mainhand?: EquipItem;
    offhand?: EquipItem;
}

type GuiCallback = (event: any) => any;
type GuiOptions = GuiCallback | { run: GuiCallback, movable: boolean, close: boolean };

/**
 * Velt's `Gui` Utility
 */
export class Gui {
    /**
     * Initialize a GUI with `velt-helpers` from its name, amount of rows, and if its movable or not.
     * @param name The name of the GUI
     * @param rows The amount of rows in the GUI
     * @param movable If the GUI is movable or not
     */
    constructor(name: string, rows: number, movable: boolean);
    /**
     * Set the item at the given slot of the GUI, with an optional callback with the options
     * @param slot The slot of the GUI to set
     * @param item The item to add to that slot of the GUI
     * @param options The options, or the callback run when the slot is clicked.
     */
    set(slot: number, item: any, options: GuiOptions): this;
    /**
     * Set the item at the given slot of the GUI, with an optional callback with the options
     * @param slot The slot of the GUI to set
     * @param item The item to add to that slot of the GUI
     * @param options The options, or the callback run when the slot is clicked.
     * @alias set
     */
    format(slot: number, item: any, options: GuiOptions): this;
    /**
     * Clear or unset a specific slot of this GUI
     * @param slot The slot to unset
     */
    unset(slot: number): this;
    /**
     * Clear or unset a specific slot of this GUI
     * @param slot The slot to unset
     * @alias format
     */
    unformat(slot: number): this;
    /**
     * Get an item from a specific slot of this GUI
     * @param slot The slot to get the item from
     */
    get(slot: number): any;
    /**
     * Show this GUI to one or more given players
     * @param players The players to show the GUI to
     */
    show(...players: any[]): this;
    /**
     * Show this GUI to one or more given players
     * @param players The players to show the GUI to
     * @alias show
     */
    open(...players: any[]): this;
    /**
     * Clear GUI including callbacks and movables
     */
    clear(): this;
}

/**
 * Velt's `Pathfinder` Utility. Note this uses functionality only available with PaperMC.
 * @requires PaperMC
 */
export class Pathfinder {
    /**
     * Create a pathfinder from an entity
     * @param entity The entity to create the pathfinder from
     * @requires PaperMC
     */
    constructor(entity: any);
    /**
     * The entity's current target
     */
    target: any;
    /**
     * The entity's current path
     */
    path: any;
    /**
     * Make the entity pathfind to a specific location
     * @param loc The location to pathfind to
     */
    pathfind(loc: any): this;
    /**
     * If the entity is aware of its surroundings.
     */
    aware: boolean;
}

/**
 * The options for creating a `Scoreboard` instance with `velt-helpers`
 */
interface ScoreboardOpts {
    name?: string;
    slot?: number;
    type?: string;
    scores?: any;
}

/**
 * Velt's `Scoreboard` utility
 */
export class Scoreboard {
    /**
     * Create a scoreboard from the given name, slot, type, scores, and options
     * @param name The name of the scoreboard, or the given options
     * @param slot The display slot of the scoreboard, or the given options
     * @param type The type of the scoreboard, or the given options
     * @param scores The scores for the scoreboard to be set with, or the given options
     */
    constructor(name: string | ScoreboardOpts);
    constructor(name: string, opts: ScoreboardOpts);
    constructor(name: string, slot: number, opts: ScoreboardOpts);
    constructor(name: string, slot: number, type: string);
    constructor(name: string, slot: number, type: string, scores: any);
    /**
     * The display slot of the scoreboard
     */
    slot: number;
    /**
     * Set the display slot of the scoreboard to a different slot
     * @param slot The slot to set the scoreboard to
     */
    setSlot(slot: number): this;
    /**
     * The name of the scoreboard
     */
    name: string;
    /**
     * Set the name of the scoreboard to the given replacement name
     * @param name The name to change the scoreboard to
     */
    setName(name: string): this;
    /**
     * Set a score of the scoreboard to a new value
     * @param index The score of the scoreboard to replace
     * @param text The new value to replace the score with
     */
    setScore(index: number, text: string): this;
    /**
     * Set one or more scores of the scoreboard to replacement values
     */
    set(index: number, text: string): this;
    set(scores: { [prop: number]: string }): this;
    set(scores: (string | [number, string])[]): this | void;
    /**
     * Show this scoreboard to one or more players
     * @param players The players to show the scoreboard to
     */
    show(...players: any[]): this;
}

/**
 * Velt's `EntityWrapper` utility, particularly useful with custom mobs
 */
export class EntityWrapper extends Pathfinder {
    /**
     * If the entity is dead or not
     */
    dead: boolean;
    /**
     * If the entity is alive or not
     */
    alive: boolean;
    /**
     * Get the distance from this entity to the given location
     * @param loc The location to get the distance to
     */
    distTo(loc: any): number;
    /**
     * Shoot a given projectile from this entity with the optional options
     * @param proj The projectile type to shoot
     * @param opts The options to shoot the projectile with
     */
    shoot(proj: string, opts?: ShootOpts): this;
    /**
     * Shoot a given projectile from this entity, and then return the projectile with the optional options
     * @param proj The projectile type to shoot
     * @param opts The options to shoot the projectile with
     */
    shootAndGet(proj: string, opts?: ShootOpts): any;
    /**
     * Effect this entity with the given effect and options.
     * @param type The effect type
     * @param opts The options of the effect, like the `duration` and `amplifier`.
     */
    effect(type: string, opts?: EffectOpts): this;
    /**
     * Equip this entity with the set of given equipment, like armor and the offhand for example.
     * @param equipment The equipment to equip this entity with
     */
    equip(equipment: Equipment): this;
}

/**
 * Velt's inventory utility, particularly useful for serializing inventories with `velt-storage`
 */
export class Inventory {
    /**
     * Initialize an inventory with the `Inventory` utility
     */
    constructor(entity: any);
    constructor(contents: any, armor: any);
    /**
     * Give the given entity all the items in this inventory, including armor
     * @param entity The entity to give the items of this inventory to
     * @param opts The options, which is just the option of clearing the inventory before giving it the items
     */
    give(entity: any, opts?: { clear: boolean }): void;
}

/**
 * The options for a custom mob
 */
interface CustomMobOpts {
    type?: string;
    maxHealth?: number;
    health?: number;
    name?: string;
    adult?: boolean;
    baby?: boolean;
    equipment?: Equipment;
    attrs?: { [ prop: string ]: any };
    effects?: EffectOpts[];
    cycle?(this: EntityWrapper, entity: any): any;
}

/**
 * Velt's Custom Mob Utility
 */
export class CustomMob {
    /**
     * Initialize a custom mob instance from the given options.
     * @param opts The options to initialize this `CustomMob` instance with.
     */
    constructor(opts: CustomMobOpts);
    /**
     * Apply the given properties (like increased health, new equipment, new custom logic with `cycle`, and etc) to the given entity.
     * Useful if you want to convert naturally spawned mobs to this custom mob type.
     * @param entity The entity to apply the `CustomMob` properties to.
     */
    apply(entity: any): any;
    /**
     * Spawn this `CustomMob` type at a specific location.
     * @param loc The location to spawn the custom mob at.
     */
    summon(loc: any): any;
}

/**
 * Velt's Custom Items Utility
 */
export class Item {
    /**
     * @param material The optional material to create this custom mob with. Can be optional if you specify it in the `opts`.
     * @param opts The options for this custom item.
     */
    constructor(opts: {});
    constructor(material: string, opts: {});
    /**
     * The itemstack this custom item instance created.
     */
    itemstack: any;
    /**
     * Give this custom item to the given players
     * @param players The players to give the item to
     */
    give(...players: any[]): void;
}

/**
 * Velt's Direction utility
 */
export class Direction {
    /**
     * Initialize this `Direction` instance with a vector, a pitch and yaw, or two locations (or objects that can be casted to locations).
     */
    constructor(vector: any);
    constructor(pitch: number, yaw: number);
    constructor(loc: any, other: any);
    /**
     * Clone this direction.
     */
    clone(): Direction;
    /**
     * Reverse this direction.
     */
    reverse(): Direction;
    /**
     * Apply this direction to a given location at a given amount.
     * @param loc The location to apply to.
     * @param amount The amount of how much to apply to that location.
     */
    apply(loc: any, amount?: number): Direction;
    /**
     * Push a given entity in this direction at the given speed
     * @param entity The entity to push
     * @param speed The speed to push them at
     */
    push(entity: any, speed?: number): Direction;
    /**
     * Set an entity's direction to this direction with a given speed.
     * @param entity The entity to change the direction of
     * @param speed The speed to set their direction at
     */
    setDirection(entity: any, speed?: number): Direction;
}

/**
 * Velt's crafting utility
 */
export interface Crafting {
    /**
     * Create a shaped crafting recipe.
     * @param items the items, formatted by `{ letter: item }`
     * @param shape an array of item keys, corresponding with the position in the crafting table
     * @param result the output of the crafting recipe
     * @param namespace the name of this item to register under velt, isn't necessary unless conflicts
     *
     */
    createShapedRecipe(options: {
        items: any;
        shape: string[];
        result: string
    }, namespace: string): {
        /** Remove this recipe from the server. */
        delete(): void;
    }
    /**
     * Create a shapeless crafting recipe.
     * @param input the items
     * @param output the result of the crafting
     * @param namespace the name of this item to register under velt, isn't necessary unless conflicts
     */
    createShapelessRecipe(input: any[], output: any, namespace?: string): {
        /** Remove this recipe from the server. */
        delete(): void;
    }
    /**
     * Create a furnace recipe.
     * @param input the item
     * @param output the result of the smelting
     * @param xp the amount of xp the user gets as result
     * @param cookingTime the amount of ticks it takes to cook
     * @param namespace the name of this item to register under velt, isn't necessary unless conflicts
     */
    createFurnaceRecipe(input: any, output: any, xp?: number, cookingTime?: number, namespace?: string): {
        /** Remove this recipe from the server. */
        delete(): void;
    }
    /**
     * Create a blast furnace recipe.
     * @param input the item
     * @param output the result of the smelting
     * @param xp the amount of xp the user gets as result
     * @param cookingTime the amount of ticks it takes to cook
     * @param namespace the name of this item to register under velt, isn't necessary unless conflicts
     */
    createBlastingRecipe(input: any, output: any, xp?: number, cookingTime?: number, namespace?: string): {
        /** Remove this recipe from the server. */
        delete(): void;
    }
    /**
     * Create a campfire recipe.
     * @param input the item
     * @param output the result of the cooking
     * @param xp the amount of xp the user gets as result
     * @param cookingTime the amount of ticks it takes to cook
     * @param namespace the name of this item to register under velt, isn't necessary unless conflicts
     */
    createCampfireRecipe(input: any, output: any, xp?: number, cookingTime?: number, namespace?: string): {
        /** Remove this recipe from the server. */
        delete(): void;
    }
    /**
     * Create a smoker recipe.
     * @param input the item
     * @param output the result of the cooking
     * @param xp the amount of xp the user gets as result
     * @param cookingTime the amount of ticks it takes to cook
     * @param namespace the name of this item to register under velt, isn't necessary unless conflicts
     */
    createSmokingRecipe(input: any, output: any, xp?: number, cookingTime?: number, namespace?: string): {
        /** Remove this recipe from the server. */
        delete(): void;
    }
    /**
     * Create a smithing table recipe.
     * @param input the first item
     * @param input2 the second item
     * @param output the result of the smithing
     * @param namespace the name of this item to register under velt, isn't necessary unless conflicts
     */
    createSmithingRecipe(input: any, input2: any, output: any, namespace?: string): {
        /** Remove this recipe from the server. */
        delete(): void;
    }
}

/**
 * Velt's bossbar utility.
 */
interface BossBar {
    /** Get a specific BossBar made by velt. */
    getBar(bar: string): BossBarMethods;
    /** Get all of the server's bossbars. */
    getBars(): BossBarMethods[];
    /** Create a bossbar. */
    create(options: {
        /** The bossbar's title */
        title: string;
        /** The bossbar's color */
        color: BarColor;
        /** The bossbar style */
        style: BarStyle;
        /** How much the bossbar is filled */
        progress?: number;
        /** The bossbar flags */
        flags?: BarFlag[];
    }): BossBarMethods;

}

type BarColor = 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'white' | 'yellow';
type BarStyle = 'segmented 10' | 'segmented 12' | 'segmented 20' | 'segmented 6' | 'solid';
type BarFlag = 'create fog' | 'darken sky' | 'play boss music';

interface BossBarMethods {
    /** Add a flag to the bossbar. */
    addFlag(flag: BarFlag): this;
    /** Show the bossbar to a player or players, or to all players with it hidden. */
    show(player: any): this;
    /** Hide the bossbar from a player or players, or to all players with it shown. */
    hide(player: any): this;
    /** Remove all players from the bossbar. */
    removeAll(): this;
    /** Remove a flag from the bossbar. */
    removeFlag(flag: BarFlag): this;
    /** Set how much the bossbar is filled. */
    setProgress(progress: number): this;
    /** Set the bossbar's title. */
    setTitle(title: string): this;
    /** Set the bossbar's color. */
    setColor(color: BarColor): this;
    /** Set the bossbar style. */
    setStyle(style: BarStyle): this;
    /** The bossbar's color. */
    color: string;
    /** The players the bossbar is attached to. */
    players: any[];
    /** How much the bossbar is filled. */
    progress: number;
    /** The bossbar style. */
    style: string;
    /** The bossbar's title. */
    title: string;
    /** If the bossbar is visible by the player's it's attached to. */
    visible: boolean;
}

type EquipItem = { item: any, dropChance: number } | any;

type shoot =  (entity: any, proj: string, opts?: ShootOpts) => any;
type lookingAt = (entity: any, range?: number) => any;
type effect = ((entity: any, type: string, opts?: EffectOpts) => void) | ((entity: any, opts: EffectOpts) => void);
type clearEffects = (entity: any) => void;
type give = (entity: any, ...items: any[]) => void;
type attrs = (entity: any) => { [ prop: string ]: any };
type equip = (entity: any, equipment: Equipment) => void;
type swap = (entity: any, other: any) => void;
type drop = (item: any, loc: any) => void;
type distBetween = (start: any, end: any) => number;

/**
 * Shoot a projectile from an entity.
 * @param entity The entity to shoot the projectile from
 * @param proj The projectile type to shoot
 * @param opts The optional options such as the speed and direction
 */
export const shoot: shoot;
/**
 * Return the target that the entity is looking at.
 * @param entity The entity whose looking at the target.
 * @param range The range of how far away the target can be at the most.
 */
export const lookingAt: lookingAt;
/**
 * Effect an entity with a specific effect with an optional duration and amplifier.
 * @param entity The entity to effect
 * @param type The effect type, optional if you're specifying only the options
 * @param opts The options, optional if you're specifying only the effect, contains options like `duration` and `amplifier`.
 */
export const effect: effect;
/**
 * Clear all effects from an entity.
 * @param entity The entity to clear effects from
 */
export const clearEffects: clearEffects;
/**
 * Give one or more items to any entity.
 * @param entity The entity to give the items to.
 * @param items The items to give.
 */
export const give: give;
/**
 * Get a wrapper around the attributes of any given entity
 * @param entity The entity to get attributes of
 */
export const attrs: attrs;
/**
 * Equip any entity with items for their main hand, offhand, or armor.
 * @param entity The entity to equip.
 * @param equipment The equipment to provide them with.
 */
export const equip: equip;
/**
 * Swap the positions of any two entities.
 * @param entity The entity to swap with the other entity's position
 * @param other The second entity to swap with the first entity's position
 */
export const swap: swap;
/**
 * Drop an item at a location.
 * @param item The item to drop
 * @param loc The location to drop it at
 */
export const drop: drop;
/**
 * Get the distance between any two locations, or any two objects that can be casted to locations (like entities)
 * @param start The first location or object that can be casted to a location
 * @param end The second location or object that can be casted to a location
 */
export const distBetween: distBetween;

export const crafting: Crafting;

export const bossbar: BossBar;

export const helpers: {
    shoot: shoot,
    lookingAt: lookingAt,
    effect: effect,
    clearEffects: clearEffects,
    give: give,
    attrs: attrs,
    equip: equip,
    swap: typeof swap,
    drop: typeof drop,
    distBetween: distBetween,
    crafting: Crafting,
    bossbar: BossBar,
    Gui: typeof Gui,
    Pathfinder: typeof Pathfinder,
    Scoreboard: typeof Scoreboard,
    EntityWrapper: typeof EntityWrapper,
    Inventory: typeof Inventory,
    CustomMob: typeof CustomMob,
    Item: typeof Item,
    Direction: typeof Direction,
};

export default helpers;
