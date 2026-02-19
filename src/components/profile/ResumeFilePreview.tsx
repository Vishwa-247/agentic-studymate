import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, EyeOff, Download, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ResumeFilePreviewProps {
  filePath: string;
  fileName: string;
  fileSize?: number;
  uploadDate: string;
  onDelete?: () => Promise<void>;
}

export default function ResumeFilePreview({ 
  filePath, 
  fileName, 
  fileSize, 
  uploadDate, 
  onDelete 
}: ResumeFilePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      toast({
        title: "Resume Deleted",
        description: "Your resume has been successfully deleted.",
      });
    } catch (error) {
      console.error('Failed to delete resume:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = async () => {
    if (!showPreview && !previewUrl) {
      setIsGeneratingUrl(true);
      try {
        const { data } = await supabase.storage
          .from('resume-files')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        if (data?.signedUrl) {
          setPreviewUrl(data.signedUrl);
        } else {
          toast({
            title: "Preview unavailable",
            description: "Unable to generate preview URL for this file.",
            variant: "destructive",
          });
          return;
        }
      } catch (error) {
        console.error('Error generating preview URL:', error);
        toast({
          title: "Preview error",
          description: "Failed to load file preview.",
          variant: "destructive",
        });
        return;
      } finally {
        setIsGeneratingUrl(false);
      }
    }
    setShowPreview(!showPreview);
  };

  const handleDownload = async () => {
    try {
      const { data } = await supabase.storage
        .from('resume-files')
        .createSignedUrl(filePath, 300); // 5 minutes for download

      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Unable to download the file.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.toLowerCase().includes('.pdf')) return '📄';
    if (fileName.toLowerCase().includes('.doc')) return '📝';
    return '📄';
  };

  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Uploaded Resume
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(fileName)}</span>
            <div>
              <p className="font-medium text-sm">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {fileSize ? formatFileSize(fileSize) : 'Unknown size'} • 
                Uploaded {new Date(uploadDate).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handlePreview}
              disabled={isGeneratingUrl}
            >
              {isGeneratingUrl ? (
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              ) : showPreview ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-3 w-3" />
            </Button>
            {onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete Resume?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>Are you sure you want to permanently delete "{fileName}"?</p>
                      <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-destructive">⚠️ This action cannot be undone!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Once deleted:
                            </p>
                            <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-0.5">
                              <li>You'll lose all extracted profile data</li>
                              <li>You'll need to re-upload your resume</li>
                              <li>AI analysis will need to run again</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel - Keep Resume</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                          Deleting...
                        </div>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Yes, Delete Forever
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <FileText className="h-3 w-3 mr-1" />
            Processed by AI
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Stored securely
          </Badge>
        </div>

        {/* Preview */}
        {showPreview && previewUrl && (
          <div className="border rounded-lg overflow-hidden">
            {isPdf ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-muted">
                  <span className="text-sm font-medium">PDF Preview</span>
                  <Button size="sm" variant="outline" asChild>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Open Full View
                    </a>
                  </Button>
                </div>
                <iframe
                  src={previewUrl}
                  className="w-full h-96"
                  title="Resume Preview"
                />
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-2">
                  Preview not available for this file type.
                </p>
                <Button size="sm" variant="outline" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in New Tab
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <p className="font-medium mb-1">File Information:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Stored in Supabase Storage bucket: resume-files</li>
            <li>Path: {filePath}</li>
            <li>AI extraction: Completed successfully</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}