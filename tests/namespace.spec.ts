import * as tst from 'typescript-test-utils'
import * as S from '../src'
import { c, R } from './__helpers'

describe('specifier', () => {
  it('can be omitted when input+data is optional', () => {
    const s2 = S.create<{ a?: { b?: number } }, { a?: { b?: number } }>({ fields: {} })
    s2.change({ a: { b: 2 } })
    expect(s2.data).toEqual({ a: { b: 2 } })
  })
})

describe('Well known classes do not get counted as namespace', () => {
  it('regexp', () => {
    S.create<{ a?: { b?: string | RegExp } }>({ fields: { a: { fields: { b: { initial: () => /a/ } } } } })
  })
  it('Date', () => {
    S.create<{ a?: { b?: string | Date } }>({
      fields: { a: { fields: { b: { initial: () => new Date() } } } },
    })
  })
})

describe('static errors', () => {
  it('a field requires an initializer if the input is optional', () => {
    S.create<{ a?: { b?: 1 } }>({ fields: { a: { fields: { b: { initial: c(1) } } } } })
    // @ts-expect-error
    S.create<{ a?: { b?: 1 } }>({ fields: { a: { fields: { b: {} } } } })
  })
  it('a field cannot have an initializer if the input is required', () => {
    S.create<{ a: { b: 1 } }>({ fields: { a: { fields: { b: {} } } } })
    // @ts-expect-error
    S.create<{ a: { b: 1 } }>({ fields: { a: { fields: { b: { initial: c(1) } } } } })
  })
  it('if the namespace is optional but its fields are required then namespace must have initializer', () => {
    S.create<{ a?: { b: 1 } }>({ fields: { a: { initial: c({ b: 1 }), fields: { b: {} } } } })
    // @ts-expect-error missing a.initial
    S.create<{ a?: { b: 1 } }>({ fields: { a: { fields: { b: {} } } } })
  })
  it('namespace initializer only needs to return required fields', () => {
    S.create<{ a?: { b: 1; c?: 2 } }>({
      fields: { a: { initial: c({ b: 1 }), fields: { b: {}, c: { initial: c(2) } } } },
    })
    // @ts-expect-error missing initializer
    S.create<{ a?: { b: 1; c?: 2 } }>({ fields: { a: { initial: c({ b: 1 }), fields: { b: {}, c: {} } } } })
    // prettier-ignore
    // @ts-expect-error missing required fields in namespace initializer
    S.create<{ a?: { b: 1; c?: 2 } }>({ fields: { a: { initial: c({}), fields: { b: {}, c: { initial: c(2) } } } } })
  })
})

describe('initializer', () => {
  it('statically required when namespace optional', () => {
    // @ts-expect-error
    S.create<{ a?: { b: 1 } }>({ fields: { a: { fields: { b: {} } } } })
    S.create<{ a?: { b: 1 } }>({ fields: { a: { initial: c({ b: 1 }), fields: { b: {} } } } })
  })
  it('statically forbidden when namespace optional, but no required fields within', () => {
    // @ ts-expect-error
    // todo not failing right now because of excess property checks
    S.create<{ a?: { b?: 1 } }>({ fields: { a: { fields: { initial: c({}), b: { initial: c(1) } } } } })
  })
  it('statically optional when namespace optional and has 1+ required fields within, but is also optional in the data', () => {
    S.create<{ a?: { b?: 1 } }, { a?: { b: 1 } }>({ fields: { a: { fields: { b: { initial: c(1) } } } } })
    // prettier-ignore
    // todo initial is not actually allowed here, only looks like it b/c of excess property checks
    S.create<{ a?: { b?: 1 } }, { a?: { b: 1 }}>({ fields: { a: { initial: c({}), fields: { b: { initial: c(1) } } } } })
  })
  it('accepted when namespace optional in input but required in data; it initializes trees under required fields', () => {
    const s = S.create<{ a?: { b: 1 } }>({ fields: { a: { initial: c({ b: 1 }), fields: { b: {} } } } })
    expect(s.data).toEqual({ a: { b: 1 } })
  })
  it('statically (todo) cannot provide optional fields and if it does are overriden by the field initializer', () => {
    // todo this should raise a compiler warning but it does not because of https://github.com/microsoft/TypeScript/issues/241#issuecomment-669138047
    // @ ts-expect-error c prop forbidden from namespace initializer
    // prettier-ignore
    const s = S.create<{ a?: { b: 1, c?: number } }>({ fields: { a: { log:{b:1,c:2}, log2: {b:1,c:2}, initial(){ return { b:1, c: 3 } }, fields: { b: {}, c:{initial: c(2) } } } } })
    expect(s.data).toEqual({ a: { b: 1, c: 2 } })
  })
})

