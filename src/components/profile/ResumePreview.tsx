import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Download, Maximize2, Minimize2 } from "lucide-react";

interface ResumePreviewProps {
  file: File;
  showAnalysis?: boolean;
  fullView?: boolean;
  analysisData?: {
    extracted_text?: string;
    analysis?: {
      overall_score?: number;
      strengths?: string[];
      weaknesses?: string[];
      keywords_found?: string[];
      sections_analysis?: any;
    };
    word_count?: number;
    page_count?: number;
  };
}

export default function ResumePreview({ file, showAnalysis = false, analysisData }: ResumePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (file) {
      setIsProcessing(true);
      
      // Create object URL for preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Use actual extracted text from analysis data if available
      if (analysisData?.extracted_text) {
        setExtractedText(analysisData.extracted_text);
        setIsProcessing(false);
      } else {
        // Fallback for when no analysis data is available yet
        setTimeout(() => {
          setExtractedText("Text extraction is handled by the Profile Service backend. Upload your resume to see the extracted content.");
          setIsProcessing(false);
        }, 1000);
      }

      return () => URL.revokeObjectURL(url);
    }
  }, [file, analysisData]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = file.name;
    link.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Resume Preview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {file.type === 'application/pdf' ? 'PDF' : 'DOCX'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`space-y-4 ${isExpanded ? 'min-h-[600px]' : 'min-h-[300px]'}`}>
          {/* File Info */}
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-sm">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date().toLocaleDateString()}
              </p>
            </div>
            {isProcessing && (
              <div className="ml-auto flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-xs text-muted-foreground">Processing...</span>
              </div>
            )}
          </div>

          {/* Enhanced Preview Content */}
          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="bg-muted border-b border-border p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Document Preview</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {file.type === "application/pdf" ? "PDF" : "DOCX"}
                  </Badge>
                  {!isProcessing && (
                    <div className="flex items-center gap-1 text-xs text-primary">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      Processed
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4">
              {isProcessing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground">Extracting content...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Document thumbnail/icon */}
                  <div className="flex items-center justify-center py-4 bg-muted rounded border-2 border-dashed border-border">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.type === "application/pdf" ? "PDF Document" : "Word Document"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Content preview */}
                  <div className="bg-muted rounded-lg p-4">
                    <h5 className="font-semibold mb-3 text-sm">Extracted Content Preview:</h5>
                    <div className="max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
                        {analysisData?.extracted_text
                          ? analysisData.extracted_text.substring(0, 500) +
                            (analysisData.extracted_text.length > 500 ? "..." : "")
                          : extractedText.substring(0, 500) + "..."}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Analysis Highlights */}
          {showAnalysis && !isProcessing && (
            <div className="space-y-4">
              <h4 className="font-medium text-sm">AI Analysis Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-muted rounded-lg border border-border">
                    <div className="text-lg font-bold text-primary">
                      {analysisData?.analysis?.sections_analysis
                        ? Object.keys(analysisData.analysis.sections_analysis).length
                        : "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Sections Found</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg border border-border">
                    <div className="text-lg font-bold text-primary">
                      {analysisData?.analysis?.keywords_found
                        ? analysisData.analysis.keywords_found.length
                        : "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Skills Detected</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg border border-border">
                    <div className="text-lg font-bold text-primary">
                      {analysisData?.word_count ||
                        (analysisData?.extracted_text
                          ? analysisData.extracted_text.split(" ").length
                          : "-")}
                    </div>
                    <div className="text-xs text-muted-foreground">Words</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg border border-border">
                    <div className="text-lg font-bold text-primary">
                      {analysisData?.page_count ||
                        (analysisData?.extracted_text
                          ? Math.ceil(analysisData.extracted_text.length / 3000)
                          : "-")}
                    </div>
                    <div className="text-xs text-muted-foreground">Pages</div>
                  </div>
                </div>
              
              {/* Key Insights */}
              <div className="bg-muted border border-border rounded-lg p-4">
                {analysisData?.analysis ? (
                  <div className="space-y-3">
                    <h5 className="font-semibold text-sm">AI Analysis Summary</h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Overall Score:</span>
                        <span className="text-xs font-bold text-primary">{analysisData.analysis.overall_score || "N/A"}/100</span>
                      </div>
                      {analysisData.analysis.strengths && analysisData.analysis.strengths.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Top Strengths:</span>
                          <ul className="text-xs text-muted-foreground mt-1 ml-4">
                            {analysisData.analysis.strengths.slice(0, 2).map((strength, index) => (
                              <li key={index} className="list-disc">{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysisData.analysis.keywords_found && analysisData.analysis.keywords_found.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Key Skills Found:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysisData.analysis.keywords_found.slice(0, 5).map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Analysis Available After Backend Processing</h5>
                    <p className="text-xs text-muted-foreground">
                      Upload your resume through the Profile Builder to get AI-powered insights and analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isExpanded && !isProcessing && (
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-3">Complete Document Content</h4>
              <div className="max-h-96 overflow-y-auto border border-border rounded-lg p-4 bg-muted">
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono leading-relaxed">
                  {analysisData?.extracted_text || extractedText}
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}