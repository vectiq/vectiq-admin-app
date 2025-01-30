import { SlidePanel } from '@/components/ui/SlidePanel';
import { ProjectForm } from './ProjectForm';
import { FolderKanban } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSubmit: (data: Project) => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: ProjectDialogProps) {
  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={project ? 'Edit Project' : 'New Project'}
      icon={<FolderKanban className="h-5 w-5 text-indigo-500" />}
    >
      <div className="p-6">
        <ProjectForm
          project={project}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </div>
    </SlidePanel>
  );
}