it('a field initializer initializes its data', () => {
  const settings = S.create<{ a?: { b?: 1 } }>({ fields: { a: { fields: { b: { initial: c(1) } } } } })
  expect(settings.data.a.b).toEqual(1)
})
it('data can be changed', () => {
  const settings = S.create<{ a?: { b?: number } }>({ fields: { a: { fields: { b: { initial: c(1) } } } } })
  expect(settings.change({ a: { b: 2 } }).data).toEqual({ a: { b: 2 } })
})
it('data merges deeply preserving existing data not targetted by input', () => {
  const settings = S.create<{ a?: { a?: number; b?: number }; b?: number }>({
    fields: {
      a: { fields: { a: { initial: c(1) }, b: { initial: c(2) } } },
      b: { initial: c(3) },
    },
  })
  expect(settings.change({ a: { a: 4 } }).data).toEqual({ a: { a: 4, b: 2 }, b: 3 })
})
// todo bring back in strict mode, see commented out code in resolve func
it.skip('passing a plain object to a non-namespace field will error gracefully', () => {
  const s = S.create<{ a?: 1 }>({ fields: { a: { initial: c(1) } } })
  // @ts-expect-error
  expect(() => s.change({ a: { b: 2 } })).toThrowErrorMatchingSnapshot()
})
describe('with shorthands', () => {
  it('allow a value to be assigned directly to the namespace field', () => {
    type i = { a?: number | { b?: number } }
    type d = { a: { b: number } }
    const settings = S.create<i, d>({
      // prettier-ignore
      fields: { a: { shorthand: (value) => ({ b: value + 100 }), fields: { b: { initial: c(1) } } } }
    })
    expect(settings.data).toEqual({ a: { b: 1 } })
    expect(settings.change({ a: 2 }).data).toEqual({ a: { b: 102 } })
  })
  describe('runtime errors', () => {
    it('unexpected shorthand errors fail gracefully', () => {
      type d = { a: { b: number } }
      type i = { a: number | { b: number } }
      // prettier-ignore
      const s = S.create<i, d>({ fields: { a: { shorthand(value) { throw new Error(`Unexpected shorthand error with value ${value}`) }, fields: { b: { initial: c('') } } } } })
      expect(() => s.change({ a: 100 }).data.a).toThrowErrorMatchingSnapshot()
    })
  })
  it('still accepts longhand input', () => {
    type d = { a: { b: number } }
    type i = { a: number | { b: number } }
    const s = S.create<i, d>({
      // prettier-ignore
      fields: { a: { shorthand: (n) => ({ b: n + 100 }) , fields: { b: { initial: c(1) } } } }
    })
    expect(s.change({ a: { b: 3 } }).data.a).toEqual({ b: 3 })
  })
  it('can be a type that differs from the longhand', () => {
    const s = S.create<{ a: (() => number) | { b: string } }, { a: { b: string } }>({
      // prettier-ignore
      fields: { a: { shorthand: (f) => ({ b: f().toString() }), fields: { b: {} } } }
    })
    expect(s.change({ a: () => 1 }).data).toEqual({ a: { b: '1' } })
  })

  it('changing with a shorthand on a namespace that does not support them will error gracefully', () => {
    const s = S.create<{ a: { b: string } }>({ fields: { a: { fields: { b: {} } } } })
    // @ts-expect-error
    expect(() => s.change({ a: 'runtime error' })).toThrowError(
      'Setting "a" is a namespace with no shorthand so expects an object but received a non-object: \'runtime error\''
    )
  })
})

describe('map on root namespace', () => {
  it('it works on root', () => {
    // prettier-ignore
    const s = S.create<{ b1: string }, { b2: string }>({
      map(input, ctx) { return { b2:'bar' } },
      fields: { b1: {} }
    })
    expect(s.change({ b1: 'foo' }).data).toEqual({ b1: 'foo', b2: 'bar' })
  })
})

