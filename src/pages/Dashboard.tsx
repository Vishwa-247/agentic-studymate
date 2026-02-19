import Chatbot from "@/components/Chatbot";
import OrchestratorCard from "@/components/OrchestratorCard";
import ServiceHealthMonitor from "@/components/debug/ServiceHealthMonitor";
import JobSearchTestCard from "@/components/job/JobSearchTestCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Container from "@/components/ui/Container";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { companies } from "@/data/companyProblems";
import { dsaTopics } from "@/data/dsaProblems";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  ArrowRight,
  BookOpen,
  Code,
  Loader2,
  Medal,
  MessageSquare,
  Sparkles,
  Target,
  User,
  Video,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showChatbot, setShowChatbot] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [recentCourses, setRecentCourses] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
  });

  type LatestMetrics = {
    created_at: string;
    overall_score: number;
    clarification_habit: number;
    structure: number;
    tradeoff_awareness: number;
    scalability_thinking: number;
    failure_awareness: number;
    adaptability: number;
  };

  const [latestMetrics, setLatestMetrics] = useState<LatestMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const loadLatestMetrics = useCallback(async (uid: string) => {
    setMetricsLoading(true);
    setMetricsError(null);
    try {
      const { data, error } = await supabase
        .from("interview_metrics")
        .select(
          "created_at, overall_score, clarification_habit, structure, tradeoff_awareness, scalability_thinking, failure_awareness, adaptability"
        )
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      setLatestMetrics((data?.[0] as any) ?? null);
    } catch (e) {
      console.error("Failed to load interview metrics:", e);
      setLatestMetrics(null);
      setMetricsError("No interview metrics yet.");
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    if (user?.id) loadLatestMetrics(user.id);
  }, [user?.id, loadLatestMetrics]);

  // Real-time listeners for courses, interviews, and profile updates
  useEffect(() => {
    if (!user) return;

    // Listen for course updates
    const courseChannel = supabase
      .channel("course-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courses",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadUserData();
        }
      )
      .subscribe();

    // Listen for profile updates
    const profileChannel = supabase
      .channel("profile-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_profiles",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadUserData(); // Refresh profile data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(courseChannel);
      supabase.removeChannel(profileChannel);
    };
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (profile) {
        // Get the latest completion percentage from database function
        try {
          const { data: completionResult } = await supabase.rpc(
            "calculate_profile_completion",
            {
              user_profile_id: user?.id,
            }
          );

          // Update the profile with the latest completion percentage
          const updatedProfile = {
            ...profile,
            completion_percentage:
              completionResult || profile.completion_percentage || 0,
          };

          setUserProfile(updatedProfile);
        } catch (completionError) {
          console.error(
            "Failed to get completion percentage:",
            completionError
          );
          setUserProfile(profile);
        }
      }

      // Load recent courses
      const { data: courses } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (courses) {
        setRecentCourses(courses);
        setCourseStats({
          total: courses.length,
          completed: courses.filter((c) => c.status === "completed").length,
          inProgress: courses.filter(
            (c) => c.status === "generating" || c.status === "draft"
          ).length,
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  // Real interviews data - empty by default, will be populated from backend
  const displayInterviews: any[] = [];
  const recentInterviews = displayInterviews.slice(0, 3);

  // DSA Analytics calculations (static totals)
  const totalDSAProblems = dsaTopics.reduce(
    (total, topic) => total + topic.totalProblems,
    0
  );
  const solvedDSAProblems = dsaTopics.reduce(
    (total, topic) => total + topic.solvedProblems,
    0
  );
  const totalCompanyProblems = companies.reduce(
    (total, company) => total + company.totalProblems,
    0
  );
  const solvedCompanyProblems = companies.reduce(
    (total, company) => total + company.solvedProblems,
    0
  );
  const totalAllDSAProblems = totalDSAProblems + totalCompanyProblems;
  const totalSolvedDSAProblems = solvedDSAProblems + solvedCompanyProblems;
  const dsaProgressPercentage =
    totalAllDSAProblems > 0
      ? Math.round((totalSolvedDSAProblems / totalAllDSAProblems) * 100)
      : 0;

  // Real DSA data from Supabase
  const [realDSAData, setRealDSAData] = useState({
    solvedProblems: 0,
    totalFeedbacks: 0,
    recentFeedbacks: [] as any[],
    progressPercentage: 0,
  });

  const loadRealDSAProgress = useCallback(async () => {
    if (!user) return;
    try {
      const { data: feedbacks, error } = await supabase
        .from("dsa_feedbacks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const uniqueProblems = new Set(
        (feedbacks || []).map((f) => f.problem_name)
      );
      const solvedCount = uniqueProblems.size;
      const percentage =
        totalAllDSAProblems > 0
          ? Math.round((solvedCount / totalAllDSAProblems) * 100)
          : 0;

      setRealDSAData({
        solvedProblems: solvedCount,
        totalFeedbacks: feedbacks?.length || 0,
        recentFeedbacks: (feedbacks || []).slice(0, 5),
        progressPercentage: percentage,
      });
    } catch (e) {
      console.error("Failed to load DSA progress:", e);
    }
  }, [user, totalAllDSAProblems]);

  useEffect(() => {
    if (user) loadRealDSAProgress();
  }, [user, loadRealDSAProgress]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("dashboard-dsa-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dsa_feedbacks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadRealDSAProgress();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, loadRealDSAProgress]);

  // Recent DSA activity (solved problems from topics and companies)
  const recentDSAActivity = [
    ...dsaTopics.slice(0, 2).map((topic) => ({
      type: "topic",
      name: topic.title,
      progress:
        topic.totalProblems > 0
          ? Math.round((topic.solvedProblems / topic.totalProblems) * 100)
          : 0,
      solved: topic.solvedProblems,
      total: topic.totalProblems,
      id: topic.id,
    })),
    ...companies.slice(0, 1).map((company) => ({
      type: "company",
      name: company.title,
      progress:
        company.totalProblems > 0
          ? Math.round((company.solvedProblems / company.totalProblems) * 100)
          : 0,
      solved: company.solvedProblems,
      total: company.totalProblems,
      id: company.id,
    })),
  ];

  const WelcomeCard = () => (
    <Card className="col-span-full p-6 text-center">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">
          Welcome to StudyMate, {user?.user_metadata?.full_name || "Student"}!
        </CardTitle>
        <CardDescription className="text-base">
          Your personalized learning and interview practice platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="max-w-md mx-auto">
          <p className="mb-4">
            Get started by building your professional profile or practice
            interview
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to="/profile-builder">
                Build Profile <User className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/mock-interview">
                Start Interview <Video className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const showWelcomeCard = displayInterviews.length === 0;

  return (
    <Container>
      <div className="py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              StudyMate Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your learning progress and interview performance
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              ← Back
            </Button>
            <Button asChild>
              <Link to="/profile-builder">Build Profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/mock-interview">AI Interview Coach</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowChatbot(!showChatbot)}
              className="flex items-center gap-1"
            >
              <MessageSquare size={16} />
              <span>Help</span>
            </Button>
          </div>
        </div>

        {showChatbot && (
          <div className="mb-8">
            <Chatbot />
          </div>
        )}

        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="dsa">DSA Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* AI Orchestrator Recommendation - TOP PRIORITY */}
            {user?.id && (
              <div className="animate-fade-up">
                <OrchestratorCard userId={user.id} />
              </div>
            )}

            {/* Minimal Overview for standard users */}
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Focus for today
                  </CardTitle>
                  <CardDescription>
                    Your AI mentor suggests focusing on your interview skills.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link to="/showcase">
                      View System Mission Control <Activity className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Profile Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    <div className="text-2xl font-bold">
                      {userProfile?.completion_percentage || 0}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Generated Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-primary" />
                    <div className="text-2xl font-bold">
                      {courseStats.total}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    AI Interviews
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Video className="mr-2 h-4 w-4 text-primary" />
                    <div className="text-2xl font-bold">
                      {displayInterviews.length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Profile Strength
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Medal className="mr-2 h-4 w-4 text-primary" />
                    <div className="text-2xl font-bold">
                      {userProfile?.profile_strength_score || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    DSA Problems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Code className="mr-2 h-4 w-4 text-primary" />
                    <div className="text-2xl font-bold">
                      {realDSAData.solvedProblems}/{totalAllDSAProblems}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Profile Building</CardTitle>
                  <CardDescription>
                    Complete your professional profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userProfile && userProfile.completion_percentage > 0 ? (
                    // Show profile summary when profile exists
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <User className="h-8 w-8 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-medium mb-1">
                            {userProfile.full_name || "Anonymous User"}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {userProfile.professional_summary?.substring(
                              0,
                              100
                            ) || "No summary available"}
                            {userProfile.professional_summary &&
                              userProfile.professional_summary.length > 100 &&
                              "..."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Profile Completion
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {userProfile.completion_percentage}%
                          </p>
                        </div>
                        <Button asChild>
                          <Link to="/profile-builder">
                            {userProfile.completion_percentage === 100
                              ? "View Profile"
                              : "Complete Profile"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Show default message when no profile
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="mb-4">
                        <User className="h-12 w-12 mx-auto text-primary mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Build Your Profile
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a comprehensive professional profile to get
                          personalized recommendations
                        </p>
                      </div>
                      <Button asChild>
                        <Link to="/profile-builder">
                          Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Interviews</CardTitle>
                  <CardDescription>
                    Your latest practice sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentInterviews.length > 0 ? (
                    <div className="space-y-6">
                      {recentInterviews.map((interview) => (
                        <div
                          key={interview.id}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium">
                              {interview.job_role}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(
                                interview.created_at
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium text-muted-foreground">
                              Pending
                            </span>
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/interview-result/${interview.id}`}>
                                <ArrowRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link
                          to="/dashboard?tab=interviews"
                          onClick={() => setActiveTab("interviews")}
                        >
                          View All AI Interviews
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No interviews yet. Start your first mock interview!
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {showWelcomeCard && <WelcomeCard />}
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Analytics</CardTitle>
                  <CardDescription>
                    Your course generation statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {courseStats.inProgress > 0 && (
                      <div className="p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
                          <Activity className="h-4 w-4 animate-pulse" />
                          <span className="text-sm font-medium">
                            Course Generating...
                          </span>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-500">
                          Your course is being created. This usually takes 40-60
                          seconds.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {courseStats.total}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Courses
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {courseStats.completed}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-amber-500">
                          {courseStats.inProgress}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          In Progress
                        </div>
                      </div>
                    </div>
                    <Button className="w-full" asChild>
                      <Link to="/course-generator">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Generate New Course
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Courses</CardTitle>
                  <CardDescription>
                    Your latest generated courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentCourses.length > 0 ? (
                    <div className="space-y-4">
                      {recentCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {course.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {course.difficulty} • {course.purpose}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(course.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                course.status === "completed"
                                  ? "bg-primary/10 text-primary"
                                  : course.status === "generating"
                                  ? "bg-secondary text-secondary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {course.status}
                            </span>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/course/${course.id}`}>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link to="/courses">View All Courses</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto text-primary mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No Courses Yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate your first course to get started with
                        personalized learning
                      </p>
                      <Button asChild>
                        <Link to="/course-generator">
                          Generate Course{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interviews">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayInterviews.map((interview) => (
                <Card key={interview.id}>
                  <CardHeader>
                    <CardTitle>{interview.job_role}</CardTitle>
                    <CardDescription>
                      Tech Stack: {interview.tech_stack}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded-full ${
                          interview.completed
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {interview.completed ? "Completed" : "In Progress"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">
                        Overall Score
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          Math.random() >= 0.8
                            ? "text-green-500"
                            : Math.random() >= 0.5
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        {Math.floor(Math.random() * 40 + 60)}%
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link to={`/interview-result/${interview.id}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}

              <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">New Mock Interview</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Practice with AI-powered interview coaching
                </p>
                <Button asChild>
                  <Link to="/mock-interview">
                    Start Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dsa">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>DSA Progress Overview</CardTitle>
                  <CardDescription>
                    Your Data Structures and Algorithms practice statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {dsaProgressPercentage}%
                      </span>
                    </div>
                    <Progress value={realDSAData.progressPercentage} />
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {realDSAData.solvedProblems}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Problems Solved
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-muted-foreground">
                          {totalAllDSAProblems}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Problems
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest DSA practice sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentDSAActivity.map((activity, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{activity.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {activity.solved}/{activity.total}
                            </span>
                          </div>
                          <Progress value={activity.progress} />
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link to="/dsa-sheet">
                          Continue Practice{" "}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Jump into your DSA practice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full" asChild>
                      <Link to="/dsa-sheet">
                        <Code className="mr-2 h-4 w-4" />
                        Practice DSA Problems
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/dsa-sheet/company/google">
                        <Target className="mr-2 h-4 w-4" />
                        Company Specific Problems
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
};

export default Dashboard;
