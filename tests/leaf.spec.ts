import { log } from '@nexus/logger'
import * as S from '../src'
import { c } from './__helpers'

describe('change', () => {
  it('.data reflects the change', () => {
    const s = S.create<{ a: number }>({ fields: { a: {} } })
    expect(s.change({ a: 1 }).data).toEqual({ a: 1 })
  })
  it('.metadata reflects the change', () => {
    const s = S.create<{ a: number }>({ fields: { a: {} } })
    expect(s.change({ a: 1 }).metadata.fields.a).toMatchObject({ from: 'change', value: 1 })
  })
  it('array data is not merged in .data', () => {
    const s = S.create<{ a: number[] }>({ fields: { a: {} } })
    expect(s.change({ a: [2] }).data).toEqual({ a: [2] })
    expect(s.change({ a: [3] }).data).toEqual({ a: [3] })
  })
  it('array data is not merged in .metadata', () => {
    const s = S.create<{ a: number[] }>({ fields: { a: {} } })
    expect(s.change({ a: [3] }).data).toEqual({ a: [3] })
    expect(s.change({ a: [2] }).metadata.fields.a).toMatchObject({ from: 'change', value: [2] })
  })
})

describe('specifiers', () => {
  describe('encounter static errors', () => {
    it('if missing for a fields in the input type', () => {
      S.create<{ a: number }>({ fields: { a: {} } })
      // @ts-expect-error
      S.create<{ a: number }>({ fields: {} })
    })
  })
  describe('with optional data', () => {
    it('can be omitted', () => {
      const s = S.create<{ a: number }, { a?: number }>({ fields: {} })
      expect(s.data.a).toBeUndefined()
    })
    it('can be omitted: and can still be changed', () => {
      const s = S.create<{ a: number }, { a?: number }>({ fields: {} })
      s.change({ a: 1 })
      expect(s.data).toEqual({ a: 1 })
    })
    it('can still be provided too', () => {
      const s = S.create<{ a: number }, { a?: number }>({ fields: { a: {} } })
      expect(s.data.a).toBeUndefined()
    })
  })
})

describe('initial()', () => {
  describe('throws an error', () => {
    it('when not assigned a function', () => {
      expect(() =>
        // @ts-expect-error
        S.create<{ a?: number }>({ fields: { a: { initial: 1 } } })
      ).toThrowErrorMatchingSnapshot()
    })
    it('gracefully upon an unexpected error', () => {
      expect(() =>
        S.create<{ a?: number }>({
          fields: {
            a: {
              initial() {
                throw new Error('Unexpected error while trying to initialize setting')
              },
            },
          },
        })
      ).toThrowErrorMatchingSnapshot()
    })
  })
  describe('encounter static errors', () => {
    it('when undefined is returned', () => {
      // cannot throw error for this b/c sometimes undefined is acceptable (see other tests)
      // @ts-expect-error
      S.create<{ a?: string }>({ fields: { a: { initial: c(undefined) } } })
    })
    it('when used on an input field that is required', () => {
      // @ts-expect-error
      S.create<{ a: number }>({ fields: { a: { initial: c(1) } } })
    })
    it('when return a type that is not assignable to the input field', () => {
      // @ts-expect-error
      S.create<{ a?: string }>({ fields: { a: { initial: c(1) } } })
      // @ts-expect-error
      S.create<{ a?: string | boolean }>({ fields: { a: { initial: c(1) } } })
    })
  })
  it('are run at create time', () => {
    const s = S.create<{ a?: number }>({ fields: { a: { initial: c(1) } } })
    expect(s.data.a).toEqual(1)
  })
  describe('with optional data field', () => {
    it('can be omitted even if the input is optional, in which case the data initializes to undefined', () => {
      const s = S.create<{ a?: number }, { a?: number }>({ fields: { a: {} } })
      expect(s.data.a).toBeUndefined()
    })
    it('can still be provided, in which case the data initializes to the returned value like usual', () => {
      const s = S.create<{ a?: number }, { a?: number }>({ fields: { a: { initial: c(1) } } })
      expect(s.data.a).toEqual(1)
    })
    it('can still be provided, but can now return undefined', () => {
      const s = S.create<{ a?: number }, { a?: number }>({ fields: { a: { initial: c(undefined) } } })
      expect(s.data.a).toBeUndefined()
    })
  })
  describe('can be for input fields of type', () => {
    it('function', () => {
      const s = S.create<{ a?: (n: number) => number }>({ fields: { a: { initial: c((x) => x + 1) } } })
      expect(s.data.a(1)).toEqual(2)
    })
    it('array', () => {
      const s = S.create<{ a?: 1[] }>({ fields: { a: { initial: c([1]) } } })
      expect(s.data.a).toEqual([1])
    })
    it('null', () => {
      const s = S.create<{ a?: null }>({ fields: { a: { initial: c(null) } } })
      expect(s.data.a).toEqual(null)
    })
    // prettier-ignore
    it('boolean, number, string, literal', () => {
      expect(S.create<{ a?: boolean }>({ fields: { a: { initial: c(true) } } }).data.a).toEqual(true)
      expect(S.create<{ a?: number }>({ fields: { a: { initial: c(1) } } }).data.a).toEqual(1)
      expect(S.create<{ a?: 2 }>({ fields: { a: { initial: c(2) } } }).data.a).toEqual(2)
      expect(S.create<{ a?: string }>({ fields: { a: { initial: c('a') } } }).data.a).toEqual('a')
    })
  })
})

