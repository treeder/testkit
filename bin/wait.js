/**
 * Continuously polls a URL with fetch until a 200 response is received.
 *
 * @param {string} url The URL to poll.
 * @param {object} [options] Optional parameters.
 * @param {number} [options.interval=2000] The interval in ms to wait between polls.
 * @returns {Promise<Response>} A promise that resolves with the successful response.
 */
export async function waitForServer(url, options = {}) {
  const { interval = 2000, retries = 30 } = options

  // A helper function to introduce a delay using a Promise [1.4.5]
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  let i = 0
  while (true) {
    i++
    if (i > retries) throw new Error('Retries exceeded')
    try {
      const response = await fetch(url)

      // Check if the response status is 200 OK [1.3.2]
      if (response.ok) {
        console.log('Server is up! Status:', response.status)
        return response
      } else {
        // Log other status codes if needed
        console.log(`Server responded with status: ${response.status}. Retrying...`)
        return response
      }
    } catch (error) {
      // This catches network errors, e.g., server not running
      console.log('Server not available. Retrying...')
    }

    // Wait for the specified interval before the next attempt [1.4.3]
    await delay(interval)
  }
}
