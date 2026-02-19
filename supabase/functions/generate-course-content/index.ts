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

interface GenerateContentRequest {
  courseId: string;
  contentType: 'flashcards' | 'mcqs' | 'qnas' | 'notebook' | 'resources';
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  count?: number;
  chapterContent?: string;
}

interface YouTubeSearchResult {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: { medium: { url: string } };
    channelTitle: string;
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const { courseId, contentType, topic, difficulty = 'medium', count = 5, chapterContent }: GenerateContentRequest = await req.json();

    console.log(`🤖 Generating ${contentType} for course ${courseId}, topic: ${topic}`);

    let generatedContent: any = {};
    let aiResponse: any = {};

    // Generate content based on type
    switch (contentType) {
      case 'flashcards':
        aiResponse = await generateFlashcards(groqApiKey, topic, difficulty, count, chapterContent);
        generatedContent = await saveFlashcards(supabaseClient, courseId, aiResponse.flashcards);
        break;

      case 'mcqs':
        aiResponse = await generateMCQs(groqApiKey, topic, difficulty, count, chapterContent);
        generatedContent = await saveMCQs(supabaseClient, courseId, aiResponse.mcqs);
        break;

      case 'qnas':
        aiResponse = await generateQNAs(groqApiKey, topic, difficulty, count, chapterContent);
        generatedContent = await saveQNAs(supabaseClient, courseId, aiResponse.qnas);
        break;

      case 'notebook':
        aiResponse = await generateNotebook(groqApiKey, topic, chapterContent);
        generatedContent = await saveNotebook(supabaseClient, courseId, aiResponse);
        break;

      case 'resources':
        if (youtubeApiKey) {
          aiResponse = await searchYouTubeVideos(youtubeApiKey, topic);
          generatedContent = await saveResources(supabaseClient, courseId, aiResponse);
        } else {
          throw new Error('YouTube API key not configured');
        }
        break;

      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    console.log(`✅ Generated ${contentType} successfully`);

    return new Response(JSON.stringify({
      success: true,
      contentType,
      count: Array.isArray(generatedContent) ? generatedContent.length : 1,
      data: generatedContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`❌ Error generating content:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateFlashcards(groqApiKey: string, topic: string, difficulty: string, count: number, chapterContent?: string) {
  const prompt = `Generate ${count} high-quality flashcards about "${topic}" with ${difficulty} difficulty level.
${chapterContent ? `\n\nBased on this content:\n${chapterContent.substring(0, 2000)}` : ''}

Return a JSON object with this structure:
{
  "flashcards": [
    {
      "question": "Clear, specific question",
      "answer": "Comprehensive answer with explanation"
    }
  ]
}

Focus on:
- Key concepts and definitions
- Practical applications
- Common misconceptions
- Important details for ${difficulty} level learners`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational content creator. Generate high-quality, accurate flashcards that help students learn effectively.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Invalid AI response format');
  }
}

async function generateMCQs(groqApiKey: string, topic: string, difficulty: string, count: number, chapterContent?: string) {
  const prompt = `Generate ${count} high-quality multiple choice questions about "${topic}" with ${difficulty} difficulty level.
${chapterContent ? `\n\nBased on this content:\n${chapterContent.substring(0, 2000)}` : ''}

Return a JSON object with this structure:
{
  "mcqs": [
    {
      "question": "Clear question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Why this answer is correct"
    }
  ]
}

Guidelines:
- Make questions test understanding, not just memorization
- Ensure distractors are plausible but clearly wrong
- Provide clear explanations
- Match ${difficulty} difficulty level`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational assessment creator. Generate challenging but fair multiple choice questions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Invalid AI response format');
  }
}

async function generateQNAs(groqApiKey: string, topic: string, difficulty: string, count: number, chapterContent?: string) {
  const prompt = `Generate ${count} comprehensive Q&A pairs about "${topic}" with ${difficulty} difficulty level.
${chapterContent ? `\n\nBased on this content:\n${chapterContent.substring(0, 2000)}` : ''}

Return a JSON object with this structure:
{
  "qnas": [
    {
      "question": "Detailed, thoughtful question",
      "answer": "Comprehensive answer with examples and explanations"
    }
  ]
}

Focus on:
- Deep understanding questions
- Practical applications
- Real-world scenarios
- Common challenges and solutions`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator creating detailed Q&A content for deep learning.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Invalid AI response format');
  }
}

async function generateNotebook(groqApiKey: string, topic: string, chapterContent?: string) {
  const prompt = `Create a comprehensive learning notebook for "${topic}".
${chapterContent ? `\n\nBased on this content:\n${chapterContent.substring(0, 3000)}` : ''}

Return a JSON object with this structure:
{
  "keyConcepts": [
    {"term": "Concept Name", "definition": "Clear definition"}
  ],
  "analogy": "Real-world analogy that explains the concept clearly",
  "mindMap": {
    "root": {
      "name": "${topic}",
      "children": [
        {
          "name": "Main Category",
          "children": [
            {"name": "Subconcept 1"},
            {"name": "Subconcept 2"}
          ]
        }
      ]
    }
  },
  "studyGuide": "Step-by-step study guide with key points and learning objectives"
}

Make it comprehensive and educational.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert learning designer creating comprehensive study materials.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to parse Groq response:', content);
    throw new Error('Invalid AI response format');
  }
}

async function searchYouTubeVideos(youtubeApiKey: string, topic: string) {
  const searchQuery = encodeURIComponent(`${topic} tutorial programming`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${searchQuery}&type=video&key=${youtubeApiKey}`;

  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return data.items?.map((item: YouTubeSearchResult) => ({
    title: item.snippet.title,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    description: item.snippet.description.substring(0, 200),
    thumbnail_url: item.snippet.thumbnails.medium.url,
    provider: 'youtube',
    type: 'video'
  })) || [];
}

async function saveFlashcards(supabaseClient: any, courseId: string, flashcards: any[]) {
  const { data, error } = await supabaseClient
    .from('course_flashcards')
    .insert(
      flashcards.map(card => ({
        course_id: courseId,
        question: card.question,
        answer: card.answer,
        difficulty: 'medium'
      }))
    )
    .select();

  if (error) throw new Error(`Failed to save flashcards: ${error.message}`);
  return data;
}

async function saveMCQs(supabaseClient: any, courseId: string, mcqs: any[]) {
  const { data, error } = await supabaseClient
    .from('course_mcqs')
    .insert(
      mcqs.map(mcq => ({
        course_id: courseId,
        question: mcq.question,
        options: mcq.options,
        correct_answer: mcq.correct_answer,
        explanation: mcq.explanation,
        difficulty: 'medium'
      }))
    )
    .select();

  if (error) throw new Error(`Failed to save MCQs: ${error.message}`);
  return data;
}

async function saveQNAs(supabaseClient: any, courseId: string, qnas: any[]) {
  const { data, error } = await supabaseClient
    .from('course_qnas')
    .insert(
      qnas.map(qna => ({
        course_id: courseId,
        question: qna.question,
        answer: qna.answer
      }))
    )
    .select();

  if (error) throw new Error(`Failed to save Q&As: ${error.message}`);
  return data;
}

async function saveNotebook(supabaseClient: any, courseId: string, notebook: any) {
  const { data, error } = await supabaseClient
    .from('course_notebooks')
    .insert({
      course_id: courseId,
      key_concepts: notebook.keyConcepts || [],
      analogy: notebook.analogy || '',
      mind_map: notebook.mindMap || null,
      study_guide: notebook.studyGuide || ''
    })
    .select();

  if (error) throw new Error(`Failed to save notebook: ${error.message}`);
  return data[0];
}

async function saveResources(supabaseClient: any, courseId: string, resources: any[]) {
  const { data, error } = await supabaseClient
    .from('course_resources')
    .insert(
      resources.map(resource => ({
        course_id: courseId,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        description: resource.description,
        thumbnail_url: resource.thumbnail_url,
        provider: resource.provider
      }))
    )
    .select();

  if (error) throw new Error(`Failed to save resources: ${error.message}`);
  return data;
}