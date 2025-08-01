import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Button } from "@/frontend/components/ui/button";
import { Loader2, AlertTriangle, Trash2 } from "lucide-react";
import { deleteAccount } from "@/backend/api/services/auth.service";
import { useToast } from "@/frontend/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/frontend/components/ui/alert";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";

const DeleteAccount = () => {
  const [password, setPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate form
    if (!password) {
      setError("Password is required");
      return;
    }
    
    if (!confirmDelete) {
      setError("You must confirm that you want to delete your account");
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteAccount(password);
      
      setDialogOpen(false);
      
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted. You will be redirected to the sign in page.",
      });
      
      // Navigate to login page
      setTimeout(() => {
        navigate("/auth/signin");
      }, 2000);
    } catch (error) {
      console.error("Account deletion error:", error);
      setError(error.message || "There was an error deleting your account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: This action cannot be undone</AlertTitle>
          <AlertDescription>
            Deleting your account will remove all your data including notes, tasks, calendar events, 
            and files. This action is permanent and cannot be reversed.
          </AlertDescription>
        </Alert>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleDeleteAccount} className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="delete-password" className="text-left">
                  Enter your password to confirm
                </Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-delete"
                  checked={confirmDelete}
                  onCheckedChange={(checked) => setConfirmDelete(checked === true)}
                />
                <Label
                  htmlFor="confirm-delete"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I understand that this will permanently delete my account and all associated data
                </Label>
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" type="submit" disabled={loading || !confirmDelete}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Confirm Delete"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DeleteAccount; 