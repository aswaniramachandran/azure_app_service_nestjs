import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

interface SearchQuery {
  search?: string;
}

export function applySearch<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query: SearchQuery,
  fields: string[],
) {
  const text = query.search?.trim();

  if (!text) {
    return;
  }

  text
    .split(/\s+/)
    .filter(Boolean)
    .forEach((term, index) => {
      const key = `searchTerm${index}`;

      const escaped = term.replace(/[\\%_]/g, '\\$&');

      const conditions = fields
        .map(
          (field) =>
            `CAST(${field} AS TEXT) ILIKE :${key}`,
        )
        .join(' OR ');

      qb.andWhere(`(${conditions})`, {
        [key]: `%${escaped}%`,
      });
    });
}