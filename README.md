# testkit

The simplest API testing kit.

## Motivation

Most testing frameworks are complicated, old, not ESM, etc. I just wanted something super simple that is easy to get started, lets you do anything you want without jumping through hoops, and gets
out of your way.

## Getting started

```sh
npm install --save-dev treeder/testkit
```

Then write simple tests like this:

```js
export async function test1(c) {
  let r = await c.api.fetch(`/`)
  console.log('r:', r)
  assert(r.message == 'hello world!', 'not hello world!')
}
```

Then add tests to TestKit and run:

```js
import { TestKit } from 'testkit'
import { test1 } from './test1.js'

// create context:
let c = {
  env: process.env,
}
// create TestKit
let testKit = new TestKit(c, [test1])
// run
await testKit.run()
```

See full example with auth headers and what not that you can copy and paste at [test/test.js](test/test.js)

### Running tests

In your package.json, make sure you have your standard "start" script which starts your server.

And a "test" line that starts your tests.

Then add a "testkit" one:

```json
"scripts": {
  "start": "npm run build && npx -y wrangler dev --env dev",
  "test": "node test/test.js",
  "testkit": "npx -y treeder/testkit --port=8787"
},
```

Then run:

```sh
npm run testkit
```

Add `npm run testkit` to your CI and if it passes, you're good. If it fails, don't merge!

### Passing data through the tests

Tests run in the order you define them in the array you pass to `new TestKit()`.

If your test returns an object, that object will be merged into the context under a `data` field that you can access in subsequent tests.

Test 1:

```js
export async function test1(c) {
  let myObject = {name: 'john'}
  return { myObject }
}
```

That return data will be available in any subsequest test.  

```js
export async function test2(c) {
  console.log(c.data.myObject)
}
```

## To run examples in this repository.

Clone the repo and run:

```sh
npm run testkit
```
