import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

/**
 * Example of a Database Transaction Pattern.
 * Ensures that multiple DB operations either all succeed or all fail together (Atomicity).
 */

@Injectable()
export class TransactionService {
  constructor(private dataSource: DataSource) {}

  async transferFunds(fromUserId: number, toUserId: number, amount: number) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Deduct from sender
      await queryRunner.manager.decrement('User', { id: fromUserId }, 'balance', amount);

      // 2. Add to receiver
      await queryRunner.manager.increment('User', { id: toUserId }, 'balance', amount);

      // 3. Log the transaction
      await queryRunner.manager.insert('AuditLog', { fromUserId, toUserId, amount });

      // If all good, commit
      await queryRunner.commitTransaction();
    } catch (err) {
      // Since it failed, rollback ALL changes made in this transaction
      console.error('Transaction failed. Rolling back...', err.message);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Release the connection back to the pool
      await queryRunner.release();
    }
  }
}
