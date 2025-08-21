
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
    for (const test of this.tests) {
      await test(this.c)
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