describe('map on record entry namespace', () => {
  it('context param contains "key" prop indicating where in record this namespace comes from', () => {
    // prettier-ignore
    const s = S.create<{ a: R<{ b1: string }> }, { a: R<{ b2: {path:string[],key:string} }> }>({
        fields: { a: { entry: {
            map(input, ctx) { tst.assertTrue<tst.Equals<{path:string[],key:string}, typeof ctx>>(); return {b2:ctx} },
            fields: { b1: {} } }
        }}
      })
    expect(s.change({ a: { foobar: { b1: 'ignore' } } }).data).toEqual({
      a: { foobar: { b1: 'ignore', b2: { path: ['__root__', 'a', 'foobar'], key: 'foobar' } } },
    })
  })
  it('runs over entries provided by record initializer', () => {
    // prettier-ignore
    const s = S.create<{ a: R<{ b1: string }> }, { a: R<{ b2: {input: {b1:string},ctx: {path:string[],key:string}} }> }>({
      fields: { a: {
        initial: c({foo:{b1:''}}),
        entry: {
          map(input, ctx) { return {b2:{input:{...input}, ctx}} },
          fields: { b1: {} }
        }
      }}
    })
    expect(s.data).toMatchSnapshot()
  })
})

describe('map with initializers does not show up in the metadata data, and...', () => {
  it('runs at initialization time with input from namesapce initializer', () => {
    // prettier-ignore
    const s = S.create<{ a: { b?: { c1:string }  } }, { a: { b: { c2: string} } }>({
        fields: { a: { fields: { b: {
          initial(){ return { c1:'foo'} },
          map(input, ctx) { return { c2: input.c1 } },
          fields: { c1: {} }
        }}}}
      })
    expect(s.data).toEqual({ a: { b: { c1: 'foo', c2: 'foo' } } })
    expect(s.metadata).toMatchSnapshot()
  })
  it('runs at initialization time with input from namesapce field initializers', () => {
    // prettier-ignore
    const s = S.create<{ a: { b1?: string } }, { a: { b2: string } }>({
        fields: { a: {
          map(input, ctx) { return {b2:input.b1} },
          fields: { b1: { initial: c('foo')} }
        }}
      })
    expect(s.data).toEqual({ a: { b1: 'foo', b2: 'foo' } })
    expect(s.metadata).toMatchSnapshot()
  })
  it('runs at initialization time with input from namespace and field initializers', () => {
    // prettier-ignore
    const s = S.create<{ a: { b?: { c1:string, d1?:string }  } }, { a: { b: { c2: string, d2: string} } }>({
        fields: { a: { fields: { b: {
          initial(){ return { c1:'c1-foo'} },
          map(input, ctx) { return { c2: input.c1, d2: input.d1 } },
          fields: { c1: {}, d1: { initial: c('d1-foo') } }
        }}}}
      })
    expect(s.data).toEqual({ a: { b: { c1: 'c1-foo', c2: 'c1-foo', d1: 'd1-foo', d2: 'd1-foo' } } })
    expect(s.metadata).toMatchSnapshot()
  })
})

describe('map on non-root namespace', () => {
  it.todo('gracefully errors when unexpected error')
  it('when input is not in data it is statically unavailable in data but actually present there at runtime', () => {
    // prettier-ignore
    const s = S.create<{ a: { b1: string } }, { a: { b2: string } }>({
        fields: { a: {
          map(input, ctx) { return {b2:'bar'} },
          fields: { b1: {} }
        }}
      })
    expect(s.change({ a: { b1: 'foo' } }).data).toEqual({ a: { b1: 'foo', b2: 'bar' } })
  })
  it('input param (1st) is the normalized input (e.g. shorthands are expanded)', () => {
    const map = jest.fn().mockImplementation((input, ctx) => {
      return { b: Number(input.b) }
    })

    // prettier-ignore
    const s = S.create<{ a: string | { b: string } }, { a: { b: number } }>({
      fields: { a: {
        map,
        shorthand(s) { return {b:s} },
        fields: { b: {} } } }
    })
    expect(s.change({ a: '1' }).data).toEqual({ a: { b: 1 } })
    expect(map.mock.calls).toMatchSnapshot()
  })
  it('context param (2nd) contains path prop', () => {
    // prettier-ignore
    const s = S.create<{ a: { b: string } }, { a: { b: {path:string[]} } }>({
        fields: { a: {
          map(input, ctx) { tst.assertTrue<tst.Equals<{path:string[]}, typeof ctx>>(); return {b:ctx} },
          fields: { b: {} } } }
      })
    expect(s.change({ a: { b: 'ignore' } }).data).toEqual({ a: { b: { path: ['__root__', 'a'] } } })
  })
})
