import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface QueryFilter {
  field: string;
  operator:
    | '='
    | '!='
    | '>'
    | '>='
    | '<'
    | '<='
    | 'ILIKE';
  value: any;
}

export function applyFilters<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  filters: QueryFilter[],
) {
  filters.forEach((filter, index) => {
    const parameter = `filter_${index}`;

    qb.andWhere(
      `${filter.field} ${filter.operator} :${parameter}`,
      {
        [parameter]: filter.value,
      },
    );
  });
}