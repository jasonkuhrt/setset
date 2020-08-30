/**
 * This module only deals with the type level (no term level)
 * It contains the rich conditional type system powering the settings library.
 */

import { Primitive } from 'type-fest'
import {
  ExcludeUndefined,
  IncludesPlainObjectOrInterface,
  IncludesRecord,
  IsEqual,
  IsRecord,
  KeepOptionalKeys,
  KeepRequiredKeys,
  Lookup,
  OnlyPlainObjectOrInterface,
  PlainObject,
} from './utils'

// todo implement context
type BaseContext = { path: string[] }

export type Spec<Input, Data> = NamespaceSpec<Input, Data, {}>

export type InferDataFromInput<Input> = {
  [K in keyof Input]-?: Input[K] extends Leaf
    ? ExcludeUndefined<Input[K]['type']>
    : IncludesPlainObjectOrInterface<Input[K]> extends true
    ? InferDataFromInput<OnlyPlainObjectOrInterface<Input[K]>>
    : ExcludeUndefined<Input[K]>
}

export type UserInput<Input> = UnwrapSyntheticLeavesDeeply<Input, true>

export type KeysWhereNotPresentOrRequiredInData<Input, Data> = {
  [K in keyof Input]: K extends keyof Data ? (undefined extends Data[K] ? never : K) : K
}[keyof Input]

type KeysWhereNotPresentOrOptionalInData<Input, Data> = {
  [K in keyof Input]: K extends keyof Data ? (undefined extends Data[K] ? K : never) : K
}[keyof Input]

type NO_DATA_MATCH = 'NO_DATA_MATCH'

type Node<Input, Data, Key, LocalContext> = Lookup<Input, Key> extends Leaf
  ? LeafSpec<Lookup<Input, Key>['type'], Lookup<Data, Key>>
  : IncludesRecord<Lookup<Input, Key>> extends true
  ? RecordSpec<Lookup<Input, Key>, Lookup<Data, Key>>
  : IncludesPlainObjectOrInterface<Lookup<Input, Key>> extends true
  ? NamespaceSpec<Lookup<Input, Key>, Lookup<Data, Key, NO_DATA_MATCH>, LocalContext>
  : LeafSpec<Lookup<Input, Key>, Lookup<Data, Key>>

/**
 * Namespace Utils
 */

export type ExcludeShorthand<T> = Exclude<OnlyPlainObjectOrInterface<T>, Leaf>

type NormalizeNamespaceInput<Input, Data> = NormalizeNamespaceInputFieldsOptionalityWithDataFieldsOptionality<
  ExcludeShorthand<Input>,
  Data
>

type NormalizeNamespaceInputFieldsOptionalityWithDataFieldsOptionality<Input, Data> =
  // input optional + data optional = input optional
  // input optional + data required = input required
  // input optional + no data       = input required
  // input required + *             = input required
  // prettier-ignore
  (InputKeysWhereOptionalAndInDataToo<Input,Data> extends never ? {} : Pick<Input, InputKeysWhereOptionalAndInDataToo<Input,Data>>) &
  (Required<Omit<Input, InputKeysWhereOptionalAndInDataToo<Input,Data>>>)

type InputKeysWhereOptionalAndInDataToo<Input, Data> = {
  [K in keyof Input]: K extends keyof Data
    ? undefined extends Input[K]
      ? undefined extends Data[K]
        ? K
        : never
      : never
    : never
}[keyof Input]

export type GetNamespaceDataWhereDivergingFromInput<Input, Data> = Pick<
  ExcludeUndefined<Data>,
  GetNamespaceDataKeysWhereDivergingFromInput<
    ExcludeShorthand<ExcludeUndefined<Input>>,
    ExcludeUndefined<Data>
  >
>

export type GetNamespaceDataKeysWhereDivergingFromInput<Input, Data> = {
  [K in keyof Data]: K extends keyof Input
    ? IsNamespaceInputFieldEqualDataField<Data[K], Input[K]> extends true
      ? never
      : K
    : K
}[keyof Data]

// optionality differences does not count in determinining diverging
type IsNamespaceInputFieldEqualDataField<InputField, DataField> = IsEqual<
  ExcludeUndefined<InputField>,
  ExcludeUndefined<DataField>
>

export type OmitNamespaceKeys<T> = {
  [K in keyof T]: IsRecord<ExcludeUndefined<T[K]>> extends true
    ? never
    : HasNamespace<ExcludeUndefined<T[K]>> extends true
    ? never
    : T[K]
}

type HasNamespace<T> = OnlyNamespace<T> extends never ? false : true

export type IsNamespaceInputEqualData<Input, Data> = IsEqual<
  Required<OmitNamespaceKeys<UnwrapSyntheticLeavesDeeply<ExcludeShorthand<Input>>>>,
  Required<OmitNamespaceKeys<ExcludeUndefined<Data>>>
>

type OnlyNamespace<T> = T extends Function
  ? never
  : T extends RegExp
  ? never
  : T extends Date
  ? never
  : T extends any[]
  ? never
  : T extends Leaf
  ? never
  : T extends Primitive
  ? never
  : IsRecord<T> extends true
  ? never
  : T

type OnlyShorthand<T> = UnwrapSyntheticLeaf<ExcludeUndefined<Exclude<T, OnlyNamespace<T>>>>

