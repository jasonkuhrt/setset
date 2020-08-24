import * as Lo from 'lodash'
import { inspect } from 'util'
import {
  appendPath,
  isNamespaceSpecifier,
  isRecordSpecifier,
  renderPath,
  Specifier,
  SpecifierNamespace,
  TraversalInfo,
} from './settings'

/**
 * Validate the spec for basic invariants.
 */
export function validateSpecifier(specifier: Specifier, info: TraversalInfo) {
  if (isNamespaceSpecifier(specifier)) {
    if (specifier.map !== undefined && typeof specifier.map !== 'function') {
      let message = ''
      if (info.path.length === 1) message += 'Root mapper was invalid.'
      else message += `Mapper for setting specifier at path "${renderPath(info)}" was invalid.`
      // prettier-ignore
      message  += ` Mappers must be functions. Got: ${inspect(specifier.map)}`
      throw new Error(message)
    }

    Lo.forOwn(specifier.fields, (fieldSpecifier: Specifier, fieldName: string) => {
      validateSpecifier(fieldSpecifier, appendPath(info, fieldName))
    })

    return
  }

  if (isRecordSpecifier(specifier)) {
    validateSpecifier(specifier.entry as SpecifierNamespace, info)
    return
  }
}
