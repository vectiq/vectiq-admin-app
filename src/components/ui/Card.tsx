interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  gradient?: boolean;
}

export function Card({ 
  children, 
  className = '',
  hover = false,
  glass = false,
  gradient = false
}: CardProps) {
  return (
    <div className={`rounded-lg shadow-sm ring-1 ring-gray-900/5 p-6 transition-all duration-300
      ${hover ? 'hover-card' : ''}
      ${glass ? 'glass' : 'bg-white'}
      ${gradient ? 'gradient-bg' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}