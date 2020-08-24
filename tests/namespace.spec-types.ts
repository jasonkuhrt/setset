import * as tst from 'typescript-test-utils'
import * as S from '..'
import { NA, R } from './__helpers'

/**
 * basic
 */

S.create<{ a: { b: number } }>({ fields: { a: { fields:{ b: {} } } } })
S.create<{ a: { b: number } }>({ fields: { a: { fields:{ b: {} } } } }).change({a: { b: 1 } })

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

/**
 * interfaces
 */

interface A { a?: number }
S.create<{ a?: A }>({ fields: { a: { fields:{ a: { initial: () => 1 } } } } })
S.create<{ a?: 1 | A }>({ fields: { a: { shorthand: () => ({a:1}), fields:{ a: { initial: () => 1 } } } } })

/**
 * mappers for field name mismatch
 */

// when fields of input not same as data then data mapper required
S.create<{ a: { b: number } }, { a: { z: number }}> ({ fields: { a: { map: () => NA, fields: NA } } })
S.create<{ a?: { b: number } }, { a: { z: number }}>({ fields: { a: { map: () => NA, fields: NA, initial: NA } } })
S.create<{ a: { b: number } }, { a?: { z: number }}>({ fields: { a: { map: () => NA, fields: NA } } })

// data mapper return is the data fields with no match in input 
S.create<{ a: { b?: number } }, { a: { z: number }}> ({ fields: { a: { map: () => { return {z:1} }, fields: NA } } })
S.create<{ a: { b?: number } }, { a?: { z: number }}>({ fields: { a: { map: () => { return {z:1} }, fields: NA } } })
// ... matching fields are not part of return requirement
S.create<{ a: { b?: number } }, { a: { z: number, b:number }}>({ fields: { a: { map: () => { return {z:1} }, fields: NA } } })
S.create<{ a: { b?: number } }, { a: { z: number, b?:number }}>({ fields: { a: { map: () => { return {z:1} }, fields: NA } } }) // todo way to explicitly test that b: undefined|number not acceptable in return type, check autocomplete for now to see it is working

// data mapper param 1 is the normalized namespace input (no shorthands, initializers run)
S.create<{ a: { b: number } },           { a: { z: number }}> ({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number}>>(); return NA }, fields: NA } } })
S.create<{ a: { b: number } },           { a?: { z: number }}>({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number}>>(); return NA }, fields: NA } } })
// ... no shorthands
S.create<{ a: boolean | { b: number } }, { a: { z: number }}>({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number}>>(); return NA }, shorthand: NA, fields: NA } } })
// ... post-initializer
S.create<{ a: { b?: number } },             { a: { z: number }}>           ({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number}>>(); return NA }, fields: NA } } })
S.create<{ a: { b?: number, c?: number } }, { a: { z: number, c:number }}> ({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number, c:number}>>(); return NA }, fields: NA } } })
S.create<{ a: { b?: number, c: number } },  { a: { z: number, c?:number }}>({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number, c:number}>>(); return NA }, fields: NA } } })
S.create<{ a: { b?: number, c?: number } }, { a: { z: number, c?:number }}>({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number, c?:number}>>(); return NA }, fields: NA } } })

// optional input is not considered mismatch 
S.create<{ a?: { b1?: string, c?: number } }, { a: { b2: string, c:number }}>({ fields: { a: { map: (input) => { return {b2:''} }, fields: NA } } })

// receives context
S.create<{ a: { b?: number } }, { a: { z: number }}>({ fields: { a: { map: (input, ctx) => { tst.assertTrue<tst.Equals<typeof ctx, {path:string[]}>>(); return NA }, fields: NA } } })

/**
 * mappers for namespaces under records
 */

// receives context with key
S.create<{ a: R<{ b?: number }> }, { a: R<{ z: number }>}> ({ fields: { a: { entry: { map: (input, ctx) => { tst.assertTrue<tst.Equals<typeof ctx, {path:string[], key: string}>>(); return NA }, fields: NA } } } })

/**
 * mappers for field type mismatch
 * these tests are not as rigorous as field name mismatch, should overlap mostly re implementation
 */

// requires map
S.create<{ a: { b: number } }, { a: { b: boolean }}>({ fields: { a: { map: () => NA, fields: NA } } })
// return is data fields that diverge
S.create<{ a: { b: number } },           { a: { b: boolean }}>          ({ fields: { a: { map: () => { return {b:true}}, fields: NA } } })
S.create<{ a: { b: number, c:number } }, { a: { b: boolean, c:number }}>({ fields: { a: { map: () => { return {b:true}}, fields: NA } } })
// param is normalized input
S.create<{ a: { b: number } },           { a: { b: boolean }}>({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b:number}>>(); return NA }, fields: NA } } })


/**
 * mappers for root fields
 */

S.create<{ a: number }, { a: boolean }>({ map: () => NA, fields: NA })
S.create<{ a: number }, { a: boolean }>({ map: () => { return {a:true} }, fields: NA })
S.create<{ a: number }, { a: boolean }>({ map: (input) => { tst.assertTrue<tst.Equals<typeof input, {a:number}>>(); return NA }, fields: NA })

/**
 * mappers (not) for nested namespaces
 */

// only top-most map is required
S.create<{ a: { b1: { c: number } } }, { a: { b2: { c: boolean } }}>({ fields: { a: { map: () => NA, fields: { b1: { fields: { c: {} }} } } } })

// mapper must return diverged sub-tree
S.create<{ a: { b1: { c: number } } }, { a: { b2: { c: boolean } }}>({ fields: { a: { map: () => ({b2:{c:true}}), fields: NA } } })

// input is input sub-tree
S.create<{ a: { b1: { c: number } } }, { a: { b2: { c: boolean } }}>({ fields: { a: { map: (input) => { tst.assertTrue<tst.Equals<typeof input, {b1:{c:number}}>>();return NA }, fields: NA } } })
