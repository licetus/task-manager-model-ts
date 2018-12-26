import { makeConstructor } from '@restify-ts/errors'

const normalize = (name: string) => {
  if (!name.endsWith('Error')) {
    return `${name}Error`
  }
  return name
}

class ErrorManager {
  private locales: any
  private message: string

  constructor(error: { name: string, message?: string }) {
    const lang = require('../config/config.json').locales
    this.locales = require(`./locale.${lang}.json`)
    if (error.message) {
      this.message = error.message
    } else {
      const name = error.name.slice(0, -5)
      this.message = this.locales[name]
    }
  }

  public register = (errors: any ) => {
    Object.keys(errors).forEach((key) => {
      const config = errors[key]
      const errorName = normalize(key)
      let err
      switch (typeof config) {
        case 'number':
          err = makeConstructor(errorName, {
            statusCode: config,
          })
          break
        case 'object':
          err = makeConstructor(errorName, config)
          break
        default:
          throw new Error(`Invalid error config for ${errorName}`)
      }
      Object.assign({
      })
    })
  }
}