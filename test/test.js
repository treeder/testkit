import 'dotenv/config'
import { API } from 'api'
import { assert, TestKit } from '../testkit.js'

// Write test functions or import tests from other files
async function test1(c) {
  let r = await c.api.fetch(`/`)
  console.log('r:', r)
  assert(r.message == 'hello world!', 'not hello world!')
}

// Create the context for your tests, include anything the need to run
let apiURL = 'http://localhost:8787'
let api = new API({
  apiURL,
  // set any auth headers and things here
  headers: {
    Authorization: `apiKey ${process.env.API_KEY}`
  }
})

let c = {
  api,
  env: process.env,
}

let testKit = new TestKit(c,
  [test1]
)
await testKit.run()

