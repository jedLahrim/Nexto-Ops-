import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Column,
  DataSource,
  Entity,
  OptimisticLockVersionMismatchError,
  PrimaryGeneratedColumn,
  Repository,
  VersionColumn,
} from 'typeorm';
import { rethrow } from '@nestjs/core/helpers/rethrow';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stock: number;

  @VersionColumn()
  version: number; // For Optimistic Locking
}

@Injectable()
export class TransactionsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // 1. Pessimistic Locking (Row-level lock)
  async purchaseWithPessimisticLock(id: number, quantity: number) {
    return await this.dataSource.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id: id },
        lock: { mode: 'pessimistic_write' }, // SELECT ... FOR UPDATE
      });

      if (product.stock >= quantity) {
        product.stock -= quantity;
        await manager.save(product);
      } else {
        throw new ConflictException('Out of stock');
      }
    });
  }

  // 2. Optimistic Concurrency Control
  async purchaseWithOptimisticLock(id: number, quantity: number, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const product = await this.productRepository.findOneBy({ id });

        if (product.stock < quantity) {
          rethrow(new ConflictException('Out of stock'));
        }

        product.stock -= quantity;
        await this.productRepository.save(product); // throws on version mismatch
        return; // success
      } catch (err) {
        const isLastAttempt = attempt === retries - 1;
        if (err instanceof OptimisticLockVersionMismatchError && !isLastAttempt) {
          continue; // re-fetch and retry
        }
        throw err; // rethrow ConflictException or final attempt failure
      }
    }
  }
}
