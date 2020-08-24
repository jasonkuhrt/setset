// metadata
import * as tst from 'typescript-test-utils'
import * as S from '..'
import { R } from './__helpers'

/**
 * specifiers
 */

// Entry fields are required to be specified
S.create<{ a: R<{z: number }> }>({ fields: { a: { entry: { fields: { z: {} } } } }})
// @ts-expect-error
S.create<{ a: R<{z: number }> }>({ fields: { a: { entry: {} } }})
// @ts-expect-error
S.create<{ a: R<{z: number }> }>({ fields: { a: {} }})
// @ts-expect-error
S.create<{ a: R<{z?: number }> }>({ fields: { a: { entry: {} } }})

// However if entry data field is optional, then so to is entry input field spec
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

// if entry input/data field types are mismatch THEN mapType required on sub-field specifiers
S.create<{ a: R<{z: number }> },  { a: R<{ z: boolean }> }>({ fields: { a: { entry: { fields: { z: {} }, map: (input) => ({ z: Boolean(input.z) }) } } }})
// @ts-expect-error
S.create<{ a: R<{z: number }> },  { a: R<{ z: boolean, y: 1 }> }>({ fields: { a: { entry: { fields: { z: {} } } } }})

// todo if "map" method given THEN mapEntryData not required nor are any field mappers

// todo if input has fields that are not present in data THEN mapEntryData is required
// S.create<{ a: R<{z: number, y:number }> },  { a: R<{ y: number }> }>({ fields: { a: { mapEntryData: (data) => ({}), entry: { fields: { z: { mapData: (z) => ({y:z})}, y: {} } } } }})

// todo if input has fields that are not present in data and vice-versa THEN mapEntryData is required
// S.create<{ a: R<{z: number }> },  { a: R<{ y: number }> }>({ fields: { a: { entry: { fields: { z: { mapData: (z) => ({y:z})} } } } }})

// if data has fields that are not present in input THEN mapEntryData is required 
S.create<{ a: R<{a: number }> },  { a: R<{ a: number, b: number }> }>({ fields: { a: { entry: { fields: {a: {}}, map: () => ({ b:1 }) } } }})
// @ts-expect-error
S.create<{ a: R<{a: number }> },  { a: R<{ a: number, b: number }> }>({ fields: { a: { entry: { a: {} } } }})
// mapEntryData gets a representation of the data resolved from input up to then
// NOTE autocomplete on param is wrong, shows "b" being there, but wrong, and indeed, try accessing it, not there. So just autocomplete bug in VSCode
S.create<{ a?: R<{ a?: number }> }, { a: R<{ a: number, b: number }> }>({ fields: { a: {  entry: { fields: { a: { initial: () => 1 } }, map: (data) => ({ b: data.a }), } } } })
// @ts-expect-error data.b is not available on the data parameter
S.create<{ a?: R<{ a?: number }> }, { a: R<{ a: number, b: number }> }>({ fields: { a: { entry: { fields: { a: { initial: () => 1 } }, map: (data) => ({ b: data.b }),  } } } })


const zVal = S.create<{ a?: R<{z: number }> }>({ fields: { a: { entry: { fields: { z: {} } } }}}).metadata.fields.a.value.foobar.fields.z.value
tst.assertTrue<tst.Equals<number, typeof zVal>>()
const zVal2 = S.create<{ a?: R<{z: number }> }>({ fields: { a: { entry: { fields: { z: {} } } }}}).metadata.fields.a.initial.foobar.fields.z.value
tst.assertTrue<tst.Equals<number, typeof zVal2>>()

/**
 * shorthands
 */

// if non-pojo unioned with input entry pojo THEN input entry field spec shorthand required
S.create<{ a: R<number | {a: number }> }>({ fields: { a: { entry: { fields: { a: {} }, shorthand: (a) => ({a}) } } }})
// @ts-expect-error
S.create<{ a: R<number | {a: number }> }>({ fields: { a: { entry: { a: {} } } }})
