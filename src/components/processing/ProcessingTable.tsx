import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, Th, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog';
import { ChevronDown, ChevronRight, Users, AlertCircle, StickyNote, MessageCircle, CircleDot, CircleDashed, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { NotesSlideout } from './NotesSlideout';
import { useProcessingNotes } from '@/lib/hooks/useProcessingNotes';
import { useProcessing } from '@/lib/hooks/useProcessing';
import type { ProcessingProject } from '@/types';

interface ProjectNotesMap {
  [projectId: string]: number;
}

interface ProcessingTableProps {
  projects: ProcessingProject[];
  onUpdateStatus: (args: { projectId: string; status: 'not started' | 'draft' | 'sent' }) => Promise<void>;
  isUpdating: boolean;
  month: string;
}

interface XeroInvoiceLineItem {
  Description: string;
  Quantity: number;
  UnitAmount: number;
  AccountCode: string;
}

interface XeroInvoice {
  Type: string;
  Reference: string;
  Contact: {
    ContactID: string;
  };
  LineItems: XeroInvoiceLineItem[];
}

export function ProcessingTable({ 
  projects, 
  onUpdateStatus,
  isUpdating,
  month
}: ProcessingTableProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<ProcessingProject | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [invoiceResponse, setInvoiceResponse] = useState<any | null>(null);
  const [projectNotesCounts, setProjectNotesCounts] = useState<ProjectNotesMap>({});
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);
  const [pdfDebugData, setPdfDebugData] = useState<string | null>(null);
  const [invoiceConfirmation, setInvoiceConfirmation] = useState<{ isOpen: boolean; project: ProcessingProject | null }>({
    isOpen: false,
    project: null
  });
  
  const { generateInvoice, isGeneratingInvoice } = useProcessing(new Date(month + '-01'));

  // Get notes for selected project only
  const {
    projectNotes,
    getProjectNotes,
    addProjectNote,
    updateProjectNote,
    deleteProjectNote,
    isLoadingProjectNotes
  } = useProcessingNotes({
    projectId: selectedProject?.id,
    month
  });

  // Load note counts for all projects when component mounts or projects change
  useEffect(() => {
    const loadNoteCounts = async () => {
      const counts: ProjectNotesMap = {};
      for (const project of projects) {
        const notes = await getProjectNotes(project.id, month);
        counts[project.id] = notes?.notes?.length || 0;
      }
      setProjectNotesCounts(counts);
    };
    loadNoteCounts();
  }, [projects, month, getProjectNotes]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'draft':
        return <CircleDot className="h-4 w-4 text-amber-500" />;
      default:
        return <CircleDashed className="h-4 w-4 text-gray-400" />;
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="success">Sent</Badge>;
      case 'draft':
        return <Badge variant="warning">Draft</Badge>;
      default:
        return <Badge variant="default">Not Started</Badge>;
    }
  };

  const handleStatusChange = async (projectId: string, currentStatus: string) => {
    // Cycle through statuses: not started -> draft -> sent
    const statusOrder = ['not started', 'draft', 'sent'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];

    try {
      await onUpdateStatus(
        {
          projectId,
          status: nextStatus as 'not started' | 'draft' | 'sent'
        }
      );
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status. Please try again.');      
    }
  };

  const handleGenerateInvoice = async (project: ProcessingProject) => {
    setInvoiceConfirmation({ isOpen: true, project });
  };

  const handleConfirmInvoice = async () => {
    const project = invoiceConfirmation.project;
    if (!project) return;
    setGeneratingInvoiceId(project.id);

    try {
      const response = await generateInvoice(project);
      setInvoiceResponse(response);
      if (response.pdfData) {
        // Convert Uint8Array to base64 string for display
        setPdfDebugData(response.pdfData);
      }
      setInvoiceConfirmation({ isOpen: false, project: null });
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      alert('Failed to generate invoice. Please check the console for details.');
    }
    setGeneratingInvoiceId(null);
    setInvoiceConfirmation({ isOpen: false, project: null });
  };


  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <tr>
            <Th className="w-8"></Th>
            <Th>Project</Th>
            <Th>Client</Th>
            <Th className="text-right">Hours</Th>
            <Th>Timesheet Approval</Th>
            <Th>Processing Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </TableHeader>
        <TableBody>
          {projects.map(project => {
            const isExpanded = expandedProjects.has(project.id);
            const isLaborHire = project.type === 'labor_hire';

            return (
              <React.Fragment key={project.id}>
                <tr key={`header-${project.id}`} className="border-t border-gray-200">
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProject(project.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </Td>
                  <Td className="font-medium">{project.name}</Td>
                  <Td>{project.clientName}</Td>
                  <Td className="text-right">{project.totalHours.toFixed(1)}</Td>
                  <Td>
                    {project.requiresApproval ? (
                      <Badge
                        variant={
                          project.assignments.every(a => a.approvalStatus === 'approved') ? 'success' :
                          project.assignments.some(a => a.approvalStatus === 'pending') ? 'warning' :
                          'default'
                        }
                      >
                        {project.assignments.every(a => a.approvalStatus === 'approved') ? 'All Approved' :
                         project.assignments.some(a => a.approvalStatus === 'pending') ? 'Pending Approval' :
                         'Not Submitted'}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">No Approval Required</Badge>
                    )}
                  </Td>
                  <Td>
                    {getStatusBadge(project.invoiceStatus)}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="relative"
                        title="View project notes"
                        onClick={() => {
                          setSelectedProject(project);
                          setNotesOpen(true);
                        }}
                      >
                        <StickyNote className="h-4 w-4" />
                        {projectNotesCounts[project.id] > 0 && (
                          <Badge
                            variant="secondary"
                            className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 flex items-center justify-center text-xs"
                          >
                            {projectNotesCounts[project.id]}
                          </Badge>
                        )}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        title={`Status: ${project.invoiceStatus}`}
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(project.id, project.invoiceStatus)}
                        className="p-2"
                      >
                        {getStatusIcon(project.invoiceStatus)}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={(generatingInvoiceId === project.id) || !project.xeroContactId}
                        title="Generate Xero Invoice"
                        onClick={() => handleGenerateInvoice(project)}
                        className="p-2"
                      >
                        {generatingInvoiceId === project.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Td>
                </tr>

                {isExpanded && (
                  <>
                    <tr key={`details-${project.id}`} className="bg-gray-50">
                      <td></td>
                      <td colSpan={7} className="py-2 px-4">
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <tr key={`details-header-${project.id}`} className="border-t border-gray-200">
                                <Th>Staff Member</Th>
                                <Th>Task</Th>
                                <Th>Timesheet Status</Th>
                                <Th className="text-right">Total Hours</Th>
                              </tr>
                            </TableHeader>
                            <TableBody>
                              {project.assignments.map(assignment => (
                                <tr key={`${project.id}-${assignment.userId}-${assignment.taskId}`}>
                                  <Td className="font-medium">{assignment.userName}</Td>
                                  <Td>{assignment.taskName}</Td>
                                  <Td>
                                    {project.requiresApproval ? (
                                      <Badge
                                        variant={
                                          assignment.approvalStatus === 'approved' ? 'success' :
                                          assignment.approvalStatus === 'pending' ? 'warning' :
                                          assignment.approvalStatus === 'rejected' ? 'destructive' :
                                          'default'
                                        }
                                      >
                                        {assignment.approvalStatus === 'approved' ? 'Approved' :
                                         assignment.approvalStatus === 'pending' ? 'Pending Approval' :
                                         assignment.approvalStatus === 'rejected' ? 'Rejected' :
                                         'Not Submitted'}
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary">No Approval Required</Badge>
                                    )}
                                  </Td>
                                  <Td className="text-right">{assignment.hours.toFixed(1)}</Td>
                                </tr>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </td>
                    </tr>
                  </>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
      
      {selectedProject && (
        <NotesSlideout
          open={notesOpen}
          onClose={() => {
            setNotesOpen(false);
            setSelectedProject(null);
          }}
          title={`Notes for ${selectedProject.name}`}
          notes={projectNotes}
          onAddNote={addProjectNote}
          onUpdateNote={updateProjectNote}
          onDeleteNote={deleteProjectNote}
          isLoading={isLoadingProjectNotes}
        />
      )}
      
      {/* Debug Invoice Output */}
      {invoiceResponse && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Generated Xero Invoice</h3>
              <p className="text-xs text-gray-500 mt-1">
                Invoice ID: {invoiceResponse.Invoices?.[0]?.InvoiceID}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setInvoiceResponse(null);
                setPdfDebugData(null);
              }}
            >
              Clear
            </Button>
          </div>
          
          <div className="bg-white p-4 rounded border space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant="success" className="ml-2">
                  {invoiceResponse.Invoices?.[0]?.Status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Invoice Number:</span>
                <span className="ml-2">{invoiceResponse.Invoices?.[0]?.InvoiceNumber}</span>
              </div>
              <div>
                <span className="font-medium">Amount Due:</span>
                <span className="ml-2">${invoiceResponse.Invoices?.[0]?.AmountDue?.toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium">Reference:</span>
                <span className="ml-2">{invoiceResponse.Invoices?.[0]?.Reference}</span>
              </div>
            </div>
          </div>
          
          {pdfDebugData && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">PDF Debug Data</h4>
              <div className="bg-white p-4 rounded border">
                <textarea
                  readOnly
                  value={pdfDebugData}
                  className="w-full h-32 font-mono text-xs p-2 border rounded"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog 
        open={invoiceConfirmation.isOpen} 
        onOpenChange={(open) => setInvoiceConfirmation(prev => ({ ...prev, isOpen: open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate Xero Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block mb-4">
                This will create a new draft invoice in Xero for {invoiceConfirmation.project?.name}. The invoice will include all time entries for the current month.
              </span>
              <span className="block bg-gray-50 p-4 rounded-md text-sm">
                <span className="block"><strong>Client:</strong> {invoiceConfirmation.project?.clientName}</span>
                <span className="block"><strong>Total Hours:</strong> {invoiceConfirmation.project?.totalHours.toFixed(1)}</span>
                {invoiceConfirmation.project?.purchaseOrderNumber && (
                  <span className="block"><strong>PO Number:</strong> {invoiceConfirmation.project.purchaseOrderNumber}</span>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmInvoice}>Generate Invoice</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}