//prettier-ignore
export type NamespaceSpec<Input, Data, LocalContext> =
  {
    fields: NamespaceFields<ExcludeShorthand<Input>, Data>
  } &
  // todo jsdoc 1) when namespace has no matching data key then developer is responsible
  // todo to map the data tree over _somehow_. Impossible to know how, so return type is
  // todo any possible data. This logic is arbitrary and not guaranteed to work. You should
  // todo unit test it!
  (
    Data extends NO_DATA_MATCH
    ? {}  // something already diverged higher up in the hierarchy, then nothing to do here
    : IsNamespaceInputEqualData<Input, Data> extends true
    // ? { i: Input, d: Data, eq: IsNamespaceInputEqualData<Input, Data> }
    ? {} 
    : { map(normalizedInput: NormalizeNamespaceInput<Input, ExcludeUndefined<Data>>, context: BaseContext & LocalContext): GetNamespaceDataWhereDivergingFromInput<Input, Data> }
  ) &
  /**
   * If namespace is union with non-pojo type then shorthand required 
   */
  (
    OnlyShorthand<Input> extends never
    ? {  }
    : {
        shorthand: Shorthand<OnlyShorthand<Input>, UnwrapSyntheticLeavesDeeply<ExcludeShorthand<Input>>>
      }
  ) &
  /**
   * If namespace is optional AND 1+ sub inputs are required THEN initializer required 
   *  ... if no data match THEN still required
   *  ... but if data optional THEN initial is forbidden (since we'll initialize namespace (data) to undefined)
   *  ... but if all namespace fields (input) are optional THEN initial is forbidden (b/c we can automate
   *      namespace (data) with namespace (input) field initializers)
   */
  (
    undefined extends Input
      ? {} extends KeepOptionalKeys<Input>
        ? {}
        : undefined extends Data
          ? { initial?(): KeepRequiredKeys<Exclude<Input, undefined>> }
          : { initial():  KeepRequiredKeys<Exclude<Input, undefined>> }
      : {}
  )

/**
 * todo
 */
// prettier-ignore
export type NamespaceFields<Input, Data> =
  (
    KeysWhereNotPresentOrOptionalInData<Input, Data> extends never
      ? {}
      : { [Key in KeysWhereNotPresentOrOptionalInData<Input, Data>]+?: Node<Input,Data,Key, {}> }
  ) &
  (
    KeysWhereNotPresentOrRequiredInData<Input, Data> extends never
      ? {}
      : { [Key in KeysWhereNotPresentOrRequiredInData<Input, Data>]-?: Node<Input,Data,Key, {}> }
  )

/**
 * todo: currently assumes Record<string, object>
 */
// prettier-ignore
// todo how does no data match affect this?
export type RecordSpec<Input, Data> =
  (
    {
      /**
       * Specify the settings input for each entry in the record.
       */
      // todo how does no data match affect this?
      entry: Node<
        OnlyPlainObjectOrInterface<ExcludeUndefined<Input>>,
        Data,
        string,
        {
          /**
           * The name under which this entry shows up in the reocrd.
           */
          key: string
        }
      >
    }
  ) &
    /**
     * if input is optional then initial is required
     * unless all
     */
    (
      undefined extends Input
      ? {
          /**
           * Initialize the record with some entries. By default the record will be an empty object.
           */
          initial?(): ExcludeUndefined<Input>
        }
      : {
          /**
           * Initialize the record with some entries. Although you require users to input a record, your initializer will still be run too, if provided.
           */
          initial?(): ExcludeUndefined<Input>
        }
    )

// [1]
// If the field can be undefined it means that initial is not required.
// In most cases it probably means initial won't be supplied. However
// there are may be some odd cases where iniital is present but can
// return undefined.
// prettier-ignore
export type LeafSpec<Input, Data> =
  {
    validate?: Validate<ExcludeUndefined<Input>>
    /**
     * Specify a fixup for this setting.
     *
     * A "fixup" corrects minor problems in a
     * given setting. It also provides a human readable message about what was
     * done and why.
     *
     * Return null if no fixup was needed. Return a fixup object
     * otherwise. The new value should be returned along with a list of one or
     * more messages, one for each thing that was fixed.
     */
    fixup?: Fixup<ExcludeUndefined<Input>>
  } &
  /**
   * if input is optional then initial is required
   * if input is optional and no matching data key then initial is required
   * if input is optional and matching data key optional then initial is optional
   */
  (
    undefined extends Input
      ? undefined extends Data
        ? { initial?(): Input }
        : { initial(): ExcludeUndefined<Input> }
      : {}
  )

/**
 * Isolated Types
 */

export type Validate<Input = Primitive> = (value: Input) => null | { reasons: string[] }

//todo support no messages
export type Fixup<Input = Primitive> = (input: Input) => null | { value: Input; messages?: string[] }

export type MapType<Input = Primitive, Return = Primitive> = (input: Input) => Return

export type Shorthand<Input = Primitive, Return = PlainObject> = (input: Input) => Return

/**
 * Synthetic Leaves
 */

export type Leaf<T = any> = { __settingKind: 'Leaf'; type: T }

export type AlreadyNativeTypeError = 'Error: You wrapped Leaf<> around this field type but Setset already considers it a leaf.'

export type NativeLeaf = Primitive | Date | RegExp

export type UnwrapSyntheticLeavesDeeply<T, CheckUselessWraps extends boolean = false> = {
  [K in keyof T]: T[K] extends Leaf
    ? UnwrapSyntheticLeaf<T[K], CheckUselessWraps>
    : HasNamespace<T[K]> extends true
    ? UnwrapSyntheticLeavesDeeply<T[K]>
    : T[K]
}

export type UnwrapSyntheticLeaf<T, CheckUselessWraps extends boolean = false> = T extends Leaf
  ? CheckUselessWraps extends true
    ? T['type'] extends NativeLeaf
      ? AlreadyNativeTypeError
      : T['type']
    : T['type']
  : T
