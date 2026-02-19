import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { courseService } from "@/api/services/courseService";
import { CourseType } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { gatewayAuthService } from "@/api/services/gatewayAuthService";
import { supabase } from "@/integrations/supabase/client";
import Container from "@/components/ui/Container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit3,
  ExternalLink,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Courses = () => {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [user]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchQuery, selectedDifficulty, selectedPurpose, selectedStatus]);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const fetchedCourses = await courseService.getCourses();
      setCourses(fetchedCourses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to fetch courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone and will delete all course content including chapters, flashcards, and MCQs.`)) {
      return;
    }

    try {
      // Get user email for Gateway authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error('User not authenticated');
      }

      // Ensure we have a Gateway token (separate from Supabase token)
      const gatewayToken = await gatewayAuthService.ensureGatewayAuth(user.email);

      const response = await fetch(`http://localhost:8000/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete course');
      }

      toast({
        title: "Course Deleted",
        description: `"${courseTitle}" has been deleted successfully.`,
      });

      // Refresh the course list
      fetchCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(course => course.difficulty === selectedDifficulty);
    }

    if (selectedPurpose !== "all") {
      filtered = filtered.filter(course => course.purpose === selectedPurpose);
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(course => {
        const status = course.content?.status || course.status || 'draft';
        if (selectedStatus === "completed") return status === 'published' || status === 'complete';
        if (selectedStatus === "in-progress") return status === 'generating' || status === 'processing';
        return status === selectedStatus;
      });
    }

    setFilteredCourses(filtered);
  };

  const getCourseStatusBadge = (course: CourseType) => {
    const status = course.content?.status || course.status || 'draft';
    
    switch (status) {
      case 'published':
      case 'complete':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'generating':
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-amber-500 text-white">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Generating
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      exam: "Exam",
      job_interview: "Job Interview",
      practice: "Practice",
      coding_preparation: "Coding",
      other: "Other"
    };
    return labels[purpose] || purpose;
  };

  if (!user) {
    return (
      <Container className="py-12">
        <Alert>
          <AlertDescription>
            Please sign in to view your courses.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Courses</h1>
          <p className="text-muted-foreground">
            Manage and continue your learning journey
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <Button asChild>
            <Link to="/course-generator">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Purpose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Purposes</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="job_interview">Job Interview</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="coding_preparation">Coding</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full md:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {courses.length === 0 ? "No courses yet" : "No courses found"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {courses.length === 0 
              ? "Create your first course to get started with personalized learning"
              : "Try adjusting your search or filter criteria"
            }
          </p>
          {courses.length === 0 && (
            <Button asChild>
              <Link to="/course-generator">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Course
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Courses Grid */}
      {!isLoading && filteredCourses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 mb-2">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.summary || `A comprehensive course on ${course.title}`}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/course/${course.id}`)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Course
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {getCourseStatusBadge(course)}
                  <Badge variant="outline" className="text-xs">
                    {course.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getPurposeLabel(course.purpose)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Progress */}
                  {course.progress_percentage !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{course.progress_percentage}%</span>
                      </div>
                      <Progress value={course.progress_percentage} className="h-2" />
                    </div>
                  )}

                  {/* Course Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(course.created_at).toLocaleDateString()}
                    </div>
                    {course.completion_time_estimate && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {course.completion_time_estimate}min
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/course/${course.id}`)}
                    variant={course.content?.status === 'generating' ? 'secondary' : 'default'}
                  >
                    {course.content?.status === 'generating' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Continue Learning
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {!isLoading && courses.length > 0 && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">{courses.length}</p>
                    <p className="text-muted-foreground">Total Courses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">
                      {courses.filter(c => c.content?.status === 'published' || c.status === 'published').length}
                    </p>
                    <p className="text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Loader2 className="w-8 h-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">
                      {courses.filter(c => c.content?.status === 'generating' || c.content?.status === 'processing').length}
                    </p>
                    <p className="text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold">
                      {Math.round(courses.reduce((acc, course) => acc + (course.completion_time_estimate || 0), 0) / 60)}h
                    </p>
                    <p className="text-muted-foreground">Total Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      )}
    </Container>
  );
};

export default Courses;
