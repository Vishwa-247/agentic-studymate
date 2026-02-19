import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, BookOpen, FileText, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Container from "@/components/ui/Container";

interface CourseLayoutProps {
  courseTitle: string;
  chapterName: string;
  contentSummary: string;
  progress: number;
  children: React.ReactNode;
}

const CourseLayout = ({ 
  courseTitle, 
  chapterName, 
  contentSummary, 
  progress, 
  children 
}: CourseLayoutProps) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'modules' | 'resources'>('overview');
  const [showChatBot, setShowChatBot] = useState(false);

  const sidebarSections = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'modules', label: 'Modules', icon: FileText },
    { id: 'resources', label: 'Resources & Videos', icon: PlayCircle },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <Container className="max-w-7xl py-4">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4" />
                Back to Courses
              </Button>
            </div>
          </div>

          {/* Course Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Chapter Name Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Chapter</CardTitle>
              </CardHeader>
              <CardContent>
                <h2 className="text-xl font-bold">{chapterName}</h2>
              </CardContent>
            </Card>

            {/* Content Summary Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Content Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{contentSummary}</p>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {sidebarSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Button
                        key={section.id}
                        variant={activeSection === section.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setActiveSection(section.id)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {section.label}
                      </Button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 relative">
            <Card className="min-h-[600px]">
              <CardContent className="p-6">
                {children}
              </CardContent>
            </Card>

            {/* Floating Chat Bot */}
            {showChatBot && (
              <Card className="absolute bottom-4 right-4 w-80 shadow-lg border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Chat Bot</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowChatBot(false)}
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">
                      It should get to know about the course and every thing here ok same like the coursera 
                      coach here ok it should ask the answers and giving the options and every thing here eok 
                      smae like that ok every thing her eok
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 px-3 py-2 text-sm border rounded-md" 
                      placeholder="Ask me anything..."
                    />
                    <Button size="sm">Send</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat Bot Toggle */}
            <Button
              className="absolute bottom-4 right-4 rounded-full w-12 h-12"
              onClick={() => setShowChatBot(!showChatBot)}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Chapter
          </Button>
          <Button>
            Next Chapter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default CourseLayout;