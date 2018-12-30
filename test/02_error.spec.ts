import { error } from '../src/errors'


describe('* Error =======================', () => {
  const ERRORS = {
    Test: 400,
  }
  it('create error', () => {
    error.register(ERRORS)
    error.should.have.property('TestError')
  })
  it('throw error', () => {
    // process.env.NODE_LOCALES = 'zh-cn'
    const m = error.lang({
      name: 'TestError'
    })
    const e = new error.TestError(m)
    e.name.should.equal('TestError')
    switch (process.env.NODE_LOCALES) {
      case 'zh-cn':
        e.message.should.equal('这是一个测试用异常')
        break
      case 'en-US':
        e.message.should.equal('This is a test error.')
    }
    const f = function() {
      throw e
    }
    f.should.Throw()
  })
})