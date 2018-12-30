export const error: any = require('restify-errors')

const normalize = (name: string) => {
  if (!name.endsWith('Error')) {
    return `${name}Error`
  }
  return name
}

error.lang = (error: { name: string, message?: string }) => {
  const locale = require('../config/config.json').locales || 'en-US'
  const locales = require(`./locale.${locale}.json`)
  if (error.message) {
    return error.message
  } else {
    const name = error.name.slice(0, -5)
    return locales[name]
  }
}

error.register = (errors: any) => {
  Object.keys(errors).forEach((key) => {
    const config = errors[key]
    const errorName = normalize(key)
    switch (typeof config) {
      case 'number':
        error[errorName] = error.makeConstructor(errorName, {
          statusCode: config,
        })
        break
      case 'object':
        error[errorName] = error.makeConstructor(errorName, config)
        break
      default:
        throw new Error(`Invalid error config for ${errorName}`)
    }
  })
}
