import { Column } from "@tanstack/react-table";

export interface ColumnMeta<TData> {
  label?: string;
  initialVisible?: boolean;
  disableHiding?: boolean;
  variant?: 'text' | 'number' | 'select' | 'date' | 'datetime-local' | 'time' | 'checkbox' | 'radio' | 'switch';
  placeholder?: string;
  unit?: string;
  options?: Array<{ label: string; value: string | number }>;
  // Add any other meta properties you need
}

export type ColumnWithMeta<TData> = Column<TData> & {
  columnDef: {
    meta?: ColumnMeta<TData>;
  };
};
