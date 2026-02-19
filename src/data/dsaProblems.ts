export interface DSAProblem {
  name: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed?: boolean;
  category?: 'inside' | 'outside';
}

export interface DSATopic {
  id: string;
  title: string;
  icon: string;
  problems: DSAProblem[];
  totalProblems: number;
  solvedProblems: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'inside' | 'outside';
}

export const dsaTopics: DSATopic[] = [
  {
    id: "string-basics",
    title: "String Basics",
    icon: "⚡",
    totalProblems: 28,
    solvedProblems: 0,
    difficulty: 'Easy',
    category: 'inside',
    problems: [
      { name: "Reverse String", url: "https://leetcode.com/problems/reverse-string", difficulty: "Easy", category: "inside" },
      { name: "Valid Palindrome", url: "https://leetcode.com/problems/valid-palindrome", difficulty: "Easy", category: "inside" },
      { name: "Length of Last Word", url: "https://leetcode.com/problems/length-of-last-word/", difficulty: "Easy", category: "inside" },
      { name: "Find the Index of the First Occurrence in a String", url: "https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string/", difficulty: "Easy", category: "inside" },
      { name: "Longest Substring Without Repeating Characters", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters", difficulty: "Medium", category: "inside" },
      { name: "String to Integer (atoi)", url: "https://leetcode.com/problems/string-to-integer-atoi", difficulty: "Medium", category: "inside" },
      { name: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", category: "inside" },
      { name: "Reverse Words in a String", url: "https://leetcode.com/problems/reverse-words-in-a-string", difficulty: "Medium", category: "inside" },
      { name: "Reverse Vowels of a String", url: "https://leetcode.com/problems/reverse-vowels-of-a-string/", difficulty: "Easy", category: "inside" },
      { name: "Minimum Window Substring", url: "https://leetcode.com/problems/minimum-window-substring", difficulty: "Hard", category: "outside" },
      { name: "Longest Palindromic Substring", url: "https://leetcode.com/problems/longest-palindromic-substring", difficulty: "Medium", category: "inside" },
      { name: "Group Anagrams", url: "https://leetcode.com/problems/group-anagrams", difficulty: "Medium", category: "inside" },
      { name: "Permutation in String", url: "https://leetcode.com/problems/permutation-in-string", difficulty: "Medium", category: "inside" },
      { name: "Regular Expression Matching", url: "https://leetcode.com/problems/regular-expression-matching", difficulty: "Hard", category: "outside" },
      { name: "Word Break", url: "https://leetcode.com/problems/word-break", difficulty: "Medium", category: "inside" },
      { name: "Wildcard Matching", url: "https://leetcode.com/problems/wildcard-matching", difficulty: "Hard", category: "outside" },
      { name: "Longest Valid Parentheses", url: "https://leetcode.com/problems/longest-valid-parentheses", difficulty: "Hard", category: "outside" },
      { name: "Substring with Concatenation of All Words", url: "https://leetcode.com/problems/substring-with-concatenation-of-all-words", difficulty: "Hard", category: "outside" },
      { name: "Remove Duplicates from String", url: "https://leetcode.com/problems/remove-duplicates-from-string", difficulty: "Easy", category: "inside" },
      { name: "Minimum Number of Deletions to Make a String Palindrome", url: "https://leetcode.com/problems/minimum-deletion-to-make-string-palindrome/", difficulty: "Medium", category: "inside" },
      { name: "Compare Version Numbers", url: "https://leetcode.com/problems/compare-version-numbers/", difficulty: "Medium", category: "inside" },
      { name: "Roman to Integer", url: "https://leetcode.com/problems/roman-to-integer/", difficulty: "Easy", category: "inside" },
      { name: "Integer to Roman", url: "https://leetcode.com/problems/integer-to-roman/", difficulty: "Medium", category: "inside" },
      { name: "Valid Number", url: "https://leetcode.com/problems/valid-number/", difficulty: "Hard", category: "outside" },
      { name: "Encode and Decode Strings", url: "https://leetcode.com/problems/encode-and-decode-strings/", difficulty: "Medium", category: "outside" },
      { name: "Find the Closest Palindrome", url: "https://leetcode.com/problems/find-the-closest-palindrome/", difficulty: "Hard", category: "outside" },
      { name: "Text Justification", url: "https://leetcode.com/problems/text-justification/", difficulty: "Hard", category: "outside" },
      { name: "Word Ladder", url: "https://leetcode.com/problems/word-ladder/", difficulty: "Hard", category: "outside" }
    ]
  },
  {
    id: "array-basics",
    title: "Array Basics",
    icon: "📊",
    totalProblems: 12,
    solvedProblems: 0,
    difficulty: 'Easy',
    category: 'inside',
    problems: [
      { name: "Two Sum", url: "https://leetcode.com/problems/two-sum", difficulty: "Easy", category: "inside" },
      { name: "Squares of a Sorted Array", url: "https://leetcode.com/problems/squares-of-a-sorted-array/", difficulty: "Easy", category: "inside" },
      { name: "Best Time to Buy and Sell Stock", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock", difficulty: "Easy", category: "inside" },
      { name: "Contains Duplicate", url: "https://leetcode.com/problems/contains-duplicate", difficulty: "Easy", category: "inside" },
      { name: "Product of Array Except Self", url: "https://leetcode.com/problems/product-of-array-except-self", difficulty: "Medium", category: "inside" },
      { name: "Rotate Array", url: "https://leetcode.com/problems/rotate-array", difficulty: "Medium", category: "inside" },
      { name: "Maximum Subarray", url: "https://leetcode.com/problems/maximum-subarray", difficulty: "Medium", category: "inside" },
      { name: "Valid Sudoku", url: "https://leetcode.com/problems/valid-sudoku", difficulty: "Medium", category: "inside" },
      { name: "Merge Intervals", url: "https://leetcode.com/problems/merge-intervals", difficulty: "Medium", category: "inside" },
      { name: "3Sum", url: "https://leetcode.com/problems/3sum", difficulty: "Medium", category: "inside" },
      { name: "Move Zeroes", url: "https://leetcode.com/problems/move-zeroes", difficulty: "Easy", category: "inside" },
      { name: "Find All Numbers Disappeared in an Array", url: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array", difficulty: "Easy", category: "inside" }
    ]
  },
  {
    id: "two-pointers",
    title: "Two Pointers Approach",
    icon: "👆",
    totalProblems: 6,
    solvedProblems: 0,
    difficulty: 'Medium',
    category: 'inside',
    problems: [
      { name: "Find the Closest Pair from Two Arrays", url: "https://www.geeksforgeeks.org/problems/find-the-closest-pair-from-two-arrays4215/1", difficulty: "Medium", category: "inside" },
      { name: "Find All Triplets with Zero Sum", url: "https://www.geeksforgeeks.org/problems/find-the-closest-pair-from-two-arrays4215/1", difficulty: "Medium", category: "inside" },
      { name: "Triplet Sum in Array", url: "https://www.geeksforgeeks.org/problems/triplet-sum-in-array-1587115621/1", difficulty: "Medium", category: "inside" },
      { name: "Triplet Family", url: "https://www.geeksforgeeks.org/problems/triplet-family/1", difficulty: "Medium", category: "inside" },
      { name: "4 Sum - Count quadruplets with given sum", url: "https://www.geeksforgeeks.org/problems/count-quadruplets-with-given-sum/1", difficulty: "Hard", category: "outside" },
      { name: "Trapping Rain Water", url: "https://www.geeksforgeeks.org/problems/trapping-rain-water-1587115621/1", difficulty: "Hard", category: "outside" }
    ]
  },
  {
    id: "sliding-window",
    title: "Sliding Window",
    icon: "🪟",
    totalProblems: 11,
    solvedProblems: 0,
    difficulty: 'Medium',
    category: 'inside',
    problems: [
      { name: "Indexes of Subarray Sum", url: "https://www.geeksforgeeks.org/problems/subarray-with-given-sum-1587115621/1", difficulty: "Easy", category: "inside" },
      { name: "K Sized Subarray Maximum", url: "https://www.geeksforgeeks.org/problems/maximum-of-all-subarrays-of-size-k3101/1", difficulty: "Hard", category: "outside" },
      { name: "Longest Subarray with Sum K", url: "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1", difficulty: "Easy", category: "inside" },
      { name: "Max Sum Subarray of size K", url: "https://www.geeksforgeeks.org/problems/max-sum-subarray-of-size-k5313/1", difficulty: "Easy", category: "inside" },
      { name: "Smallest window containing all characters of another string", url: "https://www.geeksforgeeks.org/problems/smallest-window-in-a-string-containing-all-the-characters-of-another-string-1587115621/1", difficulty: "Hard", category: "outside" },
      { name: "Length of the longest substring", url: "https://www.geeksforgeeks.org/problems/length-of-the-longest-substring3036/1", difficulty: "Medium", category: "inside" },
      { name: "First negative in every window of size k", url: "https://www.geeksforgeeks.org/problems/first-negative-integer-in-every-window-of-size-k3345/1", difficulty: "Easy", category: "inside" },
      { name: "Count distinct elements in every window", url: "https://www.geeksforgeeks.org/problems/count-distinct-elements-in-every-window/1", difficulty: "Medium", category: "inside" },
      { name: "Smallest distinct window", url: "https://www.geeksforgeeks.org/problems/smallest-distant-window3132/1", difficulty: "Hard", category: "outside" },
      { name: "Largest Sum Subarray of Size at least K", url: "https://www.geeksforgeeks.org/problems/largest-sum-subarray-of-size-at-least-k3121/1", difficulty: "Hard", category: "outside" },
      { name: "Check if Permutation is Substring", url: "https://www.geeksforgeeks.org/problems/check-if-permutation-is-substring/1", difficulty: "Medium", category: "inside" }
    ]
  },
  {
    id: "matrices",
    title: "Matrices",
    icon: "🔢",
    totalProblems: 9,
    solvedProblems: 0,
    difficulty: 'Medium',
    category: 'inside',
    problems: [
      { name: "Spiral Matrix", url: "https://leetcode.com/problems/spiral-matrix/", difficulty: "Medium", category: "inside" },
      { name: "Search a 2D Matrix", url: "https://leetcode.com/problems/search-a-2d-matrix/", difficulty: "Medium", category: "inside" },
      { name: "Median in a row-wise sorted Matrix", url: "https://practice.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix1527/1", difficulty: "Medium", category: "inside" },
      { name: "Row with max 1s", url: "https://practice.geeksforgeeks.org/problems/row-with-max-1s0023/1", difficulty: "Medium", category: "inside" },
      { name: "Sorted matrix", url: "https://www.geeksforgeeks.org/problems/sorted-matrix2333/1", difficulty: "Medium", category: "inside" },
      { name: "Find a specific pair in Matrix", url: "https://www.geeksforgeeks.org/find-a-specific-pair-in-matrix/", difficulty: "Hard", category: "outside" },
      { name: "Rotate an Image 90 Degree Clockwise", url: "https://www.geeksforgeeks.org/rotate-a-matrix-by-90-degree-in-clockwise-direction-without-using-any-extra-space/", difficulty: "Medium", category: "inside" },
      { name: "Kth element in Matrix", url: "https://www.geeksforgeeks.org/problems/kth-element-in-matrix/1", difficulty: "Hard", category: "outside" },
      { name: "Common elements in all rows of a given matrix", url: "https://www.geeksforgeeks.org/common-elements-in-all-rows-of-a-given-matrix/", difficulty: "Medium", category: "inside" }
    ]
  },
  {
    id: "bit-manipulation",
    title: "Bit Manipulation",
    icon: "🔢",
    totalProblems: 12,
    solvedProblems: 0,
    difficulty: 'Medium',
    category: 'outside',
    problems: [
      { name: "Count Set Bits in an Integer", url: "https://leetcode.com/problems/number-of-1-bits/", difficulty: "Easy", category: "inside" },
      { name: "Reverse Bits", url: "https://leetcode.com/problems/reverse-bits/", difficulty: "Easy", category: "inside" },
      { name: "Find the Two Non-Repeating Elements in an Array of Repeating Elements", url: "https://practice.geeksforgeeks.org/problems/finding-the-numbers0215/1", difficulty: "Medium", category: "inside" },
      { name: "Count Number of Bits to be Flipped to Convert A to B", url: "https://practice.geeksforgeeks.org/problems/bit-difference/0", difficulty: "Easy", category: "inside" },
      { name: "Program to Find Whether a Number is Power of Two", url: "https://leetcode.com/problems/power-of-two/", difficulty: "Easy", category: "inside" },
      { name: "Copy Set Bits in a Range", url: "https://www.geeksforgeeks.org/copy-set-bits-in-a-range/", difficulty: "Medium", category: "outside" },
      { name: "Single Number II", url: "https://leetcode.com/problems/single-number-iii/", difficulty: "Medium", category: "inside" },
      { name: "Hamming Distance", url: "https://leetcode.com/problems/total-hamming-distance/", difficulty: "Hard", category: "outside" },
      { name: "Bitwise ORs of Subarrays", url: "https://leetcode.com/problems/bitwise-ors-of-subarrays/", difficulty: "Hard", category: "outside" },
      { name: "Divide Integers", url: "https://leetcode.com/problems/divide-two-integers/", difficulty: "Medium", category: "inside" },
      { name: "Minimum Xor Value", url: "https://www.interviewbit.com/problems/min-xor-value/", difficulty: "Hard", category: "outside" },
      { name: "Max Xor In a Range [L,R]", url: "https://www.geeksforgeeks.org/maximum-xor-value-of-a-pair-from-a-range/", difficulty: "Hard", category: "outside" }
    ]
  },
  {
    id: "linked-lists",
    title: "Linked Lists",
    icon: "🔗",
    totalProblems: 11,
    solvedProblems: 0,
    difficulty: 'Medium',
    category: 'inside',
    problems: [
      { name: "Reverse Linked List", url: "https://leetcode.com/problems/reverse-linked-list/", difficulty: "Easy", category: "inside" },
      { name: "Merge Two Sorted Lists", url: "https://leetcode.com/problems/merge-two-sorted-lists/", difficulty: "Easy", category: "inside" },
      { name: "Remove Nth Node From End of List", url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", difficulty: "Medium", category: "inside" },
      { name: "Palindrome Linked List", url: "https://leetcode.com/problems/palindrome-linked-list/", difficulty: "Easy", category: "inside" },
      { name: "Add Two Numbers", url: "https://leetcode.com/problems/add-two-numbers/", difficulty: "Medium", category: "inside" },
      { name: "Intersection of Two Linked Lists", url: "https://leetcode.com/problems/intersection-of-two-linked-lists/", difficulty: "Easy", category: "inside" },
      { name: "Design Linked List", url: "https://leetcode.com/problems/design-linked-list/", difficulty: "Medium", category: "inside" },
      { name: "Linked List Cycle", url: "https://leetcode.com/problems/linked-list-cycle/", difficulty: "Easy", category: "inside" },
      { name: "Sort List", url: "https://leetcode.com/problems/sort-list/", difficulty: "Medium", category: "inside" },
      { name: "Copy List with Random Pointer", url: "https://leetcode.com/problems/copy-list-with-random-pointer/", difficulty: "Medium", category: "inside" },
      { name: "Flatten a Multilevel Doubly Linked List", url: "https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list/", difficulty: "Medium", category: "inside" }
    ]
  },
  {
    id: "stacks-queues",
    title: "Stacks and Queues",
    icon: "📚",
    totalProblems: 9,
    solvedProblems: 0,
    difficulty: 'Medium',
    category: 'inside',
    problems: [
      { name: "Valid Parentheses", url: "https://leetcode.com/problems/valid-parentheses", difficulty: "Easy", category: "inside" },
      { name: "Min Stack", url: "https://leetcode.com/problems/min-stack/", difficulty: "Medium", category: "inside" },
      { name: "Implement Queue using Stacks", url: "https://leetcode.com/problems/implement-queue-using-stacks/", difficulty: "Easy", category: "inside" },
      { name: "Implement Stack using Queues", url: "https://leetcode.com/problems/implement-stack-using-queues/", difficulty: "Easy", category: "inside" },
      { name: "Sliding Window Maximum", url: "https://leetcode.com/problems/sliding-window-maximum/", difficulty: "Hard", category: "outside" },
      { name: "Next Greater Element I", url: "https://leetcode.com/problems/next-greater-element-i/", difficulty: "Easy", category: "inside" },
      { name: "Daily Temperatures", url: "https://leetcode.com/problems/daily-temperatures/", difficulty: "Medium", category: "inside" },
      { name: "Evaluate Reverse Polish Notation", url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/", difficulty: "Medium", category: "inside" },
      { name: "LRU Cache", url: "https://leetcode.com/problems/lru-cache/", difficulty: "Medium", category: "inside" }
    ]
  },
  {
    id: "trees",
    title: "Trees",
    icon: "🌳",
    totalProblems: 10,
    solvedProblems: 0,
    difficulty: 'Medium',
    category: 'inside',
    problems: [
      { name: "Binary Tree Inorder Traversal", url: "https://leetcode.com/problems/binary-tree-inorder-traversal/", difficulty: "Easy", category: "inside" },
      { name: "Binary Tree Preorder Traversal", url: "https://leetcode.com/problems/binary-tree-preorder-traversal/", difficulty: "Easy", category: "inside" },
      { name: "Binary Tree Postorder Traversal", url: "https://leetcode.com/problems/binary-tree-postorder-traversal/", difficulty: "Easy", category: "inside" },
      { name: "Maximum Depth of Binary Tree", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", difficulty: "Easy", category: "inside" },
      { name: "Same Tree", url: "https://leetcode.com/problems/same-tree/", difficulty: "Easy", category: "inside" },
      { name: "Symmetric Tree", url: "https://leetcode.com/problems/symmetric-tree/", difficulty: "Easy", category: "inside" },
      { name: "Convert Sorted Array to Binary Search Tree", url: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/", difficulty: "Easy", category: "inside" },
      { name: "Lowest Common Ancestor of a BST", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", difficulty: "Medium", category: "inside" },
      { name: "Binary Tree Level Order Traversal", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/", difficulty: "Medium", category: "inside" },
      { name: "Validate Binary Search Tree", url: "https://leetcode.com/problems/validate-binary-search-tree/", difficulty: "Medium", category: "inside" }
    ]
  },
  {
    id: "graphs",
    title: "Graphs",
    icon: "🕸️",
    totalProblems: 12,
    solvedProblems: 0,
    difficulty: 'Hard',
    category: 'outside',
    problems: [
      { name: "BFS of graph", url: "https://practice.geeksforgeeks.org/problems/bfs-traversal-of-graph/1", difficulty: "Easy", category: "inside" },
      { name: "Is Graph Bipartite?", url: "https://leetcode.com/problems/is-graph-bipartite/", difficulty: "Medium", category: "inside" },
      { name: "Number of Islands", url: "https://leetcode.com/problems/number-of-islands/", difficulty: "Medium", category: "inside" },
      { name: "Clone Graph", url: "https://leetcode.com/problems/clone-graph/", difficulty: "Medium", category: "inside" },
      { name: "Bus routes", url: "https://leetcode.com/problems/bus-routes/", difficulty: "Hard", category: "outside" },
      { name: "Prim's Algo", url: "https://www.spoj.com/problems/MST/", difficulty: "Hard", category: "outside" },
      { name: "Connecting cities with minimum cost", url: "https://www.geeksforgeeks.org/minimum-cost-connect-cities/", difficulty: "Hard", category: "outside" },
      { name: "Graph Valid Tree", url: "https://leetcode.com/problems/graph-valid-tree/", difficulty: "Medium", category: "inside" },
      { name: "Course Schedule", url: "https://leetcode.com/problems/course-schedule/", difficulty: "Medium", category: "inside" },
      { name: "Course Schedule II", url: "https://leetcode.com/problems/course-schedule-ii/", difficulty: "Medium", category: "inside" },
      { name: "Word Ladder", url: "https://leetcode.com/problems/word-ladder/", difficulty: "Hard", category: "outside" },
      { name: "Shortest Path in Binary Matrix", url: "https://leetcode.com/problems/shortest-path-in-binary-matrix/", difficulty: "Medium", category: "inside" }
    ]
  },
  {
    id: "dynamic-programming",
    title: "Dynamic Programming",
    icon: "⚡",
    totalProblems: 10,
    solvedProblems: 0,
    difficulty: 'Hard',
    category: 'outside',
    problems: [
      { name: "Climbing Stairs", url: "https://leetcode.com/problems/climbing-stairs/", difficulty: "Easy", category: "inside" },
      { name: "Coin Change", url: "https://leetcode.com/problems/coin-change/", difficulty: "Medium", category: "inside" },
      { name: "Longest Increasing Subsequence", url: "https://leetcode.com/problems/longest-increasing-subsequence/", difficulty: "Medium", category: "inside" },
      { name: "House Robber", url: "https://leetcode.com/problems/house-robber/", difficulty: "Medium", category: "inside" },
      { name: "House Robber II", url: "https://leetcode.com/problems/house-robber-ii/", difficulty: "Medium", category: "inside" },
      { name: "Unique Paths", url: "https://leetcode.com/problems/unique-paths/", difficulty: "Medium", category: "inside" },
      { name: "Jump Game", url: "https://leetcode.com/problems/jump-game/", difficulty: "Medium", category: "inside" },
      { name: "Min Cost Climbing Stairs", url: "https://leetcode.com/problems/min-cost-climbing-stairs/", difficulty: "Easy", category: "inside" },
      { name: "Decode Ways", url: "https://leetcode.com/problems/decode-ways/", difficulty: "Medium", category: "inside" },
      { name: "Word Break", url: "https://leetcode.com/problems/word-break/", difficulty: "Medium", category: "inside" }
    ]
  },
  {
    id: "trie",
    title: "Trie",
    icon: "🌲",
    totalProblems: 10,
    solvedProblems: 0,
    difficulty: 'Hard',
    category: 'outside',
    problems: [
      { name: "Implement Trie (Prefix Tree)", url: "https://leetcode.com/problems/implement-trie-prefix-tree/", difficulty: "Medium", category: "inside" },
      { name: "Add and Search Word - Data structure design", url: "https://leetcode.com/problems/add-and-search-word-data-structure-design/", difficulty: "Medium", category: "inside" },
      { name: "Word Search II", url: "https://leetcode.com/problems/word-search-ii/", difficulty: "Hard", category: "outside" },
      { name: "Replace Words", url: "https://leetcode.com/problems/replace-words/", difficulty: "Medium", category: "inside" },
      { name: "Palindrome Pairs", url: "https://leetcode.com/problems/palindrome-pairs/", difficulty: "Hard", category: "outside" },
      { name: "Maximum XOR of Two Numbers in an Array", url: "https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/", difficulty: "Medium", category: "inside" },
      { name: "Concatenated Words", url: "https://leetcode.com/problems/concatenated-words/", difficulty: "Hard", category: "outside" },
      { name: "Word Squares", url: "https://leetcode.com/problems/word-squares/", difficulty: "Hard", category: "outside" },
      { name: "Design Search Autocomplete System", url: "https://leetcode.com/problems/design-search-autocomplete-system/", difficulty: "Hard", category: "outside" },
      { name: "Stream of Characters", url: "https://leetcode.com/problems/stream-of-characters/", difficulty: "Hard", category: "outside" }
    ]
  }
];