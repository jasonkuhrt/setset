import * as S from '../src'
import { R } from './__helpers'

it('errors gracefully if user supplies invalid value kind to change', () => {
  const s = S.create<{ a: R<{ b: number }> }>({ fields: { a: { entry: { fields: { b: {} } } } } })
  // @ts-ignore-error
  expect(() => s.change({ a: 1 })).toThrowErrorMatchingSnapshot()
})

describe('specifiers', () => {
  it('can be omitted when input+data is optional', () => {
    const s3 = S.create<{ a?: R<{ b?: number }> }, { a?: R<{ b?: number }> }>({ fields: {} })
    s3.change({ a: { foobar: { b: 2 } } })
    expect(s3.data).toEqual({ a: { foobar: { b: 2 } } })
  })
})

it('can have their settings changed', () => {
  const s = S.create<{ a: R<{ b: number }> }>({ fields: { a: { entry: { fields: { b: {} } } } } })
  expect(s.change({ a: { foobar: { b: 2 } } }).data).toEqual({ a: { foobar: { b: 2 } } })
})

describe('initial()', () => {
  it('is accepted and is called (required record case)', () => {
    // prettier-ignore
    const s = S.create<{ a: R<{ b: number }> }>({ fields: { a: { initial: () => ({ foobar: { b: 2 } }), entry: { fields: { b: {} } } } } })
    expect(s.data).toEqual({ a: { foobar: { b: 2 } } })
    expect(s.metadata).toMatchSnapshot()
  })
  it('is accepted and is called (optional record case)', () => {
    // prettier-ignore
    const s = S.create<{ a?: R<{ b: number }> }>({ fields: { a: { initial: () => ({ foobar: {b:2}}), entry: { fields: { b: {} } } } } })
    expect(s.data).toEqual({ a: { foobar: { b: 2 } } })
    expect(s.metadata).toMatchSnapshot()
  })
  it('is omittable, defaulting to empty object (optional reocrd case)', () => {
    // todo bit odd that data could be typed as optional but it would never be...
    // prettier-ignore
    const s = S.create<{ a?: R<{ b: number }> }>({ fields: { a: { entry: { fields: { b: {} } } } } })
    expect(s.data).toEqual({ a: {} })
    expect(s.metadata).toMatchSnapshot()
  })
  describe('metadata', () => {
    it('captured immutable initial state', () => {
      const s = S.create<{ a?: R<{ b: number }> }>({ fields: { a: { entry: { fields: { b: {} } } } } })
      s.change({ a: { foobar: { b: 1 } } })
      expect(s.metadata).toMatchSnapshot()
    })
    it('captures immutable initial state even with sub-initializers', () => {
      // prettier-ignore
      const s = S.create<{ a: R<{ b?: number; c?: number }> }>({
          fields: { a: { initial: () => ({ foobar: { c: 1 } }), entry: { fields: { c: { initial: () => 100 }, b: { initial: () => 2 } } } } }
        })
      expect(s.metadata).toMatchSnapshot()
      s.change({ a: { foobar: { c: 3 } } })
      expect(s.metadata).toMatchSnapshot()
    })
  })
  describe('sub-initializers', () => {
    it('run when respective fields not given by record initializer', () => {
      const s = S.create<{ a: R<{ b?: number }> }>({
        fields: { a: { initial: () => ({ foobar: {} }), entry: { fields: { b: { initial: () => 1 } } } } },
      })
      expect(s.data).toEqual({ a: { foobar: { b: 1 } } })
    })
    it('skipped when respective fields are given by record initializer', () => {
      // prettier-ignore
      const s = S.create<{ a: R<{ b?: number }> }>({
          fields: { a: { initial: () => ({ foobar: { b: 2 } }), entry: { fields: { b: { initial: () => 1 } } } } },
        })
      expect(s.data).toEqual({ a: { foobar: { b: 2 } } })
    })
    it('data merged with data given in record initializer', () => {
      // prettier-ignore
      const s = S.create<{ a: R<{ b?: number; c: 1 }> }>({
          fields: { a: { initial: () => ({ foobar: { c: 1 } }), entry: { fields: { c: {}, b: { initial: () => 1 } } } } }
        })
      expect(s.data).toEqual({ a: { foobar: { c: 1, b: 1 } } })
    })
  })
})
