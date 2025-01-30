@@ .. @@
 import { useConfirm } from '@/lib/hooks/useConfirm';
-import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
+import {
+  AlertDialog,
+  AlertDialogContent,
+  AlertDialogHeader,
+  AlertDialogTitle,
+  AlertDialogDescription,
+  AlertDialogFooter,
+  AlertDialogAction,
+  AlertDialogCancel,
+} from '@/components/ui/AlertDialog';
 import type { Project } from '@/types';

@@ .. @@
   } = useProjects();
   const [selectedProject, setSelectedProject] = useState<Project | null>(null);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
-  const { confirm, dialog, handleClose } = useConfirm();
+  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; projectId: string | null }>({
+    isOpen: false,
+    projectId: null
+  });
   const [isTasksDialogOpen, setIsTasksDialogOpen] = useState(false);

@@ .. @@
   }, [selectedProject, updateProject, createProject]);

   const handleDelete = useCallback(async (id: string) => {
-    const confirmed = await confirm({
-      title: 'Delete Project',
-      message: 'Are you sure you want to delete this project? This action cannot be undone.',
-      confirmText: 'Delete',
-      cancelText: 'Cancel',
-    });
+    setDeleteConfirmation({ isOpen: true, projectId: id });
+  }, []);

-    if (confirmed) {
-      await deleteProject(id);
+  const handleConfirmDelete = async () => {
+    if (deleteConfirmation.projectId) {
+      await deleteProject(deleteConfirmation.projectId);
+      setDeleteConfirmation({ isOpen: false, projectId: null });
     }
-  }, [confirm, deleteProject]);
+  };

@@ .. @@
         onUpdateProject={handleUpdateProjectTasks}
       />
       
-      {dialog && (
-        <ConfirmDialog
-          open={dialog.isOpen}
-          title={dialog.title}
-          message={dialog.message}
-          confirmText={dialog.confirmText}
-          cancelText={dialog.cancelText}
-          onConfirm={() => handleClose(true)}
-          onCancel={() => handleClose(false)}
-        />
-      )}
+      <AlertDialog 
+        open={deleteConfirmation.isOpen} 
+        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
+      >
+        <AlertDialogContent>
+          <AlertDialogHeader>
+            <AlertDialogTitle>Delete Project</AlertDialogTitle>
+            <AlertDialogDescription>
+              Are you sure you want to delete this project? This action cannot be undone.
+            </AlertDialogDescription>
+          </AlertDialogHeader>
+          <AlertDialogFooter>
+            <AlertDialogCancel>Cancel</AlertDialogCancel>
+            <AlertDialogAction onClick={handleConfirmDelete}>Delete</AlertDialogAction>
+          </AlertDialogFooter>
+        </AlertDialogContent>
+      </AlertDialog>
     </div>
   );
 }