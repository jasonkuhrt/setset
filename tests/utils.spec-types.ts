import * as tst from 'typescript-test-utils'
import * as S from '..'
import { GetNamespaceDataWhereDivergingFromInput, InferDataFromInput, IsNamespaceInputEqualData, KeysWhereNotPresentOrRequiredInData, Leaf, UnwrapSyntheticLeaf, UserInput } from "../src"
import { KeepRequiredKeys } from "../src/utils"
import { R } from './__helpers'

/**
 * DataDefault
 */

interface A { a?: number }

const dataDefualt1: S.InferDataFromInput<{}> = {}
const dataDefualt2: S.InferDataFromInput<{ a: 1 }>               = { a: 1 }
const dataDefualt3: S.InferDataFromInput<{ a: { a: 1 } }>        = { a: { a: 1 } }
const dataDefualt4: S.InferDataFromInput<{ a: 1 | { a: 1 } }>    = { a: { a: 1 } }
tst.assertTrue<tst.Equals<{a: { a: number }}, S.InferDataFromInput<{ a: 1 | A }>>>()

// optionality
const dataDefualt1b: S.InferDataFromInput<{ a?: 1 }>             = { a: 1 }
// @ts-expect-error
const dataDefualt1c: S.InferDataFromInput<{ a?: 1 }>             = { a: undefined }

type a = string extends keyof never ? 1:2

/**
 * helpers
 */

// KeepRequiredKeys
tst.assertTrue<tst.Equals<{},     KeepRequiredKeys<{ a?: 1; b?: 2 }>>>()
tst.assertTrue<tst.Equals<{a: 1}, KeepRequiredKeys<{ a: 1; b?: 2 }>>>()

tst.assertTrue<tst.Equals<never,    KeysWhereNotPresentOrRequiredInData<{a:1}, {a?:1}>>>()
tst.assertTrue<tst.Equals<'a',      KeysWhereNotPresentOrRequiredInData<{a:1}, {b:1}>>>()
tst.assertTrue<tst.Equals<'a',      KeysWhereNotPresentOrRequiredInData<{a:1}, {a:1}>>>()
tst.assertTrue<tst.Equals<'a'|'b',  KeysWhereNotPresentOrRequiredInData<{a:1,b:1}, {a:1,b:1}>>>()
tst.assertTrue<tst.Equals<'a',      KeysWhereNotPresentOrRequiredInData<{a:1}, {a:1,b:1}>>>()
tst.assertTrue<tst.Equals<'a'|'b',  KeysWhereNotPresentOrRequiredInData<{a:1,b:1}, {a:1}>>>()

// InferDataFromInput
tst.assertTrue<tst.Equals<{a:1}, InferDataFromInput<{a:1}>>>()
tst.assertTrue<tst.Equals<{a:{b:2}}, InferDataFromInput<{a:{b:2}}>>>()
tst.assertTrue<tst.Equals<{a:{b:2}}, InferDataFromInput<{a?:{b?:2}}>>>()

// UserInput
tst.assertTrue<tst.Equals<{a:1}, UserInput<{a:1}>>>()
tst.assertTrue<tst.Equals<{a:{b:2}}, UserInput<{a:{b:2}}>>>()

tst.assertTrue<tst.Equals<{}, GetNamespaceDataWhereDivergingFromInput<{a:boolean},{a:boolean}>>>()
tst.assertTrue<tst.Equals<{}, GetNamespaceDataWhereDivergingFromInput<false | {a?:boolean},{a:boolean}>>>()
tst.assertTrue<tst.Equals<{b:string}, GetNamespaceDataWhereDivergingFromInput<{a:boolean},{a:boolean, b:string}>>>()

tst.assertTrue<tst.Equals<{a:boolean}, UnwrapSyntheticLeaf<Leaf<{a:boolean}>>>>()

tst.assertTrue<tst.Equals<true, IsNamespaceInputEqualData<{ a: 1 }, { a: 1 }>>>()
tst.assertTrue<tst.Equals<true, IsNamespaceInputEqualData<{ a?: R<{ b: number }> }, { a: R<{ b: number }> }>>>()
