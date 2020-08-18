import * as Logger from '@nexus/logger'
import * as Lo from 'lodash'
import { DataDefault, MetadataState, Spec } from '.'
import { commit, createInfo, dataFromMetadata, FixupInfo, initialize, resolve } from './settings'
import { validateSpecifier } from './spec-validation'
import { isDevelopment, PlainObject } from './utils'

const log = Logger.log.child('settings')

/**
 * todo
 */
export type Manager<Input extends PlainObject, Data extends PlainObject> = {
  reset(): Manager<Input, Data>
  change(input: Input): Manager<Input, Data>
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

/**
 *
 */
export function create<Input extends PlainObject, Data extends PlainObject = DataDefault<Input>>({
  fields,
  ...options
}: {
  fields: Spec<Input, Data>
} & Options): Manager<Input, Data> {
  log.debug('construct')
  const info = createInfo()

  if (isDevelopment()) {
    validateSpecifier({ fields }, info)
  }

  // todo we currently have to clone the given spec deeply because mapEntryData mutations the spec with shadow specifiers
  // and shodow specifiers currently break the second+ initialize run (e.g. during reset)
  // todo we didn't catch this yet with own unit test, but other nexus unit tets caught the issue

  const initial = initialize({ fields: Lo.cloneDeep(fields) }, info)
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
      const newData = resolve(options, 'change', { fields }, input, state.data, state.metadata, info)
      commit({ fields: Lo.cloneDeep(fields) }, 'change', newData, state.data, state.metadata)
      return api
    },
    reset() {
      log.debug('reset')
      const initial = initialize({ fields: Lo.cloneDeep(fields) }, info)
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
