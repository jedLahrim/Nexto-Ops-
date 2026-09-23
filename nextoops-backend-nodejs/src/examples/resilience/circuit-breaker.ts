import * as CircuitBreaker from 'opossum';

/**
 * Example of a Circuit Breaker using Opossum.
 * It prevents an app from repeatedly trying to execute an operation that's likely to fail,
 * giving the failing service time to recover.
 */

async function unreliableServiceCall() {
  if (Math.random() > 0.7) throw new Error('Third party service down');
  return 'Data from remote service';
}

const options = {
  timeout: 3000, // If the task takes more than 3s, fail it
  errorThresholdPercentage: 50, // Critical error rate before opening the circuit
  resetTimeout: 10000, // After 10s, try again (half-open state)
};

const breaker = new CircuitBreaker(unreliableServiceCall, options);

breaker.fallback(() => 'Sorry, the service is currently unavailable. Returning cached data.');

export async function executeWithResilience() {
  try {
    const result = await breaker.fire();
    console.log(result);
  } catch (err) {
    console.error('Circuit open or failed:', err.message);
  }
}

breaker.on('open', () => console.warn('--- CIRCUIT OPENED ---'));
breaker.on('close', () => console.info('--- CIRCUIT CLOSED ---'));