describe('fixup()', () => {
  let logs: jest.Mock
  let logSettingsOriginal: any

  beforeEach(() => {
    logs = jest.fn()
    logSettingsOriginal = {
      output: log.settings.output,
      filter: log.settings.filter.originalInput,
      pretty: log.settings.pretty,
    }
    log.settings({ output: { write: logs }, pretty: false })
  })

  afterEach(() => {
    log.settings(logSettingsOriginal)
  })

  describe('when onFixup handler', () => {
    it('is set then called when fixup fixes something', () => {
      const onFixup = jest.fn()
      const s = S.create<{ path: string }>({
        onFixup,
        fields: {
          path: {
            fixup(value) {
              if (value[0] === '/') return null
              return { messages: ['must have leading slash'], value: `/${value}` }
            },
          },
        },
      })
      expect(s.change({ path: 'foo' }).data).toEqual({ path: '/foo' })
      expect(onFixup.mock.calls).toMatchSnapshot()
    })
    it('fails then it errors gracefully', () => {
      // prettier-ignore
      const onFixup = jest.fn().mockImplementation(() => { throw new Error('Unexpected error!') })
      // prettier-ignore
      const s = S.create<{ path: string }>({ onFixup, fields: { path: { fixup() { return { value: 'foobar', messages: [] } } } } })
      expect(() => s.change({ path: '' })).toThrowError(
        'onFixup callback for "path" failed \nUnexpected error!'
      )
    })
    it('is not called for a fixup that returns null', () => {
      const onFixup = jest.fn()
      const s = S.create<{ path: string }>({ onFixup, fields: { path: { fixup: () => null } } })
      s.change({ path: '' })
      expect(onFixup.mock.calls).toEqual([])
    })
    it('not set then defualt is to log a warning', () => {
      log.settings({ filter: '*@warn' })
      // prettier-ignore
      const s = S.create<{ a: string }>({ fields: { a: { fixup() { return { value: 'fixed', messages: ['...'] } } } } })
      s.change({ a: 'foo' })
      expect(logs.mock.calls).toMatchSnapshot()
    })
    it('not set and no messages provided then default is to do nothing', () => {
      log.settings({ filter: '*@warn' })
      // prettier-ignore
      const s = S.create<{ a: string }>({ fields: { a: { fixup() { return { value: 'fixed' } } } } })
      s.change({ a: 'foo' })
      expect(logs.mock.calls).toMatchSnapshot()
    })
    it('is set then default handler is not run', () => {
      log.settings({ filter: '*@warn' })
      // prettier-ignore
      const s = S.create<{ a: string }>({ onFixup() {}, fields: { a: { fixup() { return { value: 'fixed', messages: ['...'] } } } } })
      s.change({ a: 'foo' })
      expect(logs.mock.calls).toEqual([])
    })
    it('is set it can call the original handler to retain the original base behaviour', () => {
      log.settings({ filter: '*@warn' })
      // prettier-ignore
      const s = S.create<{ a: string }>({ onFixup(info, original) { original(info) }, fields: { a: { fixup() { return { value: 'fixed', messages: ['...'] } } } } })
      s.change({ a: 'foo' })
      expect(logs.mock.calls).toMatchSnapshot()
    })
    it('can receive no messages if a fixup did not provide any', () => {
      const onFixup = jest.fn()
      let info
      // prettier-ignore
      const s = S.create<{ a: string }>({ onFixup, fields: { a: { fixup() { return { value: 'fixed'  } } } } })
      s.change({ a: 'foo' })
      expect(onFixup.mock.calls).toMatchSnapshot()
    })
  })
  it('a namespace with shorthand runs through fixups too', () => {
    const onFixup = jest.fn()
    // prettier-ignore
    const settings = S.create<{ a: number | { a: number } }>({
      onFixup,
      fields: { a: { shorthand: (a) => ({ a }), fields: { a: { fixup: (value) => ({ messages: [`must be 1, was ${value}`], value: 1 }) } } } },
    })
    expect(settings.change({ a: 2 }).data).toEqual({ a: { a: 1 } })
    expect(onFixup.mock.calls).toMatchSnapshot()
  })
  it('if fixup fails it errors gracefully', () => {
    // prettier-ignore
    const s = S.create<{ path: string }>({ fields: { path: { fixup() { throw new Error('Unexpected error!') } } } })
    expect(() => s.change({ path: '' })).toThrowErrorMatchingSnapshot()
  })
  describe('static errors', () => {
    it('fixup return .value prop must match the input type', () => {
      // @ts-expect-error
      // prettier-ignore
      S.create<{ a: 1 }>({ fields: { a: { fixup() { return { value: 2, messages: [] } } } } }).data
    })
  })
  it('initial does not pass through fixup', () => {
    // prettier-ignore
    expect(
      S.create<{ a?: number }>({ fields: { a: { initial: () => 1, fixup() { return { value: 2, messages: [] } } } } }).data
    ).toEqual({ a: 1 })
  })
})

