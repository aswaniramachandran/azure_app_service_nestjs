import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

interface SortQuery {
  sortBy?: string;
  sortOrder?: string;
}

export function applySort<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query: SortQuery,
  allowedColumns: Record<string, string>,
) {
  const sortBy =
    query.sortBy && allowedColumns[query.sortBy]
      ? query.sortBy
      : 'id';

  const sortOrder =
    query.sortOrder?.toLowerCase() === 'desc'
      ? 'DESC'
      : 'ASC';

  qb.orderBy(
    allowedColumns[sortBy],
    sortOrder,
  );

  return {
    sortBy,
    sortOrder,
  };
}