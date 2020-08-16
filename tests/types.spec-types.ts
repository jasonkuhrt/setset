// metadata
import * as tst from 'typescript-test-utils'
import * as S from '..'

type R<T> = Record<string, T>

/**
 * raw
 */

// todo raw breaks type errors badly, so disabled for now.
// todo it is a union alternative, object with raw method
// todo problem is certain type errors in main union member
//      lead to only suggesting/talking about this raw alt
// s.create<{ a: number }>({ spec: { raw: (input) => input } })
// s.create<{ a: number }>({ spec: { a: { raw: (a) => a } } })
// s.create<{ a: R<{z: number }> }>({ spec: { a: { raw(input) { return input } } }})

/**
 * Records
 */

// by default entry fields are required to be listed in entryFields
S.create<{ a: R<{z: number }> }>({ fields: { a: { entry: { fields: { z: {} } } } }})
// @ts-expect-error
S.create<{ a: R<{z: number }> }>({ fields: { a: { entry: {} } }})
// @ts-expect-error
S.create<{ a: R<{z: number }> }>({ fields: { a: {} }})
// @ts-expect-error
S.create<{ a: R<{z?: number }> }>({ fields: { a: { entry: {} } }})

// if entry data field is optional, then so to is entry input field spec
// ... optionality of input does not matter then
S.create<{ a: R<{z: number }> }, { a: R<{z?: number }> }>({ fields: { a: { entry: { fields: {} } } }})
S.create<{ a: R<{z?: number }> }, { a: R<{z?: number }> }>({ fields: { a: { entry: { fields: {} } } }})
// ... input field spec may still be provided if desired
S.create<{ a: R<{z: number }> }, { a: R<{z?: number }> }>({ fields: { a: { entry: { fields: { z: {} } } } }})
// ... if all entry input field specs are optional then so to is entryFields property itself
// todo
// s.create<{ a: R<{z: number }> }, { a: R<{z?: number }> }>({ spec: { a: {} }})
// ... ... but still permitted 
S.create<{ a: R<{z: number }> }, { a: R<{z?: number }> }>({ fields: { a: { entry: { fields: {} } } }})

// if entry input field optional THEN initializer required
S.create<{ a: R<{z?: number }> }>({ fields: { a: { entry: { fields: { z: { initial: () => 1 } } } } }})
// @ts-expect-error
S.create<{ a: R<{z?: number }> }>({ fields: { a: { entry: { z: {} } } }})

// if input field optional THEN initializer required
S.create<{ a?: R<{z: number }> }>({ fields: { a: { entry: { fields: { z: {} } }, initial: () => ({foo:{z:1}}) } }})
// @ts-expect-error
S.create<{ a?: R<{z: number }> }>({ fields: { a: { entry: { z: {} } }}})
// ... but if entry input fields all optional THEN initializer optional
S.create<{ a?: R<{z?: number }> }>({ fields: { a: { entry: { fields: { z: {initial: () => 1 } } } } }})
S.create<{ a?: R<{z?: number }> }>({ fields: { a: { entry: { fields: { z: {initial: () => 1 } } }, initial: () => ({foo:{z:1}}) } }})
// REGRESSION TEST: initial must return an empety record or record of valid entries
// @ts-expect-error
S.create<{ a?: R<{z?: number }> }>({ fields: { a: { entry: { z: {initial: () => 1 } }, initial: () => ({foo:{z:true}}) } }})

// // todo
// // if entry input/data field types are mismatch THEN entry input field spec mapType required
// // todo this also triggers requiring mapEntryData ... developer should be able to choose which they want ... not able to provide both ... either top level or all sub-instances
// // ... actually looking below, for shadow data fields, local mappers are a really bad fit, not just a style difference
// s.create<{ a: R<{z: number }> },  { a: R<{ z: boolean }> }>({ spec: { a: { entryFields: { z: { mapType: Boolean } }, } }})
// @ts-expect-error
S.create<{ a: R<{z: number }> },  { a: R<{ z: boolean }> }>({ fields: { a: { entry: { z: {} } } }})

// // todo
// // if entry input/data field are mismatch THEN entry input field spec mapData required
// s.create<{ a: R<{z: number }> },  { a: R<{ y: number }> }>({ spec: { a: { entryFields: { z: { mapData: (z) => ({y:z})} } } }})

// if data has fields that are not present in input THEN mapEntryData is required 
S.create<{ a: R<{a: number }> },  { a: R<{ a: number, b: number }> }>({ fields: { a: { entry: { fields: {a: {}} }, mapEntryData: (input) => ({ ...input, b:1 }) } }})
// @ts-expect-error
S.create<{ a: R<{a: number }> },  { a: R<{ a: number, b: number }> }>({ fields: { a: { entry: { a: {} } } }})
// mapEntryData gets a representation of the data resolved from input up to then
S.create<{ a?: R<{ a?: number }> }, { a: R<{ a: number, b: number }> }>({ fields: { a: { mapEntryData: (data) => ({ a: data.a, b: data.a }), entry: { fields: { a: { initial: () => 1 } } } } } })
// @ts-expect-error data.b is not available on the data parameter
S.create<{ a?: R<{ a?: number }> }, { a: R<{ a: number, b: number }> }>({ fields: { a: { mapEntryData: (data) => ({ a: data.a, b: data.b }), entry: { a: { initial: () => 1 } } } } })


const zVal = S.create<{ a?: R<{z: number }> }>({ fields: { a: { entry: { fields: { z: {} } } }}}).metadata.fields.a.value.foobar.fields.z.value
tst.assertTrue<tst.Equals<number, typeof zVal>>()
const zVal2 = S.create<{ a?: R<{z: number }> }>({ fields: { a: { entry: { fields: { z: {} } } }}}).metadata.fields.a.initial.foobar.fields.z.value
tst.assertTrue<tst.Equals<number, typeof zVal2>>()

// if non-pojo unioned with input entry pojo THEN input entry field spec shorthand required
S.create<{ a: R<number | {a: number }> }>({ fields: { a: { entry: { fields: { a: {} }, shorthand: (a) => ({a}) } } }})
// @ts-expect-error
S.create<{ a: R<number | {a: number }> }>({ fields: { a: { entry: { a: {} } } }})

/**
 * namespaces
 */

S.create<{ a: { a: number } }>({ fields: { a: { fields:{ a: {} } } } })
S.create<{ a: { a: number } }, { a: { z: number }}>({ fields: { a: { fields:{ a: { mapData: (a) => ({ z: a }) } } } } })
S.create<{ a: { a: number } }, { a: { a: boolean }}>({ fields: { a: { fields:{ a: { mapType: (a) => Boolean(a) } } } } })

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

// RegExp does not get counted as namesapce
S.create<{ a?: { b?: string | RegExp } }>({ fields: { a: { fields: { b: { initial: () => /a/ } } } } })
// Date does not get counted as namesapce
S.create<{ a?: { b?: string | Date } }>({ fields: { a: { fields: { b: { initial: () => new Date() } } } } })

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
