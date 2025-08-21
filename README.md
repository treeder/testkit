# testkit

The simplest API testing kit. 

## Motivation

Most testing frameworks are using complicated, old, not ESM, etc. I just wanted something super simple that is easy to get started, lets you do anything you want without jumping through hoops, and gets
out of your way. 

## Getting started

```sh
npm install treeder/testkit
```

Then write simple tests like this:

```js
async function test1(c) {
  let r = await c.api.fetch(`/`)
  console.log('r:', r)
  assert(r.message == 'hello world!', 'not hello world!')
}
```

Then add tests to TestKit and run:

```js
// create context:
let c = {
  env: process.env,
}
// create TestKit
let testKit = new TestKit(c,
  [test1]
)
// run
await testKit.run()
```

See full example with auth headers and what not that you can copy and paste at [test/test.js](test/test.js)

## Running tests

In your package.json, make a "start-server" in scripts that will start the API server.

Then also add a "test" and "ci" line like below.

```json
"scripts": {
  "start-server": "npm run build && npx wrangler dev --env dev",
  "test": "node test/test.js",
  "ci": "start-server-and-test start-server 8787 test"
},
```

Then just run:

```sh
npm run ci
```

And add that line `npm run ci` to your CI and what not. 

## To run examples

```sh
npm install
npm run ci
```
