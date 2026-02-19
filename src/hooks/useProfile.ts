import { profileService } from "@/api/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ProfileFormData, UserProfile } from "@/types/profile";
import { ExtractedResumeData } from "@/types/resume";
import { useCallback, useEffect, useState } from "react";

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize empty profile
  const initializeProfile = useCallback((): UserProfile => ({
    userId: user?.id || "",
    personalInfo: {
      fullName: user?.user_metadata?.full_name || "",
      email: user?.email || "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: "",
    },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    completionPercentage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), [user]);

  const loadProfile = useCallback(async () => {
    console.log('🔄 [PROFILE DEBUG] loadProfile called:', { 
      hasUser: !!user, 
      userId: user?.id 
    });
    
    if (!user) {
      console.log('❌ [PROFILE DEBUG] No user in loadProfile');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('📡 [PROFILE DEBUG] Calling profileService.getProfile...');
      const profileData = await profileService.getProfile(user.id);
      console.log('✅ [PROFILE DEBUG] Profile loaded successfully:', profileData);
      
      // Get resume data if available
      const resumeData = await profileService.getUserResume(user.id);
      if (resumeData) {
        profileData.resumeData = {
          filename: resumeData.filename,
          uploadDate: resumeData.upload_date,
          storagePath: resumeData.file_path, // Use the correct storage path from backend
          fileSize: resumeData.file_size,
          parsedData: resumeData.parsed_data,
          extractedText: resumeData.extracted_text,
          aiAnalysis: resumeData.ai_analysis,
          skillGaps: resumeData.skill_gaps,
          recommendations: resumeData.recommendations,
        };
      }
      
      setProfile(profileData);
    } catch (error) {
      console.error('❌ [PROFILE DEBUG] Failed to load profile:', error);
      setError("Failed to load profile");
      // Initialize fallback profile
      console.log('🔄 [PROFILE DEBUG] Initializing fallback profile...');
      setProfile(initializeProfile());
    } finally {
      setIsLoading(false);
    }
  }, [user, initializeProfile]);

  useEffect(() => {
    console.log('🔄 [PROFILE DEBUG] useEffect triggered:', { 
      hasUser: !!user, 
      userId: user?.id,
      userEmail: user?.email 
    });
    if (user) {
      console.log('👤 [PROFILE DEBUG] User found, loading profile...');
      loadProfile();
    } else {
      console.log('❌ [PROFILE DEBUG] No user found');
    }
  }, [user, loadProfile]);

  const updateProfile = async (updates: Partial<ProfileFormData>) => {
    console.log('🔄 updateProfile called:', { 
      userId: user?.id, 
      hasProfile: !!profile,
      updateKeys: Object.keys(updates)
    });
    
    if (!user?.id) {
      const error = new Error('Authentication required - please sign in again');
      console.error('❌ updateProfile failed: no authenticated user');
      throw error;
    }

    setIsLoading(true);
    
    try {
      const updatedProfile = await profileService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
      
      console.log('✅ Profile updated successfully');
      
    } catch (error) {
      console.error('❌ updateProfile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadResume = async (file: File, jobRole?: string) => {
    console.log("📤 uploadResume called:", {
      hasProfile: !!profile,
      hasUser: !!user,
      userId: user?.id,
      profileUserId: profile?.userId,
      userObject: user,
      userKeys: user ? Object.keys(user) : "No user object",
    });

    // Prioritize direct Supabase session check for more reliable user ID
    let userId = null;

    console.log(
      "🔍 [FRONTEND DEBUG] Checking Supabase session directly for user ID..."
    );
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("❌ [FRONTEND DEBUG] Supabase session error:", error);
      } else if (session?.user?.id) {
        userId = session.user.id;
        console.log(
          "✅ [FRONTEND DEBUG] Got user ID from Supabase session:",
          userId
        );
      }
    } catch (error) {
      console.error(
        "❌ [FRONTEND DEBUG] Error checking Supabase session:",
        error
      );
    }

    // Fallback to useAuth user if Supabase session fails
    if (!userId && user?.id) {
      userId = user.id;
      console.log(
        "⚠️ [FRONTEND DEBUG] Using useAuth user ID as fallback:",
        userId
      );
    }

    if (!userId) {
      console.error(
        "❌ [FRONTEND DEBUG] No userId found in profile or user! (from useProfile.ts)"
      );
      console.error("❌ [FRONTEND DEBUG] User object in useProfile:", user);
      console.error(
        "❌ [FRONTEND DEBUG] This should NOT happen with your auth state!"
      );
      toast({
        title: "Authentication Error",
        description: "Please sign in again to upload your resume.",
        variant: "destructive",
      });
      return;
    }

    console.log(
      "✅ [FRONTEND DEBUG] useProfile.ts - User ID validation passed:",
      userId
    );

    // Remove profile dependency - we only need user.id for upload
    console.log(
      "✅ [FRONTEND DEBUG] Authentication check passed, proceeding with upload"
    );

    setIsLoading(true);

    try {
      console.log("📤 Uploading resume to backend...");
      const result = await profileService.uploadResume(file, userId);

      if (result.success) {
        console.log("✅ Resume uploaded successfully");
        console.log("📋 User ID in result:", result.user_id || userId);

        // Ensure userId is in the result for later use
        result.user_id = result.user_id || userId;

        toast({
          title: "Resume Uploaded!",
          description: "Your resume has been processed and analyzed.",
        });

        // Reload profile to get updated data
        await loadProfile();
        return result;
      } else {
        throw new Error(result?.message || "Failed to extract profile data");
      }
    } catch (error) {
      console.error("❌ Failed to upload resume:", error);
      console.error("📋 Full error:", {
        message: error?.message,
        stack: error?.stack,
        userId: userId,
        fileName: file.name,
      });

      toast({
        title: "Error",
        description:
          error?.message || "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const applyExtractedData = async (extractedData: ExtractedResumeData, explicitUserId?: string) => {
    // Use explicit userId if provided, otherwise fall back to context user
    const userIdToUse = explicitUserId || user?.id;

    if (!userIdToUse || !extractedData) {
      console.error('❌ [APPLY DEBUG] Missing userId or extractedData:', {
        hasUserId: !!userIdToUse,
        hasExtractedData: !!extractedData,
        contextUser: user?.id,
        explicitUserId: explicitUserId
      });
      return false;
    }

    console.log('🔄 [APPLY DEBUG] Starting applyExtractedData with userId:', userIdToUse);
    
    setIsLoading(true);
    try {
      const success = await profileService.applyExtractedData(userIdToUse, extractedData);
      
      if (success) {
        // Reload profile to get updated data
        await loadProfile();
        
        toast({
          title: "Success! 🎉",
          description: "Your profile has been automatically filled with extracted data from your resume.",
        });
        
        return true;
      } else {
        throw new Error('Failed to apply extracted data');
      }
    } catch (error) {
      console.error("Failed to apply extracted data:", error);
      toast({
        title: "Error", 
        description: "Failed to apply extracted data. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteResume = async () => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const success = await profileService.deleteResume(user.id);
      
      if (success) {
        // Reload profile to remove resume data
        await loadProfile();
        
        toast({
          title: "Resume Deleted",
          description: "Your resume has been successfully deleted.",
        });
        
        return true;
      } else {
        throw new Error('Failed to delete resume');
      }
    } catch (error) {
      console.error("Failed to delete resume:", error);
      toast({
        title: "Error",
        description: "Failed to delete resume. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    uploadResume,
    applyExtractedData,
    deleteResume,
    loadProfile,
  };
};
