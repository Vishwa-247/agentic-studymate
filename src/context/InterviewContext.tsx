import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { InterviewQuestionType, MockInterviewType, CourseType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';

// Define types for the interview state
export enum InterviewStage {
  Setup = "setup",
  Questions = "questions",
  Recording = "recording",
  Review = "review",
  Complete = "complete",
}

// Mock interview questions based on job role with answers
const staticInterviewQuestions = {
  "Software Engineer": [
    {
      question: "Tell me about your experience with software development methodologies like Agile or Scrum.",
      answer: "I've worked in Agile environments for several years, participating in daily stand-ups, sprint planning, and retrospectives. I find the iterative approach helps deliver value faster and respond to changes more effectively. For example, in my last project, we used two-week sprints and user story mapping to break down complex features, which improved our delivery predictability by 40%."
    },
    {
      question: "How do you approach debugging a complex issue in your code?",
      answer: "I follow a systematic approach: First, I reproduce the issue to understand exactly what's happening. Then I isolate variables by checking logs and using debugging tools. I form hypotheses about potential causes and test them systematically. For more complex issues, I use bisection to find where problems were introduced. I also document my findings to help the team learn from these incidents."
    },
    {
      question: "Explain how you would design a scalable web application.",
      answer: "I'd start by defining clear service boundaries using domain-driven design. For scalability, I'd implement a microservices architecture with independent scaling capabilities, use a load balancer for traffic distribution, and implement caching strategies at multiple levels. Database design would include proper indexing, potentially sharding for horizontal scaling, and read replicas. I'd also focus on statelessness to allow for horizontal scaling and implement circuit breakers to prevent cascading failures."
    },
    {
      question: "What version control systems have you used and how do you manage code conflicts?",
      answer: "I primarily use Git with GitHub/GitLab, following a branch-based workflow (like GitFlow or trunk-based development). To avoid conflicts, I create focused branches for individual features, rebase regularly from the main branch, and keep pull requests small. When conflicts do occur, I resolve them by understanding both changes, communicating with the other developers if needed, and using tools like VSCode's merge conflict resolver to make thoughtful merging decisions."
    },
    {
      question: "Describe a challenging project you worked on and how you contributed to its success.",
      answer: "I worked on migrating a monolithic application to microservices architecture while ensuring zero downtime. My contribution included creating a detailed migration plan, implementing the strangler pattern to gradually replace functionality, setting up comprehensive monitoring for both systems, and designing a rollback strategy. I also created automated tests to ensure feature parity between systems. Through careful planning and execution, we completed the migration ahead of schedule with minimal disruption to users."
    }
  ],
  "Frontend Developer": [
    {
      question: "What's your experience with React hooks and how have you used them?",
      answer: "I've extensively used React hooks to simplify component logic. I use useState for local component state, useEffect for side effects like API calls and DOM updates, useContext for accessing global state, and useRef for persistent values not triggering re-renders. I've also created custom hooks like useWindowSize and useFetch to abstract reusable logic across components. This has helped reduce code duplication by 30% in our codebase and made components more testable and maintainable."
    },
    {
      question: "How do you optimize website performance?",
      answer: "I approach performance optimization holistically: First, I measure with Lighthouse and performance profiling. For code-level optimizations, I implement code splitting, lazy loading, and memoization for expensive operations. I optimize rendering with useMemo, React.memo, and useCallback. For assets, I use compression, responsive images, and resource prioritization. I also implement effective caching strategies and server-side rendering where appropriate. In my last project, these strategies reduced our Largest Contentful Paint by 40%."
    },
    {
      question: "Explain the concept of responsive design and how you implement it.",
      answer: "Responsive design ensures optimal viewing across device sizes. I implement it using a mobile-first approach with CSS media queries, flexible grid layouts, and relative units like rem and percentages. I use CSS frameworks like Tailwind CSS to create responsive components and test across multiple screen sizes. I also implement responsive images with srcset and sizes attributes and ensure touch-friendly interfaces for mobile. For complex UIs, I sometimes create completely different component views for mobile vs. desktop experiences."
    },
    {
      question: "What strategies do you use for testing frontend code?",
      answer: "I employ multiple testing strategies: Unit tests with Jest for individual functions and components, integration tests with React Testing Library for component interactions, end-to-end tests with Cypress for critical user flows, and visual regression tests with Storybook and Chromatic. I follow a testing pyramid approach, with more unit tests than integration tests, and fewer E2E tests. I aim for test coverage of critical paths and business logic rather than arbitrary coverage percentages."
    },
    {
      question: "How do you handle cross-browser compatibility issues?",
      answer: "I handle cross-browser compatibility through several approaches: First, using autoprefixer and Babel for transpilation to ensure modern JavaScript and CSS works everywhere. I consult caniuse.com to understand feature support and provide appropriate fallbacks. I test on multiple browsers using BrowserStack or cross-browser testing tools. For critical applications, I define a browser support matrix with the product team and implement graceful degradation when needed. I also use feature detection rather than browser detection to make decisions about functionality."
    }
  ],
  "Backend Developer": [
    {
      question: "Describe your experience with database design and optimization.",
      answer: "I've designed both SQL and NoSQL databases, focusing on proper normalization for SQL databases to reduce redundancy while maintaining query performance. I implement indexing strategies based on query patterns, use explain plans to identify bottlenecks, and optimize queries using techniques like covering indexes and query rewriting. For large datasets, I've implemented database sharding, read replicas, and caching layers. In a recent project, my optimization work reduced average query time from 1.2s to 150ms for our most critical operations."
    },
    {
      question: "How do you handle API security concerns?",
      answer: "I implement defense in depth for API security: Authentication using JWT or OAuth, fine-grained authorization checks for resources, input validation on all parameters, rate limiting to prevent abuse, HTTPS for all endpoints, protection against common vulnerabilities like SQL injection and XSS, and implementing CORS policies. I also log security events, use secure headers, keep dependencies updated, and conduct regular security reviews. For sensitive operations, I implement additional protections like requiring re-authentication or using temporary tokens."
    },
    {
      question: "Explain how you would design a microservice architecture.",
      answer: "When designing a microservice architecture, I start by identifying bounded contexts following domain-driven design principles. Each service should have its own database and communicate through well-defined APIs (typically REST or gRPC). I implement an API gateway for client communication, service discovery for dynamic scaling, circuit breakers for resilience, and distributed tracing for observability. Data consistency is maintained through eventual consistency patterns like saga or outbox. I containerize services with Docker and orchestrate with Kubernetes for efficient deployment and scaling."
    },
    {
      question: "What strategies do you use for error handling in backend systems?",
      answer: "My error handling strategy has multiple layers: Using try-catch blocks with specific error types rather than catching all exceptions, implementing global error handlers to provide consistent responses, logging errors with context for debugging, implementing retry mechanisms with exponential backoff for transient failures, and using circuit breakers to prevent cascading failures. I create meaningful error messages for clients that are secure (not revealing implementation details) yet helpful. For critical systems, I implement monitoring to alert on error thresholds."
    },
    {
      question: "How do you approach API versioning?",
      answer: "I approach API versioning with several strategies depending on the use case. For URL-based versioning, I use patterns like /v1/resources for clear delineation. For header-based versioning, I use Accept or custom headers to specify versions. I prefer semantic versioning (MAJOR.MINOR.PATCH) to communicate breaking changes clearly. When evolving APIs, I maintain backward compatibility where possible, deprecate features before removing them, provide clear documentation about changes, and offer migration paths. For critical APIs, I might support multiple active versions with a defined sunset policy."
    }
  ],
  "Data Scientist": [
    {
      question: "Explain your approach to cleaning and preparing data for analysis.",
      answer: "My data preparation workflow starts with exploratory analysis to understand the data structure and identify quality issues. I handle missing values based on their nature—using imputation for MAR data or removing for MCAR where appropriate. I identify and handle outliers through statistical methods like z-score or IQR. For categorical data, I implement encoding strategies like one-hot or target encoding depending on cardinality. I normalize or standardize features when needed, create derived features that may better represent underlying patterns, and document all transformations for reproducibility."
    },
    {
      question: "What machine learning algorithms have you worked with and in what contexts?",
      answer: "I've worked with a range of algorithms: Regression models (linear, polynomial, regularized) for prediction tasks; classification algorithms like random forests and gradient boosting for categorization problems; clustering techniques like K-means and DBSCAN for segmentation; neural networks for complex pattern recognition; and time series models like ARIMA and Prophet for forecasting. I select algorithms based on data characteristics, interpretability requirements, and performance metrics. In a recent customer segmentation project, I compared K-means, hierarchical clustering, and DBSCAN, ultimately selecting DBSCAN due to its ability to identify clusters of varying densities."
    },
    {
      question: "How do you validate the performance of your models?",
      answer: "I use a multi-faceted approach to model validation: First, implementing proper train-test splits or cross-validation to prevent data leakage. I select metrics appropriate to the problem (accuracy, precision/recall, F1, AUC-ROC for classification; RMSE, MAE, R² for regression). For time-dependent data, I use time-based validation. I evaluate against baseline models to ensure improvements, analyze feature importance for model understanding, perform residual analysis to identify systematic errors, and conduct regular monitoring for models in production to detect performance drift."
    },
    {
      question: "Describe a time when your analysis led to an actionable business insight.",
      answer: "In an e-commerce company, I analyzed customer churn patterns and discovered that customers who contacted support multiple times within their first month were 3x more likely to churn. Digging deeper, I found this was primarily happening with specific product categories. We implemented targeted onboarding improvements for those categories, created proactive support touchpoints for at-risk customers, and developed a real-time dashboard for the support team. These changes reduced early-stage churn by 25% and increased lifetime value by approximately $450,000 annually."
    },
    {
      question: "How do you communicate technical findings to non-technical stakeholders?",
      answer: "I focus on translating technical results into business value: I start with the business question and key findings rather than methodology, use visualization to make patterns clear, avoid jargon or explain it when necessary, focus on actionable insights rather than technical details, and use concrete examples or scenarios to illustrate impact. I tailor communication to the audience's needs—executives get high-level ROI and strategic implications while operational teams get more detailed actionable steps. I always provide confidence levels with predictions and clarify limitations of the analysis."
    }
  ],
  "DevOps Engineer": [
    {
      question: "Describe your experience with CI/CD pipelines.",
      answer: "I've built and maintained CI/CD pipelines using tools like Jenkins, GitLab CI, and GitHub Actions. My pipelines typically include automated testing (unit, integration, and end-to-end), code quality checks with SonarQube, security scanning with tools like OWASP Dependency Check, containerization with Docker, and deployment automation. I implement infrastructure as code to ensure environment consistency and use feature flags for safer releases. In my current role, I reduced deployment time from 45 minutes to under 10 minutes while implementing stricter quality gates."
    },
    {
      question: "How do you approach infrastructure automation?",
      answer: "I implement infrastructure as code using tools like Terraform, Ansible, or CloudFormation to ensure reproducibility and version control of infrastructure. I maintain environment parity between development and production to catch issues early. I use modular design with reusable components and follow the principle of immutable infrastructure—replacing rather than modifying resources. I implement automated testing for infrastructure code and integrate infrastructure deployment into CI/CD pipelines. This approach has reduced our provisioning time by 80% and virtually eliminated configuration drift issues."
    },
    {
      question: "What monitoring and logging strategies have you implemented?",
      answer: "I implement a comprehensive observability stack covering metrics, logs, and traces. For metrics, I use Prometheus and Grafana to monitor system health and business KPIs with clearly defined SLOs. For logging, I implement structured logging with tools like ELK Stack or Loki, with consistent formats and appropriate retention policies. For distributed systems, I add request tracing with Jaeger or Zipkin to track requests across services. I also create automated alerts based on anomaly detection rather than just thresholds, and maintain runbooks for common issues."
    },
    {
      question: "How do you handle security in a DevOps environment?",
      answer: "I incorporate security throughout the DevOps lifecycle ('DevSecOps'): implementing security scanning in CI/CD pipelines for vulnerabilities in code and dependencies, using infrastructure as code with security policies as code, implementing least privilege principles and secret management solutions like HashiCorp Vault, conducting regular vulnerability assessments, automating compliance checks, and immutable infrastructure to reduce attack surface. I also ensure proper network segmentation, implement security monitoring, and conduct regular security training for the team."
    },
    {
      question: "Explain your approach to incident response and management.",
      answer: "My incident response process starts with detection through monitoring and alerting, followed by triage to assess impact and priority. During response, we focus on mitigation first, then root cause identification. We use standardized severity levels with defined response times and escalation paths. Post-incident, we conduct blameless postmortems to identify systemic issues and create action items to prevent recurrence. We maintain incident documentation and runbooks for common scenarios. This structured approach has reduced our mean time to recover (MTTR) by 35% over the past year."
    }
  ],
  "ML Engineer": [
    {
      question: "Explain your experience with deploying machine learning models to production.",
      answer: "I've deployed various ML models to production using containerization with Docker and orchestration with Kubernetes. I implement model serving using platforms like TensorFlow Serving, TorchServe, or custom Flask/FastAPI services depending on requirements. For ML pipelines, I use tools like Kubeflow or Airflow to automate training, validation, and deployment. I ensure proper versioning of both models and data, implement A/B testing infrastructure for new models, and set up monitoring for both technical metrics (latency, throughput) and ML-specific metrics (data drift, prediction drift). This approach enabled us to reduce deployment time from weeks to days."
    },
    {
      question: "How do you ensure the quality and reliability of machine learning systems?",
      answer: "I ensure ML reliability through multiple practices: implementing comprehensive testing (unit tests for preprocessing code, integration tests for pipelines, automated model evaluation against baselines), data validation to detect schema/distribution changes, model validation with appropriate metrics and cross-validation, monitoring for data drift and model performance, implementing circuit breakers to fall back to simpler models when necessary, and maintaining documentation for both technical implementations and model behavior. For critical systems, I also implement human-in-the-loop validation before major model updates go live."
    },
    {
      question: "Describe your approach to feature engineering and selection.",
      answer: "My feature engineering process begins with domain knowledge to identify potentially useful transformations. I create features that represent underlying patterns—categorical encodings, numerical transformations, text embeddings, interaction terms, and temporal features. For selection, I use statistical methods (correlation analysis, ANOVA), model-based importance (tree-based feature importance, LASSO regularization), and validation performance to identify the most valuable features. I balance predictive power with computational efficiency and interpretability requirements, documenting the rationale for each feature to maintain institutional knowledge."
    },
    {
      question: "How do you handle the challenges of training models on large datasets?",
      answer: "For large datasets, I implement several strategies: using distributed training frameworks like Horovod or PyTorch Distributed, implementing batch processing and incremental learning where possible, optimizing data loading pipelines to prevent I/O bottlenecks, using appropriate sampling techniques for initial model development, and leveraging cloud computing resources for scalability. I monitor resource utilization during training and optimize hyperparameters efficiently using techniques like Bayesian optimization rather than exhaustive grid search. For extremely large datasets, I evaluate whether approaches like federated learning might be appropriate."
    },
    {
      question: "How do you keep up with the rapidly evolving field of machine learning?",
      answer: "I stay current through multiple channels: reading papers on arXiv and following research summaries on platforms like Paper With Code, participating in ML communities on GitHub and Hugging Face, taking specialized courses on emerging techniques, attending conferences like NeurIPS or applied ML conferences, implementing new techniques in small proof-of-concept projects, and participating in kaggle competitions to practice skills. I also follow industry practitioners on social media and blogs, and participate in reading groups with colleagues to discuss new research and its practical applications."
    }
  ],
  "Cloud Architect": [
    {
      question: "How do you approach designing multi-region, highly available cloud architectures?",
      answer: "For multi-region architectures, I design with several principles in mind: implementing active-active or active-passive configurations based on requirements, using global load balancers for traffic distribution, ensuring data consistency through appropriate replication strategies, implementing automated failover mechanisms with regular testing, and defining clear RPO/RTO objectives to guide technical decisions. I use region-specific resources with proper isolation while maintaining centralized monitoring and management. This approach resulted in 99.999% availability for a critical financial system I designed, with seamless regional failover during an actual outage event."
    },
    {
      question: "Describe your experience with cloud cost optimization.",
      answer: "I approach cloud cost optimization systematically: implementing resource tagging for attribution, using right-sizing tools to identify over-provisioned resources, implementing auto-scaling for variable workloads, utilizing spot/preemptible instances for fault-tolerant workloads, leveraging reserved instances or savings plans for predictable usage, implementing lifecycle policies for storage and data archiving, and continuous monitoring of usage patterns. I create FinOps dashboards to give teams visibility into their spending and establish governance processes for resource provisioning. In my last role, these strategies reduced our cloud spend by 35% while supporting 50% growth in usage."
    },
    {
      question: "How do you implement security in cloud environments?",
      answer: "My cloud security approach implements defense in depth: defining a strong identity and access management foundation with least privilege principles, network security with proper segmentation and private endpoints, encryption both in transit and at rest for sensitive data, implementing security monitoring and threat detection, automated compliance checking against frameworks like CIS or NIST, and regular security assessments including penetration testing. I also implement automated remediation for common issues and design for immutability and ephemerality where possible to reduce attack surface. All security controls are implemented as infrastructure as code to ensure consistency and auditability."
    },
    {
      question: "Explain how you manage cloud infrastructure at scale.",
      answer: "To manage cloud infrastructure at scale, I implement infrastructure as code using tools like Terraform or CloudFormation with modular, reusable components and proper state management. I organize resources using logical hierarchies (like AWS Organizations or GCP folders) with appropriate governance policies. For operations, I implement comprehensive monitoring and centralized logging, automate routine tasks, create self-service capabilities for development teams within defined guardrails, and implement approval workflows for changes to critical infrastructure. I also maintain proper documentation and implement tagging strategies to enable resource discovery and attribution."
    },
    {
      question: "How do you approach migrating legacy applications to the cloud?",
      answer: "I approach cloud migration using a phased strategy: beginning with assessment to understand application dependencies, constraints, and business criticality. I evaluate migration approaches (rehost, replatform, refactor, replace) based on business value and technical constraints. For execution, I create a detailed migration plan with minimal downtime strategies, implement proper testing environments to validate functionality, develop rollback procedures, and prioritize moving stateless components first when possible. Post-migration, I ensure proper monitoring and optimization. For a recent large migration project, we successfully moved 85 applications using this approach with zero critical incidents."
    }
  ],
  "Default": [
    {
      question: "Tell me about your background and experience in this field.",
      answer: "I have [X] years of experience in [field], with expertise in [key skills]. I've worked at [notable companies/projects], where I [key accomplishments]. My educational background includes [degrees/certifications]. I'm particularly skilled at [technical/soft skills] and have consistently delivered [results/metrics]. My approach combines strong technical knowledge with practical problem-solving abilities, allowing me to [value proposition]."
    },
    {
      question: "What are your biggest strengths and weaknesses related to this role?",
      answer: "My key strengths include [technical skill], [soft skill], and [relevant experience]. For example, [specific example demonstrating strength]. As for weaknesses, I'm working on improving my [skill/ability]. I've taken concrete steps like [specific actions] to address this. For instance, [specific example of improvement]. I believe in continuous growth and actively seek feedback to identify areas where I can develop further."
    },
    {
      question: "How do you stay updated with current trends and technologies?",
      answer: "I maintain a structured approach to continuous learning: I follow industry publications like [specific sources], participate in communities such as [specific forums/groups], and regularly take courses on platforms like [learning platforms]. I allocate time each week for learning new skills, often working on side projects to apply new technologies practically. I also attend conferences and meetups like [specific events] and maintain a network of peers for knowledge sharing. Recently, I [example of applying new knowledge]."
    },
    {
      question: "Describe a challenging problem you solved in a previous role.",
      answer: "In my role at [company], we faced [specific challenge] that was impacting [business impact]. I took initiative by first thoroughly analyzing the problem through [methods]. After identifying that the root cause was [finding], I developed a solution that involved [approach]. I implemented this by [specific actions] while collaborating with [stakeholders]. This resulted in [quantifiable results] and taught me valuable lessons about [learnings]. The approach has since been adopted for similar challenges across the organization."
    },
    {
      question: "Where do you see yourself professionally in the next 3-5 years?",
      answer: "In the next 3-5 years, I aim to develop deeper expertise in [specific areas relevant to role] while taking on increasing responsibility in [target areas]. I'm particularly interested in opportunities to [specific career goals] and contribute to [meaningful outcomes]. I plan to enhance my skills through [specific development plans] and potentially pursue [certifications/education]. Ultimately, I want to be in a position where I can [leadership/impact goal] while continuing to grow technically and professionally."
    }
  ]
};

// Types for our context
interface InterviewContextType {
  // State
  isLoading: boolean;
  stage: InterviewStage;
  interviewData: MockInterviewType | null;
  questions: InterviewQuestionType[];
  currentQuestionIndex: number;
  isCourseTabActive: boolean;
  isGeneratingCourse: boolean;
  isRecording: boolean;
  recordingComplete: boolean;
  isProcessing: boolean;
  recentInterviews: MockInterviewType[];
  recentCourses: CourseType[];

  // Actions
  setStage: (stage: InterviewStage) => void;
  setCourseTabActive: (active: boolean) => void;
  handleInterviewSetup: (role: string, techStack: string, experience: string) => void;
  handleAnswerSubmitted: (blob: Blob) => void;
  handleNextQuestion: () => void;
  handleSubmitCourse: (courseName: string, purpose: CourseType['purpose'], difficulty: CourseType['difficulty']) => void;
  startRecording: () => void;
  stopRecording: () => void;
  handleCancel: () => void;
  handleDownloadInterview: () => void;
  resumeInterview: (interview: MockInterviewType) => void;
}

// Create the context
export const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

// Provider component
export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState<InterviewStage>(InterviewStage.Setup);
  const [interviewData, setInterviewData] = useState<MockInterviewType | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestionType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCourseTabActive, setIsCourseTabActive] = useState(false);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recentInterviews, setRecentInterviews] = useState<MockInterviewType[]>([
    {
      id: "mock-001",
      job_role: "Software Engineer",
      tech_stack: "React, Node.js",
      experience: "3-5",
      user_id: "user-123",
      completed: true,
      created_at: new Date().toISOString()
    },
    {
      id: "mock-002",
      job_role: "Full Stack Developer",
      tech_stack: "React, Node.js, MongoDB, Express",
      experience: "2-4",
      user_id: "user-123",
      completed: true,
      created_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "mock-003",
      job_role: "Data Engineer",
      tech_stack: "Python, SQL, Spark, AWS",
      experience: "3-5",
      user_id: "user-123",
      completed: true,
      created_at: new Date(Date.now() - 172800000).toISOString()
    }
  ]);
  const [recentCourses, setRecentCourses] = useState<CourseType[]>([
    {
      id: "course-dummy-1",
      title: "JavaScript Fundamentals",
      purpose: "practice",
      difficulty: "beginner",
      created_at: new Date().toISOString(),
      user_id: "user-123",
      content: { status: 'complete' }
    },
    {
      id: "course-dummy-2",
      title: "Cloud Architecture",
      purpose: "exam",
      difficulty: "advanced",
      created_at: new Date(Date.now() - 86400000).toISOString(),
      user_id: "user-123",
      content: { status: 'complete' }
    }
  ]);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleInterviewSetup = (role: string, techStack: string, experience: string) => {
    setIsLoading(true);
    
    try {
      const newInterview = {
        id: `mock-${crypto.randomUUID().split('-')[0]}`,
        job_role: role || "Software Engineer",
        tech_stack: techStack || "React, Node.js",
        experience,
        user_id: user?.id || "guest-user",
        completed: false,
        created_at: new Date().toISOString()
      };
      
      setInterviewData(newInterview);
      
      const questionList = staticInterviewQuestions[role as keyof typeof staticInterviewQuestions] || 
                        staticInterviewQuestions.Default;
      
      const generatedQuestions = questionList.map((item, index) => ({
        id: crypto.randomUUID(),
        interview_id: newInterview.id,
        question: item.question,
        suggested_answer: item.answer,
        order_number: index + 1,
        user_answer: null,
        created_at: new Date().toISOString()
      }));
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      
      setRecentInterviews(prev => [newInterview as MockInterviewType, ...prev]);
      
      setStage(InterviewStage.Questions);
      toast({
        title: "Interview Created",
        description: "Your mock interview has been set up successfully.",
      });
    } catch (error) {
      console.error("Error setting up interview:", error);
      
      const defaultInterview = {
        id: `mock-${crypto.randomUUID().split('-')[0]}`,
        job_role: "Software Engineer",
        tech_stack: "JavaScript, React",
        experience: "1-3",
        user_id: user?.id || "guest-user",
        completed: false,
        created_at: new Date().toISOString()
      };
      
      const defaultQuestions = staticInterviewQuestions.Default.map((item, index) => ({
        id: crypto.randomUUID(),
        interview_id: defaultInterview.id,
        question: item.question,
        suggested_answer: item.answer,
        order_number: index + 1,
        user_answer: null,
        created_at: new Date().toISOString()
      }));
      
      setInterviewData(defaultInterview);
      setQuestions(defaultQuestions);
      setCurrentQuestionIndex(0);
      setRecentInterviews(prev => [defaultInterview as MockInterviewType, ...prev]);
      setStage(InterviewStage.Questions);
      
      toast({
        title: "Interview Created",
        description: "Your mock interview has been set up with default questions.",
      });
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const fetchInterviewQuestions = (interviewId: string) => {
    setIsLoading(true);
    try {
      const interview = recentInterviews.find(i => i.id === interviewId);
      if (!interview) {
        throw new Error("Interview not found");
      }
      
      const questionList = staticInterviewQuestions[interview.job_role as keyof typeof staticInterviewQuestions] || 
                         staticInterviewQuestions.Default;
      
      const generatedQuestions = questionList.map((item, index) => ({
        id: crypto.randomUUID(),
        interview_id: interviewId,
        question: item.question,
        suggested_answer: item.answer,
        order_number: index + 1,
        user_answer: null,
        created_at: new Date().toISOString()
      }));
      
      if (isMounted.current) {
        setQuestions(generatedQuestions);
        setCurrentQuestionIndex(0);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      
      const fallbackQuestions = staticInterviewQuestions.Default.map((item, index) => ({
        id: crypto.randomUUID(),
        interview_id: interviewId,
        question: item.question,
        suggested_answer: item.answer,
        order_number: index + 1,
        user_answer: null,
        created_at: new Date().toISOString()
      }));
      
      if (isMounted.current) {
        setQuestions(fallbackQuestions);
        setCurrentQuestionIndex(0);
        toast({
          title: "Using Default Questions",
          description: "We've provided general interview questions for your practice session.",
        });
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleAnswerSubmitted = (blob: Blob) => {
    if (!interviewData || !questions[currentQuestionIndex]) return;
    
    try {
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        user_answer: "Recorded answer"
      };
      
      setQuestions(updatedQuestions);
      
      toast({
        title: "Answer Recorded",
        description: "Your answer has been recorded successfully.",
      });
      setRecordingComplete(true);
    } catch (error) {
      console.error("Error saving answer:", error);
      
      setRecordingComplete(true);
      toast({
        title: "Answer Recorded",
        description: "Your answer has been saved.",
      });
    }
  };

  const handleNextQuestion = () => {
    setRecordingComplete(false);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setStage(InterviewStage.Questions);
    } else {
      setStage(InterviewStage.Complete);
      
      if (interviewData) {
        try {
          const updatedInterview = {
            ...interviewData,
            completed: true
          };
          
          setRecentInterviews(prev => prev.map(item => 
            item.id === interviewData.id ? updatedInterview : item
          ));
          
          toast({
            title: "Interview Completed",
            description: "Your interview has been completed. Preparing your results...",
          });
          
          navigate(`/interview-result/${interviewData.id}`);
        } catch (error) {
          console.error("Error updating interview status:", error);
          navigate(`/interview-result/${interviewData.id}`);
        }
      }
    }
  };

  const handleSubmitCourse = (courseName: string, purpose: CourseType['purpose'], difficulty: CourseType['difficulty']) => {
    setIsGeneratingCourse(true);
    
    try {
      toast({
        title: "Generating Course",
        description: "Please wait while we create your course.",
      });

      const courseId = crypto.randomUUID();
      
      const newCourse = {
        id: courseId,
        title: courseName,
        purpose: purpose,
        difficulty: difficulty,
        summary: `A comprehensive course on ${courseName} designed for ${purpose} level.`,
        user_id: user?.id || "guest-user",
        created_at: new Date().toISOString(),
        content: { status: 'complete' }
      };
      
      setRecentCourses(prev => [newCourse as CourseType, ...prev]);
      
      toast({
        title: "Course Generated",
        description: "Your course has been successfully generated!",
      });
      
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error("Error creating course:", error);
      
      const fallbackCourse = {
        id: crypto.randomUUID(),
        title: courseName || "New Course",
        purpose: purpose,
        difficulty: difficulty,
        user_id: user?.id || "guest-user",
        created_at: new Date().toISOString(),
        content: { status: 'complete' }
      };
      
      setRecentCourses(prev => [fallbackCourse as CourseType, ...prev]);
      
      toast({
        title: "Course Generated",
        description: "Your course has been generated with example content.",
      });
      
      navigate(`/course/${fallbackCourse.id}`);
    } finally {
      if (isMounted.current) {
        setIsGeneratingCourse(false);
      }
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingComplete(false);
  };
  
  const stopRecording = () => {
    setIsRecording(false);
  };
  
  const handleCancel = () => {
    setStage(InterviewStage.Questions);
    setRecordingComplete(false);
  };

  const handleDownloadInterview = () => {
    toast({
      title: "Interview Downloaded",
      description: "Your interview has been downloaded successfully.",
    });
  };
  
  const resumeInterview = (interview: MockInterviewType) => {
    setInterviewData(interview);
    fetchInterviewQuestions(interview.id);
    setStage(InterviewStage.Questions);
  };
  
  const setCourseTabActive = (active: boolean) => {
    setIsCourseTabActive(active);
  };

  const value = {
    // State
    isLoading,
    stage,
    interviewData,
    questions,
    currentQuestionIndex,
    isCourseTabActive,
    isGeneratingCourse,
    isRecording,
    recordingComplete,
    isProcessing,
    recentInterviews,
    recentCourses,
    
    // Actions
    setStage,
    setCourseTabActive,
    handleInterviewSetup,
    handleAnswerSubmitted,
    handleNextQuestion,
    handleSubmitCourse,
    startRecording,
    stopRecording,
    handleCancel,
    handleDownloadInterview,
    resumeInterview,
  };

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
};

// Custom hook to use the interview context
export const useInterview = (): InterviewContextType => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }
  return context;
};
