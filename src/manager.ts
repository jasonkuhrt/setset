import * as Logger from '@nexus/logger'
import { forEach, values } from 'lodash'
import { InferDataFromInput, MetadataState } from '.'
import {
  commitNamespace,
  createInfo,
  dataFromMetadata,
  FixupInfo,
  initialize,
  isNamespaceSpecifier,
  isRecordSpecifier,
  normalize,
} from './settings'
import { validateSpecifier } from './spec-validation'
import { Spec, UserInput } from './static'
import { isDevelopment, PlainObject } from './utils'

const log = Logger.log.child('settings')

/**
 * todo
 */
export type Manager<Input extends PlainObject, Data extends PlainObject> = {
  reset(): Manager<Input, Data>
  change(input: UserInput<Input>): Manager<Input, Data>
  original(): Data
  metadata: MetadataState<Data>
  data: Data
}

export type Options = {
  /**
   * Handle fixup events.
   *
   * If your settings spec has no fixups then you can ignore this option.
   *
   * By default, fixups are logged at warning level. If you provide your own
   * function then this default behaviour will be disabled. You can retain it by
   * calling the default function passed as a second argument to your function.
   */
  onFixup?: (info: FixupInfo, originalHandler: (info: FixupInfo) => void) => void
}

function treeifySpec(dec: any, parent: any) {
  dec.parent = parent
  if (isNamespaceSpecifier(dec)) {
    forEach(values(dec.fields), (v: any) => {
      treeifySpec(v, dec)
    })
    return dec
  }
  if (isRecordSpecifier(dec)) {
    treeifySpec(dec.entry, dec)
    return dec
  }
  return dec
}

/**
 *
 */
export function create<Input extends PlainObject, Data extends PlainObject = InferDataFromInput<Input>>(
  specDec: Spec<Input, Data> & Options
): Manager<Input, Data> {
  log.debug('construct')
  const info = createInfo()

  const spec = treeifySpec(specDec, '__ROOT__')

  if (isDevelopment()) {
    validateSpecifier(spec, info)
  }

  // todo we currently have to clone the given spec deeply because mapEntryData mutations the spec with shadow specifiers
  // and shodow specifiers currently break the second+ initialize run (e.g. during reset)

  const initial = initialize(spec, info)
  const state = {
    data: initial.data as Data,
    original: (undefined as any) as Data, // lazy
    metadata: initial.metadata as any, // Metadata<Data>,
  }

  const api: Manager<Input, Data> = {
    data: state.data,
    metadata: state.metadata,
    change(input) {
      log.debug('change', { input })
      const newData = normalize(spec, 'change', spec, input, state.data, state.metadata, info)
      commitNamespace(spec, 'change', newData, state.data, state.metadata, info)
      return api
    },
    reset() {
      log.debug('reset')
      const initial = initialize(spec, info)
      api.data = state.data = initial.data as any
      api.metadata = state.metadata = initial.metadata as any
      return api
    },
    original() {
      log.debug('get original')
      const original = state.original ?? dataFromMetadata(state.metadata, {})
      return original
    },
  }

  return api
}
