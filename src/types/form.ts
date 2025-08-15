import {UseFormReturn} from "react-hook-form";

export type FormInputProps = {
  form: UseFormReturn<any>;
  item: {
    name: string;
    label: string;
    placeholder?: string;
    description?: string;
  };
  disabled?: boolean;
  className?: string;
}

export type FormNumberProps = {
  form: UseFormReturn<any>;
  item: {
    name: string;
    label: string;
    placeholder?: string;
    description?: string;
    prefix?: string;
    suffix?: string;
    precision?: number;
  };
  disabled?: boolean;
  className?: string;
}

export type FormPasswordProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
    readonly?: boolean
  };
  disabled?: boolean
  className?: string
}

export type FormTextAreaProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
    minRows?: number
    maxRows?: number
    readonly?: boolean
  };
  disabled?: boolean
  className?: string
}

export type FormSelectProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
    selectLabel?: string
    options: Array<{ label: string, value: string }>
  };
  disabled?: boolean
  className?: string
}

export type FormComboboxProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
    selectLabel?: string
    searchPlaceholder?: string
    options: Array<{ label: string, value: string }>
    readonly?: boolean
  };
  disabled?: boolean
  className?: string
}

export type FormMultiSelectProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
    selectLabel?: string
    searchPlaceholder?: string
    maxCount?: number
    options: Array<{ label: string, value: string }>
  };
  disabled?: boolean
  className?: string
}

export type FormDatePickerProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
  };
  disabled?: boolean
  className?: string
}

export type FormDateRangePickerProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
    from?: Date
    to?: Date
  };
  disabled?: boolean
}

export type FormUploadProps = {
  form: UseFormReturn<any>;
  item: {
    name: string
    label: string
    placeholder?: string
    description?: string
    readonly?: boolean,
    maxFiles: number,
    maxSize: number
  };
  disabled?: boolean
  className?: string
}