import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/styles';

export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset transition-all duration-200 hover:scale-105 hover:shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-gray-50 text-gray-600 ring-gray-500/10',
        secondary: 'bg-blue-50 text-blue-700 ring-blue-700/10',
        success: 'bg-green-50 text-green-700 ring-green-600/20',
        warning: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        destructive: 'bg-red-50 text-red-700 ring-red-600/10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}