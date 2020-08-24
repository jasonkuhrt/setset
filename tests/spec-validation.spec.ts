import * as S from '../src'
import { R } from './__helpers'

it('if root mapper is assigned a non-function', () => {
  expect(() => {
    // @ts-expect-error
    S.create<{ a: number }, { a: boolean }>({ map: 1, fields: { a: {} } })
  }).toThrowErrorMatchingSnapshot()
})

it('if map is assigned a non-function', () => {
  expect(() => {
    // @ts-expect-error
    S.create<{ a: { b: number } }, { a: { b: boolean } }>({ fields: { a: { map: 1, fields: { b: {} } } } })
  }).toThrowErrorMatchingSnapshot()
})

it('if record-entry map is assigned a non-function', () => {
  expect(() => {
    // prettier-ignore
    // @ts-expect-error
    S.create<{ a: R<{ b: number }> }, { a: R<{ b: boolean }> }>({ fields: { a: { entry: { map: 1, fields: { b: {} } } } } })
  }).toThrowErrorMatchingSnapshot()
})
