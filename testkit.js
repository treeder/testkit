
export class TestKit {

  /**
   * 
   * @param {*} c context
   * @param {*} tests array of test functions
   */
  constructor(c, tests) {
    this.c = c
    this.tests = tests
  }

  async run() {
    this.c.data ||= {}
    for (const test of this.tests) {
      let r = await test(this.c)
      // merge the results into a data field on the context so next tests can use the results
      if(isObject(r)){
              // asdfasdf
        this.c.data = {...this.c.data, ...r}
      }
    }
  }

}
// same as assert, but throws an error if assertion is false
export function assert(assertion, ...args) {
  console.assert(assertion, ...args)
  if (!assertion) {
    throw new Error(args.join(' '))
  }
}

function isObject(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}
