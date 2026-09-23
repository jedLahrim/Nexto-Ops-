import { DataSource, EntityTarget, FindManyOptions, Repository } from 'typeorm';

/**
 * Example of a Generic Repository Pattern.
 * This abstracts data access logic, making it easier to swap DBs or mock data for testing.
 */

export abstract class BaseRepository<T> {
  protected repository: Repository<T>;

  constructor(
    protected readonly entity: EntityTarget<T>,
    protected readonly dataSource: DataSource,
  ) {
    this.repository = this.dataSource.getRepository(entity);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findById(id: string) {
    // return this.repository.findOneBy({ id });
  }

  async create(data: any): Promise<any> {
    const item = this.repository.create(data);
    return this.repository.save(item);
  }

  async update(id: any, data: any): Promise<void> {
    await this.repository.update(id, data);
  }

  async delete(id: any): Promise<void> {
    await this.repository.delete(id);
  }
}
