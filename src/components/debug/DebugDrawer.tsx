import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/styles';

interface DebugDrawerProps {
  enabled: boolean;
}

export function DebugDrawer({ enabled }: DebugDrawerProps) {
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  if (!enabled) return null;

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 bg-gray-900 text-white transition-all duration-300",
        isExpanded ? "bottom-0" : "-bottom-32"
      )} 
      style={{ zIndex: 20 }}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-8 right-4 bg-gray-900 text-white px-4 py-2 rounded-t-lg flex items-center gap-2 text-sm hover:bg-gray-800 transition-colors"
      >
        Debug Console
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>

      {/* Drawer Content */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto flex gap-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter error message..."
            className="flex-1 bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            rows={3}
          />
          <Button
            onClick={() => {
              if (text.trim()) {
                setText('');
              }
            }}
            className="self-start whitespace-nowrap"
          >
            Throw
          </Button>
        </div>
      </div>
    </div>
  );
}