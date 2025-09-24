#!/usr/bin/env node
import { exec } from 'child_process'
import { waitForServer } from './wait.js'
import { spawn } from 'child_process'

/**
 * Spawns a child process and returns a Promise that resolves when the process exits.
 * @param {string} command The command to run.
 * @param {string[]} args The arguments for the command.
 * @returns {Promise<number>} A promise that resolves with the process's exit code.
 */
function spawnProcess(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      // 'inherit' pipes the child process's output to the parent's console
      stdio: 'inherit',
    })
    // proc.stdout.pipe(process.stdout)
    // proc.stderr.pipe(process.stderr)

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Process exited with code ${code}`))
      }
    })

    proc.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * Repeatedly tries to fetch a URL until it succeeds or times out.
 * @param {string} url The URL to check.
 * @param {number} timeout The maximum time to wait in milliseconds.
 * @returns {Promise<void>} A promise that resolves when the URL is accessible.
 */
async function waitForUrl(url, timeout = 30000) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        console.log(`✅ URL ${url} is up and running!`)
        return // Success!
      }
    } catch (error) {
      // This is expected if the server isn't ready yet (e.g., connection refused)
    }
    // Wait for a short period before retrying
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timeout: URL ${url} was not available within ${timeout / 1000} seconds.`)
}

/**
 * Main function to orchestrate the process.
 */
async function main() {
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
      await run2(args, options)
      break
    default:
      await run2(args, options)
  }
}

async function run2(args, options) {
  let serverProcess = null

  let serverCommand = `npm`
  let serverArgs = ['start']
  let serverURL = `http://localhost:${options.port}`
  let secondCommand = `npm`
  let secondArgs = ['run', 'test']

  try {
    // 1. Start the first process (the server)
    console.log('🚀 Starting server process...')
    serverProcess = spawn(serverCommand, serverArgs)
    serverProcess.stdout.pipe(process.stdout)
    serverProcess.stderr.pipe(process.stderr)

    // Handle server process errors
    serverProcess.on('error', (err) => {
      console.error('Failed to start server process:', err)
      process.exit(1) // Exit if the server can't even start
    })

    // 2. Wait for it to start by checking the URL
    await waitForUrl(serverURL)

    // 3. Run the second process and wait for it to finish
    console.log('\n🏃 Running tests...')
    await spawnProcess(secondCommand, secondArgs)
    // console.log('✅ Second process finished.')
  } catch (error) {
    console.error('❌ An error occurred:', error.message)
  } finally {
    // 4. Once the second process is done (or if an error occurred), shut down the first process
    if (serverProcess) {
      console.log('\n shutting down server process...')
      serverProcess.kill('SIGTERM') // Send a termination signal
    }
  }
}

await main()
