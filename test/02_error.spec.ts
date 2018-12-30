import errors from '../src/errors'


describe('* Error =======================', () => {
  const ERRORS = {
    Test: 400,
  }
  errors.register(ERRORS)

  it('create error', () => {
    errors.should.have.property('TestError')
  })
  it('throw error', () => {
    // process.env.NODE_LOCALES = 'zh-cn'
    const m = errors.lang({
      name: 'TestError'
    })
    const t = new errors.TestError(m)
    t.name.should.equal('TestError')
    switch (process.env.NODE_LOCALES) {
      case 'zh-cn':
        t.message.should.equal('这是一个测试用异常')
        break
      case 'en-US':
        t.message.should.equal('This is a test error.')
    }
    const f = function() {
      throw t
    }
    f.should.Throw()
  })
})