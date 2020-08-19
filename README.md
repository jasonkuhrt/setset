# setset

Powerful Incremental Type-driven Settings Engine.

![trunk](https://github.com/prisma-labs/project-lib-typescript/workflows/trunk/badge.svg)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Overview](#overview)
- [Guide](#guide)
  - [About Leaves, Namespaces & Records](#about-leaves-namespaces--records)
  - [Input vs Data](#input-vs-data)
  - [API Overview](#api-overview)
    - [.create](#create)
    - [.data](#data)
    - [.change()](#change)
    - [.reset()](#reset)
    - [.metadata](#metadata)
    - [.original](#original)
  - [Working With Leaves](#working-with-leaves)
    - [Initializers](#initializers)
    - [Fixups](#fixups)
    - [Validators](#validators)
    - [Type mappers](#type-mappers)
    - [Data mappers](#data-mappers)
  - [Working With Namespaces](#working-with-namespaces)
    - [Initializers](#initializers-1)
    - [Data Mappers](#data-mappers)
    - [Shorthands](#shorthands)
  - [Working With Records](#working-with-records)
    - [Initializers](#initializers-2)
    - [Data Mappers](#data-mappers-1)
  - [Reciepes](#reciepes)
    - [One-Off Config](#one-off-config)
- [Roadmap](#roadmap)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Overview

Setset is a generic TS library for managing settings. It technically works with JS but is designed to be used with TS as you will see below. Here is an overview of its features:

- API to incrementally change settings
- Settings can be simple leaf values like scalars or instances of built in classes (Date, RegExp, ...)
- Settings can be namespaces containing more settings
- Settings can be records containing more settings
- Setting namespaces can have shorthand values that expand into a some set of fields within the namespace
- Distinction between settings input (what is given) and settings data (what is stored)
- Metadata that tracks the initial value of each setting
- Metadata that tracks the source of the current value of each setting

Setset is designed with the following workflow in mind:

1. Firstly, you are building some kind of library or framework that has settings that you want your users to be able to control.
1. You define a TS type representing the input your users will be able to give to configure the settings of your tool.
   ```ts
   type Input = {
     /**
      * Documentation for this setting... (and assume the rest have docs too!)
      */
     foo?: number
     bar?: string
     qux?:
       | boolean
       | {
           a?: 'Alpha' | 'Bravo'
           b?: boolean
         }
   }
   ```
   It is desirable to define `Input` manually (as opposed to relying on e.g. inference) because this way you can write jsDoc. This is important. It can help save your users a trip to the website/README/etc.
1. You feed this TS type to the type variable in `Setset.create` and based on the resulting inference implement your settings in a type-safe way.

   ```ts
   import * as Setset from 'setset'

   const settings = Sestset.create<Input>({
     // The implementation below is type-safe, with nuanced
     // requirements that match however you have designed
     // your Input type.
     fields: {
       foo: {
         initial: () => 1
       },
       bar: {
         initial: () => '?'
       },
       qux: {
         shorthand: (b) => ({ b })
         fields: {
           a: {
             initial: () => 'Bravo'
           },
           b: {
             initial: () => false
           }
         }
       }
     }
   })
   ```

1. `Setset.create` returns a settings _manager_. You expose this API to your users however you want. Maybe the whole api but maybe only a part of it, wrapped, whatever.
   ```ts
   settings.data // { foo: 1, bar: '?', qux: { a: 'Bravo', b: false }}
   settings.change({ foo: 2 })
   settings.data.foo // { foo: 2 }
   settings.metadata.fields.foo.value // 2
   settings.metadata.fields.foo.initial // 1
   ```

<br/>

## Guide

Setset has three categories of settings: leaf, namespace, and record.

### About Leaves, Namespaces & Records

Leaf settings are terminal points in your settings. When a leaf is changed it overwrites whatever the value was previously.

Namespace settings contain additional settings. Namespaces are useful to provide logical grouping to help users navigate and understand your settings. As you would expect changes to namespaced fields _merge_ with the previous state of the namespace.

Record settings look similar to namespace settings but there are two differences. First, instead of _fields_ we say it has _keys_ and _keys_ are dynamic because they are semantically part of the data. Second, values are of a single type. We refer to a pair of key and value as an _entry_. Records are useful as an alternative to arrays when keying by one of the member properties makes sense. Doing so enforces uniqueness and allows your users to take advantage of the incremental change API (chagnes to entries merge with previous entry state, if any).

### Input vs Data

Setset makes a distinction between settings _input_ and settings _data_. Input is what users give but data is what is stored. Usually settings input is not 1:1 with the data. Here are some reasons:

1. _Generally_ you should want your input to be optional (zero config philosophy) but your data to be required (avoid scattering fallbacks across codebase). For example an optional setting that falls back to a default if the user doesn't give a value. The input is optional but the data is guaranteed to have either the user input or the default.
2. You want to be able to pass shorthands to namespaces. For example a boolean to toggle a feature quickly, but an object to configure it deeply if needed. The data only contains the object representation. The shorthand only lives at the input level.
3. You want to expose some settings that map to another tool in a different way than that tools represents them. Maybe you want to hardcode some of the tools' settings. Or maybe you want an abstract the tool's settings altogether. These are data mapping problems and you could certainly solve them in a different part of your codebase, but Setset can encapsulate this concern for you _if/when you want_.

The difference between input and data is modeled via type generics on the `Setset.create` constructor.

```ts
type Input = { a?: string }
type Data = { a: string }
const settings = Setset.create<Input, Data>(...)
```

Because the pattern of optional input with required data is so common it is the default. You can construct your settings with just the input type and Setset will infer a data type where all settings fields (recursively) are required. So for example the above could be rewritten like so and mean the same thing:

```ts
type Input = { a?: string }
const settings = Setset.create<Input>(...)
```

### API Overview

#### .create

Invoke `.create()` to create a new settings instance. There are two type parameters, one required, one optional. The first is `Input` which types the shape of the input your settings will accept in the `.change(...)` instance method. The second is `Data` which types the shape of the settings data in `.data` instane property. `Data` type parameter is _optional_. By default it is inferred from the `Input` parameter using the following transformations:

1. All fields become required
2. All namespaces have their shorthands removed

Then you must supply the actual implementation. Implementing the settings is a core aspect of using Setset. Each kind of setting (leaf, namespace, record) is documented in its own guide below. The implementation includes things like field initializers and shorthands.

```ts
const settings = Setset.create<{ a?: 1 }>({ fields: { a: { initial: () => 0 } } })
```

#### .data

The `.data` property contains the current state of the settings. This property's value will mutated when `.change()` is invoked. The type of `.data` is the `Data` type variable (generic) passed (or inferred when not passed) to `Setset.create<Input, Data>`.

```ts
const settings = Setset.create<{ a?: 1 }>({ fields: { a: { initial: () => 0 } } })
settings.data.a // 0
```

#### .change()

Invoke `.change()` to change the current state of settings. The type of the input parameter is the `Input` type variable (generic) passed to `Sestset.create<Input>`. Invocations will mutate the `.metadata` and `.data` properties.

```ts
const settings = Setset.create<{ a?: 1 }>({ fields: { a: { initial: () => 0 } } })
settings.data.a // 0
settings.change({ a: 1 })
settings.data.a // 1
```

#### .reset()

Invoke `.reset()` to reset the state of `.data` and `.metadata` on the current settings instance.

```ts
import * as Assert from 'assert'

const settings = Setset.create<{ a?: 1 }>({ fields: { a: { initial: () => 0 } } })
settings.change({ a: 1 })
settings.reset()
Assert.deepEqual(
  setters.data,
  Setset.create<{ a?: 1 }>({ fields: { a: { initial: () => 0 } } })
)
```

#### .metadata

The `.metadata` property conatins a representation of the `.data` with additonal information about the state:

- What was the initial value of a leaf or record?
- How was the current value of a leaf or record set? `initial` means by the initializer (aka. default). `change` means by an invocation to `.change()`.

```ts
const settings = Setset.create<{ a?: 1 }>({ fields: { a: { initial: () => 0 } } })
settings.metadata // { type: "leaf", value: 0, from: 'initial', initial: 0 }
settings.change({ a: 1 })
settings.metadata // { type: "leaf", value: 1, from: 'change', initial: 0 }
```

#### .original

The `.original` property contains a representation of the `.data` as it was just after the instane was first constructed. This is a convenience property derived from the more complex `.metadata` property.

### Working With Leaves

Leaves are the building block of settings. They are terminal points representing a concrete setting. This is in contrast to namespaces or records which contain more settings within.

All JS scalar types are considered leaf settings as are instances of a well known classes like `Date` or `RegExp`.

```ts
type Input = { foo: string; bar: RegExp; qux: Date }

const settings = Setset.create<Input>({ fields: { foo: {}, bar: {}, qux: {} } })

settings.change({ foo: 'bar', bar: /.../, qux: new Date() })
```

You can force Setset to treat anything as a leaf by wrapping it within the `Leaf` type. These are called _synthetic leves_. For example here is how Setset reacts to a [Moment](https://momentjs.com/) instance by default. It treats it as a namespace and expects all the methods on the Moment class to be implemented as settings.

```ts
import * as Moment from 'moment'

type Input = { startOn: Moment }

const settings = Setset.create<Input>({ fields: { startOn: { fields: {} } } })
```

```
Type '{}' is missing the following properties from type '...': format, startOf, endOf, add, and 78 more
```

Now here it is fixed via the `Leaf` type. Notice that the types in `.change()` and `.data` only deal with `Moment` types like you would expect (`Leaf` has been stripped).

```ts
import * as Moment from 'moment'

type Input = { startOn: Setset.Leaf<Moment> }

const settings = Setset.create<Input>({ fields: { startOn: {} } })

settings.change({ startOn: Moment.utc() })
settings.data.startOn.format()
```

If you try to apply `Leaf` to a type Setset already considers a leaf natively you'll get a nice little string literal error message. Example:

```ts
type Input = { foo: Setset.Leaf<string> }

const settings = Setset.create<Input>({ fields: { foo: {} } })

settings.change({
  // Setset makes the type of `foo` be literally this string literal
  foo: 'Error: You wrapped Leaf<> around this field type but Setset already considers it a leaf.',
})
```

#### Initializers

#### Fixups

#### Validators

#### Type mappers

#### Data mappers

### Working With Namespaces

#### Initializers

#### Data Mappers

#### Shorthands

### Working With Records

#### Initializers

#### Data Mappers

### Reciepes

#### One-Off Config

You aren't forced to leverage the incremental API of Setset. If you just want classical one-time constructor with Setset benefits like automatic environment variable consumption (future feature), you can use Setset like so:

```ts
import * as Setset from 'setset'

type Input = { ... }

class {
  constructor(input: Input) {
    const settings = Setset.create<Input>({...}).change(options).data
  }
}
```

<br/>

## Roadmap

- [] allow env vars to populate settings
- [] track env vars as a source of the current value
- [] \$initial magic var to reset settting to its original state (re-running initializers)
- [] dev mode that runs initial through fixup and validation
- [] benchmarks
