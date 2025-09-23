import 'dotenv/config'
import { API } from 'api'
import { TestKit } from '../testkit.js'
import { test1 } from './test1.js'

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

