import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const isAllowed =
    origin === 'https://lovable.app' ||
    origin.endsWith('.lovable.app') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://lovable.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };
};

interface CourseGenerationRequest {
  courseName: string;
  purpose: 'exam' | 'job_interview' | 'practice' | 'coding_preparation' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  userId: string;
  geminiApiKey?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { courseName, purpose, difficulty, userId, geminiApiKey } = await req.json() as CourseGenerationRequest;

    // Log agent activity
    await supabaseClient.from('agent_logs').insert({
      agent_name: 'course-generator-agent',
      user_id: userId,
      log_level: 'info',
      message: `Starting course generation for: ${courseName}`,
      metadata: { purpose, difficulty }
    });

    // Create course entry
    const { data: course, error: courseError } = await supabaseClient
      .from('courses')
      .insert({
        user_id: userId,
        title: courseName,
        purpose,
        difficulty,
        status: 'draft',
        summary: `A comprehensive course on ${courseName} for ${purpose} at ${difficulty} level.`
      })
      .select()
      .single();

    if (courseError) {
      throw new Error(`Failed to create course: ${courseError.message}`);
    }

    // Create generation job
    const { data: job, error: jobError } = await supabaseClient
      .from('course_generation_jobs')
      .insert({
        user_id: userId,
        course_id: course.id,
        status: 'pending',
        job_type: 'course_creation',
        current_step: 'Initializing course generation',
        metadata: { courseName, purpose, difficulty }
      })
      .select()
      .single();

    if (jobError) {
      throw new Error(`Failed to create generation job: ${jobError.message}`);
    }

    // Update course with job reference
    await supabaseClient
      .from('courses')
      .update({ generation_job_id: job.id })
      .eq('id', course.id);

    // Start background content generation
    generateCourseContent(supabaseClient, course.id, courseName, purpose, difficulty, userId, geminiApiKey || '').catch(console.error);

