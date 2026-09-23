/**
 * Example of an Exponential Backoff Retry pattern.
 * When a request fails, it waits longer after each successive failure before trying again.
 */

export async function retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
): Promise<T> {
    let attempt = 1;

    while (attempt <= maxAttempts) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }

            console.warn(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);

            // Wait for delay
            await new Promise(res => setTimeout(res, delay));

            // Double the delay for the next attempt (exponential)
            delay *= 2;
            attempt++;
        }
    }

    throw new Error('Retry logic failed to execute'); // Should not reach here
}

// Usage Example
async function fetchConfig() {
    // Logic...
}

// retry(() => fetchConfig(), 5, 500);
