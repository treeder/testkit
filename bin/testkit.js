#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

let pargs = process.argv
console.log(pargs)

let command = 'run' // default
let args = pargs.slice(2)
const options = {}
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const [key, value] = args[i].slice(2).split('=')
    options[key] = value || true
    args.splice(i, 1)
    i--
  }
}

console.log('options:', options)
if (args.length > 0) {
  command = args[0]
  args = args.slice(1)
}
console.log('command:', command)
console.log('args:', args)

switch (command) {
  case 'run':
    await run(args, options)
    break
  default:
    await run(args, options)
}

export async function run(args, options) {
  console.log('running testkit...', args)

  let cmd = `start-server-and-test start ${options.port} test`
  let proc = exec(cmd)
  proc.stdout.pipe(process.stdout)
  proc.stderr.pipe(process.stderr)
  proc.on('close', (code) => {
    console.log(`AAA child process exited with code ${code}`)
  })
  proc.on('error', (err) => {
    console.log(`AAA child process error: ${err}`)
  })
  let promises = []
  promises.push(
    new Promise((resolve, reject) => {
      proc.on('close', (code) => {
        console.log(`child process exited with code ${code}`)
        resolve()
      })
    }),
  )
  promises.push(
    new Promise((resolve, reject) => {
      proc.on('error', (err) => {
        console.log(`child process error: ${err}`)
        reject(err)
      })
    }),
  )
  await Promise.all(promises)
}
