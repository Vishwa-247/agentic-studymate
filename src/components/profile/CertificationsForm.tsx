import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Award, ExternalLink } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Certification } from "@/types/profile";
import { useToast } from "@/hooks/use-toast";

const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuing organization is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type CertificationFormData = z.infer<typeof certificationSchema>;

export default function CertificationsForm() {
  const { profile, updateProfile, isLoading } = useProfile();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
    },
  });

  const onSubmit = async (data: CertificationFormData) => {
    try {
      const currentCertifications = profile?.certifications || [];
      let updatedCertifications;

      const certificationData: Certification = {
        ...(data as Required<CertificationFormData>),
        id: editingId || Date.now().toString(),
      };

      if (editingId) {
        updatedCertifications = currentCertifications.map(cert =>
          cert.id === editingId ? certificationData : cert
        );
      } else {
        updatedCertifications = [...currentCertifications, certificationData];
      }

      await updateProfile({ certifications: updatedCertifications });
      
      form.reset();
      setEditingId(null);
      setShowForm(false);
      
      toast({
        title: "Success",
        description: editingId ? "Certification updated successfully" : "Certification added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save certification",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (certification: Certification) => {
    form.reset(certification);
    setEditingId(certification.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const updatedCertifications = profile?.certifications?.filter(cert => cert.id !== id) || [];
      await updateProfile({ certifications: updatedCertifications });
      toast({
        title: "Success",
        description: "Certification deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete certification",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    form.reset();
    setEditingId(null);
    setShowForm(false);
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Certifications</h2>
          <p className="text-muted-foreground">
            Add your professional certifications and credentials to showcase your expertise.
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Certification
          </Button>
        )}
      </div>

      {/* Certifications List */}
      <div className="space-y-4">
        {profile?.certifications?.map((certification) => (
          <Card key={certification.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{certification.name}</h3>
                      {certification.credentialUrl && (
                        <a 
                          href={certification.credentialUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {certification.expiryDate && isExpired(certification.expiryDate) && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{certification.issuer}</p>
                    <p className="text-sm text-muted-foreground">
                      Issued: {certification.issueDate}
                      {certification.expiryDate && ` • Expires: ${certification.expiryDate}`}
                    </p>
                    {certification.credentialId && (
                      <p className="text-sm text-muted-foreground">
                        Credential ID: {certification.credentialId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(certification)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(certification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Certification" : "Add Certification"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certification Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="AWS Certified Solutions Architect" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issuer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issuing Organization *</FormLabel>
                        <FormControl>
                          <Input placeholder="Amazon Web Services" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Date *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jan 2023" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input placeholder="Jan 2026" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="credentialId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credential ID</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC123DEF456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="credentialUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credential URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://verify.certification.com/123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : editingId ? "Update" : "Add"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}