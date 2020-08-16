import { Primitive } from 'type-fest'

/**
 * Check if curerntly in production mode defined as
 * NODE_ENV environment variable equaling "production".
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if curerntly in development mode defined as
 * NODE_ENV environment variable not equaling "production".
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export type Lookup<Object, Key, Fallback = never> = Key extends keyof Object ? Object[Key] : Fallback

export type IsSameKeys<A, B> = keyof A extends keyof B ? (keyof B extends keyof A ? true : false) : false

export type AnyObject = { [k: string]: any }

export declare type ExcludeUndefined<A> = A extends undefined ? never : A

export type IncludesVoid<T> = (T extends void ? true : never) extends never ? false : true

export type IncludesUndefined<T> = (T extends undefined ? true : never) extends never ? false : true

export type IsRecord<T> = string extends keyof T ? true : false

export type OnlyIndexedType<T> = string extends keyof T ? T : never

export type IncludesRecord<T> = OnlyIndexedType<Exclude<T, Primitive | void>> extends never ? false : true

export type MaybePromise<T = void> = T | Promise<T>

export type CallbackRegistrer<F> = (f: F) => void

export type SideEffector = () => MaybePromise

export type OnlyPlainObjectOrInterface<T> = T extends Function
  ? never
  : T extends RegExp
  ? never
  : T extends Date
  ? never
  : T extends any[]
  ? never
  : T extends Primitive
  ? never
  : T

export type IncludesPlainObjectOrInterface<T> = OnlyPlainObjectOrInterface<T> extends never ? false : true

export type ExcludePlainObjectOrInterface<T> = Exclude<T, OnlyPlainObjectOrInterface<T>>

/**
 * Represents a POJO. Prevents from allowing arrays and functions
 *
 * @remarks
 *
 * TypeScript interfaces will not be considered sub-types. For that, use AnyObject
 */
export type PlainObject = {
  [x: string]: Primitive | object
}

export type isPlainObject<T> = T extends PlainObject ? true : false

export type NotPlainObject = Primitive | any[] | Function

export type IncludesPlainObject<T> = Only<T, PlainObject> extends never ? false : true

export type Only<T, U> = Exclude<T, Exclude<T, U>>

export type KeepOptionalKeys<t> = {
  [k in keyof t]: undefined extends t[k] ? t[k] : never
}

export type GetRequiredKeys<T> = { [K in keyof T]: undefined extends T[K] ? never : K }[keyof T]

export type KeepRequiredKeys<t> = {
  [k in ExcludeUndefined<GetRequiredKeys<t>>]-?: undefined extends t[k] ? never : t[k]
}

export type UnknownFallback<T, U> = unknown extends T ? U : T

export type Includes<T, U> = (T extends U ? T : never) extends never ? false : true

export type ExcludePrimitive<T> = Exclude<T, Primitive>

export function assertTypeEquals<T>(expression: T): void {}

export function mergeShallow(o1: any, o2: any) {
  for (const [k, v] of Object.entries(o2)) {
    if (v !== undefined) {
      o1[k] = v
    }
  }
  return o1
}
