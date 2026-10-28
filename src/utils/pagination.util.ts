import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

interface PaginationQuery {
  page?: number;
  limit?: number;
}

export function applyPagination<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query: PaginationQuery,
) {
  const page = Math.max(
    1,
    query.page ?? 1,
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      query.limit ?? 10,
    ),
  );

  qb.skip((page - 1) * limit);
  qb.take(limit);

  return {
    page,
    limit,
  };
}