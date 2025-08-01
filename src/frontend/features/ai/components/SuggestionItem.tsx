import React, { useState } from 'react';
import { Button } from '@/frontend/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { ThumbsUp, ThumbsDown, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import { TaskSuggestion, EventSuggestion, SuggestionFeedback, recordSuggestionFeedback } from '@/backend/api/services/ai/suggestions/suggestionService';
import { useToast } from '@/frontend/hooks/use-toast';
import { Textarea } from '@/frontend/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/frontend/components/ui/dialog';
import { Label } from '@/frontend/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/frontend/components/ui/alert-dialog';

interface SuggestionItemProps {
  suggestion: TaskSuggestion | EventSuggestion;
  type: 'task' | 'event';
  userId: string; // Needed for recording feedback
  onStatusChange: (suggestionId: string, type: 'task' | 'event', status: 'accepted' | 'rejected') => Promise<void>; // To refresh list after accept/reject
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ suggestion, type, userId, onStatusChange }) => {
  const { toast } = useToast();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'accurate' | 'inaccurate' | 'other' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    try {
      setIsSubmitting(true);
      await onStatusChange(suggestion.id, type, 'accepted');
      setShowAcceptDialog(false);
    } catch (error) {
      console.error(`Error accepting ${type} suggestion:`, error);
      toast({ title: 'Error', description: `Failed to accept ${type} suggestion.`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      await onStatusChange(suggestion.id, type, 'rejected');
      setShowRejectDialog(false);
    } catch (error) {
      console.error(`Error rejecting ${type} suggestion:`, error);
      toast({ title: 'Error', description: `Failed to reject ${type} suggestion.`, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openFeedbackModal = (fType: 'accurate' | 'inaccurate' | 'other') => {
    setFeedbackType(fType);
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!feedbackType) return;

    const feedbackData: SuggestionFeedback = {
      userId,
      suggestionId: suggestion.id,
      suggestionType: type,
      originalSuggestion: suggestion, // Store the full suggestion object
      feedbackType: feedbackType,
      comments: feedbackComment || undefined,
    };

    try {
      await recordSuggestionFeedback(feedbackData);
      toast({ title: 'Feedback Submitted', description: 'Thank you for your feedback!' });
      setShowFeedbackModal(false);
      setFeedbackComment('');
      setFeedbackType(null);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({ title: 'Feedback Error', description: 'Could not submit feedback.', variant: 'destructive' });
    }
  };
  
  const isTask = (s: TaskSuggestion | EventSuggestion): s is TaskSuggestion => type === 'task';

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{suggestion.title}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type === 'task' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
            {type.toUpperCase()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {suggestion.description && <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>}
        {isTask(suggestion) && suggestion.dueDate && <p className="text-sm"><strong>Due:</strong> {new Date(suggestion.dueDate).toLocaleDateString()}</p>}
        {isTask(suggestion) && suggestion.priority && <p className="text-sm"><strong>Priority:</strong> {suggestion.priority}</p>}
        {!isTask(suggestion) && (suggestion as EventSuggestion).startTime && <p className="text-sm"><strong>Starts:</strong> {new Date((suggestion as EventSuggestion).startTime).toLocaleString()}</p>}
        {!isTask(suggestion) && (suggestion as EventSuggestion).endTime && <p className="text-sm"><strong>Ends:</strong> {new Date((suggestion as EventSuggestion).endTime).toLocaleString()}</p>}
        {suggestion.projectName && <p className="text-sm"><strong>Project:</strong> {suggestion.projectName}</p>}
        {isTask(suggestion) && suggestion.labels && suggestion.labels.length > 0 && (
          <p className="text-sm"><strong>Labels:</strong> {suggestion.labels.join(', ')}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-3">
        <div className="flex space-x-2">
          <Button onClick={() => setShowAcceptDialog(true)} size="sm" variant="outline">Accept</Button>
          <Button onClick={() => setShowRejectDialog(true)} size="sm" variant="outline">Reject</Button>
        </div>
        <div className="flex items-center space-x-2 pt-2 border-t w-full mt-2">
          <span className="text-sm font-medium">Feedback:</span>
          <Button variant="ghost" size="icon" onClick={() => openFeedbackModal('accurate')} title="Accurate">
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => openFeedbackModal('inaccurate')} title="Inaccurate">
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardFooter>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              You selected: <strong>{feedbackType}</strong>. Add any comments below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="feedbackComment" className="text-right">
                Comments
              </Label>
              <Textarea
                id="feedbackComment"
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                className="col-span-3"
                placeholder="Optional comments..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
            <Button onClick={submitFeedback}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Confirmation Dialog */}
      <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept {type === 'task' ? 'Task' : 'Event'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to accept this {type}? This will create a new {type === 'task' ? 'task' : 'event'} with these details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {type === 'task' ? 'Task' : 'Event'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this suggestion? It will be removed from your suggestions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default SuggestionItem; 