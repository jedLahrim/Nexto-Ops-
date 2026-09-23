/**
 * Example of the Saga Pattern (Choreography-based).
 * Handles distributed transactions across microservices with compensating actions.
 */

export class OrderSaga {

    async createOrder(id: string) {
        try {
            // 1. Reserve Stock (Microservice A)
            console.log('Step 1: Reserving stock...');
            await this.reserveStock(id);

            // 2. Process Payment (Microservice B)
            console.log('Step 2: Processing payment...');
            try {
                await this.chargeCard(id);
            } catch (err) {
                console.error('Payment failed! Initiating compensation...');
                // COMPENSATING ACTION for Step 1
                await this.releaseStock(id);
                throw new Error('Order aborted: Payment failed');
            }

            // 3. Finalize
            console.log('Step 3: Order completed.');
        } catch (err) {
            console.error(err.message);
        }
    }

    // Mocked actions
    private async reserveStock(id: string) { return true; }
    private async chargeCard(id: string) { throw new Error('Declined'); }
    private async releaseStock(id: string) { console.log('COMPENSATION: Stock released.'); }
}
