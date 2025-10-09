'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useFieldValidation } from '@/lib/validation';
import { ValidationRule } from '@/lib/validation';

// Form field wrapper component
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

// Form label component
interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

export function FormLabel({
  children,
  htmlFor,
  required,
  className,
}: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
    >
      {children}
      {required && <span className='text-destructive ml-1'>*</span>}
    </label>
  );
}

// Form error message component
interface FormErrorMessageProps {
  children: React.ReactNode;
  className?: string;
}

export function FormErrorMessage({
  children,
  className,
}: FormErrorMessageProps) {
  if (!children) return null;

  return (
    <p className={cn('text-sm text-destructive', className)}>{children}</p>
  );
}

// Form description component
interface FormDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function FormDescription({ children, className }: FormDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  );
}

// Validated input component
interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  validation?: ValidationRule;
  validateOnChange?: boolean;
  error?: string;
  required?: boolean;
}

export function ValidatedInput({
  label,
  description,
  validation,
  validateOnChange = true,
  error: externalError,
  required,
  className,
  id,
  ...props
}: ValidatedInputProps) {
  const fieldId = React.useMemo(
    () => id || `input-${Math.random().toString(36).substr(2, 9)}`,
    [id]
  );

  const {
    error: validationError,
    touched,
    validate,
    isValid,
  } = useFieldValidation(
    fieldId,
    props.value || '',
    validation || {},
    validateOnChange
  );

  const error = externalError || validationError;
  const hasError = touched && error;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (validation) {
      validate();
    }
    props.onBlur?.(e);
  };

  return (
    <FormField>
      {label && (
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
      )}
      {description && <FormDescription>{description}</FormDescription>}
      <input
        id={fieldId}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
        onBlur={handleBlur}
      />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormField>
  );
}

// Validated textarea component
interface ValidatedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  validation?: ValidationRule;
  validateOnChange?: boolean;
  error?: string;
  required?: boolean;
}

export function ValidatedTextarea({
  label,
  description,
  validation,
  validateOnChange = true,
  error: externalError,
  required,
  className,
  id,
  ...props
}: ValidatedTextareaProps) {
  const fieldId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const {
    error: validationError,
    touched,
    validate,
    isValid,
  } = useFieldValidation(
    fieldId,
    props.value || '',
    validation || {},
    validateOnChange
  );

  const error = externalError || validationError;
  const hasError = touched && error;

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (validation) {
      validate();
    }
    props.onBlur?.(e);
  };

  return (
    <FormField>
      {label && (
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
      )}
      {description && <FormDescription>{description}</FormDescription>}
      <textarea
        id={fieldId}
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
        onBlur={handleBlur}
      />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormField>
  );
}

// Validated select component
interface ValidatedSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  description?: string;
  validation?: ValidationRule;
  validateOnChange?: boolean;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export function ValidatedSelect({
  label,
  description,
  validation,
  validateOnChange = true,
  error: externalError,
  required,
  options,
  placeholder,
  className,
  id,
  ...props
}: ValidatedSelectProps) {
  const fieldId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const {
    error: validationError,
    touched,
    validate,
    isValid,
  } = useFieldValidation(
    fieldId,
    props.value || '',
    validation || {},
    validateOnChange
  );

  const error = externalError || validationError;
  const hasError = touched && error;

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    if (validation) {
      validate();
    }
    props.onBlur?.(e);
  };

  return (
    <FormField>
      {label && (
        <FormLabel htmlFor={fieldId} required={required}>
          {label}
        </FormLabel>
      )}
      {description && <FormDescription>{description}</FormDescription>}
      <select
        id={fieldId}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          hasError && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
        onBlur={handleBlur}
      >
        {placeholder && (
          <option value='' disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormField>
  );
}

// Form group component
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

// Form actions component
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>{children}</div>
  );
}
