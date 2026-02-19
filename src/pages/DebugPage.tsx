import Container from "@/components/ui/Container";
import SupabaseDebug from "@/components/debug/SupabaseDebug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Settings } from "lucide-react";

export default function DebugPage() {
  return (
    <Container className="py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Bug className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">System Debug & Testing</CardTitle>
            <p className="text-muted-foreground">
              Test and debug Supabase connectivity, edge functions, and database operations
            </p>
          </CardHeader>
        </Card>

        {/* Debug Tools */}
        <div className="grid grid-cols-1 gap-6">
          <SupabaseDebug />
          
          {/* Additional Debug Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Debug Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <h4 className="font-medium">Common Issues & Solutions:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>Database Connection Fails:</strong> Check internet connection and Supabase project status</li>
                  <li><strong>Authentication Issues:</strong> Make sure you're logged in and have proper permissions</li>
                  <li><strong>Storage Access Problems:</strong> Verify RLS policies are set up correctly for the resume-files bucket</li>
                  <li><strong>Edge Function Errors:</strong> Check function logs in Supabase dashboard and ensure GROQ_API_KEY is set</li>
                  <li><strong>Table Access Denied:</strong> Confirm RLS policies allow your user to access the required tables</li>
                </ul>
              </div>
              
              <div className="text-sm space-y-2">
                <h4 className="font-medium">How to Use This Page:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Click "Run System Tests" to check all Supabase services</li>
                  <li>Review any failed tests and their error messages</li>
                  <li>Green tests mean everything is working correctly</li>
                  <li>Red tests indicate issues that need to be resolved</li>
                  <li>Yellow warnings are non-critical but worth checking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}