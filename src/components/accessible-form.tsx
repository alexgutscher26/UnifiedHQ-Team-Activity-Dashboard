'use client';

import React, { forwardRef, useId } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useAriaLiveAnnouncer } from '@/hooks/use-accessibility';

interface AccessibleFormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  label,
  description,
  error,
  required,
  children,
  className,
}) => {
  const id = useId();
  const descriptionId = useId();
  const errorId = useId();

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={id}
        className={cn(
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {label}
      </Label>
      {description && (
        <p id={descriptionId} className='text-sm text-muted-foreground'>
          {description}
        </p>
      )}
      {React.cloneElement(
        children as React.ReactElement,
        {
          id,
          'aria-describedby': cn(
            description && descriptionId,
            error && errorId
          ),
          'aria-invalid': !!error,
          'aria-required': required,
        } as any
      )}
      {error && (
        <p id={errorId} className='text-sm text-red-500' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  announceOnChange?: boolean;
}

export const AccessibleInput = forwardRef<
  HTMLInputElement,
  AccessibleInputProps
>(
  (
    {
      label,
      description,
      error,
      required,
      announceOnChange,
      onChange,
      ...props
    },
    ref
  ) => {
    const { announce } = useAriaLiveAnnouncer();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (announceOnChange) {
        announce(`Input changed to: ${event.target.value}`);
      }
      onChange?.(event);
    };

    return (
      <AccessibleFormField
        label={label}
        description={description}
        error={error}
        required={required}
      >
        <Input ref={ref} onChange={handleChange} {...props} />
      </AccessibleFormField>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

interface AccessibleTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  announceOnChange?: boolean;
}

export const AccessibleTextarea = forwardRef<
  HTMLTextAreaElement,
  AccessibleTextareaProps
>(
  (
    {
      label,
      description,
      error,
      required,
      announceOnChange,
      onChange,
      ...props
    },
    ref
  ) => {
    const { announce } = useAriaLiveAnnouncer();

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (announceOnChange) {
        announce(`Textarea changed to: ${event.target.value}`);
      }
      onChange?.(event);
    };

    return (
      <AccessibleFormField
        label={label}
        description={description}
        error={error}
        required={required}
      >
        <Textarea ref={ref} onChange={handleChange} {...props} />
      </AccessibleFormField>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

interface AccessibleSelectProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  announceOnChange?: boolean;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  label,
  description,
  error,
  required,
  options,
  value,
  onValueChange,
  placeholder,
  announceOnChange,
}) => {
  const { announce } = useAriaLiveAnnouncer();
  const id = useId();
  const descriptionId = useId();
  const errorId = useId();

  const handleValueChange = (newValue: string) => {
    if (announceOnChange) {
      const selectedOption = options.find(option => option.value === newValue);
      announce(`Selected: ${selectedOption?.label || newValue}`);
    }
    onValueChange?.(newValue);
  };

  return (
    <AccessibleFormField
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger
          aria-describedby={cn(description && descriptionId, error && errorId)}
          aria-invalid={!!error}
          aria-required={required}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </AccessibleFormField>
  );
};

interface AccessibleCheckboxProps {
  label: string;
  description?: string;
  error?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
  announceOnChange?: boolean;
}

export const AccessibleCheckbox: React.FC<AccessibleCheckboxProps> = ({
  label,
  description,
  error,
  checked,
  onCheckedChange,
  required,
  announceOnChange,
}) => {
  const { announce } = useAriaLiveAnnouncer();
  const id = useId();
  const descriptionId = useId();
  const errorId = useId();

  const handleCheckedChange = (newChecked: boolean) => {
    if (announceOnChange) {
      announce(`${label} ${newChecked ? 'checked' : 'unchecked'}`);
    }
    onCheckedChange?.(newChecked);
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center space-x-2'>
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          aria-describedby={cn(description && descriptionId, error && errorId)}
          aria-invalid={!!error}
          aria-required={required}
        />
        <Label
          htmlFor={id}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            required && 'after:content-["*"] after:text-red-500 after:ml-1'
          )}
        >
          {label}
        </Label>
      </div>
      {description && (
        <p id={descriptionId} className='text-sm text-muted-foreground'>
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className='text-sm text-red-500' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleRadioGroupProps {
  label: string;
  description?: string;
  error?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  value?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  announceOnChange?: boolean;
}

export const AccessibleRadioGroup: React.FC<AccessibleRadioGroupProps> = ({
  label,
  description,
  error,
  options,
  value,
  onValueChange,
  required,
  announceOnChange,
}) => {
  const { announce } = useAriaLiveAnnouncer();
  const id = useId();
  const descriptionId = useId();
  const errorId = useId();

  const handleValueChange = (newValue: string) => {
    if (announceOnChange) {
      const selectedOption = options.find(option => option.value === newValue);
      announce(`Selected: ${selectedOption?.label || newValue}`);
    }
    onValueChange?.(newValue);
  };

  return (
    <div className='space-y-2'>
      <fieldset>
        <legend className='text-sm font-medium leading-none'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </legend>
        {description && (
          <p id={descriptionId} className='text-sm text-muted-foreground mt-1'>
            {description}
          </p>
        )}
        <RadioGroup
          value={value}
          onValueChange={handleValueChange}
          aria-describedby={cn(description && descriptionId, error && errorId)}
          aria-invalid={!!error}
          aria-required={required}
          className='mt-2'
        >
          {options.map(option => (
            <div key={option.value} className='flex items-center space-x-2'>
              <RadioGroupItem
                value={option.value}
                id={`${id}-${option.value}`}
                disabled={option.disabled}
              />
              <Label htmlFor={`${id}-${option.value}`} className='text-sm'>
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {error && (
          <p id={errorId} className='text-sm text-red-500 mt-1' role='alert'>
            {error}
          </p>
        )}
      </fieldset>
    </div>
  );
};

interface AccessibleSwitchProps {
  label: string;
  description?: string;
  error?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
  announceOnChange?: boolean;
}

export const AccessibleSwitch: React.FC<AccessibleSwitchProps> = ({
  label,
  description,
  error,
  checked,
  onCheckedChange,
  required,
  announceOnChange,
}) => {
  const { announce } = useAriaLiveAnnouncer();
  const id = useId();
  const descriptionId = useId();
  const errorId = useId();

  const handleCheckedChange = (newChecked: boolean) => {
    if (announceOnChange) {
      announce(`${label} ${newChecked ? 'enabled' : 'disabled'}`);
    }
    onCheckedChange?.(newChecked);
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center space-x-2'>
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          aria-describedby={cn(description && descriptionId, error && errorId)}
          aria-invalid={!!error}
          aria-required={required}
        />
        <Label
          htmlFor={id}
          className={cn(
            'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            required && 'after:content-["*"] after:text-red-500 after:ml-1'
          )}
        >
          {label}
        </Label>
      </div>
      {description && (
        <p id={descriptionId} className='text-sm text-muted-foreground'>
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className='text-sm text-red-500' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleSliderProps {
  label: string;
  description?: string;
  error?: string;
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  announceOnChange?: boolean;
}

export const AccessibleSlider: React.FC<AccessibleSliderProps> = ({
  label,
  description,
  error,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  required,
  announceOnChange,
}) => {
  const { announce } = useAriaLiveAnnouncer();
  const id = useId();
  const descriptionId = useId();
  const errorId = useId();

  const handleValueChange = (newValue: number[]) => {
    if (announceOnChange) {
      announce(`Slider value changed to: ${newValue[0]}`);
    }
    onValueChange?.(newValue);
  };

  return (
    <div className='space-y-2'>
      <Label
        htmlFor={id}
        className={cn(
          'text-sm font-medium leading-none',
          required && 'after:content-["*"] after:text-red-500 after:ml-1'
        )}
      >
        {label}
      </Label>
      {description && (
        <p id={descriptionId} className='text-sm text-muted-foreground'>
          {description}
        </p>
      )}
      <Slider
        id={id}
        value={value}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        aria-describedby={cn(description && descriptionId, error && errorId)}
        aria-invalid={!!error}
        aria-required={required}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value?.[0] || min}
        className='w-full'
      />
      {value && (
        <div className='text-sm text-muted-foreground'>
          Current value: {value[0]}
        </div>
      )}
      {error && (
        <p id={errorId} className='text-sm text-red-500' role='alert'>
          {error}
        </p>
      )}
    </div>
  );
};
