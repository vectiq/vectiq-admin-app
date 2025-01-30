import { useState } from 'react';
import { SlidePanel } from '@/components/ui/SlidePanel';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { StickyNote, Plus, Edit2, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { NoteCard } from '@/components/ui/NoteCard';
import type { Note } from '@/types';

interface NotesSlideoutProps {
  open: boolean;
  onClose: () => void;
  title: string;
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  isLoading?: boolean;
}

export function NotesSlideout({
  open,
  onClose,
  title,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  isLoading
}: NotesSlideoutProps) {
  const [newNote, setNewNote] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Sort notes by priority (high -> medium -> low) and then by creation date (newest first)
  const sortedNotes = [...notes].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    
    // If priorities are different, sort by priority
    if (priorityDiff !== 0) return priorityDiff;
    
    // If priorities are the same, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    await onAddNote({
      text: newNote.trim(),
      priority: newNotePriority,
      status: 'pending',
      createdBy: 'Current User' // TODO: Get from auth context
    });

    setNewNote('');
    setNewNotePriority('medium');
    setIsAddingNote(false);
  };

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title={title}
      icon={<StickyNote className="h-5 w-5 text-indigo-500" />}
    >
      <div className="flex flex-col h-full">
        {/* Add Note Form */}
        <div className="p-6 border-b border-gray-200 flex justify-end">
          {isAddingNote ? (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Add New Note</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNote(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
              
              <FormField label="Note Text">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Type your note here..."
                  autoFocus
                />
              </FormField>

              <div className="flex items-end gap-3">
                <FormField label="Priority" className="flex-1">
                  <Select
                    value={newNotePriority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => setNewNotePriority(value)}
                  >
                    <SelectTrigger>
                      {newNotePriority.charAt(0).toUpperCase() + newNotePriority.slice(1)}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              className="group hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
              Add Note
            </Button>
          )}
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notes yet</p>
            </div>
          ) : (
            sortedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={(noteId, text) => onUpdateNote(noteId, { text })}
                onDelete={onDeleteNote}
                onStatusChange={(noteId, status) => onUpdateNote(noteId, { status })}
              />
            ))
          )}
        </div>
      </div>
    </SlidePanel>
  );
}