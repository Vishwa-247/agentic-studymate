import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2, Database, Cog, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

export default function SupabaseDebug() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    const testResults: TestResult[] = [];

    // Test 1: Supabase Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      testResults.push({
        name: 'Database Connection',
        status: error ? 'fail' : 'pass',
        message: error ? `Connection failed: ${error.message}` : 'Connected successfully',
        details: error ? error.details : 'Can query profiles table'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Database Connection',
        status: 'fail',
        message: `Connection error: ${error.message}`,
        details: 'Failed to connect to Supabase'
      });
    }

    // Test 2: Authentication
    try {
      const { data: { user } } = await supabase.auth.getUser();
      testResults.push({
        name: 'Authentication',
        status: user ? 'pass' : 'warning',
        message: user ? `Authenticated as ${user.email}` : 'Not authenticated',
        details: user ? `User ID: ${user.id}` : 'Please log in to test authenticated features'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Authentication',
        status: 'fail',
        message: `Auth error: ${error.message}`
      });
    }

    // Test 3: Storage Access
    try {
      const { data, error } = await supabase.storage.listBuckets();
      const resumeBucket = data?.find(bucket => bucket.name === 'resume-files');
      testResults.push({
        name: 'Storage Access',
        status: error ? 'fail' : resumeBucket ? 'pass' : 'warning',
        message: error ? `Storage error: ${error.message}` : 
                 resumeBucket ? 'Resume bucket accessible' : 'Resume bucket not found',
        details: resumeBucket ? 'resume-files bucket exists and is accessible' : 'Check bucket configuration'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Storage Access',
        status: 'fail',
        message: `Storage test failed: ${error.message}`
      });
    }

    // Test 4: Edge Function - Resume Extractor
    try {
      const testFormData = new FormData();
      testFormData.append('test', 'true');
      
      const { data, error } = await supabase.functions.invoke('resume-extractor', {
        body: testFormData
      });
      
      testResults.push({
        name: 'Resume Extractor Function',
        status: error ? 'fail' : 'pass',
        message: error ? `Function error: ${error.message}` : 'Function is accessible',
        details: error ? 'Check function deployment and logs' : 'Edge function responds to requests'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Resume Extractor Function',
        status: 'fail',
        message: `Function test failed: ${error.message}`,
        details: 'Edge function may not be deployed or configured correctly'
      });
    }

    // Test 5: Database Tables
    const requiredTables = ['user_profiles', 'resume_extractions', 'user_resumes'] as const;
    for (const table of requiredTables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        testResults.push({
          name: `Table: ${table}`,
          status: error ? 'fail' : 'pass',
          message: error ? `Table error: ${error.message}` : 'Table accessible',
          details: error ? 'Check table exists and RLS policies' : 'Table exists and is queryable'
        });
      } catch (error: any) {
        testResults.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: `Table test failed: ${error.message}`
        });
      }
    }

    setResults(testResults);
    setIsRunning(false);

    // Show summary toast
    const passCount = testResults.filter(r => r.status === 'pass').length;
    const totalCount = testResults.length;
    
    toast({
      title: "System Tests Complete",
      description: `${passCount}/${totalCount} tests passed`,
      variant: passCount === totalCount ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase System Diagnostics
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Test database connectivity, authentication, storage, and edge functions
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Cog className="h-4 w-4 mr-2" />
              Run System Tests
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Test Results</h4>
              <Badge variant="outline">
                {results.filter(r => r.status === 'pass').length}/{results.length} passed
              </Badge>
            </div>

            {results.map((result, index) => (
              <div key={index} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium text-sm">{result.name}</span>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                
                <p className="text-sm text-muted-foreground">{result.message}</p>
                
                {result.details && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    {result.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* System Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-3 w-3" />
            <span className="font-medium">System Information</span>
          </div>
          <p>• Supabase Project: jwmsgrodliegekbrhvgt</p>
          <p>• Storage Bucket: resume-files</p>
          <p>• Edge Functions: resume-extractor</p>
          <p>• Authentication: Enabled with RLS</p>
        </div>
      </CardContent>
    </Card>
  );
}