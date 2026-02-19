import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

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

interface RecommendationRequest {
  problemName: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  userRating: number;
  struggledAreas: string[];
}

interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
  relevanceScore: number;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('YouTube recommendations function called');
    
    const { 
      problemName, 
      category, 
      difficulty, 
      userRating, 
      struggledAreas 
    }: RecommendationRequest = await req.json();

    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      console.error('YOUTUBE_API_KEY not found');
      return new Response(
        JSON.stringify({ 
          error: 'YouTube API not configured',
          videos: getFallbackRecommendations(category, difficulty)
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Build search query based on user feedback
    let searchQuery = `${category} ${problemName} tutorial`;
    
    // Adjust query based on user rating and struggled areas
    if (userRating <= 2) {
      searchQuery += ' beginner explanation step by step';
    } else if (userRating >= 4) {
      searchQuery += ' advanced optimization';
    }

    // Add specific areas user struggled with
    if (struggledAreas.includes('Algorithm design')) {
      searchQuery += ' algorithm approach';
    }
    if (struggledAreas.includes('Implementation')) {
      searchQuery += ' coding implementation';
    }
    if (struggledAreas.includes('Time complexity')) {
      searchQuery += ' time complexity analysis';
    }

    console.log('YouTube search query:', searchQuery);

    // Search YouTube API
    const youtubeResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=video&maxResults=5&q=${encodeURIComponent(searchQuery)}&key=${youtubeApiKey}`
    );

    if (!youtubeResponse.ok) {
      console.error('YouTube API error:', youtubeResponse.status);
      return new Response(
        JSON.stringify({ 
          videos: getFallbackRecommendations(category, difficulty)
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const youtubeData = await youtubeResponse.json();
    console.log('YouTube API response:', youtubeData);

    // Process and score videos
    const videos = processYouTubeResults(youtubeData, category, difficulty, struggledAreas);

    return new Response(
      JSON.stringify({
        success: true,
        videos,
        query: searchQuery
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in YouTube recommendations function:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch recommendations',
        videos: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function processYouTubeResults(
  youtubeData: any, 
  category: string, 
  difficulty: string,
  struggledAreas: string[]
): YouTubeVideo[] {
  const items = youtubeData.items || [];
  
  return items.map((item: any) => {
    const video: YouTubeVideo = {
      id: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      relevanceScore: calculateRelevanceScore(item, category, difficulty, struggledAreas)
    };
    
    return video;
  }).sort((a: YouTubeVideo, b: YouTubeVideo) => b.relevanceScore - a.relevanceScore);
}

function calculateRelevanceScore(
  item: any, 
  category: string, 
  difficulty: string,
  struggledAreas: string[]
): number {
  let score = 0.5; // Base score
  
  const title = item.snippet.title.toLowerCase();
  const description = item.snippet.description?.toLowerCase() || '';
  const channelTitle = item.snippet.channelTitle.toLowerCase();
  
  // Category relevance
  if (title.includes(category.toLowerCase())) score += 0.3;
  if (description.includes(category.toLowerCase())) score += 0.1;
  
  // Difficulty relevance
  if (title.includes(difficulty)) score += 0.2;
  if (title.includes('beginner') && difficulty === 'easy') score += 0.15;
  if (title.includes('advanced') && difficulty === 'hard') score += 0.15;
  
  // Struggled areas relevance
  struggledAreas.forEach(area => {
    if (area === 'Understanding the problem' && title.includes('explanation')) score += 0.1;
    if (area === 'Algorithm design' && title.includes('algorithm')) score += 0.1;
    if (area === 'Implementation' && title.includes('code')) score += 0.1;
    if (area === 'Time complexity' && (title.includes('complexity') || title.includes('optimization'))) score += 0.1;
  });
  
  // Quality indicators
  const qualityChannels = [
    'neetcode', 'abdul bari', 'tushar roy', 'back to back swe', 
    'techdose', 'take u forward', 'coding ninja', 'geeksforgeeks'
  ];
  
  if (qualityChannels.some(channel => channelTitle.includes(channel))) {
    score += 0.2;
  }
  
  // Educational keywords
  const educationalKeywords = ['tutorial', 'explained', 'step by step', 'leetcode', 'interview'];
  educationalKeywords.forEach(keyword => {
    if (title.includes(keyword)) score += 0.05;
  });
  
  return Math.min(score, 1); // Cap at 1.0
}

function getFallbackRecommendations(category: string, difficulty: string): YouTubeVideo[] {
  // Curated high-quality DSA channels and videos
  const fallbackVideos: YouTubeVideo[] = [
    {
      id: 'fallback1',
      title: `${category} - Complete Tutorial and Problem Solving`,
      channelTitle: 'NeetCode',
      thumbnail: 'https://i.ytimg.com/vi/default/mqdefault.jpg',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(category + ' tutorial')}`,
      relevanceScore: 0.9
    },
    {
      id: 'fallback2',
      title: `${category} Interview Questions and Solutions`,
      channelTitle: 'Back To Back SWE',
      thumbnail: 'https://i.ytimg.com/vi/default/mqdefault.jpg',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(category + ' interview questions')}`,
      relevanceScore: 0.8
    },
    {
      id: 'fallback3',
      title: `${category} - ${difficulty} Level Problems`,
      channelTitle: 'TechDose',
      thumbnail: 'https://i.ytimg.com/vi/default/mqdefault.jpg',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(category + ' ' + difficulty)}`,
      relevanceScore: 0.7
    }
  ];
  
  return fallbackVideos;
}