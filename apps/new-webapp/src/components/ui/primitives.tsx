'use client';

import {Dialog} from '@base-ui/react/dialog';
import {cva, type VariantProps} from 'class-variance-authority';
import {Eye, EyeOff, X} from 'lucide-react';
import {forwardRef, useId, useState} from 'react';
import {cn} from '@/utils/cn';

const buttonVariants = cva('button', {
  variants: {
    variant: {
      primary: 'button-primary',
      secondary: 'button-secondary',
      ghost: 'button-ghost',
      danger: 'button-danger',
    },
    size: {sm: 'button-sm', md: 'button-md', icon: 'button-icon'},
  },
  defaultVariants: {variant: 'primary', size: 'md'},
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {className, variant, size, type = 'button', ...props},
  ref,
) {
  return <button ref={ref} type={type} className={cn(buttonVariants({variant, size}), className)} {...props} />;
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(function IconButton(
  {className, size = 'icon', variant = 'ghost', ...props},
  ref,
) {
  return <Button ref={ref} className={className} size={size} variant={variant} {...props} />;
});

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, FieldProps>(function TextField(
  {label, hint, error, className, id, ...props},
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? (props.name ? `field-${props.name}` : generatedId);
  const descriptionId = hint || error ? `${inputId}-description` : undefined;
  return (
    <label className={cn('field', className)} htmlFor={inputId}>
      <span className="field-label">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={cn('input', error && 'input-error')}
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        aria-label={props['aria-label'] ?? label}
        {...props}
      />
      {(error || hint) && (
        <span id={descriptionId} className={cn('field-hint', error && 'field-error')}>
          {error ?? hint}
        </span>
      )}
    </label>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, Omit<FieldProps, 'type'>>(function PasswordField(
  {label, hint, error, className, id, ...props},
  ref,
) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? (props.name ? `field-${props.name}` : generatedId);
  const descriptionId = hint || error ? `${inputId}-description` : undefined;
  return (
    <div className={cn('field', className)}>
      <label className="field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="password-input">
        <input
          ref={ref}
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn('input', error && 'input-error')}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          aria-label={props['aria-label'] ?? label}
          {...props}
        />
        <IconButton
          className="password-toggle"
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLocaleLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(value => !value)}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </IconButton>
      </div>
      {(error || hint) && (
        <span id={descriptionId} className={cn('field-hint', error && 'field-error')}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
});

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  {label, hint, className, id, children, ...props},
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? (props.name ? `field-${props.name}` : generatedId);
  return (
    <label className={cn('field', className)} htmlFor={selectId}>
      <span className="field-label">{label}</span>
      <select ref={ref} id={selectId} className="input select" aria-label={props['aria-label'] ?? label} {...props}>
        {children}
      </select>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
});

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function ProgressBar({value, label}: {value: number; label: string}) {
  const boundedValue = Math.min(1, Math.max(0, value));
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(boundedValue * 100)}
      >
        <span
          className={cn('progress-value', value >= 1 && 'progress-danger')}
          style={{width: `${boundedValue * 100}%`}}
        />
      </div>
    </div>
  );
}

export function Tooltip({label, children}: {label: string; children: React.ReactNode}) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="tooltip-trigger"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="tooltip" role="tooltip">
          {label}
        </span>
      )}
    </span>
  );
}

export interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DialogShell({open, onOpenChange, title, description, children, footer}: DialogShellProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Popup className="dialog-popup">
          <div className="dialog-header">
            <div>
              <Dialog.Title className="dialog-title">{title}</Dialog.Title>
              {description && <Dialog.Description className="dialog-description">{description}</Dialog.Description>}
            </div>
            <Dialog.Close render={<IconButton aria-label="Close dialog" />}>
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="dialog-content">{children}</div>
          {footer && <div className="dialog-footer">{footer}</div>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  busy = false,
  onConfirm,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogShell
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void handleConfirm()}>
              {busy ? 'Working…' : confirmLabel}
            </Button>
          </>
        }
      >
        {children}
        <div className="danger-note">This action cannot be undone.</div>
      </DialogShell>
    </>
  );
}
