import { Repository } from 'typeorm';

/**
 * Example of Pagination strategies: Offset-based vs Cursor-based.
 */

export class PaginationService<T> {
    constructor(private repository: Repository<T>) { }

    // 1. Offset-based Pagination (Standard)
    // Good for simple UIs, but slow for large datasets because the DB has to skip rows.
    async paginateOffset(page: number = 1, limit: number = 10) {
        const [data, total] = await this.repository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { id: 'DESC' } as any,
        });

        return {
            data,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit),
            },
        };
    }

    // 2. Cursor-based Pagination (Performance Optimized)
    // Much faster for infinite scrolling. It uses the ID of the last item as the "cursor".
    async paginateCursor(cursor?: number, limit: number = 10) {
        const query = this.repository
            .createQueryBuilder('entity')
            .orderBy('entity.id', 'DESC')
            .limit(limit + 1); // Fetch one extra to see if there's a next page

        if (cursor) {
            query.where('entity.id < :cursor', { cursor });
        }

        const data = await query.getMany();
        const hasNextPage = data.length > limit;

        // Remove the extra item
        if (hasNextPage) data.pop();

        const nextCursor = hasNextPage ? data[data.length - 1]['id'] : null;

        return {
            data,
            meta: {
                nextCursor,
                hasNextPage,
            },
        };
    }
}
