import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from './lib/utils';

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'error';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: ButtonTone;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
};

export const Button = ({
  children,
  className,
  tone = 'primary',
  size = 'md',
  icon: Icon,
  type = 'button',
  ...props
}: ButtonProps) => {
  return (
    <button
      className={cn('button', `button--${tone}`, `button--${size}`, className)}
      type={type}
      {...props}
    >
      {Icon ? <Icon size={16} /> : null}
      <span>{children}</span>
    </button>
  );
};

export const Badge = ({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: BadgeTone }>) => {
  return <span className={cn('badge', `badge--${tone}`)}>{children}</span>;
};

export const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) => {
  return (
    <div className="page-header">
      <div className="page-header__content">
        {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
};

export const SectionCard = ({
  title,
  subtitle,
  actions,
  children,
  className,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}>) => {
  return (
    <motion.section
      className={cn('section-card', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      {(title || subtitle || actions) && (
        <header className="section-card__header">
          <div className="section-card__heading">
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {actions ? <div className="section-card__actions">{actions}</div> : null}
        </header>
      )}
      <div className="section-card__body">{children}</div>
    </motion.section>
  );
};

export const StatCard = ({
  label,
  value,
  caption,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  caption?: string;
  tone?: BadgeTone;
}) => {
  return (
    <motion.article
      className={cn('stat-card', `stat-card--${tone}`)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {caption ? <p>{caption}</p> : null}
    </motion.article>
  );
};

export const Field = ({
  label,
  hint,
  error,
  children,
}: PropsWithChildren<{
  label?: string;
  hint?: string;
  error?: string;
}>) => {
  return (
    <label className="field">
      {label ? <span className="field__label">{label}</span> : null}
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
};

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return <input className={cn('input', className)} {...props} />;
};

export const Select = ({ className, children, ...props }: PropsWithChildren<SelectHTMLAttributes<HTMLSelectElement>>) => {
  return (
    <select className={cn('input', 'select', className)} {...props}>
      {children}
    </select>
  );
};

export const TextArea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  return <textarea className={cn('input', 'textarea', className)} {...props} />;
};

export const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <TriangleAlert size={18} />
      </div>
      <div className="empty-state__content">
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {action}
    </div>
  );
};

export const InlineMessage = ({
  tone = 'info',
  title,
  children,
}: PropsWithChildren<{
  tone?: BadgeTone;
  title: string;
}>) => {
  return (
    <div className={cn('inline-message', `inline-message--${tone}`)}>
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
};

export const LoadingState = ({ label = 'Loading…' }: { label?: string }) => (
  <div className="loading-state">
    <LoaderCircle className="spin" size={18} />
    <span>{label}</span>
  </div>
);

export const ToggleTabs = <T extends string>({
  value,
  onChange,
  items,
  variant = 'default',
}: {
  value: T;
  onChange: (value: T) => void;
  items: Array<{ value: T; label: string; count?: number }>;
  variant?: 'default' | 'navigation';
}) => {
  return (
    <div className={cn('toggle-tabs', variant === 'navigation' && 'toggle-tabs--navigation')}>
      {items.map((item) => (
        <button
          key={item.value}
          className={cn('toggle-tabs__item', value === item.value && 'toggle-tabs__item--active')}
          onClick={() => onChange(item.value)}
          type="button"
        >
          <span>{item.label}</span>
          {typeof item.count === 'number' ? <em>{item.count}</em> : null}
        </button>
      ))}
    </div>
  );
};

export const Pagination = ({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <Button tone="ghost" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} icon={ChevronLeft}>
        Back
      </Button>
      <span>
        Page {page} of {totalPages}
      </span>
      <Button
        tone="ghost"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        icon={ChevronRight}
      >
        Next
      </Button>
    </div>
  );
};

export const Drawer = ({
  open,
  title,
  subtitle,
  onClose,
  children,
}: PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
}>) => {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close"
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            type="button"
          />
          <motion.aside
            className="drawer"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.24 }}
          >
            <header className="drawer__header">
              <div>
                <h3>{title}</h3>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
              <Button tone="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </header>
            <div className="drawer__body">{children}</div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};
