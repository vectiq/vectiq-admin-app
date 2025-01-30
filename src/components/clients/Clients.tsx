@@ .. @@
 import { ClientDialog } from '@/components/clients/ClientDialog';
 import { LoadingScreen } from '@/components/ui/LoadingScreen';
 import { Button } from '@/components/ui/Button';
-import { useConfirm } from '@/lib/hooks/useConfirm';
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
 import type { Client } from '@/types';

@@ .. @@
   } = useClients();
   const [selectedClient, setSelectedClient] = useState<Client | null>(null);
   const [isDialogOpen, setIsDialogOpen] = useState(false);
-  const { confirm, dialog, handleClose } = useConfirm();
+  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; clientId: string | null }>({
+    isOpen: false,
+    clientId: null
+  });

@@ .. @@
   }, [selectedClient, updateClient, createClient]);

   const handleDelete = useCallback(async (id: string) => {
-    const confirmed = await confirm({
-      title: 'Delete Client',
-      message: 'Are you sure you want to delete this client? This action cannot be undone.',
-      confirmText: 'Delete',
-      cancelText: 'Cancel',
-    });
+    setDeleteConfirmation({ isOpen: true, clientId: id });
+  }, []);

-    if (confirmed) {
-      await deleteClient(id);
+  const handleConfirmDelete = async () => {
+    if (deleteConfirmation.clientId) {
+      await deleteClient(deleteConfirmation.clientId);
+      setDeleteConfirmation({ isOpen: false, clientId: null });
     }
-  }, [confirm, deleteClient]);
+  };

@@ .. @@
         onSubmit={handleSubmit}
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
+            <AlertDialogTitle>Delete Client</AlertDialogTitle>
+            <AlertDialogDescription>
+              Are you sure you want to delete this client? This action cannot be undone.
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