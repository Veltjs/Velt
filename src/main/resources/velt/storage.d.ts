// velt-storage.js
/**
 * This is the documentation for the `velt/storage` module.
 * It handles everything to do with storage across restarts, like serialization, deserialization, etc.
 * It exports one object with one property, `Storage`, which is quite a handy, useful, and easy API to use to store data across restarts.
 *
 * @module
 */

/**
 * Options for getting items
 */
interface ItemOpts<T> {
    default?: T;
}

export interface Serializer {
    serialize(obj: any): any;
    deserialize(obj: any): any;
}

export interface Parser {
    load(text: string): any;
    dump(obj: any): string;
}

type ValueOf<T> = T[keyof T];

export class Item<T> {
    /**
     * Get a property/item from this `Item`.
     * @param index The property to get
     * @param opts The options for getting this item, specifically the default value if this item has no value.
     */
    item<U extends keyof T>(index: U, opts?: ItemOpts<T[U]>): Field<T[U]>;
    /**
     * Get a property/item from this `Item`.
     * @param index The property to get
     * @param opts The options for getting this item, specifically the default value if this item has no value.
     * @alias item
     */
    field<U extends keyof T>(index: ValueOf<T>, opts?: ItemOpts<T[U]>): Field<T[U]>;
    /**
     * Set a field of this `Item` to a value.
     * @param index The field to be set
     * @param val The value for the field to be set as
     **/
    setItem<U extends keyof T>(index: keyof T, val: T[U]): Field<T[U]>;
    /**
     * Get the value of the given field of this `Item`.
     * @param index The field to get
     */
    getItem<U extends keyof T>(index: keyof T): T[U];
    /**
     * *This only works for items with their value as an array*
     * Find the item that matches the condition from this `Item<U[]>`
     * @param cond The condition to find the item with.
     */
    find<U extends ValueOf<T>>(cond: (val: U) => any): U | Nothing;
    /**
     * *This only works for items with their value as an array*
     * Check if this `Item<U[]>` has an item that matches the condition
     * @param cond The condition to find the item with.
     */
    has<U extends ValueOf<T>>(cond: (val: U) => any): boolean;
    /**
     * *This only works for items with their value as an array*
     * Remove all items that match the condition from this `Item<U[]>`
     * @param cond The condition to find the item with.
     */
    filter<U extends ValueOf<T>>(cond: (val: U) => any): this;
    /**
     * *This only works for items with their value as an array*
     * Remove the given item from this `Item<U[]>`
     * @param val The item to remove
     */
    remove<U extends ValueOf<T>>(val: U): this;
    /**
     * *This only works for items with their value as an array*
     * Add the given item to this `Item<U[]>`
     * @param val The item to push
     */
    push<U extends ValueOf<T>>(val: U): this;
    /**
     * *This only works for items with properties like objects or arrays*
     * Pop the given index or property from this `Item`.
     * @param val The item to pop
     */
    pop(val: keyof T): T;
    /**
     * If there is no value for this `Item` already, and the `val` isn't `null` or `undefined` or anything either, set the value to the `val`.
     * @param val
     */
    setDefault<T>(val: T): this;
    /**
     * Get the current value of this `Item`.
     */
    get<T>(): T;
    /**
     * List all of the items in this `Item`.
     * If the value is an an array, returns the value, otherwise, it returns the keys of the value.
     */
    list<T>(): (ValueOf<T>)[] | (keyof T)[];
    /**
     * *This only works for items with a number*
     * Increase this `Item` by the given number.
     * @param num The number to add
     */
    add(num: number): this;
    /**
     * *This only works for items with a number*
     * Subtract this `Item` by the given number.
     * @param num The number to subtract
     */
    subtract(num: number): this;
    /**
     * *This only works for items with a number*
     * Multiply this `Item` by the given number.
     * @param num The number to multiply by
     */
    multiply(num: number): this;
    /**
     * *This only works for items with a number*
     * Divide this `Item` by the given number.
     * @param num The number to divide by
     */
    divide(num: number): this;
    /**
     * *This only works for items with a number*
     * Raise this `Item` to the power of the given number
     * @param num The number to raise to the power of
     */
    pow(num: number): this;
    /**
     * Set this `Item` to the given value.
     * @param val The value to set this item to.
     */
    set(val: T): this;
}

export class Nothing extends Item<undefined> {
    get(): undefined;
    _get(): undefined;
}

export class Storage<T> extends Item<T> {
    constructor(path: string, opts?: {});
    _get(): T;
    set(val: T): this;
    save(path: string, callback?: () => any): Promise<any>;
    static createConfig<T>(path: string, data: any, opts?: {}): Storage<T>;
}

export class Field<T> extends Item<T> {
    _get(): T;
    set(value: T): this;
}

export interface Serializers {
    advancedSerializer: Serializer,
    simpleSerializer: Serializer
}

export interface Parsers {
    JSONParser: Parser,
    YAMLParser: Parser
}

export const serializers: Serializers;
export const parsers: Parsers;

export const storage: {
    Storage: typeof Storage,
    serializers: Serializers,
    parsers: Parsers
};

export default storage;