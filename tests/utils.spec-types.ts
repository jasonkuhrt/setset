import * as tst from 'typescript-test-utils'
import * as S from '..'
import { KeysWhereDataRequiredOrNotInData } from "../src"
import { KeepRequiredKeys } from "../src/utils"

/**
 * DataDefault
 */

interface A { a?: number }

const dataDefualt1: S.DataFromInput<{}> = {}
const dataDefualt2: S.DataFromInput<{ a: 1 }>               = { a: 1 }
const dataDefualt3: S.DataFromInput<{ a: { a: 1 } }>        = { a: { a: 1 } }
const dataDefualt4: S.DataFromInput<{ a: 1 | { a: 1 } }>    = { a: { a: 1 } }
tst.assertTrue<tst.Equals<{a: { a: number }}, S.DataFromInput<{ a: 1 | A }>>>()

// optionality
const dataDefualt1b: S.DataFromInput<{ a?: 1 }>             = { a: 1 }
// @ts-expect-error
const dataDefualt1c: S.DataFromInput<{ a?: 1 }>             = { a: undefined }

type a = string extends keyof never ? 1:2

/**
 * helpers
 */

// KeepRequiredKeys
tst.assertTrue<tst.Equals<{},     KeepRequiredKeys<{ a?: 1; b?: 2 }>>>()
tst.assertTrue<tst.Equals<{a: 1}, KeepRequiredKeys<{ a: 1; b?: 2 }>>>()

tst.assertTrue<tst.Equals<never,    KeysWhereDataRequiredOrNotInData<{a:1}, {a?:1}>>>()
tst.assertTrue<tst.Equals<'a',      KeysWhereDataRequiredOrNotInData<{a:1}, {b:1}>>>()
tst.assertTrue<tst.Equals<'a',      KeysWhereDataRequiredOrNotInData<{a:1}, {a:1}>>>()
tst.assertTrue<tst.Equals<'a'|'b',  KeysWhereDataRequiredOrNotInData<{a:1,b:1}, {a:1,b:1}>>>()
tst.assertTrue<tst.Equals<'a',      KeysWhereDataRequiredOrNotInData<{a:1}, {a:1,b:1}>>>()
tst.assertTrue<tst.Equals<'a'|'b',  KeysWhereDataRequiredOrNotInData<{a:1,b:1}, {a:1}>>>()
