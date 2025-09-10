import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Check, 
  X, 
  Trash2, 
  Send, 
  Archive, 
  Tag,
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { Job } from "@shared/schema";

interface BulkOperationsProps {
  selectedJobs: string[];
  allJobs: Job[];
  onSelectAll: (checked: boolean) => void;
  onBulkApprove: (jobIds: string[]) => void;
  onBulkReject: (jobIds: string[]) => void;
  onBulkDelete: (jobIds: string[]) => void;
  onBulkPostToKaza: (jobIds: string[]) => void;
  onBulkArchive?: (jobIds: string[]) => void;
  onClearSelection: () => void;
}

export function BulkOperations({
  selectedJobs,
  allJobs,
  onSelectAll,
  onBulkApprove,
  onBulkReject,
  onBulkDelete,
  onBulkPostToKaza,
  onBulkArchive,
  onClearSelection
}: BulkOperationsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPostConfirm, setShowPostConfirm] = useState(false);

  const selectedJobsData = allJobs.filter(job => selectedJobs.includes(job.id));
  const allSelected = selectedJobs.length === allJobs.length && allJobs.length > 0;
  const someSelected = selectedJobs.length > 0 && selectedJobs.length < allJobs.length;

  const pendingJobs = selectedJobsData.filter(job => job.status === 'pending');
  const veteranFriendlyJobs = selectedJobsData.filter(job => 
    job.veteranKeywords && job.veteranKeywords.length > 0
  );

  if (selectedJobs.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-muted/30 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              ref={(ref) => {
                if (ref) ref.indeterminate = someSelected;
              }}
              onCheckedChange={onSelectAll}
              data-testid="checkbox-select-all"
            />
            <span className="text-sm font-medium">
              {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-2">
            {pendingJobs.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingJobs.length} pending
              </Badge>
            )}
            {veteranFriendlyJobs.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 text-xs">
                {veteranFriendlyJobs.length} veteran-friendly
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          {pendingJobs.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkApprove(pendingJobs.map(j => j.id))}
                className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                data-testid="button-bulk-approve"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve ({pendingJobs.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkReject(pendingJobs.map(j => j.id))}
                className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid="button-bulk-reject"
              >
                <X className="h-4 w-4 mr-1" />
                Reject ({pendingJobs.length})
              </Button>
            </>
          )}

          {/* More Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-3">
                <MoreHorizontal className="h-4 w-4 mr-1" />
                More
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem 
                onClick={() => setShowPostConfirm(true)}
                className="text-blue-600"
                data-testid="menu-bulk-post"
              >
                <Send className="h-4 w-4 mr-2" />
                Post to KazaConnect ({selectedJobs.length})
              </DropdownMenuItem>
              
              {onBulkArchive && (
                <DropdownMenuItem 
                  onClick={() => onBulkArchive(selectedJobs)}
                  data-testid="menu-bulk-archive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive ({selectedJobs.length})
                </DropdownMenuItem>
              )}

              <DropdownMenuItem data-testid="menu-bulk-tag">
                <Tag className="h-4 w-4 mr-2" />
                Add Tags
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600"
                data-testid="menu-bulk-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedJobs.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 px-2"
            data-testid="button-clear-selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedJobs.length} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected jobs will be permanently removed from your database.
              {veteranFriendlyJobs.length > 0 && (
                <>
                  <br /><br />
                  <strong>Warning:</strong> {veteranFriendlyJobs.length} of these jobs are veteran-friendly.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkDelete(selectedJobs);
                setShowDeleteConfirm(false);
                onClearSelection();
              }}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete {selectedJobs.length} jobs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post to KazaConnect Confirmation */}
      <AlertDialog open={showPostConfirm} onOpenChange={setShowPostConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post {selectedJobs.length} jobs to KazaConnect?</AlertDialogTitle>
            <AlertDialogDescription>
              This will post the selected jobs to your KazaConnect platform. 
              {veteranFriendlyJobs.length > 0 && (
                <>
                  <br /><br />
                  <strong>Great!</strong> {veteranFriendlyJobs.length} of these jobs are veteran-friendly and will be prioritized.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onBulkPostToKaza(selectedJobs);
                setShowPostConfirm(false);
                onClearSelection();
              }}
              data-testid="button-confirm-post"
            >
              Post {selectedJobs.length} jobs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}