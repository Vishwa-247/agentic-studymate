export interface RoleTemplate {
  title: string;
  icon: string; // lucide icon name
  description: string;
  keywords: string[];
  sampleJD: string;
}

export const roleTemplates: RoleTemplate[] = [
  {
    title: "Frontend Developer",
    icon: "Code",
    description: "UI/UX focused development",
    keywords: ["React", "TypeScript", "CSS", "JavaScript", "Next.js"],
    sampleJD: `We are looking for a Frontend Developer to join our team. You will be responsible for building and maintaining user-facing features using React and TypeScript.

Requirements:
- 2+ years of experience with React, TypeScript, and modern CSS
- Experience with state management (Redux, Zustand, or Context API)
- Familiarity with RESTful APIs and GraphQL
- Knowledge of responsive design and cross-browser compatibility
- Experience with testing frameworks (Jest, React Testing Library)
- Understanding of CI/CD pipelines and Git workflows

Nice to have:
- Experience with Next.js or Remix
- Familiarity with design systems and component libraries
- Performance optimization and web vitals knowledge`
  },
  {
    title: "Backend Developer",
    icon: "Database",
    description: "Server-side & API development",
    keywords: ["Node.js", "Python", "APIs", "PostgreSQL", "Docker"],
    sampleJD: `We are seeking a Backend Developer to design and build scalable server-side applications and APIs.

Requirements:
- 3+ years of experience with Python or Node.js
- Strong knowledge of RESTful API design and microservices architecture
- Experience with PostgreSQL, MongoDB, or similar databases
- Familiarity with Docker, Kubernetes, and cloud services (AWS/GCP)
- Understanding of authentication, authorization, and security best practices
- Experience with message queues (RabbitMQ, Kafka)

Nice to have:
- Experience with GraphQL
- Knowledge of caching strategies (Redis)
- CI/CD pipeline experience`
  },
  {
    title: "Full Stack Developer",
    icon: "TrendingUp",
    description: "End-to-end development",
    keywords: ["React", "Node.js", "MongoDB", "APIs", "TypeScript"],
    sampleJD: `We're hiring a Full Stack Developer to work across our entire tech stack, from frontend UI to backend services.

Requirements:
- 3+ years of full stack development experience
- Proficiency in React/TypeScript for frontend and Node.js or Python for backend
- Experience with SQL and NoSQL databases
- Knowledge of cloud platforms (AWS, GCP, or Azure)
- Familiarity with Git, CI/CD, and agile methodologies
- Understanding of RESTful API design and authentication

Nice to have:
- Experience with serverless architectures
- Knowledge of Docker and container orchestration
- Familiarity with monitoring and logging tools`
  },
  {
    title: "Data Scientist",
    icon: "Brain",
    description: "Data analysis & machine learning",
    keywords: ["Python", "ML", "Statistics", "SQL", "TensorFlow"],
    sampleJD: `We are looking for a Data Scientist to analyze complex datasets and build predictive models that drive business decisions.

Requirements:
- MS/PhD in Computer Science, Statistics, or related field
- 2+ years of experience with Python, pandas, NumPy, scikit-learn
- Strong foundation in statistics and machine learning algorithms
- Experience with deep learning frameworks (TensorFlow, PyTorch)
- Proficiency in SQL and data visualization tools (Tableau, Matplotlib)
- Experience with A/B testing and experimental design

Nice to have:
- Experience with NLP or computer vision
- Knowledge of MLOps and model deployment (MLflow, SageMaker)
- Experience with big data tools (Spark, Hadoop)`
  },
  {
    title: "DevOps Engineer",
    icon: "Cloud",
    description: "Infrastructure & deployment",
    keywords: ["Docker", "AWS", "CI/CD", "Kubernetes", "Terraform"],
    sampleJD: `We're seeking a DevOps Engineer to build and maintain our cloud infrastructure, CI/CD pipelines, and monitoring systems.

Requirements:
- 3+ years of DevOps or SRE experience
- Strong experience with AWS, GCP, or Azure
- Proficiency with Docker, Kubernetes, and container orchestration
- Experience with Infrastructure as Code (Terraform, CloudFormation)
- Knowledge of CI/CD tools (Jenkins, GitHub Actions, GitLab CI)
- Linux administration and shell scripting

Nice to have:
- Experience with monitoring (Prometheus, Grafana, Datadog)
- Knowledge of security best practices and compliance
- Experience with service mesh (Istio)`
  },
  {
    title: "AI/ML Engineer",
    icon: "Sparkles",
    description: "Applied AI & model development",
    keywords: ["PyTorch", "LLMs", "MLOps", "Python", "RAG"],
    sampleJD: `We're looking for an AI/ML Engineer to develop and deploy machine learning models and AI-powered features.

Requirements:
- 2+ years of experience building and deploying ML models
- Strong proficiency in Python, PyTorch or TensorFlow
- Experience with LLMs, fine-tuning, and prompt engineering
- Knowledge of RAG architectures and vector databases
- Experience with MLOps tools (MLflow, Weights & Biases, SageMaker)
- Understanding of model evaluation and optimization

Nice to have:
- Experience with multi-modal models
- Knowledge of distributed training
- Familiarity with LangChain, LlamaIndex, or similar frameworks`
  },
  {
    title: "Mobile Developer",
    icon: "Smartphone",
    description: "iOS & Android development",
    keywords: ["React Native", "Flutter", "Swift", "Kotlin", "Mobile"],
    sampleJD: `We are hiring a Mobile Developer to build and maintain cross-platform mobile applications.

Requirements:
- 2+ years of mobile development experience
- Proficiency in React Native, Flutter, or native (Swift/Kotlin)
- Experience with mobile UI/UX patterns and responsive layouts
- Knowledge of RESTful APIs and offline-first architecture
- Experience with app store deployment processes (iOS/Android)
- Understanding of mobile performance optimization

Nice to have:
- Experience with push notifications and in-app purchases
- Knowledge of mobile analytics and crash reporting
- Familiarity with CI/CD for mobile (Fastlane, Bitrise)`
  },
  {
    title: "Product Manager",
    icon: "Briefcase",
    description: "Product strategy & planning",
    keywords: ["Strategy", "Analytics", "Roadmapping", "Agile", "Leadership"],
    sampleJD: `We're looking for a Product Manager to define product strategy, prioritize features, and drive execution.

Requirements:
- 3+ years of product management experience in tech
- Strong analytical skills with experience using data to drive decisions
- Experience with agile methodologies and tools (Jira, Linear)
- Excellent communication and stakeholder management skills
- Ability to write clear PRDs and user stories
- Experience with user research and A/B testing

Nice to have:
- Technical background (CS degree or engineering experience)
- Experience with product analytics tools (Amplitude, Mixpanel)
- Domain expertise in SaaS or B2B products`
  },
  {
    title: "QA Engineer",
    icon: "ShieldCheck",
    description: "Quality assurance & testing",
    keywords: ["Selenium", "Cypress", "Jest", "API Testing", "CI/CD"],
    sampleJD: `We are seeking a QA Engineer to ensure software quality through comprehensive testing strategies.

Requirements:
- 2+ years of QA/testing experience
- Experience with test automation frameworks (Selenium, Cypress, Playwright)
- Knowledge of API testing tools (Postman, REST Assured)
- Experience with CI/CD integration for automated tests
- Strong understanding of testing methodologies (unit, integration, e2e)
- Familiarity with bug tracking tools (Jira, Linear)

Nice to have:
- Experience with performance testing (JMeter, k6)
- Knowledge of security testing
- Experience with mobile testing`
  },
  {
    title: "Cloud Architect",
    icon: "Network",
    description: "Cloud infrastructure design",
    keywords: ["AWS", "Azure", "Microservices", "Security", "Scalability"],
    sampleJD: `We're looking for a Cloud Architect to design and oversee our cloud infrastructure strategy.

Requirements:
- 5+ years of cloud architecture experience
- Deep expertise with AWS, Azure, or GCP (certified preferred)
- Experience designing microservices and distributed systems
- Knowledge of security best practices and compliance frameworks
- Experience with cost optimization and capacity planning
- Strong understanding of networking, load balancing, and CDN

Nice to have:
- Multi-cloud experience
- Experience with serverless architectures at scale
- Knowledge of data governance and disaster recovery`
  }
];

export const getRoleTemplate = (title: string): RoleTemplate | undefined => {
  return roleTemplates.find(r => r.title.toLowerCase() === title.toLowerCase());
};
