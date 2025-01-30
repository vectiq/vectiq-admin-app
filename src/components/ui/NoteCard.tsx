import { useState } from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Check, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '@/lib/utils/styles';
import type { Note } from '@/types';

interface NoteCardProps {
  note: Note;
  onEdit: (noteId: string, text: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  onStatusChange: (noteId: string, status: 'pending' | 'completed') => Promise<void>;
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onStatusChange
}: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(note.text);

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'bg-red-50 text-red-700 ring-red-600/10'
        };
      case 'medium':
        return {
          badge: 'bg-amber-50 text-amber-700 ring-amber-600/10'
        };
      case 'low':
        return {
          badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
        };
      default:
        return {
          badge: 'bg-gray-50 text-gray-700 ring-gray-600/10'
        };
    }
  };

  const handleSave = async () => {
    if (!editText.trim()) return;
    await onEdit(note.id, editText.trim());
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        "bg-white shadow-md"
      )}
    >
      {/* Note content */}
      <div className="p-6 relative">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editText.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className={cn(
                  'text-gray-900',
                  note.status === 'completed' && 'line-through'
                )}>
                  {note.text}
                </p>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                  <span>{format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  <span>•</span>
                  <span>{note.createdBy}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onStatusChange(
                    note.id, 
                    note.status === 'completed' ? 'pending' : 'completed'
                  )}
                  className={cn(
                    "p-1",
                    note.status === 'completed' 
                      ? 'text-emerald-500 hover:text-emerald-600' 
                      : 'text-gray-400 hover:text-emerald-500'
                  )}
                  title={note.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
                >
                  {note.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="p-1"
                  title="Edit note"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDelete(note.id)}
                  className="p-1 text-red-500 hover:text-red-600"
                  title="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Priority Badge */}
            <div className="absolute bottom-4 right-4">
              <div className={cn(
                "px-2 py-1 text-xs font-medium rounded-full ring-1",
                getPriorityStyles(note.priority).badge
              )}>
                {note.priority.charAt(0).toUpperCase() + note.priority.slice(1)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}