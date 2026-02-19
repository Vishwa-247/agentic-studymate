import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye, EyeOff, Download } from "lucide-react";

interface DocumentPreviewProps {
  file: File;
  onRemove?: () => void;
}

export default function DocumentPreview({ file, onRemove }: DocumentPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePreview = () => {
    if (!showPreview && !previewUrl) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
    setShowPreview(!showPreview);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📄';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4" />
          Document Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFileIcon(file.type)}</span>
            <div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} • {file.type.split('/')[1].toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePreview}>
              {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            {onRemove && (
              <Button size="sm" variant="outline" onClick={onRemove}>
                Remove
              </Button>
            )}
          </div>
        </div>

        {/* Preview */}
        {showPreview && previewUrl && (
          <div className="border rounded-lg overflow-hidden">
            {file.type === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                className="w-full h-96"
                title="Document Preview"
              />
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  Preview not available for this file type.
                  <br />
                  The document will be processed when uploaded.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <p className="font-medium mb-1">Tips for better extraction:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure text is clearly readable and not scanned as an image</li>
            <li>Use standard resume sections (Education, Experience, Skills, etc.)</li>
            <li>Include contact information at the top</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}