describe('validate()', () => {
  it('if a setting passes validation nothing happens', () => {
    const validate = jest.fn().mockImplementation(() => null)
    const settings = S.create<{ a: string }>({ fields: { a: { validate } } })
    settings.change({ a: 'bar' })
    expect(validate.mock.calls).toEqual([['bar']])
  })
  it('if a setting fails validation then an error is thrown with structured metadata attached', () => {
    const validate = jest.fn().mockImplementation((value) => {
      if (value === 'bar') return { reasons: ['Too long', 'Too simple'] }
    })
    const s = S.create<{ a: string }>({ fields: { a: { validate } } })
    let e
    try {
      s.change({ a: 'bar' })
    } catch (e_) {
      e = e_
    }
    expect(e).toMatchSnapshot()
  })
  it('initial does not pass through validate', () => {
    const validate = jest.fn().mockImplementation((value) => {
      if (value === 'bad') return { reasons: ['foobar'] }
    })
    expect(
      S.create<{ a?: number }>({ fields: { a: { initial: c(1), validate } } }).data
    ).toEqual({ a: 1 })
  })
  it('unexpected validator failures error gracefully', () => {
    const validate = jest.fn().mockImplementation((value) => {
      throw new Error('Unexpected error while trying to validate')
    })
    const s = S.create<{ a: string }>({ fields: { a: { validate } } })
    let e
    try {
      s.change({ a: 'bar' })
    } catch (e_) {
      e = e_
    }
    expect(e).toMatchSnapshot()
    expect(e.info).toMatchSnapshot()
    expect(e.value).toMatchSnapshot()
  })
})
