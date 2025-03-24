import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface DebugDrawerProps {
  enabled: boolean;
}

export function DebugDrawer({ enabled }: DebugDrawerProps) {
  const [text, setText] = useState('');

  if (!enabled) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto flex gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter error message..."
          className="flex-1 bg-gray-800 text-white rounded p-2 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          rows={3}
        />
        <Button
          onClick={() => {
            if (text.trim()) {
              console.error(text);
              setText('');
            }
          }}
          className="self-start"
        >
          Throw
        </Button>
      </div>
    </div>
  );
}