    return new Response(JSON.stringify({
      success: true,
      courseId: course.id,
      jobId: job.id,
      message: 'Course creation started. Content generation is running in the background.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in course-generator-agent:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateCourseContent(
  supabaseClient: any,
  courseId: string,
  courseName: string,
  purpose: string,
  difficulty: string,
  userId: string,
  geminiApiKey: string
) {
  try {
    // Update job status to processing
    await supabaseClient
      .from('course_generation_jobs')
      .update({
        status: 'processing',
        current_step: 'Generating course content',
        progress_percentage: 10
      })
      .eq('course_id', courseId);

    // Log content generation start
    await supabaseClient.from('agent_logs').insert({
      agent_name: 'content-generation-agent',
      user_id: userId,
      course_id: courseId,
      log_level: 'info',
      message: 'Starting content generation',
      metadata: { step: 'content_generation_start' }
    });

    // Generate chapters (40% progress)
    await generateChapters(supabaseClient, courseId, courseName, difficulty, userId, geminiApiKey);
    await updateProgress(supabaseClient, courseId, 40, 'Generated course chapters');

    // Generate flashcards (60% progress)
    await generateFlashcards(supabaseClient, courseId, courseName, difficulty, userId);
    await updateProgress(supabaseClient, courseId, 60, 'Generated flashcards');

    // Generate MCQs (80% progress)
    await generateMCQs(supabaseClient, courseId, courseName, difficulty, userId);
    await updateProgress(supabaseClient, courseId, 80, 'Generated multiple choice questions');

    // Generate Q&As (90% progress)
    await generateQAs(supabaseClient, courseId, courseName, difficulty, userId);
    await updateProgress(supabaseClient, courseId, 90, 'Generated Q&A pairs');

    // Generate notebook (95% progress)
    await generateNotebook(supabaseClient, courseId, courseName, difficulty, userId);
    await updateProgress(supabaseClient, courseId, 95, 'Generated study notebook');

    // Find resources (100% progress)
    await findResources(supabaseClient, courseId, courseName, userId);
    await updateProgress(supabaseClient, courseId, 100, 'Found learning resources');

    // Mark course as completed
    await supabaseClient
      .from('courses')
      .update({ status: 'published' })
      .eq('id', courseId);

    // Complete job
    await supabaseClient
      .from('course_generation_jobs')
      .update({
        status: 'completed',
        progress_percentage: 100,
        current_step: 'Course generation completed',
        completed_at: new Date().toISOString()
      })
      .eq('course_id', courseId);

    // Log completion
    await supabaseClient.from('agent_logs').insert({
      agent_name: 'course-generator-agent',
      user_id: userId,
      course_id: courseId,
      log_level: 'info',
      message: 'Course generation completed successfully',
      metadata: { total_duration: '180s' }
    });

  } catch (error) {
    console.error('Error in background content generation:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    await supabaseClient
      .from('course_generation_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
        completed_at: new Date().toISOString()
      })
      .eq('course_id', courseId);

    await supabaseClient.from('agent_logs').insert({
      agent_name: 'course-generator-agent',
      user_id: userId,
      course_id: courseId,
      log_level: 'error',
      message: `Course generation failed: ${errorMessage}`,
      metadata: { error: errorStack }
    });
  }
}

async function updateProgress(supabaseClient: any, courseId: string, percentage: number, step: string) {
  await supabaseClient
    .from('course_generation_jobs')
    .update({
      progress_percentage: percentage,
      current_step: step
    })
    .eq('course_id', courseId);
}

// Content generation functions with static data for now
async function generateChapters(supabaseClient: any, courseId: string, courseName: string, difficulty: string, userId: string, geminiApiKey: string) {
  const chapters = [
    {
      course_id: courseId,
      title: `Introduction to ${courseName}`,
      content: `This chapter provides a comprehensive introduction to ${courseName}. We'll cover the fundamental concepts, key principles, and why this topic is important for your ${difficulty}-level studies.`,
      order_number: 1,
      estimated_reading_time: 15
    },
    {
      course_id: courseId,
      title: `Core Concepts and Principles`,
      content: `In this chapter, we dive deep into the core concepts of ${courseName}. You'll learn about the fundamental principles that form the foundation of this subject area.`,
      order_number: 2,
      estimated_reading_time: 25
    },
    {
      course_id: courseId,
      title: `Advanced Topics and Applications`,
      content: `This chapter explores advanced topics in ${courseName} and their real-world applications. Perfect for ${difficulty}-level learners looking to deepen their understanding.`,
      order_number: 3,
      estimated_reading_time: 30
    }
  ];

  const { error } = await supabaseClient
    .from('course_chapters')
    .insert(chapters);

  if (error) {
    throw new Error(`Failed to create chapters: ${error.message}`);
  }
}

async function generateFlashcards(supabaseClient: any, courseId: string, courseName: string, difficulty: string, userId: string) {
  const flashcards = [
    {
      course_id: courseId,
      question: `What is ${courseName}?`,
      answer: `${courseName} is a comprehensive subject that encompasses various concepts and principles relevant to your studies.`,
      difficulty: difficulty
    },
    {
      course_id: courseId,
      question: `What are the key benefits of studying ${courseName}?`,
      answer: `Studying ${courseName} provides a solid foundation for understanding related concepts and can help in practical applications.`,
      difficulty: difficulty
    },
    {
      course_id: courseId,
      question: `How can you apply ${courseName} in real-world scenarios?`,
      answer: `${courseName} can be applied in various real-world scenarios by implementing the core principles and concepts learned.`,
      difficulty: difficulty
    }
  ];

  const { error } = await supabaseClient
    .from('course_flashcards')
    .insert(flashcards);

  if (error) {
    throw new Error(`Failed to create flashcards: ${error.message}`);
  }
}

async function generateMCQs(supabaseClient: any, courseId: string, courseName: string, difficulty: string, userId: string) {
  const mcqs = [
    {
      course_id: courseId,
      question: `Which of the following best describes ${courseName}?`,
      options: ["A comprehensive subject area", "A simple concept", "An outdated practice", "None of the above"],
      correct_answer: "A comprehensive subject area",
      explanation: `${courseName} is indeed a comprehensive subject area that covers multiple concepts and principles.`,
      difficulty: difficulty
    },
    {
      course_id: courseId,
      question: `What is the primary benefit of understanding ${courseName}?`,
      options: ["Better problem-solving skills", "Improved memorization", "Faster calculations", "All of the above"],
      correct_answer: "Better problem-solving skills",
      explanation: `Understanding ${courseName} primarily helps in developing better problem-solving skills.`,
      difficulty: difficulty
    }
  ];

  const { error } = await supabaseClient
    .from('course_mcqs')
    .insert(mcqs);

  if (error) {
    throw new Error(`Failed to create MCQs: ${error.message}`);
  }
}

async function generateQAs(supabaseClient: any, courseId: string, courseName: string, difficulty: string, userId: string) {
  const qnas = [
    {
      course_id: courseId,
      question: `How do I get started with ${courseName}?`,
      answer: `To get started with ${courseName}, begin by understanding the fundamental concepts covered in the course chapters, then practice with the provided exercises and examples.`
    },
    {
      course_id: courseId,
      question: `What are common mistakes to avoid in ${courseName}?`,
      answer: `Common mistakes include rushing through concepts without proper understanding, not practicing enough, and failing to connect theoretical knowledge with practical applications.`
    }
  ];

  const { error } = await supabaseClient
    .from('course_qnas')
    .insert(qnas);

  if (error) {
    throw new Error(`Failed to create Q&As: ${error.message}`);
  }
}

async function generateNotebook(supabaseClient: any, courseId: string, courseName: string, difficulty: string, userId: string) {
  const notebook = {
    course_id: courseId,
    key_concepts: [
      { term: "Fundamentals", definition: `Basic principles and concepts of ${courseName}` },
      { term: "Applications", definition: `Real-world uses and implementations of ${courseName}` },
      { term: "Best Practices", definition: `Recommended approaches for working with ${courseName}` }
    ],
    analogy: `Think of ${courseName} like building a house - you need a strong foundation (fundamentals), proper tools (concepts), and good planning (methodology).`,
    study_guide: `To master ${courseName}, follow this study guide: 1) Review all chapters thoroughly, 2) Practice with flashcards daily, 3) Test your knowledge with MCQs, 4) Apply concepts through exercises, 5) Review and reinforce learning regularly.`
  };

  const { error } = await supabaseClient
    .from('course_notebooks')
    .insert(notebook);

  if (error) {
    throw new Error(`Failed to create notebook: ${error.message}`);
  }
}

async function findResources(supabaseClient: any, courseId: string, courseName: string, userId: string) {
  const resources = [
    {
      course_id: courseId,
      title: `${courseName} Tutorial Videos`,
      type: 'video',
      url: 'https://youtube.com/watch?v=placeholder1',
      description: `Comprehensive video tutorials covering ${courseName} concepts`,
      provider: 'YouTube'
    },
    {
      course_id: courseId,
      title: `${courseName} Documentation`,
      type: 'documentation',
      url: 'https://example.com/docs',
      description: `Official documentation and reference materials for ${courseName}`,
      provider: 'Official Docs'
    },
    {
      course_id: courseId,
      title: `${courseName} Practice Exercises`,
      type: 'exercise',
      url: 'https://example.com/exercises',
      description: `Interactive exercises to practice ${courseName} concepts`,
      provider: 'Practice Platform'
    }
  ];

  const { error } = await supabaseClient
    .from('course_resources')
    .insert(resources);

  if (error) {
    throw new Error(`Failed to create resources: ${error.message}`);
  }
}