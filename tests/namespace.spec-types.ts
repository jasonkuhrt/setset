import * as S from '..'

S.create<{ a: { a: number } }>({ fields: { a: { fields:{ a: {} } } } })
S.create<{ a: { a: number } }, { a: { z: number }}>({ fields: { a: { fields:{ a: { mapData: (a) => ({ z: a }) } } } } })
S.create<{ a: { a: number } }, { a: { a: boolean }}>({ fields: { a: { fields:{ a: { mapType: (a) => Boolean(a) } } } } })

/**
 * shorthands
 */

// if an input type is union with non-pojo type then shorthand required 
S.create<{ a: number | { a: number } }>({ fields: { a: { shorthand: (a) => ({ a }), fields:{ a: {} } } } })
//@ts-expect-error
S.create<{ a: number | { a: number } }>({ fields: { a: { fields:{ a: {} } } } })

// if an input field type is optional AND 1+ sub input fields are required THEN initial is required 
S.create<{ a?: { a: number } }>({ fields: { a: { initial: () => ({a:1}),  fields:{ a: {} } } } })
// @ts-expect-error
S.create<{ a?: { a: number } }>({ fields: { a: { shorthand: (a) => ({ a }), fields:{ a: {} } } } })
// ... but if data says field can be undefined too THEN initial is forbidden
S.create<{ a?: { a: number } }, { a?: { a: number } }>({ fields: { a: { fields:{ a: {} } } } })
// ... but if 0 sub input fields are required THEN initial is forbidden (b/c we can automate the initial)
S.create<{ a?: { a?: number } }>({ fields: { a: { fields:{ a: { initial: () => 1 } } } } })

// works with interfaces
interface A { a?: number }
S.create<{ a?: A }>({ fields: { a: { fields:{ a: { initial: () => 1 } } } } })
S.create<{ a?: 1 | A }>({ fields: { a: { shorthand: () => ({a:1}), fields:{ a: { initial: () => 1 } } } } })

// when no data match THEN namespace data mapper required
S.create<{ a?: { a: number } },{ b: { b?:number }}>({ fields: { a: { mapData: (input) => ({}), initial: () => ({a:1}), fields:{ a: {} } } } })
// @ts-expect-error
S.create<{ a?: { a: number } },{ b: { b?:number }}>({ fields: { a: { initial: () => ({a:1}), fields:{ a: {} } } } })
// @ts-expect-error
S.create<{ a?: { a: number } },{ b: { b?:number }}>({ fields: { a: { mapData: (input) => ({}), fields:{ a: {} } } } })
