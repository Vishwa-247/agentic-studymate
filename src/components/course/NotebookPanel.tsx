import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import MindMap from './MindMap';
import CodePlayground from './CodePlayground';
import { CourseResource } from '@/api/services/courseService';
import { ExternalLink, Play, RefreshCw, Loader2, BookOpen, Lightbulb, Video, Link2 } from 'lucide-react';

interface KeyConcept {
  term: string;
  definition: string;
}

interface NotebookData {
  keyConcepts: KeyConcept[];
  analogy: string;
  studyGuide?: string;
}

interface MindMapData {
  root: {
    name: string;
    children?: any[];
  };
}

interface NotebookPanelProps {
  notebook: NotebookData;
  mindMap: MindMapData;
  resources?: CourseResource[];
  onGenerateContent?: (type: 'notebook' | 'resources') => void;
  isGenerating?: Record<string, boolean>;
}

const NotebookPanel: React.FC<NotebookPanelProps> = ({ 
  notebook, 
  mindMap, 
  resources = [], 
  onGenerateContent,
  isGenerating = {}
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Learning Notebook
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="concepts" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mx-4 mb-4 text-xs">
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
            <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
            <TabsTrigger value="analogy">Analogy</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="concepts" className="px-4 pb-4">
            <div className="space-y-4">
              {notebook.keyConcepts && notebook.keyConcepts.length > 0 ? (
                notebook.keyConcepts.map((concept, index) => (
                  <div key={index} className="space-y-2">
                    <Badge variant="secondary" className="text-sm">
                      {concept.term}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {concept.definition}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">No key concepts yet</p>
                  {onGenerateContent && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onGenerateContent('notebook')}
                      disabled={isGenerating.notebook}
                    >
                      {isGenerating.notebook ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Generate Concepts
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="mindmap" className="px-4 pb-4">
            <div className="w-full">
              <MindMap data={mindMap} />
            </div>
          </TabsContent>
          
          <TabsContent value="analogy" className="px-4 pb-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Real-World Analogy</h4>
              {notebook.analogy ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {notebook.analogy}
                </p>
              ) : (
                <div className="text-center py-6">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">No analogy yet</p>
                  {onGenerateContent && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onGenerateContent('notebook')}
                      disabled={isGenerating.notebook}
                    >
                      {isGenerating.notebook ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Generate Analogy
                    </Button>
                  )}
                </div>
              )}
              
              {notebook.studyGuide && (
                <>
                  <Separator className="my-4" />
                  <h4 className="font-medium text-sm">Study Guide</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notebook.studyGuide}
                  </p>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="px-4 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Learning Resources</h4>
                {onGenerateContent && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onGenerateContent('resources')}
                    disabled={isGenerating.resources}
                  >
                    {isGenerating.resources ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>
              
              {resources.length > 0 ? (
                <div className="space-y-2">
                  {resources.slice(0, 6).map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-md border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 mt-0.5">
                          {resource.type === 'video' ? (
                            <Video className="w-3 h-3 text-red-500" />
                          ) : (
                            <Link2 className="w-3 h-3 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{resource.title}</p>
                          {resource.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {resource.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              {resource.provider || resource.type}
                            </Badge>
                            {resource.duration && (
                              <span className="text-xs text-muted-foreground">
                                {Math.floor(resource.duration / 60)}min
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">No resources yet</p>
                  {onGenerateContent && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onGenerateContent('resources')}
                      disabled={isGenerating.resources}
                    >
                      {isGenerating.resources ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Find Resources
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="px-4 pb-4">
            <div className="h-[400px]">
              <CodePlayground 
                initialCode={`// Interactive Code Playground
// Try writing some code here!

function greet(name) {
  console.log('Hello, ' + name + '!');
  return 'Welcome to the course!';
}

// Test the function
const result = greet('Student');
console.log(result);

// Try modifying the code above or write your own!`}
                language="javascript"
                title="Practice Code"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotebookPanel;