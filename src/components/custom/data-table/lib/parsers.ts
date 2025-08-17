import { z } from "zod";
import { dataTableConfig } from "../config/data-table";
import type { ExtendedColumnFilter, ExtendedColumnSort } from "../types/data-table";

export type Parser<T> = {
  parse: (value: string) => T | null;
  serialize: (value: T) => string;
  eq?: (a: T, b: T) => boolean;
};

export const parseAsInteger: Parser<number> = {
  parse: (value) => {
    const int = parseInt(value, 10);
    return isNaN(int) ? null : int;
  },
  serialize: (value) => String(value),
};

export const parseAsString: Parser<string> = {
  parse: (value) => value,
  serialize: (value) => value,
};

export const parseAsArrayOf = (
  parser: Parser<any>,
  separator = ",",
): Parser<any[]> => ({
  parse: (value) => value.split(separator).map((item) => parser.parse(item)),
  serialize: (value) => value.map((item) => parser.serialize(item)).join(separator),
});


const sortingItemSchema = z.object({
  id: z.string(),
  desc: z.boolean(),
});

export const getSortingStateParser = <TData>(
  columnIds?: string[] | Set<string>,
): Parser<ExtendedColumnSort<TData>[]> => {
  const validKeys = columnIds
    ? columnIds instanceof Set
      ? columnIds
      : new Set(columnIds)
    : null;

  return {
    parse: (value) => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(sortingItemSchema).safeParse(parsed);

        if (!result.success) return null;

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as ExtendedColumnSort<TData>[];
      } catch {
        return null;
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (item, index) =>
          item.id === b[index]?.id && item.desc === b[index]?.desc,
      ),
  };
};

const filterItemSchema = z.object({
  id: z.string(),
  value: z.union([z.string(), z.array(z.string())]),
  variant: z.enum(dataTableConfig.filterVariants),
  operator: z.enum(dataTableConfig.operators),
  filterId: z.string(),
});

export type FilterItemSchema = z.infer<typeof filterItemSchema>;

export const getFiltersStateParser = <TData>(
  columnIds?: string[] | Set<string>,
): Parser<ExtendedColumnFilter<TData>[]> => {
  const validKeys = columnIds
    ? columnIds instanceof Set
      ? columnIds
      : new Set(columnIds)
    : null;

  return {
    parse: (value) => {
      try {
        const parsed = JSON.parse(value);
        const result = z.array(filterItemSchema).safeParse(parsed);

        if (!result.success) return null;

        if (validKeys && result.data.some((item) => !validKeys.has(item.id))) {
          return null;
        }

        return result.data as ExtendedColumnFilter<TData>[];
      } catch {
        return null;
      }
    },
    serialize: (value) => JSON.stringify(value),
    eq: (a, b) =>
      a.length === b.length &&
      a.every(
        (filter, index) =>
          filter.id === b[index]?.id &&
          filter.value === b[index]?.value &&
          filter.variant === b[index]?.variant &&
          filter.operator === b[index]?.operator,
      ),
  };
};