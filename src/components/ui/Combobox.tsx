import * as React from 'react';
import * as ComboboxPrimitive from '@radix-ui/react-combobox';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils/styles';

const Combobox = ComboboxPrimitive.Root;

const ComboboxTrigger = React.forwardRef<
  React.ElementRef<typeof ComboboxPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <ComboboxPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
    <ChevronsUpDown className="h-4 w-4 opacity-50" />
  </ComboboxPrimitive.Trigger>
));
ComboboxTrigger.displayName = ComboboxPrimitive.Trigger.displayName;

const ComboboxContent = React.forwardRef<
  React.ElementRef<typeof ComboboxPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <ComboboxPrimitive.Portal>
    <ComboboxPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <ComboboxPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-combobox-content-available-height)] w-full min-w-[var(--radix-combobox-trigger-width)]'
        )}
      >
        {children}
      </ComboboxPrimitive.Viewport>
    </ComboboxPrimitive.Content>
  </ComboboxPrimitive.Portal>
));
ComboboxContent.displayName = ComboboxPrimitive.Content.displayName;

const ComboboxItem = React.forwardRef<
  React.ElementRef<typeof ComboboxPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <ComboboxPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-indigo-50 data-[highlighted]:text-indigo-900 data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ComboboxPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ComboboxPrimitive.ItemIndicator>
    </span>
    {children}
  </ComboboxPrimitive.Item>
));
ComboboxItem.displayName = ComboboxPrimitive.Item.displayName;

const ComboboxEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-4 text-center text-sm text-gray-500', className)}
    {...props}
  />
));
ComboboxEmpty.displayName = 'ComboboxEmpty';

export {
  Combobox,
  ComboboxTrigger,
  ComboboxContent,
  ComboboxItem,
  ComboboxEmpty,
};