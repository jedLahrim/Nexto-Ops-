/**
 * Example of a Timeout Wrapper for Promises.
 * Ensures an operation does not hang indefinitely by throwing an error after a set time.
 */

export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
): Promise<T> {
    // Create a promise that rejects after X milliseconds
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(new Error(errorMessage));
        }, timeoutMs);
    });

    // Race the operation against the timeout
    return Promise.race([promise, timeout]);
}

// Usage Example
async function slowDatabaseQuery() {
    return new Promise(res => setTimeout(() => res('Query Result'), 5000));
}

// withTimeout(slowDatabaseQuery(), 2000)
//   .catch(err => console.error(err.message)); // 'Operation timed out'
