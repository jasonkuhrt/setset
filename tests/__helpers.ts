/**
 * Helper functions for writing tests
 */

/**
 * Create a constant function
 */
export const c = <T>(x: T) => () => x

/**
 * Create a string-keyed record
 */
export type R<T> = Record<string, T>
