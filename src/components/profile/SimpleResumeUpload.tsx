import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { ExtractedResumeData } from "@/types/resume";
import { Bot, FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import ResumeFilePreview from "./ResumeFilePreview";

const SimpleResumeUpload = () => {
  const { profile, uploadResume, applyExtractedData, deleteResume, isLoading: profileLoading } = useProfile();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiStage, setAiStage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Prevent duplicate uploads
    if (isUploading || isProcessing) {
      console.log(
        "⚠️ [FRONTEND DEBUG] Upload already in progress, ignoring new file"
      );
      toast({
        title: "Upload in Progress",
        description: "Please wait for the current upload to complete.",
        variant: "default",
      });
      return;
    }

    // File validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
      return;
    }

    setCurrentFile(file);
    processResume(file);
    },
    [toast]
  );


  const processResumeCore = async (file: File) => {
    console.log(
      "✅ [FRONTEND DEBUG] Authentication check passed, proceeding with upload"
    );

    setIsProcessing(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      console.log("🎬 [FRONTEND DEBUG] Starting AI processing simulation...");
      // AI Agent processing stages
      const stages = [
        "🔍 Scanning your resume...",
        "🧠 AI is reading your content with built-in parser...",
        "📊 Extracting work experience...",
        "🎯 Identifying skills and technologies...",
        "📝 Analyzing education background...",
        "🔍 Detecting certifications and projects...",
        "📈 Calculating match score...",
        "✨ Generating personalized insights...",
      ];

      let currentStageIndex = 0;
      setAiStage(stages[currentStageIndex]);

      // Progressive AI thinking simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 15;
          if (newProgress <= 90) {
            if (newProgress > currentStageIndex * 13) {
              currentStageIndex++;
              if (currentStageIndex < stages.length) {
                setAiStage(stages[currentStageIndex]);
              }
            }
            return newProgress;
          }
          clearInterval(progressInterval);
          return 90;
        });
      }, 400);

      // Process the resume with Python backend + Groq AI
      console.log(
        "📁 [FRONTEND DEBUG] Processing file:",
        file.name,
        "Size:",
        file.size
      );
      console.log("🔗 [FRONTEND DEBUG] Calling uploadResume function...");

      const result = await uploadResume(file);
      console.log("📋 [FRONTEND DEBUG] Upload result received:", result);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setAiStage("🎉 Analysis complete!");
      setIsUploading(false);

      if (result?.success) {
        console.log(
          "✅ [FRONTEND DEBUG] Upload successful, checking extracted data..."
        );
        console.log(
          "📊 [FRONTEND DEBUG] Extracted data available:",
          !!result?.extracted_data
        );

        if (result?.extracted_data) {
          // Store userId with extracted data for later use
          const uploadedUserId = result.user_id || user?.id;
          if (uploadedUserId) {
            console.log('💾 [FRONTEND DEBUG] Stored userId for auto-fill:', uploadedUserId);
            result.extracted_data._userId = uploadedUserId;
          }

          // Show AI agent success toast
          setTimeout(() => {
            toast({
              title: "🤖 AI Agent Ready!",
              description:
                "I've analyzed your resume and extracted your profile data.",
              action: (
                <button
                  onClick={() => handleAutoFill(result.extracted_data)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1 rounded text-sm font-medium"
                >
                  Auto-Fill Profile
                </button>
              ),
            });
          }, 1500);
        } else {
          console.log(
            "❌ [FRONTEND DEBUG] Upload failed - no extracted data available"
          );
          console.log("📋 [FRONTEND DEBUG] Result details:", {
            success: result?.success,
            message: result?.message,
            hasExtractedData: !!result?.extracted_data,
          });
          throw new Error(
            result?.message || "Upload failed - no extracted data available"
          );
        }
      } else {
        console.log("❌ [FRONTEND DEBUG] Upload not successful");
        console.log("📋 [FRONTEND DEBUG] Result details:", {
          success: result?.success,
          message: result?.message,
          hasExtractedData: !!result?.extracted_data,
        });
        throw new Error(
          result?.message ||
            "Upload failed - server returned unsuccessful result"
        );
      }
    } catch (error: any) {
      console.error("❌ [FRONTEND DEBUG] Resume processing error:", error);
      console.error("❌ [FRONTEND DEBUG] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      setIsProcessing(false);
      setIsUploading(false);
      setUploadProgress(0);
      setAiStage("");

      // Show specific error message based on error type
      if (error.message?.includes("Unsupported file type")) {
        console.log("❌ [FRONTEND DEBUG] File type error detected");
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or Word document (.pdf, .docx)",
          variant: "destructive",
        });
      } else if (error.message?.includes("File too large")) {
        console.log("❌ [FRONTEND DEBUG] File size error detected");
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
      } else if (error.message?.includes("Authentication")) {
        console.log("❌ [FRONTEND DEBUG] Authentication error detected");
        toast({
          title: "Authentication Error",
          description: "Please sign in again to upload your resume.",
          variant: "destructive",
        });
      } else if (error.message?.includes('503') || error.message?.includes('AI service')) {
        console.log("❌ [FRONTEND DEBUG] AI service error detected");
        toast({
          title: "AI Service Unavailable",
          description: "AI extraction service is unavailable. Please ensure the backend is running and GROQ_API_KEY is configured.",
          variant: "destructive",
        });
      } else if (error.message?.includes('invalid format') || error.message?.includes('JSON')) {
        console.log("❌ [FRONTEND DEBUG] AI format error detected");
        toast({
          title: "AI Processing Error",
          description: "AI returned unexpected format. Please try uploading your resume again.",
          variant: "destructive",
        });
      } else if (error.message?.includes('500')) {
        console.log("❌ [FRONTEND DEBUG] Backend error detected");
        toast({
          title: "Backend Processing Error",
          description: "Backend processing error. Please check console for details and ensure all services are running.",
          variant: "destructive",
        });
      } else {
        console.log("❌ [FRONTEND DEBUG] Generic error detected");
        toast({
          title: "Upload Failed",
          description:
            error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const processResume = async (file: File) => {
    console.log("🚀 [FRONTEND DEBUG] Starting resume processing...");
    console.log("👤 [FRONTEND DEBUG] Profile userId:", profile?.userId);
    console.log("👤 [FRONTEND DEBUG] User from useAuth:", user);
    console.log("👤 [FRONTEND DEBUG] User ID:", user?.id);
    console.log(
      "👤 [FRONTEND DEBUG] User object keys:",
      user ? Object.keys(user) : "No user object"
    );
    console.log("👤 [FRONTEND DEBUG] Auth loading state:", {
      loading: authLoading,
    });
    console.log("👤 [FRONTEND DEBUG] Full auth state:", {
      user,
      authLoading,
      profile,
    });

    // Smart authentication check - use direct Supabase session check
    if (authLoading) {
      console.log('⏳ [FRONTEND DEBUG] Auth loading, checking Supabase session directly...');

      setIsProcessing(true);
      setUploadProgress(10);
      setAiStage('🔐 Verifying authentication...');

      try {
        // Direct Supabase session check - more reliable than waiting for useAuth
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.user?.id) {
          console.error('❌ [FRONTEND DEBUG] No valid session found');
          setIsProcessing(false);
          setIsUploading(false);
          setUploadProgress(0);
          setAiStage('');
          toast({
            title: "Authentication Required",
            description: "Please sign in to upload your resume.",
            variant: "destructive",
          });
          return;
        }

        console.log('✅ [FRONTEND DEBUG] Session verified, user ID:', session.user.id);
        await processResumeCore(file);
        return;
      } catch (error) {
        console.error('❌ [FRONTEND DEBUG] Session check failed:', error);
        setIsProcessing(false);
        setIsUploading(false);
        setUploadProgress(0);
        setAiStage('');
        toast({
          title: "Authentication Error",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!user?.id) {
      console.error("❌ [FRONTEND DEBUG] No userId found in profile or user!");
      console.error("❌ [FRONTEND DEBUG] User object:", user);
      console.error("❌ [FRONTEND DEBUG] Auth loading:", authLoading);
      console.error(
        "❌ [FRONTEND DEBUG] This should NOT happen with your auth state!"
      );
      toast({
        title: "Authentication Error",
        description: "Please sign in to upload your resume.",
        variant: "destructive",
      });
      return;
    }

    console.log("✅ [FRONTEND DEBUG] User ID validation passed:", user.id);

    // Remove profile dependency - we only need user.id for upload
    console.log(
      "✅ [FRONTEND DEBUG] Authentication check passed, proceeding with upload"
    );
    
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      console.log("🎬 [FRONTEND DEBUG] Starting AI processing simulation...");
      // AI Agent processing stages
      const stages = [
                 "🔍 Scanning your resume...",
        "🧠 AI is reading your content with built-in parser...",
        "📊 Extracting work experience...",
        "🎓 Analyzing education history...",
        "⚡ Identifying skills and technologies...",
        "🏆 Processing certifications...",
        "✨ Structuring your profile data...",
      ];

      let currentStageIndex = 0;
      setAiStage(stages[currentStageIndex]);

      // Progressive AI thinking simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 15;
          if (newProgress <= 90) {
            if (newProgress > currentStageIndex * 13) {
              currentStageIndex++;
              if (currentStageIndex < stages.length) {
                setAiStage(stages[currentStageIndex]);
              }
            }
            return newProgress;
          }
          clearInterval(progressInterval);
          return 90;
        });
      }, 400);

      // Process the resume with Python backend + Groq AI
      console.log(
        "📁 [FRONTEND DEBUG] Processing file:",
        file.name,
        "Size:",
        file.size
      );
      console.log("🔗 [FRONTEND DEBUG] Calling uploadResume function...");

      const result = await uploadResume(file);
      console.log("📋 [FRONTEND DEBUG] Upload result received:", result);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setAiStage("🎉 Analysis complete!");
      setIsUploading(false);

      if (result?.success) {
        console.log(
          "✅ [FRONTEND DEBUG] Upload successful, checking extracted data..."
        );
        console.log(
          "📊 [FRONTEND DEBUG] Extracted data available:",
          !!result?.extracted_data
        );

        if (result?.extracted_data) {
          // Store userId with extracted data for later use
          const uploadedUserId = result.user_id || user?.id;
          if (uploadedUserId) {
            console.log('💾 [FRONTEND DEBUG] Stored userId for auto-fill:', uploadedUserId);
            result.extracted_data._userId = uploadedUserId;
          }

        // Show AI agent success toast
        setTimeout(() => {
          toast({
            title: "🤖 AI Agent Ready!",
              description:
                "I've analyzed your resume and extracted your profile data.",
            duration: 4000,
          });
          
          // Show auto-fill confirmation toast with action buttons
          setTimeout(() => {
            toast({
              title: "🎯 Auto-Fill Profile?",
                description:
                  "Should I automatically fill your profile with the extracted data?",
              duration: 8000,
              action: (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleAutoFill(result.extracted_data);
                    }}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                  >
                    Yes, Fill Profile
                  </button>
                  <button
                    onClick={() => {
                      setCurrentFile(null);
                      setUploadProgress(0);
                      setIsProcessing(false);
                      toast({
                        title: "Resume Saved!",
                          description:
                            "Your resume is saved. You can fill your profile manually anytime.",
                      });
                    }}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
                  >
                    Skip
                  </button>
                </div>
              ),
            });
          }, 1500);
        }, 1000);
      } else {
          console.log(
            "❌ [FRONTEND DEBUG] Upload failed - no extracted data available"
          );
          console.log("📋 [FRONTEND DEBUG] Result details:", {
            success: result?.success,
            message: result?.message,
            hasExtractedData: !!result?.extracted_data,
          });
          throw new Error(
            result?.message || "Upload failed - no extracted data available"
          );
        }
      } else {
        console.log("❌ [FRONTEND DEBUG] Upload not successful");
        console.log("📋 [FRONTEND DEBUG] Result details:", {
          success: result?.success,
          message: result?.message,
          hasExtractedData: !!result?.extracted_data,
        });
        throw new Error(
          result?.message ||
            "Upload failed - server returned unsuccessful result"
        );
      }
    } catch (error: any) {
      console.error("❌ [FRONTEND DEBUG] Resume processing error:", error);
      console.error("❌ [FRONTEND DEBUG] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
        setIsProcessing(false);
      setIsUploading(false);
        setUploadProgress(0);
      setAiStage("");
        
        // Show specific error message based on error type
      if (error.message?.includes("Unsupported file type")) {
        console.log("❌ [FRONTEND DEBUG] File type error detected");
          toast({
            title: "❌ File Type Not Supported",
          description:
            "Please upload a PDF or Word document (.pdf, .doc, .docx)",
            variant: "destructive",
            duration: 6000,
          });
        } else {
        console.log("❌ [FRONTEND DEBUG] General processing error");
          toast({
            title: "🤖 Built-in AI Processing Failed",
          description:
            error.message ||
            "Resume analysis failed. The built-in parser couldn't extract data from your resume.",
            variant: "destructive",
            duration: 6000,
          });
        }
    }
  };

  const handleAutoFill = async (extractedData: ExtractedResumeData) => {
    try {
      // Extract userId that was stored during upload
      const userIdForApply = (extractedData as any)._userId || user?.id;

      console.log('🔄 Starting auto-fill with data:', {
        hasPersonalInfo: !!extractedData?.personalInfo,
        hasSkills: !!extractedData?.skills,
        hasExperience: !!extractedData?.experience,
        hasEducation: !!extractedData?.education,
        userId: userIdForApply
      });

      if (!userIdForApply) {
        throw new Error('User ID not available. Please try uploading the resume again.');
      }

      // Check if profile already has data
      const hasExistingData = 
        profile?.personalInfo?.fullName ||
        profile?.education?.length > 0 ||
        profile?.experience?.length > 0 ||
        profile?.skills?.length > 0;

      if (hasExistingData) {
        // Show confirmation dialog
        const confirmed = window.confirm(
          '⚠️ Your profile already contains data.\n\n' +
          'Auto-filling will OVERWRITE your existing:\n' +
          '• Personal Information\n' +
          '• Education\n' +
          '• Work Experience\n' +
          '• Skills\n' +
          '• Projects\n' +
          '• Certifications\n\n' +
          'Do you want to continue and overwrite your current profile data?'
        );

        if (!confirmed) {
          toast({
            title: "Auto-Fill Cancelled",
            description: "Your existing profile data has been preserved.",
            duration: 3000,
          });
          return;
        }
      }

    toast({
      title: "🤖 AI Agent Working...",
      description:
        "I'm now filling your profile sections with the extracted data.",
      duration: 3000,
    });

    const success = await applyExtractedData(extractedData, userIdForApply);
      
      if (success) {
        console.log('✅ Auto-fill completed successfully');
        setCurrentFile(null);
        setUploadProgress(0);
        setIsProcessing(false);
        
        // Show success toast with details
        toast({
          title: "✨ Profile Auto-Filled!",
          description: "I've successfully updated your profile sections. Check Personal Info, Education, Experience, Skills, and more!",
          duration: 5000,
        });
        
        // Optional: Add a follow-up toast with instructions
        setTimeout(() => {
          toast({
            title: "📝 Next Steps",
            description: "Review and edit the auto-filled information in each section. You can always make changes!",
            duration: 4000,
          });
        }, 2000);
      } else {
        throw new Error('applyExtractedData returned false');
      }
    } catch (error) {
      console.error('❌ Error applying extracted data:', error);
      console.error('📋 Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
        extractedData: extractedData
      });

      setCurrentFile(null);
      setUploadProgress(0);
      setIsProcessing(false);
      
      toast({
        title: "Auto-Fill Failed",
        description: error?.message || "Failed to apply extracted data. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleDelete = async () => {
    try {
      const success = await deleteResume();
      if (success) {
        toast({
          title: "Resume Deleted",
          description: "Your resume has been successfully deleted.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentResume = profile?.resumeData;

  // Add authentication loading state
  if (authLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Add authentication check
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground mb-4">
                Please sign in to upload and analyze your resume.
              </p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Add loading state for profile initialization
  if (!profile && profileLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Processing State */}
      {isProcessing && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardContent className="pt-6">
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="relative">
                  <Bot className="h-8 w-8 text-primary animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-primary">
                    AI Agent Processing
                  </h3>
                  <p className="text-sm text-muted-foreground">{aiStage}</p>
                </div>
              </div>
              
              <Progress value={uploadProgress} className="h-3" />
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  AI is analyzing your professional background...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Area */}
      {!isProcessing && !currentResume && !currentFile && (
        <Card>
          <CardContent className="pt-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive 
                  ? "border-primary bg-primary/10 scale-[1.02]" 
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragActive
                      ? "Drop your resume here"
                      : "Upload Resume for AI Analysis"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    AI will automatically extract and fill your profile
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    PDF
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    DOC
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    DOCX
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Up to 10MB
                  </Badge>
                </div>
                
                <Button size="lg" className="px-8">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Resume
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Preview */}
      {currentFile && !isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{currentFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentFile(null);
                  setUploadProgress(0);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Resume Display */}
      {currentResume && !isProcessing && (
        <div className="space-y-4">
          <ResumeFilePreview
            filePath={
              currentResume.storagePath ||
              `user-uploads/${currentResume.filename}`
            }
            fileName={currentResume.filename}
            fileSize={currentResume.fileSize || 0}
            uploadDate={currentResume.uploadDate}
            onDelete={handleDelete}
          />
          
          {/* Upload New Resume */}
          <Card>
            <CardContent className="pt-6">
              <div {...getRootProps()} className="cursor-pointer">
                <input {...getInputProps()} />
                <Button variant="outline" className="w-full" size="lg">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New Resume
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SimpleResumeUpload;
