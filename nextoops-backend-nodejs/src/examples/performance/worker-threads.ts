import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

/**
 * Example of Worker Threads for CPU-intensive tasks.
 * Prevents blocking the main Node.js Event Loop.
 */

if (isMainThread) {
    // --- MAIN THREAD ---
    function runHeavyTask(data: any): Promise<any> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, { workerData: data });

            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }
} else {
    // --- WORKER THREAD ---
    const input = workerData;
    console.log('Worker thread started processing...');

    // Heavily compute complex logic (e.g., image processing, encryption)
    let result = 0;
    for (let i = 0; i < 1_000_000_000; i++) {
        result += i;
    }

    parentPort?.postMessage({ result, status: 'Completed' });
}
