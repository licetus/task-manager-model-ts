const e: any = require('restify-errors')

enum locales {
  'zh-cn',
  'en-US',
}

const normalize = (name: string) => {
  if (!name.endsWith('Error')) {
    return `${name}Error`
  }
  return name
}

e.lang = (error: { name: string, message?: string }) => {
  const locale = process.env.NODE_LOCALES || 'en-US'
  const locales = require(`./locale.${locale}.json`)
  if (error.message) {
    return error.message
  } else {
    const name = error.name.slice(0, -5)
    return locales[name]
  }
}

e.register = (errors: any) => {
  Object.keys(errors).forEach((key) => {
    const config = errors[key]
    const errorName = normalize(key)
    switch (typeof config) {
      case 'number':
        e[errorName] = e.makeConstructor(errorName, {
          statusCode: config,
        })
        break
      case 'object':
        e[errorName] = e.makeConstructor(errorName, config)
        break
      default:
        throw new Error(`Invalid error config for ${errorName}`)
    }
  })
}

export default e