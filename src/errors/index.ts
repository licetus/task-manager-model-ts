export const errors: any = require('restify-errors')

const normalize = (name: string) => {
  if (!name.endsWith('Error')) {
    return `${name}Error`
  }
  return name
}

errors.lang = (error: { name: string, message?: string }) => {
  const locale = process.env.NODE_LOCALES || 'en-US'
  const locales = require(`./locale.${locale}.json`)
  if (error.message) {
    return error.message
  } else {
    const name = error.name.slice(0, -5)
    return locales[name]
  }
}

errors.register = (errors: any) => {
  Object.keys(errors).forEach((key) => {
    const config = errors[key]
    const errorName = normalize(key)
    switch (typeof config) {
      case 'number':
        errors[errorName] = errors.makeConstructor(errorName, {
          statusCode: config,
        })
        break
      case 'object':
        errors[errorName] = errors.makeConstructor(errorName, config)
        break
      default:
        throw new Error(`Invalid error config for ${errorName}`)
    }
  })
}
