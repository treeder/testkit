#!/usr/bin/env node
import fs from 'fs/promises'
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
async function waitForUrl(url, timeout = 60000) {
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
  // console.log(pargs)

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

  // console.log('options:', options)
  if (args.length > 0) {
    command = args[0]
    args = args.slice(1)
  }
  // console.log('command:', command)
  // console.log('args:', args)

  let err = null
  switch (command) {
    case 'run':
      err = await run2(args, options)
      break
    default:
      err = await run2(args, options)
  }
  process.exit(err ? 1 : 0)
}

async function run2(args, options) {
  let serverProcess = null

  let serverCommand = `npm`
  let serverArgs = ['run', 'run']

  try {
    const pkg = JSON.parse(await fs.readFile('./package.json', 'utf8'))
    if (pkg?.scripts?.['run:test']) {
      serverArgs = ['run', 'run:test']
    }
  } catch (err) {
    // ignore
  }

  let serverURL = `http://localhost:${options.port}`
  let secondCommand = `npm`
  let secondArgs = ['run', 'test:run']

  let err = null

  try {
    // 1. Start the first process (the server)
    console.log('🚀 Starting server process...')
    serverProcess = spawn(serverCommand, serverArgs, {
      detached: true,
    })
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
    err = error
  } finally {
    // 4. Once the second process is done (or if an error occurred), shut down the first process
    if (serverProcess) {
      await gracefulShutdown(serverProcess, 5000, 'SIGTERM', true)
    }
  }
  return err
}

/**
 * Gracefully shuts down a child process.
 * * 1. Sends a termination signal (default: SIGTERM).
 * 2. Waits for the process to exit.
 * 3. If the process is still running after the timeout, sends SIGKILL.
 *
 * @param {import('child_process').ChildProcess} childProcess - The process to kill
 * @param {number} timeoutMs - Time to wait before forcing kill (default 5000ms)
 * @param {string} signal - The initial signal to send (default 'SIGTERM')
 * @param {boolean} detached - Whether the process was spawned as detached (group leader)
 * @returns {Promise<boolean>} - Resolves true if exited gracefully, false if forced
 */
async function gracefulShutdown(childProcess, timeoutMs = 5000, signal = 'SIGTERM', detached = false) {
  // 1. If process is already dead, return immediately
  if (childProcess.exitCode !== null || childProcess.signalCode !== null) {
    return true
  }

  // 2. Create the exit promise
  const exitPromise = new Promise((resolve) => {
    // If the process exits, we are done
    childProcess.once('exit', () => resolve(true))
  })

  // 3. Create the timeout promise
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve(false), timeoutMs)
  })

  // 4. Send the initial signal
  console.log(`Sending ${signal} to process ${childProcess.pid}...`)
  if (detached) {
    try {
      process.kill(-childProcess.pid, signal)
    } catch (e) {
      // Fallback for Windows or if process group killing fails
      childProcess.kill(signal)
    }
  } else {
    childProcess.kill(signal)
  }

  // 5. Race: Did it exit, or did we time out?
  const exitedGracefully = await Promise.race([exitPromise, timeoutPromise])

  if (exitedGracefully) {
    console.log(`Process ${childProcess.pid} shut down gracefully.`)
    return true
  } else {
    console.warn(`Process ${childProcess.pid} timed out. Sending SIGKILL...`)
    if (detached) {
      try {
        process.kill(-childProcess.pid, 'SIGKILL')
      } catch (e) {
        // Fallback for Windows or if process group killing fails
        childProcess.kill('SIGKILL')
      }
    } else {
      childProcess.kill('SIGKILL')
    }
    // Optionally wait for the final exit event just to be clean
    await exitPromise
    return false
  }
}

await main()
console.log('✅ Testkit finished.')
