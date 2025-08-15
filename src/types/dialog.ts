import React from "react";

export type ModalProps = {
  title: string;
  desc?: React.ReactNode;
  content?: React.ReactNode;
  textConfirm?: string;
  textCancel?: string;
  onConfirmClick?: () => void;
  onCancelClick?: () => void;
  modal?: boolean;
};

export type DialogModalProps = {
  modal?: ModalProps;
  onDismissOutside?: boolean;
  className?: string;
  classNameConfirm?: string;
  classNameCancel?: string;
  variantSubmit?: string;
};

export type ModalFormProps = {
  title: string;
  desc?: React.ReactNode;
  content: React.ReactElement;
  info?: React.ReactNode;
  textConfirm?: string;
  textCancel?: string;
  onConfirmClick: (body: Record<string, any>) => void;
  onCancelClick?: () => void;
  modal?: boolean;
  child?: any;
  defaultValue: Record<string, any>;
  schema: any;
};

export type DialogModalFormProps = {
  modal?: ModalFormProps;
  onDismissOutside?: boolean;
  className?: string;
  classNameConfirm?: string;
  classNameCancel?: string;
  variantSubmit?: string;
};