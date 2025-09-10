import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  Medal,
  Eye,
  Check,
  X,
  MessageSquare,
  Edit,
  Star,
  BookmarkPlus,
  Send
} from "lucide-react";
import { Job } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface JobPreviewProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (jobId: string) => void;
  onReject?: (jobId: string) => void;
  onSaveNote?: (jobId: string, note: string) => void;
  onSaveForLater?: (jobId: string) => void;
  onPostToKaza?: (jobId: string) => void;
}

export function JobPreview({
  job,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onSaveNote,
  onSaveForLater,
  onPostToKaza
}: JobPreviewProps) {
  const [note, setNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const isVeteranFriendly = job.veteranKeywords && job.veteranKeywords.length > 0;
  const hasSalary = job.salaryMin || job.salaryMax;
  const scrapedDate = job.scrapedDate ? new Date(job.scrapedDate) : null;

  const formatSalary = () => {
    if (!hasSalary) return "Salary not specified";
    if (job.salaryMin && job.salaryMax) {
      return `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) return `$${job.salaryMin.toLocaleString()}+`;
    if (job.salaryMax) return `Up to $${job.salaryMax.toLocaleString()}`;
    return "Salary not specified";
  };

  const handleSaveNote = async () => {
    if (!note.trim() || !onSaveNote) return;
    
    setIsSavingNote(true);
    try {
      await onSaveNote(job.id, note);
      setNote("");
    } finally {
      setIsSavingNote(false);
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'posted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold leading-tight mb-2">
                {job.title}
              </DialogTitle>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">{job.company}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {isVeteranFriendly && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                  <Medal className="h-3 w-3" />
                  Veteran Friendly
                </Badge>
              )}
              <Badge className={getStatusColor()}>
                {job.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-green-700">
                <DollarSign className="h-5 w-5" />
                <div>
                  <p className="text-sm text-muted-foreground">Salary</p>
                  <p className="font-semibold">{formatSalary()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Posted</p>
                  <p className="font-semibold">
                    {scrapedDate ? formatDistanceToNow(scrapedDate, { addSuffix: true }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-semibold capitalize">{job.source}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Job Type and Keywords */}
          <div className="flex flex-wrap gap-2">
            {job.jobType && job.jobType !== 'nan' && (
              <Badge variant="outline" className="capitalize">
                {job.jobType}
              </Badge>
            )}
            {job.veteranKeywords?.map((keyword, index) => (
              <Badge key={index} variant="secondary" className="bg-amber-50 text-amber-700">
                {keyword}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Job Description */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Job Description</h3>
            <div className="prose prose-sm max-w-none">
              {job.description && job.description !== 'nan' ? (
                <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                  {job.description}
                </div>
              ) : (
                <p className="text-muted-foreground italic">No description available</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Personal Notes
            </h3>
            <div className="space-y-3">
              <Textarea
                placeholder="Add your notes about this job..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-20"
                data-testid="textarea-job-note"
              />
              {note.trim() && (
                <Button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  size="sm"
                  data-testid="button-save-note"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 flex-1">
            {onSaveForLater && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSaveForLater(job.id)}
                data-testid="button-save-for-later"
              >
                <BookmarkPlus className="h-4 w-4 mr-2" />
                Save for Later
              </Button>
            )}

            {onPostToKaza && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPostToKaza(job.id)}
                className="text-blue-600 hover:text-blue-700"
                data-testid="button-post-to-kaza"
              >
                <Send className="h-4 w-4 mr-2" />
                Post to KazaConnect
              </Button>
            )}

            {job.url && job.url !== 'nan' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(job.url, '_blank')}
                data-testid="button-view-original"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Original
              </Button>
            )}
          </div>

          {/* Approval Actions */}
          {job.status === 'pending' && onApprove && onReject && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onReject(job.id);
                  onClose();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid="button-reject-job"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  onApprove(job.id);
                  onClose();
                }}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-approve-job"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}