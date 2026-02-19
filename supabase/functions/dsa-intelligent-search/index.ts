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

interface SearchRequest {
  query: string;
  context?: string;
  currentProblem?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('DSA Intelligent Search function called');
    
    const request: SearchRequest = await req.json();
    const { query, context, currentProblem, userLevel = 'intermediate' } = request;
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const braveApiKey = Deno.env.get('BRAVE_API_KEY');
    if (!braveApiKey) {
      console.error('BRAVE_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'Search service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Enhanced search query based on context
    let enhancedQuery = query;
    if (currentProblem) {
      enhancedQuery = `${query} DSA algorithm "${currentProblem}" data structures`;
    } else {
      enhancedQuery = `${query} data structures algorithms programming interview`;
    }

    console.log('Enhanced search query:', enhancedQuery);

    // Search with Brave API
    const braveResponse = await fetch('https://api.search.brave.com/res/v1/web/search', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': braveApiKey,
      },
      body: null
    });

    if (!braveResponse.ok) {
      console.error('Brave API error:', braveResponse.status, braveResponse.statusText);
      
      // Fallback to curated DSA responses
      const fallbackResponse = getFallbackDSAResponse(query);
      return new Response(
        JSON.stringify({
          success: true,
          source: 'fallback',
          response: fallbackResponse,
          suggestions: getDSASuggestions(query)
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const searchResults = await braveResponse.json();
    console.log('Brave search results:', searchResults);

    // Process and enhance results with AI
    const enhancedResponse = await processSearchResults(searchResults, query, currentProblem, userLevel);

    return new Response(
      JSON.stringify({
        success: true,
        source: 'web_search',
        response: enhancedResponse,
        rawResults: searchResults.web?.results?.slice(0, 3) || [],
        suggestions: getDSASuggestions(query)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in DSA search function:', error);
    
    // Return fallback response on error
    const fallbackResponse = getFallbackDSAResponse('general help');
    return new Response(
      JSON.stringify({
        success: true,
        source: 'fallback',
        response: fallbackResponse,
        error: 'Search service temporarily unavailable'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function processSearchResults(
  searchResults: any, 
  query: string, 
  currentProblem?: string,
  userLevel: string = 'intermediate'
): Promise<string> {
  const results = searchResults.web?.results || [];
  
  if (results.length === 0) {
    return getFallbackDSAResponse(query);
  }

  // Extract relevant information from top results
  const relevantInfo = results.slice(0, 3).map((result: any) => ({
    title: result.title,
    description: result.description,
    url: result.url
  }));

  // Create contextual response based on search results
  let response = `Based on current web resources, here's what I found about "${query}":\n\n`;

  relevantInfo.forEach((info: any, index: number) => {
    response += `${index + 1}. **${info.title}**\n`;
    response += `${info.description}\n`;
    response += `[Source: ${info.url}]\n\n`;
  });

  // Add level-appropriate guidance
  if (userLevel === 'beginner') {
    response += "💡 **For beginners**: Start with understanding the basic concepts before diving into implementation details.\n\n";
  } else if (userLevel === 'advanced') {
    response += "🚀 **Advanced tip**: Consider the time/space complexity trade-offs and edge cases in your implementation.\n\n";
  }

  // Add specific problem context if available
  if (currentProblem) {
    response += `📝 **For "${currentProblem}" specifically**: Consider how this concept applies to your current problem and think about the optimal approach.\n\n`;
  }

  response += "Need more specific help? Feel free to ask follow-up questions!";

  return response;
}

function getFallbackDSAResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  // DSA topic responses
  if (lowerQuery.includes('binary search')) {
    return `**Binary Search** is a divide-and-conquer algorithm that finds a target value in a sorted array.

**Key Points:**
- Time Complexity: O(log n)
- Space Complexity: O(1)
- Only works on sorted arrays

**Basic Implementation:**
1. Compare target with middle element
2. If target < middle, search left half
3. If target > middle, search right half
4. Repeat until found or search space is empty

**Common Variations:**
- Finding first/last occurrence
- Search in rotated sorted array
- Peak element finding

Would you like me to explain any specific binary search problem?`;
  }

  if (lowerQuery.includes('dynamic programming') || lowerQuery.includes('dp')) {
    return `**Dynamic Programming (DP)** is an optimization technique that solves complex problems by breaking them down into simpler subproblems.

**Key Principles:**
1. **Optimal Substructure**: Solution can be constructed from optimal solutions of subproblems
2. **Overlapping Subproblems**: Same subproblems are solved multiple times

**Common Patterns:**
- Linear DP (Fibonacci, House Robber)
- 2D DP (Unique Paths, Edit Distance)
- Tree DP (Binary Tree Maximum Path Sum)
- Bitmask DP (Subset problems)

**Approach:**
1. Identify the state
2. Define recurrence relation
3. Handle base cases
4. Optimize space if possible

Need help with a specific DP problem?`;
  }

  if (lowerQuery.includes('graph') || lowerQuery.includes('dfs') || lowerQuery.includes('bfs')) {
    return `**Graph Algorithms** are essential for solving connectivity and path-finding problems.

**Common Algorithms:**
- **DFS (Depth-First Search)**: Explores as deep as possible before backtracking
- **BFS (Breadth-First Search)**: Explores neighbors before going deeper
- **Dijkstra's**: Shortest path in weighted graphs
- **Union-Find**: Connectivity and cycle detection

**Graph Representations:**
- Adjacency List: Better for sparse graphs
- Adjacency Matrix: Better for dense graphs

**Common Problems:**
- Path finding
- Cycle detection
- Connected components
- Topological sorting

What specific graph problem are you working on?`;
  }

  if (lowerQuery.includes('tree') || lowerQuery.includes('binary tree')) {
    return `**Binary Trees** are hierarchical data structures with at most two children per node.

**Common Traversals:**
- **Inorder**: Left → Root → Right
- **Preorder**: Root → Left → Right  
- **Postorder**: Left → Right → Root
- **Level Order**: BFS traversal

**Important Concepts:**
- Height vs Depth
- Balanced vs Unbalanced trees
- Complete vs Full binary trees

**Common Problems:**
- Tree traversal variations
- Path sum problems
- Lowest Common Ancestor
- Tree validation

**Binary Search Trees (BST):**
- Left subtree < root < right subtree
- Average O(log n) operations
- Can degenerate to O(n) if unbalanced

Which tree concept would you like me to explain further?`;
  }

  if (lowerQuery.includes('array') || lowerQuery.includes('sliding window')) {
    return `**Array Algorithms** and **Sliding Window** technique are fundamental in DSA.

**Sliding Window Pattern:**
- Fixed size window: Move window of fixed size
- Variable size window: Expand/contract based on condition

**Common Array Techniques:**
- Two Pointers (fast/slow, left/right)
- Prefix Sum for range queries
- Kadane's algorithm for subarray problems
- Dutch National Flag for partitioning

**Time Complexities:**
- Linear scan: O(n)
- Binary search on sorted: O(log n)
- Nested loops: O(n²)

**Common Problems:**
- Subarray with given sum
- Maximum subarray
- Merge intervals
- Product of array except self

What specific array problem are you solving?`;
  }

  // Generic response
  return `I'd be happy to help with "${query}"! 

**Common DSA Topics I can assist with:**
- Arrays & Strings
- Linked Lists
- Trees & Graphs
- Dynamic Programming
- Binary Search
- Sorting & Searching
- Hash Tables
- Stacks & Queues

**For better assistance, please specify:**
- What specific problem are you working on?
- What's your current approach?
- Where are you getting stuck?

Feel free to ask about algorithms, data structures, time complexity, or problem-solving strategies!`;
}

function getDSASuggestions(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('binary search')) {
    return [
      "Binary search implementation",
      "Binary search variations",
      "Search in rotated array",
      "Find peak element"
    ];
  }
  
  if (lowerQuery.includes('dynamic programming')) {
    return [
      "DP optimization techniques",
      "Common DP patterns",
      "Space optimization in DP",
      "2D DP problems"
    ];
  }
  
  if (lowerQuery.includes('graph')) {
    return [
      "DFS vs BFS comparison",
      "Shortest path algorithms",
      "Cycle detection in graphs",
      "Topological sorting"
    ];
  }
  
  return [
    "Time complexity analysis",
    "Space optimization techniques",
    "Common problem patterns",
    "Interview preparation tips"
  ];
}