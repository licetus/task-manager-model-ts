import { makeConstructor } from 'restify-errors'

class Errors {
  public localization: { [errorName: string]: string }
  [errorName: string]: any

  constructor() {
    const locales = require('../config/config.json').locales || 'en-US'
    this.localization = require(`./locale.${locales}.json`)
  }

  private normalize = (name: string) => {
    if (!name.endsWith('Error')) {
      return `${name}Error`
    }
    return name
  }

  public lang = (error: { name: string, message?: string }) => {
    if (error.message) {
      return error.message
    } else {
      const name = error.name.slice(0, -5)
      return this.localization[name]
    }
  }
  public register = (errors: any) => {
    Object.keys(errors).forEach((key) => {
      const config = errors[key]
      const errorName = this.normalize(key)
      switch (typeof config) {
        case 'number':
          this[errorName] = makeConstructor(errorName, {
            statusCode: config,
          })
          break
        case 'object':
          this[errorName] = makeConstructor(errorName, config)
          break
        default:
          throw new Error(`Invalid error config for ${errorName}`)
      }
    })
  }
}

const errors = new Errors()
export default errors



