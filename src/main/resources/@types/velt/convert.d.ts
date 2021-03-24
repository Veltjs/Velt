// velt-convert.js
/**
 * This is the documentation for the `velt/convert` module.
 * This module has a more specific use-case then the others, but is still quite useful.
 * In cases where you want to supply Java or Spigot methods with Java arrays or lists, `velt-convert` may be useful.
 * Less commonly, if you need to supply some Java method with a JS object (for options for example), then `velt-convert` is the right option to do that.
 * 
 * @module
*/

/**
 * The `velt-convert` Array converter, to convert to and from Java arrays and lists.
 */
interface Arrays {
    /**
     * Convert a java array to a JS array
     * @param obj The object to convert to an array
     */
    fromJavaArray(obj: any): any[];
    /**
     * Convert a java list to a JS array
     * @param obj The object to convert to an array
     */
    fromJavaList(obj: any): any[];
    /**
     * Convert a JS array to a Java array
     * @param obj The object to convert to a Java array
     */
    toJavaArray(obj: any[]): any;
    /**
     * Convert a JS array to a Java `ArrayList`
     * @param obj The object to convert to a Java list
     */
    toJavaList(obj: any[]): any;
    /**
     * Convert a JS array to a Java list or array
     * @param obj The object to convert to a Java list or array
     */
    toJava(obj: any[], opts: { type: 'list' | 'array' }): any;
    /**
     * Convert a Java list or array to a JS array
     * @param obj The object to convert to an array
     */
    fromJava(obj: any): any[];
}

/**
 * The `velt-convert` Mapping converter, to convert to and from Java maps.
 */
interface Mapping {
    /**
     * Convert a JS object to a Java map
     * @param obj The object to convert to a Java `HashMap`
     */
    toJava(obj: {}): any;
    /**
     * Convert a Java map to a JS object
     * @param map The map to convert to a JS object.
     */
    fromJava(map: any): {};
}

/**
 * The `velt-convert` Array converter, to convert to and from Java arrays and lists.
 */
export const arrays: Arrays;
/**
 * The `velt-convert` Mapping converter, to convert to and from Java maps.
 */
export const mapping: Mapping;
export const convert: { arrays: Arrays, mapping: Mapping };

export { Arrays, Mapping };

export default convert;