import React from 'react';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { CircularScore } from './CircularScore';
import { SearchabilityChecklist } from './SearchabilityChecklist';
import { SkillsComparisonTable } from './SkillsComparisonTable';
import { AiSuggestions } from './AiSuggestions';
import { StarDeepDive } from './StarDeepDive';
import { JobRecommendations } from '@/components/job/JobRecommendations';

interface EnhancedAnalysisResultsProps {
  results: any;
  jobRole: string;
  resumeName: string;
  extractedText?: string;
}

export const EnhancedAnalysisResults: React.FC<EnhancedAnalysisResultsProps> = ({ 
  results, 
  jobRole,
  resumeName,
  extractedText
}) => {
  const score = results.overall_score || 0;
  const matchLevel = score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  
  // Build hard skills from keyword analysis with real frequency data
  const keywordAnalysis = results.keyword_analysis || {};
  const matchingKeywords = keywordAnalysis.matching_keywords || [];
  const missingKeywords = keywordAnalysis.missing_keywords || [];
  
  const hardSkills = [
    ...matchingKeywords.map((k: string) => ({ 
      name: k, foundInResume: true, frequencyInJob: 1 
    })),
    ...missingKeywords.map((k: string) => ({ 
      name: k, foundInResume: false, frequencyInJob: 1 
    }))
  ];

  // Extract score components (all from backend)
  const atsScore = results.ats_score || 0;
  const actionVerbScore = results.action_verb_score || 0;
  const starScore = results.star_methodology_score || 0;
  const keywordDensity = keywordAnalysis.keyword_density || 0;
  const skillRelevance = results.skill_validation?.relevance_score || 0;

  // Dynamic recruiter tips from AI (with fallback)
  const recruiterTips: { label: string; status: 'success' | 'warning' | 'error'; description: string }[] = 
    (results.recruiter_tips && results.recruiter_tips.length > 0)
      ? results.recruiter_tips.map((t: any) => ({
          label: t.label || 'Tip',
          status: (t.status === 'success' || t.status === 'warning' || t.status === 'error') ? t.status : 'warning',
          description: t.description || ''
        }))
      : [
          { label: "Job Level Match", status: "warning" as const, description: "Could not determine years-of-experience match." },
          { label: "Measurable Results", status: score >= 60 ? "success" as const : "warning" as const, description: score >= 60 ? "Found mentions of measurable results." : "Add more quantifiable achievements." },
          { label: "Resume Tone", status: "success" as const, description: "Professional tone detected." }
        ];

  // STAR bullet analysis
  const bulletAnalysis = results.star_analysis?.bullet_analysis || [];

  return (
    <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
      
      {/* LEFT SIDEBAR: SCORE CARD */}
      <div className="col-span-12 md:col-span-3 space-y-6">
        <Card className="p-6 text-center bg-card shadow-sm border sticky top-4">
          <h2 className="text-lg font-bold text-foreground mb-6">Match Rate</h2>
          <div className="mb-6 flex justify-center">
            <CircularScore score={score} size="lg" showLabel={false} />
          </div>
          <div className={`
            inline-block px-4 py-1 rounded-full text-sm font-bold mb-4
            ${score >= 80 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
          `}>
            {matchLevel} Match
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed text-left">
            Calculated from ATS compliance, keyword density, action verbs, STAR method, and skill relevance.
          </p>
          
          <div className="mt-8 space-y-4 text-left">
             <ScoreBar label="ATS Compliance" score={atsScore} color="bg-blue-500" />
             <ScoreBar label="Keyword Match" score={keywordDensity} color="bg-indigo-500" />
             <ScoreBar label="Action Verbs" score={actionVerbScore} color="bg-purple-500" />
             <ScoreBar label="STAR Method" score={starScore} color="bg-amber-500" />
             <ScoreBar label="Skill Relevance" score={skillRelevance} color="bg-emerald-500" />
          </div>
        </Card>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="col-span-12 md:col-span-9">
        <div className="bg-card border rounded-xl shadow-sm mb-6 p-6">
           <h1 className="text-2xl font-bold text-foreground mb-2">{jobRole || "Job Position"}</h1>
           <p className="text-muted-foreground">Resume: <span className="font-medium text-foreground">{resumeName}</span></p>
        </div>

        <Tabs defaultValue="searchability" className="w-full">
          <TabsList className="bg-card w-full justify-start border-b rounded-none h-14 p-0 mb-6 sticky top-0 z-10 flex-wrap">
            <TabTrigger value="searchability" label="Searchability" />
            <TabTrigger value="hardskills" label="Hard Skills" />
            <TabTrigger value="softskills" label="Soft Skills" />
            <TabTrigger value="star" label="STAR Deep Dive" />
            <TabTrigger value="recruitertips" label="Recruiter Tips" />
            <TabTrigger value="formatting" label="Formatting" />
            <TabTrigger value="jobs" label="Job Matches" />
          </TabsList>

          {/* TAB: SEARCHABILITY */}
          <TabsContent value="searchability" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <InfoBanner title="About Searchability" text="Refers to how easily your resume can be found by recruiters using specific keywords. Crucial for getting noticed." />
             <SearchabilityChecklist analysis={results} />
          </TabsContent>

          {/* TAB: HARD SKILLS */}
          <TabsContent value="hardskills" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <InfoBanner title="About Hard Skills" text="Specific abilities/knowledge (e.g., software proficiency). High impact on score." />
             <SkillsComparisonTable skills={hardSkills} />
          </TabsContent>

          {/* TAB: SOFT SKILLS */}
          <TabsContent value="softskills" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <InfoBanner title="About Soft Skills" text="Personal attributes like teamwork/communication. Medium impact on score." />
             <Card className="p-6">
                <h3 className="font-bold text-foreground mb-4">Soft Skills Analysis</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                   {results.sections_analysis?.summary?.feedback || "No soft skills analysis available."}
                </p>
                <div className="mt-6">
                  <h4 className="font-semibold mb-3">STAR Method Feedback</h4>
                  <AiSuggestions suggestions={results.recommendations || []} title="" />
                </div>
             </Card>
          </TabsContent>

          {/* TAB: STAR DEEP DIVE */}
          <TabsContent value="star" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <InfoBanner title="STAR Method Analysis" text="Each bullet point in your resume scored for Situation, Task, Action, and Result structure. Click a bullet to see improvement tips." />
             <StarDeepDive bulletAnalysis={bulletAnalysis} overallScore={starScore} />
          </TabsContent>

          {/* TAB: RECRUITER TIPS */}
          <TabsContent value="recruitertips" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            <InfoBanner title="About Recruiter Tips" text="Suggestions to improve appeal based on industry standards." />
             <Card className="p-6">
                <ul className="space-y-4">
                  {recruiterTips.map((tip, idx) => (
                    <RecruiterTip key={idx} label={tip.label} status={tip.status} description={tip.description} />
                  ))}
                </ul>
             </Card>
          </TabsContent>

          {/* TAB: FORMATTING */}
          <TabsContent value="formatting" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
            <InfoBanner title="About Formatting" text="Ensures your resume is ATS-friendly and properly structured for both human readers and automated systems. Each section is analyzed independently." />
             <Card className="p-6 bg-orange-50/50 border-orange-100 mb-4">
               <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-orange-500" /> AI Formatting Feedback
               </h3>
               <p className="text-sm text-muted-foreground mb-0 whitespace-pre-line leading-relaxed">
                 {results.formatting_feedback || "General formatting looks okay, but check for manual errors."}
               </p>
             </Card>
             <div className="grid grid-cols-1 gap-4">
               <FormattingCheck
                 title="Contact Information"
                 passed={Boolean(results.sections_analysis?.contact_info?.score >= 70)}
                 tip={results.sections_analysis?.contact_info?.feedback || "Include name, email, phone, LinkedIn, and location."}
                 score={results.sections_analysis?.contact_info?.score}
               />
               <FormattingCheck
                 title="Professional Summary"
                 passed={Boolean(results.sections_analysis?.summary?.score >= 60)}
                 tip={results.sections_analysis?.summary?.feedback || "Add a 2-3 line summary tailored to the target role."}
                 score={results.sections_analysis?.summary?.score}
               />
               <FormattingCheck
                 title="Work Experience Section"
                 passed={Boolean(results.sections_analysis?.experience?.score >= 60)}
                 tip={results.sections_analysis?.experience?.feedback || "Use reverse chronological order with bullet points."}
                 score={results.sections_analysis?.experience?.score}
               />
               <FormattingCheck
                 title="Skills Section"
                 passed={Boolean(results.sections_analysis?.skills?.score >= 60)}
                 tip={results.sections_analysis?.skills?.feedback || "List skills in a dedicated section, categorized by type."}
                 score={results.sections_analysis?.skills?.score}
               />
               <FormattingCheck
                 title="Education Section"
                 passed={Boolean(results.sections_analysis?.education?.score >= 60)}
                 tip={results.sections_analysis?.education?.feedback || "Include degree, institution, and graduation date."}
                 score={results.sections_analysis?.education?.score}
               />
               <FormattingCheck
                 title="ATS Compatibility"
                 passed={atsScore >= 70}
                 tip={atsScore >= 70 ? "Resume appears ATS-compatible. Good use of standard headings." : "Use standard section headings (Experience, Education, Skills). Avoid tables, images, and multi-column layouts."}
                 score={atsScore}
               />
             </div>
          </TabsContent>

          {/* TAB: JOB MATCHES */}
          <TabsContent value="jobs" className="outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
             <JobRecommendations 
                jobRole={jobRole} 
                resumeText={extractedText || results.sections_analysis?.summary?.feedback || ""} 
             />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */

const TabTrigger = ({ value, label }: { value: string, label: string }) => (
  <TabsTrigger 
    value={value}
    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-14 text-muted-foreground data-[state=active]:text-primary font-medium text-sm"
  >
    {label}
  </TabsTrigger>
);

const ScoreBar = ({ label, score, color = "bg-primary" }: { label: string, score: number, color?: string }) => (
  <div className="w-full">
    <div className="flex justify-between text-xs font-semibold text-muted-foreground mb-1">
      <span>{label}</span>
      <span>{Math.round(score)}%</span>
    </div>
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(score, 100)}%` }}></div>
    </div>
  </div>
);

const InfoBanner = ({ title, text }: { title: string; text: string }) => (
  <div className="mb-6 bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 text-blue-800">
    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
    <div>
      <h4 className="font-bold text-sm mb-1">{title}</h4>
      <p className="text-sm">{text}</p>
    </div>
  </div>
);

const RecruiterTip = ({ label, status, description }: { label: string, status: 'success' | 'warning' | 'error', description: string }) => (
  <div className="flex gap-4 items-start pb-5 border-b last:border-0 last:pb-0">
    <div className="mt-1 shrink-0">
      {status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
      {status === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
      {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1.5">
        <h4 className="font-bold text-foreground text-sm">{label}</h4>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          status === 'success' ? 'bg-green-100 text-green-700' :
          status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>{status === 'success' ? 'GOOD' : status === 'warning' ? 'IMPROVE' : 'CRITICAL'}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

const FormattingCheck = ({ title, passed, tip, score }: { title: string, passed: boolean, tip: string, score?: number }) => (
  <Card className={`p-5 border ${passed ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {passed ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-sm text-foreground">{title}</h4>
          {score !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              score >= 70 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>{Math.round(score)}%</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{tip}</p>
      </div>
    </div>
  </Card>
);
