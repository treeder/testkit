import { assert } from '../testkit.js'

export async function test1(c) {
  let r = await c.api.fetch(`/`)
  console.log('r:', r)
  assert(r.message == 'hello world!', 'not hello world!')
}
