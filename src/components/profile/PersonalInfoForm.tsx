import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { PersonalInfo } from "@/types/profile";
import { useToast } from "@/hooks/use-toast";

const personalInfoSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  location: z.string().min(1, "Location is required"),
  linkedin: z.string().url("Invalid LinkedIn URL").optional().or(z.literal("")),
  github: z.string().url("Invalid GitHub URL").optional().or(z.literal("")),
  portfolio: z.string().url("Invalid portfolio URL").optional().or(z.literal("")),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface PersonalInfoFormProps {
  isEditing?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function PersonalInfoForm({ isEditing = true, onSave, onCancel }: PersonalInfoFormProps) {
  const { profile, updateProfile, isLoading } = useProfile();
  const { toast } = useToast();

  const form = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: profile?.personalInfo.fullName || "",
      email: profile?.personalInfo.email || "",
      phone: profile?.personalInfo.phone || "",
      location: profile?.personalInfo.location || "",
      linkedin: profile?.personalInfo.linkedin || "",
      github: profile?.personalInfo.github || "",
      portfolio: profile?.personalInfo.portfolio || "",
    },
  });
  
  // Update form when profile changes
  useEffect(() => {
    if (profile?.personalInfo) {
      form.reset({
        fullName: profile.personalInfo.fullName || "",
        email: profile.personalInfo.email || "",
        phone: profile.personalInfo.phone || "",
        location: profile.personalInfo.location || "",
        linkedin: profile.personalInfo.linkedin || "",
        github: profile.personalInfo.github || "",
        portfolio: profile.personalInfo.portfolio || "",
      });
    }
  }, [profile?.personalInfo, form]);

  const handleSubmit = async (data: PersonalInfoFormData) => {
    try {
      await updateProfile({
        personalInfo: data as PersonalInfo,
      });
      
      toast({
        title: "Success",
        description: "Personal information updated successfully!",
      });
      
      if (onSave) onSave();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to update personal information: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    if (onCancel) onCancel();
  };

  if (!isEditing && profile?.personalInfo) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Full Name</h3>
            <p className="text-base">{profile.personalInfo.fullName || "Not specified"}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Email</h3>
            <p className="text-base">{profile.personalInfo.email || "Not specified"}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Phone</h3>
            <p className="text-base">{profile.personalInfo.phone || "Not specified"}</p>
          </div>
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-1">Location</h3>
            <p className="text-base">{profile.personalInfo.location || "Not specified"}</p>
          </div>
          {profile.personalInfo.linkedin && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">LinkedIn</h3>
              <p className="text-base text-blue-600 hover:underline">
                <a href={profile.personalInfo.linkedin} target="_blank" rel="noopener noreferrer">
                  {profile.personalInfo.linkedin}
                </a>
              </p>
            </div>
          )}
          {profile.personalInfo.github && (
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">GitHub</h3>
              <p className="text-base text-blue-600 hover:underline">
                <a href={profile.personalInfo.github} target="_blank" rel="noopener noreferrer">
                  {profile.personalInfo.github}
                </a>
              </p>
            </div>
          )}
          {profile.personalInfo.portfolio && (
            <div className="md:col-span-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Portfolio</h3>
              <p className="text-base text-blue-600 hover:underline">
                <a href={profile.personalInfo.portfolio} target="_blank" rel="noopener noreferrer">
                  {profile.personalInfo.portfolio}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="New York, NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Online Profiles (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Profile</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="portfolio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://johndoe.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isEditing && (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}