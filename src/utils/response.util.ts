interface ResponseQuery {
  page?: number;
  limit?: number;
}

export function createPaginationResponse<T>(
  data: T[],
  total: number,
  query: ResponseQuery,
  sortBy?: string,
  sortOrder?: string,
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

  const totalPages = Math.ceil(
    total / limit,
  );

  return {
    data,

    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },

    sort: {
      sortBy,
      sortOrder,
    },
  };
}