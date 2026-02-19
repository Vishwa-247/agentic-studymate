import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, Code2, Terminal, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CodePlaygroundProps {
  initialCode?: string;
  language?: string;
  title?: string;
}

const CodePlayground: React.FC<CodePlaygroundProps> = ({ 
  initialCode = '',
  language = 'javascript',
  title = 'Code Playground'
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running code...');

    // Simulate code execution
    setTimeout(() => {
      try {
        if (language === 'javascript') {
          // Simple JavaScript evaluation (in production, this would use a secure sandbox)
          const result = eval(code);
          setOutput(`Output: ${result}`);
        } else {
          setOutput('Code execution simulation - this would run in a secure sandbox environment.');
        }
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      }
      setIsRunning(false);
    }, 1000);
  };

  const sampleCodes = {
    react: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}

export default Counter;`,
    javascript: `// React Component Patterns Example
const withLogging = (WrappedComponent) => {
  return function WithLoggingComponent(props) {
    console.log('Component rendered with props:', props);
    return <WrappedComponent {...props} />;
  };
};

// Usage
const Button = ({ children, onClick }) => (
  <button onClick={onClick}>{children}</button>
);

const LoggedButton = withLogging(Button);

// Try it out!
console.log('Higher-Order Component example');`,
    typescript: `interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  getUser(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
}

// Example usage
const userService = new UserService();
userService.addUser({ id: 1, name: 'John', email: 'john@example.com' });
console.log(userService.getUser(1));`
  };

  const leetcodeProblems = [
    {
      title: "Two Sum",
      difficulty: "Easy",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      startingCode: `function twoSum(nums, target) {
    // Your solution here
    
}`
    },
    {
      title: "Valid Parentheses",
      difficulty: "Easy", 
      description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      startingCode: `function isValid(s) {
    // Your solution here
    
}`
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Code2 className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="playground" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mb-4">
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="leetcode">LeetCode</TabsTrigger>
          </TabsList>

          <TabsContent value="playground" className="px-4 pb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{language}</Badge>
                <Button
                  onClick={runCode}
                  disabled={isRunning}
                  className="ml-auto"
                  size="sm"
                >
                  <Play className="mr-1 h-3 w-3" />
                  {isRunning ? 'Running...' : 'Run Code'}
                </Button>
              </div>
              
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Write your code here..."
                className="min-h-[200px] font-mono text-sm"
              />
              
              {output && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4" />
                    <span className="text-sm font-medium">Output</span>
                  </div>
                  <pre className="text-sm">{output}</pre>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="examples" className="px-4 pb-4">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Sample Code Examples</h4>
              {Object.entries(sampleCodes).map(([lang, code]) => (
                <Card key={lang} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {lang}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCode(code);
                        // Switch to playground tab
                        const playgroundTab = document.querySelector('[value="playground"]') as HTMLElement;
                        playgroundTab?.click();
                      }}
                    >
                      Use This
                    </Button>
                  </div>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {code.substring(0, 150)}...
                  </pre>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leetcode" className="px-4 pb-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">Practice Problems</h4>
                <Button variant="ghost" size="sm" asChild>
                  <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    LeetCode
                  </a>
                </Button>
              </div>
              {leetcodeProblems.map((problem, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm">{problem.title}</h5>
                      <Badge 
                        variant={problem.difficulty === 'Easy' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {problem.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCode(problem.startingCode);
                        const playgroundTab = document.querySelector('[value="playground"]') as HTMLElement;
                        playgroundTab?.click();
                      }}
                      className="w-full"
                    >
                      Try This Problem
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CodePlayground;