import * as React from 'react';

import { cn } from '@/lib/utils';

type TableElementProps = React.TableHTMLAttributes<HTMLTableElement>;
type SectionProps = React.HTMLAttributes<HTMLTableSectionElement>;
type RowProps = React.HTMLAttributes<HTMLTableRowElement>;
type CellProps = React.ThHTMLAttributes<HTMLTableCellElement>;
type DataCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export const Table = React.forwardRef<HTMLTableElement, TableElementProps>(({ className, ...props }, ref) => {
  return (
    <div className="w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
});

Table.displayName = 'Table';

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => {
    return <caption ref={ref} className={cn('mt-4 text-sm text-[#6B7684]', className)} {...props} />;
  },
);

TableCaption.displayName = 'TableCaption';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, SectionProps>(({ className, ...props }, ref) => {
  return <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />;
});

TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, SectionProps>(({ className, ...props }, ref) => {
  return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
});

TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<HTMLTableSectionElement, SectionProps>(({ className, ...props }, ref) => {
  return <tfoot ref={ref} className={cn('border-t bg-[#F8FAFC] font-medium', className)} {...props} />;
});

TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef<HTMLTableRowElement, RowProps>(({ className, ...props }, ref) => {
  return <tr ref={ref} className={cn('border-b border-[#E5EAF0] transition-colors hover:bg-[#F8FAFC]', className)} {...props} />;
});

TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, CellProps>(({ className, ...props }, ref) => {
  return (
    <th
      ref={ref}
      className={cn('h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7684]', className)}
      {...props}
    />
  );
});

TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, DataCellProps>(({ className, ...props }, ref) => {
  return <td ref={ref} className={cn('px-4 py-3 align-middle text-sm text-[#191F28]', className)} {...props} />;
});

TableCell.displayName = 'TableCell';
