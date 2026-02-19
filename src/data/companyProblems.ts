
export interface CompanyProblem {
  name: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  completed?: boolean;
}

export interface Company {
  id: string;
  title: string;
  icon: string;
  links?: { label: string; url: string }[];
  problems: CompanyProblem[];
  totalProblems: number;
  solvedProblems: number;
}

export const companies: Company[] = [
  {
    id: "adobe",
    title: "Adobe",
    icon: "🅰️",
    links: [
      { label: "Careers", url: "https://www.adobe.com/careers.html" },
      { label: "LeetCode Discuss", url: "https://leetcode.com/company/adobe/" },
    ],
    totalProblems: 59,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Reverse Integer",
        url: "https://leetcode.com/problems/reverse-integer",
        difficulty: "Easy",
      },
      {
        name: "Combine Two Tables",
        url: "https://leetcode.com/problems/combine-two-tables",
        difficulty: "Easy",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Roman to Integer",
        url: "https://leetcode.com/problems/roman-to-integer",
        difficulty: "Easy",
      },
      {
        name: "Tenth Line",
        url: "https://leetcode.com/problems/tenth-line",
        difficulty: "Easy",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Longest Common Prefix",
        url: "https://leetcode.com/problems/longest-common-prefix",
        difficulty: "Easy",
      },
      {
        name: "Palindrome Number",
        url: "https://leetcode.com/problems/palindrome-number",
        difficulty: "Easy",
      },
      {
        name: "Nim Game",
        url: "https://leetcode.com/problems/nim-game",
        difficulty: "Easy",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Jewels and Stones",
        url: "https://leetcode.com/problems/jewels-and-stones",
        difficulty: "Easy",
      },
      {
        name: "Reverse String",
        url: "https://leetcode.com/problems/reverse-string",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Big Countries",
        url: "https://leetcode.com/problems/big-countries",
        difficulty: "Easy",
      },
      {
        name: "Array Partition I",
        url: "https://leetcode.com/problems/array-partition-i",
        difficulty: "Easy",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Second Highest Salary",
        url: "https://leetcode.com/problems/second-highest-salary",
        difficulty: "Easy",
      },
      {
        name: "Remove Duplicates from Sorted Array",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Majority Element",
        url: "https://leetcode.com/problems/majority-element",
        difficulty: "Easy",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "ZigZag Conversion",
        url: "https://leetcode.com/problems/zigzag-conversion",
        difficulty: "Medium",
      },
      {
        name: "Word Frequency",
        url: "https://leetcode.com/problems/word-frequency",
        difficulty: "Medium",
      },
      {
        name: "Container With Most Water",
        url: "https://leetcode.com/problems/container-with-most-water",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "4Sum",
        url: "https://leetcode.com/problems/4sum",
        difficulty: "Medium",
      },
      {
        name: "H-Index",
        url: "https://leetcode.com/problems/h-index",
        difficulty: "Medium",
      },
      {
        name: "Lexicographical Numbers",
        url: "https://leetcode.com/problems/lexicographical-numbers",
        difficulty: "Medium",
      },
      {
        name: "Integer to Roman",
        url: "https://leetcode.com/problems/integer-to-roman",
        difficulty: "Medium",
      },
      {
        name: "Nth Highest Salary",
        url: "https://leetcode.com/problems/nth-highest-salary",
        difficulty: "Medium",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Bitwise AND of Numbers Range",
        url: "https://leetcode.com/problems/bitwise-and-of-numbers-range",
        difficulty: "Medium",
      },
      {
        name: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Maximum Product Subarray",
        url: "https://leetcode.com/problems/maximum-product-subarray",
        difficulty: "Medium",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Cherry Pickup",
        url: "https://leetcode.com/problems/cherry-pickup",
        difficulty: "Hard",
      },
      {
        name: "Burst Balloons",
        url: "https://leetcode.com/problems/burst-balloons",
        difficulty: "Hard",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Shortest Palindrome",
        url: "https://leetcode.com/problems/shortest-palindrome",
        difficulty: "Hard",
      },
      {
        name: "Count of Smaller Numbers After Self",
        url: "https://leetcode.com/problems/count-of-smaller-numbers-after-self",
        difficulty: "Hard",
      },
      {
        name: "Maximal Rectangle",
        url: "https://leetcode.com/problems/maximal-rectangle",
        difficulty: "Hard",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive",
        difficulty: "Hard",
      },
      {
        name: "Wildcard Matching",
        url: "https://leetcode.com/problems/wildcard-matching",
        difficulty: "Hard",
      },
      {
        name: "Longest Valid Parentheses",
        url: "https://leetcode.com/problems/longest-valid-parentheses",
        difficulty: "Hard",
      },
      {
        name: "Strong Password Checker",
        url: "https://leetcode.com/problems/strong-password-checker",
        difficulty: "Hard",
      },
      {
        name: "Substring with Concatenation of All Words",
        url: "https://leetcode.com/problems/substring-with-concatenation-of-all-words",
        difficulty: "Hard",
      },
      {
        name: "Sudoku Solver",
        url: "https://leetcode.com/problems/sudoku-solver",
        difficulty: "Hard",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Hard",
      },
      {
        name: "Distinct Subsequences",
        url: "https://leetcode.com/problems/distinct-subsequences",
        difficulty: "Hard",
      },
      {
        name: "Subsets",
        url: "https://leetcode.com/problems/subsets",
        difficulty: "Hard",
      },
      {
        name: "Reverse Nodes in k-Group",
        url: "https://leetcode.com/problems/reverse-nodes-in-k-group",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "citadel",
    title: "Citadel",
    icon: "🏦", // Added a bank icon for Citadel
    links: [
      { label: "Careers", url: "https://www.citadel.com/careers/" },
      {
        label: "LeetCode Discuss",
        url: "https://leetcode.com/company/citadel/",
      },
    ],
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "Consecutive Numbers Sum",
        url: "https://leetcode.com/problems/consecutive-numbers-sum",
        difficulty: "Hard",
      },
      {
        name: "Longest String Chain",
        url: "https://leetcode.com/problems/longest-string-chain",
        difficulty: "Medium",
      },
      {
        name: "Different Ways to Add Parentheses",
        url: "https://leetcode.com/problems/different-ways-to-add-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Palindromic Substrings",
        url: "https://leetcode.com/problems/palindromic-substrings",
        difficulty: "Medium",
      },
      {
        name: "Inorder Successor in BST",
        url: "https://leetcode.com/problems/inorder-successor-in-bst",
        difficulty: "Medium",
      },
      {
        name: "Longest Valid Parentheses",
        url: "https://leetcode.com/problems/longest-valid-parentheses",
        difficulty: "Hard",
      },
      {
        name: "Knight Dialer",
        url: "https://leetcode.com/problems/knight-dialer",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Best Time to Buy and Sell Stock II",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii",
        difficulty: "Easy",
      },
      {
        name: "Maximal Square",
        url: "https://leetcode.com/problems/maximal-square",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Design Circular Queue",
        url: "https://leetcode.com/problems/design-circular-queue",
        difficulty: "Medium",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Find Pivot Index",
        url: "https://leetcode.com/problems/find-pivot-index",
        difficulty: "Easy",
      },
      {
        name: "Reconstruct Itinerary",
        url: "https://leetcode.com/problems/reconstruct-itinerary",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock III",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Right Side View",
        url: "https://leetcode.com/problems/binary-tree-right-side-view",
        difficulty: "Medium",
      },
      {
        name: "Construct Binary Tree from Preorder and Inorder Traversal",
        url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal",
        difficulty: "Medium",
      },
      {
        name: "Maximum Product of Three Numbers",
        url: "https://leetcode.com/problems/maximum-product-of-three-numbers",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Implement Stack using Queues",
        url: "https://leetcode.com/problems/implement-stack-using-queues",
        difficulty: "Easy",
      },
      {
        name: "Longest Substring with At Most K Distinct Characters",
        url: "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters",
        difficulty: "Hard",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Maximal Rectangle",
        url: "https://leetcode.com/problems/maximal-rectangle",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs",
        difficulty: "Easy",
      },
      {
        name: "Implement strStr()",
        url: "https://leetcode.com/problems/implement-strstr",
        difficulty: "Easy",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Maximum Length of Repeated Subarray",
        url: "https://leetcode.com/problems/maximum-length-of-repeated-subarray",
        difficulty: "Medium",
      },
      {
        name: "Best Position for a Service Centre",
        url: "https://leetcode.com/problems/best-position-for-a-service-centre",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "airbnb",
    title: "Airbnb",
    icon: "🏠",
    links: [
      { label: "Careers", url: "https://careers.airbnb.com/" },
      {
        label: "LeetCode Discuss",
        url: "https://leetcode.com/company/airbnb/",
      },
    ],
    totalProblems: 54,
    solvedProblems: 0,
    problems: [
      {
        name: "Palindrome Pairs",
        url: "https://leetcode.com/problems/palindrome-pairs",
        difficulty: "Hard",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Text Justification",
        url: "https://leetcode.com/problems/text-justification",
        difficulty: "Hard",
      },
      {
        name: "Sliding Puzzle",
        url: "https://leetcode.com/problems/sliding-puzzle",
        difficulty: "Hard",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Employee Free Time",
        url: "https://leetcode.com/problems/employee-free-time",
        difficulty: "Hard",
      },
      {
        name: "Shortest Path to Get All Keys",
        url: "https://leetcode.com/problems/shortest-path-to-get-all-keys",
        difficulty: "Hard",
      },
      {
        name: "Guess the Word",
        url: "https://leetcode.com/problems/guess-the-word",
        difficulty: "Hard",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Design In-Memory File System",
        url: "https://leetcode.com/problems/design-in-memory-file-system",
        difficulty: "Hard",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Maximum Profit in Job Scheduling",
        url: "https://leetcode.com/problems/maximum-profit-in-job-scheduling",
        difficulty: "Hard",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Minimum Number of Flips to Convert Binary Matrix to Zero Matrix",
        url: "https://leetcode.com/problems/minimum-number-of-flips-to-convert-binary-matrix-to-zero-matrix",
        difficulty: "Hard",
      },
      {
        name: "Maximum Candies You Can Get from Boxes",
        url: "https://leetcode.com/problems/maximum-candies-you-can-get-from-boxes",
        difficulty: "Hard",
      },
      {
        name: "Pour Water",
        url: "https://leetcode.com/problems/pour-water",
        difficulty: "Medium",
      },
      {
        name: "IP to CIDR",
        url: "https://leetcode.com/problems/ip-to-cidr",
        difficulty: "Medium",
      },
      {
        name: "Flatten 2D Vector",
        url: "https://leetcode.com/problems/flatten-2d-vector",
        difficulty: "Medium",
      },
      {
        name: "Design File System",
        url: "https://leetcode.com/problems/design-file-system",
        difficulty: "Medium",
      },
      {
        name: "Cheapest Flights Within K Stops",
        url: "https://leetcode.com/problems/cheapest-flights-within-k-stops",
        difficulty: "Medium",
      },
      {
        name: "Flatten Nested List Iterator",
        url: "https://leetcode.com/problems/flatten-nested-list-iterator",
        difficulty: "Medium",
      },
      {
        name: "Fraction to Recurring Decimal",
        url: "https://leetcode.com/problems/fraction-to-recurring-decimal",
        difficulty: "Medium",
      },
      {
        name: "Combination Sum",
        url: "https://leetcode.com/problems/combination-sum",
        difficulty: "Medium",
      },
      {
        name: "Wiggle Sort II",
        url: "https://leetcode.com/problems/wiggle-sort-ii",
        difficulty: "Medium",
      },
      {
        name: "Koko Eating Bananas",
        url: "https://leetcode.com/problems/koko-eating-bananas",
        difficulty: "Medium",
      },
      {
        name: "Minimize Rounding Error to Meet Target",
        url: "https://leetcode.com/problems/minimize-rounding-error-to-meet-target",
        difficulty: "Medium",
      },
      {
        name: "Pyramid Transition Matrix",
        url: "https://leetcode.com/problems/pyramid-transition-matrix",
        difficulty: "Medium",
      },
      {
        name: "Smallest Common Region",
        url: "https://leetcode.com/problems/smallest-common-region",
        difficulty: "Medium",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Mini Parser",
        url: "https://leetcode.com/problems/mini-parser",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Contains Duplicate III",
        url: "https://leetcode.com/problems/contains-duplicate-iii",
        difficulty: "Medium",
      },
      {
        name: "Wiggle Sort",
        url: "https://leetcode.com/problems/wiggle-sort",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Design Circular Queue",
        url: "https://leetcode.com/problems/design-circular-queue",
        difficulty: "Medium",
      },
      {
        name: "Maximal Square",
        url: "https://leetcode.com/problems/maximal-square",
        difficulty: "Medium",
      },
      {
        name: "Add and Search Word - Data structure design",
        url: "https://leetcode.com/problems/add-and-search-word-data-structure-design",
        difficulty: "Medium",
      },
      {
        name: "Find First and Last Position of Element in Sorted Array",
        url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Basic Calculator II",
        url: "https://leetcode.com/problems/basic-calculator-ii",
        difficulty: "Medium",
      },
      {
        name: "Convert to Base -2",
        url: "https://leetcode.com/problems/convert-to-base-2",
        difficulty: "Medium",
      },
      {
        name: "Robot Bounded In Circle",
        url: "https://leetcode.com/problems/robot-bounded-in-circle",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Bulls and Cows",
        url: "https://leetcode.com/problems/bulls-and-cows",
        difficulty: "Easy",
      },
      {
        name: "Contains Duplicate II",
        url: "https://leetcode.com/problems/contains-duplicate-ii",
        difficulty: "Easy",
      },
      {
        name: "House Robber",
        url: "https://leetcode.com/problems/house-robber",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Intersection of Two Linked Lists",
        url: "https://leetcode.com/problems/intersection-of-two-linked-lists",
        difficulty: "Easy",
      },
      {
        name: "Happy Number",
        url: "https://leetcode.com/problems/happy-number",
        difficulty: "Easy",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Single Number",
        url: "https://leetcode.com/problems/single-number",
        difficulty: "Easy",
      },
      {
        name: "Convert Sorted Array to Binary Search Tree",
        url: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree",
        difficulty: "Easy",
      },
      {
        name: "Contains Duplicate",
        url: "https://leetcode.com/problems/contains-duplicate",
        difficulty: "Easy",
      },
      {
        name: "Verifying an Alien Dictionary",
        url: "https://leetcode.com/problems/verifying-an-alien-dictionary",
        difficulty: "Easy",
      },
      {
        name: "Reverse Bits",
        url: "https://leetcode.com/problems/reverse-bits",
        difficulty: "Easy",
      },
      {
        name: "Add Strings",
        url: "https://leetcode.com/problems/add-strings",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "akuna-capital",
    title: "Akuna Capital",
    icon: "📈",
    totalProblems: 23,
    solvedProblems: 0,
    problems: [
      {
        name: "Subarray Product Less Than K",
        url: "https://leetcode.com/problems/subarray-product-less-than-k",
        difficulty: "Medium",
      },
      {
        name: "Dice Roll Simulation",
        url: "https://leetcode.com/problems/dice-roll-simulation",
        difficulty: "Medium",
      },
      {
        name: "Minimum Number of K Consecutive Bit Flips",
        url: "https://leetcode.com/problems/minimum-number-of-k-consecutive-bit-flips",
        difficulty: "Hard",
      },
      {
        name: "Wiggle Sort II",
        url: "https://leetcode.com/problems/wiggle-sort-ii",
        difficulty: "Medium",
      },
      {
        name: "Number of Ways to Paint N × 3 Grid",
        url: "https://leetcode.com/problems/number-of-ways-to-paint-n-3-grid",
        difficulty: "Hard",
      },
      {
        name: "Can Make Palindrome from Substring",
        url: "https://leetcode.com/problems/can-make-palindrome-from-substring",
        difficulty: "Medium",
      },
      {
        name: "Number of Operations to Make Network Connected",
        url: "https://leetcode.com/problems/number-of-operations-to-make-network-connected",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
      {
        name: "Network Delay Time",
        url: "https://leetcode.com/problems/network-delay-time",
        difficulty: "Medium",
      },
      {
        name: "Longest String Chain",
        url: "https://leetcode.com/problems/longest-string-chain",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Maximum Product Subarray",
        url: "https://leetcode.com/problems/maximum-product-subarray",
        difficulty: "Medium",
      },
      {
        name: "Combination Sum",
        url: "https://leetcode.com/problems/combination-sum",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Map Sum Pairs",
        url: "https://leetcode.com/problems/map-sum-pairs",
        difficulty: "Medium",
      },
      {
        name: "Delete and Earn",
        url: "https://leetcode.com/problems/delete-and-earn",
        difficulty: "Medium",
      },
      {
        name: "Cherry Pickup",
        url: "https://leetcode.com/problems/cherry-pickup",
        difficulty: "Hard",
      },
      {
        name: "Constrained Subsequence Sum",
        url: "https://leetcode.com/problems/constrained-subsequence-sum",
        difficulty: "Hard",
      },
      {
        name: "Minimum Number of Taps to Open to Water a Garden",
        url: "https://leetcode.com/problems/minimum-number-of-taps-to-open-to-water-a-garden",
        difficulty: "Hard",
      },
      {
        name: "Reduce Array Size to The Half",
        url: "https://leetcode.com/problems/reduce-array-size-to-the-half",
        difficulty: "Medium",
      },
      {
        name: "Increasing Decreasing String",
        url: "https://leetcode.com/problems/increasing-decreasing-string",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "alibaba",
    title: "Alibaba",
    icon: "🛒",
    totalProblems: 35,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Arithmetic Slices II - Subsequence",
        url: "https://leetcode.com/problems/arithmetic-slices-ii-subsequence",
        difficulty: "Hard",
      },
      {
        name: "Intersection of Two Linked Lists",
        url: "https://leetcode.com/problems/intersection-of-two-linked-lists",
        difficulty: "Easy",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Longest Common Prefix",
        url: "https://leetcode.com/problems/longest-common-prefix",
        difficulty: "Easy",
      },
      {
        name: "LFU Cache",
        url: "https://leetcode.com/problems/lfu-cache",
        difficulty: "Hard",
      },
      {
        name: "Unique Paths",
        url: "https://leetcode.com/problems/unique-paths",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Subarrays with K Different Integers",
        url: "https://leetcode.com/problems/subarrays-with-k-different-integers",
        difficulty: "Hard",
      },
      {
        name: "Maximum Product Subarray",
        url: "https://leetcode.com/problems/maximum-product-subarray",
        difficulty: "Medium",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Valid Parenthesis String",
        url: "https://leetcode.com/problems/valid-parenthesis-string",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Symmetric Tree",
        url: "https://leetcode.com/problems/symmetric-tree",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Inorder Traversal",
        url: "https://leetcode.com/problems/binary-tree-inorder-traversal",
        difficulty: "Medium",
      },
      {
        name: "Binary Search Tree Iterator",
        url: "https://leetcode.com/problems/binary-search-tree-iterator",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Path Sum IV",
        url: "https://leetcode.com/problems/path-sum-iv",
        difficulty: "Medium",
      },
      {
        name: "Split Array with Equal Sum",
        url: "https://leetcode.com/problems/split-array-with-equal-sum",
        difficulty: "Medium",
      },
      {
        name: "Split Concatenated Strings",
        url: "https://leetcode.com/problems/split-concatenated-strings",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "amazon",
    title: "Amazon",
    icon: "📦",
    totalProblems: 62,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum/",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        difficulty: "Easy",
      },
      {
        name: "Contains Duplicate",
        url: "https://leetcode.com/problems/contains-duplicate/",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self/",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray/",
        difficulty: "Medium",
      },
      {
        name: "Maximum Product Subarray",
        url: "https://leetcode.com/problems/maximum-product-subarray/",
        difficulty: "Medium",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
        difficulty: "Medium",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum/",
        difficulty: "Medium",
      },
      {
        name: "Container With Most Water",
        url: "https://leetcode.com/problems/container-with-most-water/",
        difficulty: "Medium",
      },
      {
        name: "Sum of Two Integers",
        url: "https://leetcode.com/problems/sum-of-two-integers/",
        difficulty: "Medium",
      },
      {
        name: "Number of 1 Bits",
        url: "https://leetcode.com/problems/number-of-1-bits/",
        difficulty: "Easy",
      },
      {
        name: "Counting Bits",
        url: "https://leetcode.com/problems/counting-bits/",
        difficulty: "Easy",
      },
      {
        name: "Missing Number",
        url: "https://leetcode.com/problems/missing-number/",
        difficulty: "Easy",
      },
      {
        name: "Reverse Bits",
        url: "https://leetcode.com/problems/reverse-bits/",
        difficulty: "Easy",
      },
      {
        name: "Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs/",
        difficulty: "Easy",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change/",
        difficulty: "Medium",
      },
      {
        name: "Longest Increasing Subsequence",
        url: "https://leetcode.com/problems/longest-increasing-subsequence/",
        difficulty: "Medium",
      },
      {
        name: "Longest Common Subsequence",
        url: "https://leetcode.com/problems/longest-common-subsequence/",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break/",
        difficulty: "Medium",
      },
      {
        name: "Combination Sum IV",
        url: "https://leetcode.com/problems/combination-sum-iv/",
        difficulty: "Medium",
      },
      {
        name: "House Robber",
        url: "https://leetcode.com/problems/house-robber/",
        difficulty: "Medium",
      },
      {
        name: "House Robber II",
        url: "https://leetcode.com/problems/house-robber-ii/",
        difficulty: "Medium",
      },
      {
        name: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways/",
        difficulty: "Medium",
      },
      {
        name: "Unique Paths",
        url: "https://leetcode.com/problems/unique-paths/",
        difficulty: "Medium",
      },
      {
        name: "Jump Game",
        url: "https://leetcode.com/problems/jump-game/",
        difficulty: "Medium",
      },
      {
        name: "Clone Graph",
        url: "https://leetcode.com/problems/clone-graph/",
        difficulty: "Medium",
      },
      {
        name: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule/",
        difficulty: "Medium",
      },
      {
        name: "Pacific Atlantic Water Flow",
        url: "https://leetcode.com/problems/pacific-atlantic-water-flow/",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands/",
        difficulty: "Medium",
      },
      {
        name: "Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/longest-consecutive-sequence/",
        difficulty: "Medium",
      },
      {
        name: "Insert Interval",
        url: "https://leetcode.com/problems/insert-interval/",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals/",
        difficulty: "Medium",
      },
      {
        name: "Non-overlapping Intervals",
        url: "https://leetcode.com/problems/non-overlapping-intervals/",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list/",
        difficulty: "Easy",
      },
      {
        name: "Linked List Cycle",
        url: "https://leetcode.com/problems/linked-list-cycle/",
        difficulty: "Easy",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists/",
        difficulty: "Easy",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists/",
        difficulty: "Hard",
      },
      {
        name: "Remove Nth Node From End of List",
        url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
        difficulty: "Medium",
      },
      {
        name: "Reorder List",
        url: "https://leetcode.com/problems/reorder-list/",
        difficulty: "Medium",
      },
      {
        name: "Set Matrix Zeroes",
        url: "https://leetcode.com/problems/set-matrix-zeroes/",
        difficulty: "Medium",
      },
      {
        name: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix/",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image/",
        difficulty: "Medium",
      },
      {
        name: "Word Search",
        url: "https://leetcode.com/problems/word-search/",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        difficulty: "Medium",
      },
      {
        name: "Longest Repeating Character Replacement",
        url: "https://leetcode.com/problems/longest-repeating-character-replacement/",
        difficulty: "Medium",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring/",
        difficulty: "Hard",
      },
      {
        name: "Valid Anagram",
        url: "https://leetcode.com/problems/valid-anagram/",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams/",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses/",
        difficulty: "Easy",
      },
      {
        name: "Valid Palindrome",
        url: "https://leetcode.com/problems/valid-palindrome/",
        difficulty: "Easy",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring/",
        difficulty: "Medium",
      },
      {
        name: "Palindromic Substrings",
        url: "https://leetcode.com/problems/palindromic-substrings/",
        difficulty: "Medium",
      },
      {
        name: "Maximum Depth of Binary Tree",
        url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        difficulty: "Easy",
      },
      {
        name: "Same Tree",
        url: "https://leetcode.com/problems/same-tree/",
        difficulty: "Easy",
      },
      {
        name: "Invert Binary Tree",
        url: "https://leetcode.com/problems/invert-binary-tree/",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Maximum Path Sum",
        url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
        difficulty: "Hard",
      },
      {
        name: "Subtree of Another Tree",
        url: "https://leetcode.com/problems/subtree-of-another-tree/",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "appdynamics",
    title: "AppDynamics",
    icon: "📊",
    totalProblems: 8,
    solvedProblems: 0,
    problems: [
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Moving Average from Data Stream",
        url: "https://leetcode.com/problems/moving-average-from-data-stream",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Maximal Square",
        url: "https://leetcode.com/problems/maximal-square",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Maximum Path Sum",
        url: "https://leetcode.com/problems/binary-tree-maximum-path-sum",
        difficulty: "Hard",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring with At Most K Distinct Characters",
        url: "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "apple",
    title: "Apple",
    icon: "🍎",
    totalProblems: 62,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum/",
        difficulty: "Easy",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray/",
        difficulty: "Easy",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list/",
        difficulty: "Easy",
      },
      {
        name: "Happy Number",
        url: "https://leetcode.com/problems/happy-number/",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses/",
        difficulty: "Easy",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists/",
        difficulty: "Easy",
      },
      {
        name: "Count Primes",
        url: "https://leetcode.com/problems/count-primes/",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        difficulty: "Easy",
      },
      {
        name: "Reverse Integer",
        url: "https://leetcode.com/problems/reverse-integer/",
        difficulty: "Easy",
      },
      {
        name: "Palindrome Number",
        url: "https://leetcode.com/problems/palindrome-number/",
        difficulty: "Easy",
      },
      {
        name: "Valid Anagram",
        url: "https://leetcode.com/problems/valid-anagram/",
        difficulty: "Easy",
      },
      {
        name: "Remove Duplicates from Sorted Array",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
        difficulty: "Easy",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string/",
        difficulty: "Easy",
      },
      {
        name: "Fizz Buzz",
        url: "https://leetcode.com/problems/fizz-buzz/",
        difficulty: "Easy",
      },
      {
        name: "Valid Palindrome",
        url: "https://leetcode.com/problems/valid-palindrome/",
        difficulty: "Easy",
      },
      {
        name: "Implement strStr()",
        url: "https://leetcode.com/problems/implement-strstr/",
        difficulty: "Easy",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack/",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock II",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/",
        difficulty: "Easy",
      },
      {
        name: "Maximum Depth of Binary Tree",
        url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        difficulty: "Easy",
      },
      {
        name: "Symmetric Tree",
        url: "https://leetcode.com/problems/symmetric-tree/",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum/",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers/",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache/",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands/",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self/",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string/",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals/",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break/",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number/",
        difficulty: "Medium",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image/",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams/",
        difficulty: "Medium",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change/",
        difficulty: "Medium",
      },
      {
        name: "Unique Paths",
        url: "https://leetcode.com/problems/unique-paths/",
        difficulty: "Medium",
      },
      {
        name: "Container With Most Water",
        url: "https://leetcode.com/problems/container-with-most-water/",
        difficulty: "Medium",
      },
      {
        name: "Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight/",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1/",
        difficulty: "Medium",
      },
      {
        name: "Top K Frequent Elements",
        url: "https://leetcode.com/problems/top-k-frequent-elements/",
        difficulty: "Medium",
      },
      {
        name: "Find First and Last Position of Element in Sorted Array",
        url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
        difficulty: "Medium",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays/",
        difficulty: "Hard",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder/",
        difficulty: "Hard",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists/",
        difficulty: "Hard",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream/",
        difficulty: "Hard",
      },
      {
        name: "Sudoku Solver",
        url: "https://leetcode.com/problems/sudoku-solver/",
        difficulty: "Hard",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive/",
        difficulty: "Hard",
      },
      {
        name: "Concatenated Words",
        url: "https://leetcode.com/problems/concatenated-words/",
        difficulty: "Hard",
      },
      {
        name: "The Skyline Problem",
        url: "https://leetcode.com/problems/the-skyline-problem/",
        difficulty: "Hard",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water/",
        difficulty: "Hard",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary/",
        difficulty: "Hard",
      },
      {
        name: "N-Queens",
        url: "https://leetcode.com/problems/n-queens/",
        difficulty: "Hard",
      },
      {
        name: "Edit Distance",
        url: "https://leetcode.com/problems/edit-distance/",
        difficulty: "Hard",
      },
      {
        name: "Word Break II",
        url: "https://leetcode.com/problems/word-break-ii/",
        difficulty: "Hard",
      },
      {
        name: "Maximum Frequency Stack",
        url: "https://leetcode.com/problems/maximum-frequency-stack/",
        difficulty: "Hard",
      },
      {
        name: "Jump Game II",
        url: "https://leetcode.com/problems/jump-game-ii/",
        difficulty: "Hard",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum/",
        difficulty: "Hard",
      },
      {
        name: "Palindrome Pairs",
        url: "https://leetcode.com/problems/palindrome-pairs/",
        difficulty: "Hard",
      },
      {
        name: "Find in Mountain Array",
        url: "https://leetcode.com/problems/find-in-mountain-array/",
        difficulty: "Hard",
      },
      {
        name: "Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/longest-consecutive-sequence/",
        difficulty: "Hard",
      },
      {
        name: "LFU Cache",
        url: "https://leetcode.com/problems/lfu-cache/",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "atlassian",
    title: "Atlassian",
    icon: "🔷",
    totalProblems: 62,
    solvedProblems: 0,
    problems: [
      {
        name: "Find Leaves of Binary Tree",
        url: "https://leetcode.com/problems/find-leaves-of-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Time Based Key-Value Store",
        url: "https://leetcode.com/problems/time-based-key-value-store",
        difficulty: "Medium",
      },
      {
        name: "Lemonade Change",
        url: "https://leetcode.com/problems/lemonade-change",
        difficulty: "Easy",
      },
      {
        name: "Maximum Average Subtree",
        url: "https://leetcode.com/problems/maximum-average-subtree",
        difficulty: "Medium",
      },
      {
        name: "Greatest Common Divisor of Strings",
        url: "https://leetcode.com/problems/greatest-common-divisor-of-strings",
        difficulty: "Easy",
      },
      {
        name: "Shortest Distance to a Character",
        url: "https://leetcode.com/problems/shortest-distance-to-a-character",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Design Hit Counter",
        url: "https://leetcode.com/problems/design-hit-counter",
        difficulty: "Medium",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Peeking Iterator",
        url: "https://leetcode.com/problems/peeking-iterator",
        difficulty: "Medium",
      },
      {
        name: "Dice Roll Simulation",
        url: "https://leetcode.com/problems/dice-roll-simulation",
        difficulty: "Medium",
      },
      {
        name: "Longest Increasing Subsequence",
        url: "https://leetcode.com/problems/longest-increasing-subsequence",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Logger Rate Limiter",
        url: "https://leetcode.com/problems/logger-rate-limiter",
        difficulty: "Easy",
      },
      {
        name: "Rank Teams by Votes",
        url: "https://leetcode.com/problems/rank-teams-by-votes",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Single Element in a Sorted Array",
        url: "https://leetcode.com/problems/single-element-in-a-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Backspace String Compare",
        url: "https://leetcode.com/problems/backspace-string-compare",
        difficulty: "Easy",
      },
      {
        name: "Next Permutation",
        url: "https://leetcode.com/problems/next-permutation",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Evaluate Reverse Polish Notation",
        url: "https://leetcode.com/problems/evaluate-reverse-polish-notation",
        difficulty: "Medium",
      },
      {
        name: "Friend Circles",
        url: "https://leetcode.com/problems/friend-circles",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock III",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii",
        difficulty: "Hard",
      },
      {
        name: "Subarray Product Less Than K",
        url: "https://leetcode.com/problems/subarray-product-less-than-k",
        difficulty: "Medium",
      },
      {
        name: "Palindromic Substrings",
        url: "https://leetcode.com/problems/palindromic-substrings",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Right Side View",
        url: "https://leetcode.com/problems/binary-tree-right-side-view",
        difficulty: "Medium",
      },
      {
        name: "Symmetric Tree",
        url: "https://leetcode.com/problems/symmetric-tree",
        difficulty: "Easy",
      },
      {
        name: "Flatten Nested List Iterator",
        url: "https://leetcode.com/problems/flatten-nested-list-iterator",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Binary Search Tree Iterator",
        url: "https://leetcode.com/problems/binary-search-tree-iterator",
        difficulty: "Medium",
      },
      {
        name: "Leaf-Similar Trees",
        url: "https://leetcode.com/problems/leaf-similar-trees",
        difficulty: "Easy",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Valid Palindrome II",
        url: "https://leetcode.com/problems/valid-palindrome-ii",
        difficulty: "Easy",
      },
      {
        name: "Insert into a Binary Search Tree",
        url: "https://leetcode.com/problems/insert-into-a-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight",
        difficulty: "Medium",
      },
      {
        name: "Basic Calculator II",
        url: "https://leetcode.com/problems/basic-calculator-ii",
        difficulty: "Medium",
      },
      {
        name: "Diameter of Binary Tree",
        url: "https://leetcode.com/problems/diameter-of-binary-tree",
        difficulty: "Easy",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Subsets",
        url: "https://leetcode.com/problems/subsets",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Top K Frequent Words",
        url: "https://leetcode.com/problems/top-k-frequent-words",
        difficulty: "Medium",
      },
      {
        name: "Single Number",
        url: "https://leetcode.com/problems/single-number",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Verbal Arithmetic Puzzle",
        url: "https://leetcode.com/problems/verbal-arithmetic-puzzle",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "audible",
    title: "Audible",
    icon: "🎧",
    totalProblems: 16,
    solvedProblems: 0,
    problems: [
      {
        name: "Missing Number In Arithmetic Progression",
        url: "https://leetcode.com/problems/missing-number-in-arithmetic-progression",
        difficulty: "Easy",
      },
      {
        name: "Boundary of Binary Tree",
        url: "https://leetcode.com/problems/boundary-of-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Concatenated Words",
        url: "https://leetcode.com/problems/concatenated-words",
        difficulty: "Hard",
      },
      {
        name: "Word Break II",
        url: "https://leetcode.com/problems/word-break-ii",
        difficulty: "Hard",
      },
      {
        name: "Reorder Data in Log Files",
        url: "https://leetcode.com/problems/reorder-data-in-log-files",
        difficulty: "Easy",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Set Matrix Zeroes",
        url: "https://leetcode.com/problems/set-matrix-zeroes",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Symmetric Tree",
        url: "https://leetcode.com/problems/symmetric-tree",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Minimum Absolute Difference",
        url: "https://leetcode.com/problems/minimum-absolute-difference",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "bloomberg",
    title: "Bloomberg",
    icon: "📰",
    totalProblems: 38,
    solvedProblems: 0,
    problems: [
      {
        name: "Copy List with Random Pointer",
        url: "https://leetcode.com/problems/copy-list-with-random-pointer",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Design Underground System",
        url: "https://leetcode.com/problems/design-underground-system",
        difficulty: "Medium",
      },
      {
        name: "Flatten a Multilevel Doubly Linked List",
        url: "https://leetcode.com/problems/flatten-a-multilevel-doubly-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers II",
        url: "https://leetcode.com/problems/add-two-numbers-ii",
        difficulty: "Medium",
      },
      {
        name: "Candy Crush",
        url: "https://leetcode.com/problems/candy-crush",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Kill Process",
        url: "https://leetcode.com/problems/kill-process",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Sort Characters By Frequency",
        url: "https://leetcode.com/problems/sort-characters-by-frequency",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Invalid Transactions",
        url: "https://leetcode.com/problems/invalid-transactions",
        difficulty: "Medium",
      },
      {
        name: "Populating Next Right Pointers in Each Node II",
        url: "https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack",
        difficulty: "Easy",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Shortest Palindrome",
        url: "https://leetcode.com/problems/shortest-palindrome",
        difficulty: "Hard",
      },
      {
        name: "Number of Ships in a Rectangle",
        url: "https://leetcode.com/problems/number-of-ships-in-a-rectangle",
        difficulty: "Hard",
      },
      {
        name: "Two City Scheduling",
        url: "https://leetcode.com/problems/two-city-scheduling",
        difficulty: "Easy",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
      {
        name: "Populating Next Right Pointers in Each Node",
        url: "https://leetcode.com/problems/populating-next-right-pointers-in-each-node",
        difficulty: "Medium",
      },
      {
        name: "Elimination Game",
        url: "https://leetcode.com/problems/elimination-game",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "bytedance",
    title: "ByteDance",
    icon: "🎵",
    totalProblems: 15,
    solvedProblems: 0,
    problems: [
      {
        name: "K-th Smallest in Lexicographical Order",
        url: "https://leetcode.com/problems/k-th-smallest-in-lexicographical-order",
        difficulty: "Hard",
      },
      {
        name: "Optimal Account Balancing",
        url: "https://leetcode.com/problems/optimal-account-balancing",
        difficulty: "Hard",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Reverse Pairs",
        url: "https://leetcode.com/problems/reverse-pairs",
        difficulty: "Hard",
      },
      {
        name: "Android Unlock Patterns",
        url: "https://leetcode.com/problems/android-unlock-patterns",
        difficulty: "Medium",
      },
      {
        name: "Reverse Nodes in k-Group",
        url: "https://leetcode.com/problems/reverse-nodes-in-k-group",
        difficulty: "Hard",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water II",
        url: "https://leetcode.com/problems/trapping-rain-water-ii",
        difficulty: "Hard",
      },
      {
        name: "Number of Atoms",
        url: "https://leetcode.com/problems/number-of-atoms",
        difficulty: "Hard",
      },
      {
        name: "Frog Jump",
        url: "https://leetcode.com/problems/frog-jump",
        difficulty: "Hard",
      },
      {
        name: "Swap Adjacent in LR String",
        url: "https://leetcode.com/problems/swap-adjacent-in-lr-string",
        difficulty: "Medium",
      },
      {
        name: "Implement Rand10() Using Rand7()",
        url: "https://leetcode.com/problems/implement-rand10-using-rand7",
        difficulty: "Medium",
      },
      {
        name: "Smallest String With Swaps",
        url: "https://leetcode.com/problems/smallest-string-with-swaps",
        difficulty: "Medium",
      },
      {
        name: "Greatest Sum Divisible by Three",
        url: "https://leetcode.com/problems/greatest-sum-divisible-by-three",
        difficulty: "Medium",
      },
      {
        name: "Dinner Plate Stacks",
        url: "https://leetcode.com/problems/dinner-plate-stacks",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "capital-one",
    title: "Capital One",
    icon: "🏦",
    totalProblems: 18,
    solvedProblems: 0,
    problems: [
      {
        name: "Summary Ranges",
        url: "https://leetcode.com/problems/summary-ranges",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Pruning",
        url: "https://leetcode.com/problems/binary-tree-pruning",
        difficulty: "Medium",
      },
      {
        name: "Odd Even Linked List",
        url: "https://leetcode.com/problems/odd-even-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Copy List with Random Pointer",
        url: "https://leetcode.com/problems/copy-list-with-random-pointer",
        difficulty: "Medium",
      },
      {
        name: "Word Pattern",
        url: "https://leetcode.com/problems/word-pattern",
        difficulty: "Easy",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change",
        difficulty: "Medium",
      },
      {
        name: "Fizz Buzz",
        url: "https://leetcode.com/problems/fizz-buzz",
        difficulty: "Easy",
      },
      {
        name: "Greatest Common Divisor of Strings",
        url: "https://leetcode.com/problems/greatest-common-divisor-of-strings",
        difficulty: "Easy",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "Count Primes",
        url: "https://leetcode.com/problems/count-primes",
        difficulty: "Easy",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Plus One",
        url: "https://leetcode.com/problems/plus-one",
        difficulty: "Easy",
      },
      {
        name: "Remove Linked List Elements",
        url: "https://leetcode.com/problems/remove-linked-list-elements",
        difficulty: "Easy",
      },
      {
        name: "Four Divisors",
        url: "https://leetcode.com/problems/four-divisors",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "cisco",
    title: "Cisco",
    icon: "🌐",
    totalProblems: 20,
    solvedProblems: 0,
    problems: [
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Maximum Profit in Job Scheduling",
        url: "https://leetcode.com/problems/maximum-profit-in-job-scheduling",
        difficulty: "Hard",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Convert Binary Number in a Linked List to Integer",
        url: "https://leetcode.com/problems/convert-binary-number-in-a-linked-list-to-integer",
        difficulty: "Easy",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Snakes and Ladders",
        url: "https://leetcode.com/problems/snakes-and-ladders",
        difficulty: "Medium",
      },
      {
        name: "Reverse String",
        url: "https://leetcode.com/problems/reverse-string",
        difficulty: "Easy",
      },
      {
        name: "Validate IP Address",
        url: "https://leetcode.com/problems/validate-ip-address",
        difficulty: "Medium",
      },
      {
        name: "Strobogrammatic Number",
        url: "https://leetcode.com/problems/strobogrammatic-number",
        difficulty: "Easy",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Search Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree",
        difficulty: "Easy",
      },
      {
        name: "Number of 1 Bits",
        url: "https://leetcode.com/problems/number-of-1-bits",
        difficulty: "Easy",
      },
      {
        name: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "citrix",
    title: "Citrix",
    icon: "☁️",
    totalProblems: 12,
    solvedProblems: 0,
    problems: [
      {
        name: "Special Binary String",
        url: "https://leetcode.com/problems/special-binary-string",
        difficulty: "Hard",
      },
      {
        name: "Subdomain Visit Count",
        url: "https://leetcode.com/problems/subdomain-visit-count",
        difficulty: "Easy",
      },
      {
        name: "Cherry Pickup",
        url: "https://leetcode.com/problems/cherry-pickup",
        difficulty: "Hard",
      },
      {
        name: "Degree of an Array",
        url: "https://leetcode.com/problems/degree-of-an-array",
        difficulty: "Easy",
      },
      {
        name: "Consecutive Numbers Sum",
        url: "https://leetcode.com/problems/consecutive-numbers-sum",
        difficulty: "Hard",
      },
      {
        name: "Pairs of Songs With Total Durations Divisible by 60",
        url: "https://leetcode.com/problems/pairs-of-songs-with-total-durations-divisible-by-60",
        difficulty: "Easy",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Maximum Performance of a Team",
        url: "https://leetcode.com/problems/maximum-performance-of-a-team",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "cohesity",
    title: "Cohesity",
    icon: "💾",
    totalProblems: 12,
    solvedProblems: 0,
    problems: [
      {
        name: "Reverse Nodes in k-Group",
        url: "https://leetcode.com/problems/reverse-nodes-in-k-group",
        difficulty: "Hard",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Longest Mountain in Array",
        url: "https://leetcode.com/problems/longest-mountain-in-array",
        difficulty: "Medium",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Fraction to Recurring Decimal",
        url: "https://leetcode.com/problems/fraction-to-recurring-decimal",
        difficulty: "Medium",
      },
      {
        name: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
      {
        name: "Remove Duplicates from Sorted Array",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "coursera",
    title: "Coursera",
    icon: "📚",
    totalProblems: 14,
    solvedProblems: 0,
    problems: [
      {
        name: "Number of Music Playlists",
        url: "https://leetcode.com/problems/number-of-music-playlists",
        difficulty: "Hard",
      },
      {
        name: "Minimum Moves to Equal Array Elements",
        url: "https://leetcode.com/problems/minimum-moves-to-equal-array-elements",
        difficulty: "Easy",
      },
      {
        name: "Text Justification",
        url: "https://leetcode.com/problems/text-justification",
        difficulty: "Hard",
      },
      {
        name: "Special Binary String",
        url: "https://leetcode.com/problems/special-binary-string",
        difficulty: "Hard",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Subarray Product Less Than K",
        url: "https://leetcode.com/problems/subarray-product-less-than-k",
        difficulty: "Medium",
      },
      {
        name: "Reaching Points",
        url: "https://leetcode.com/problems/reaching-points",
        difficulty: "Hard",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Wildcard Matching",
        url: "https://leetcode.com/problems/wildcard-matching",
        difficulty: "Hard",
      },
      {
        name: "Highest Grade For Each Student",
        url: "https://leetcode.com/problems/highest-grade-for-each-student",
        difficulty: "Medium",
      },
      {
        name: "Palindromic Substrings",
        url: "https://leetcode.com/problems/palindromic-substrings",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Is Subsequence",
        url: "https://leetcode.com/problems/is-subsequence",
        difficulty: "Easy",
      },
      {
        name: "Minimum Increment to Make Array Unique",
        url: "https://leetcode.com/problems/minimum-increment-to-make-array-unique",
        difficulty: "Medium",
      },
      {
        name: "N-th Tribonacci Number",
        url: "https://leetcode.com/problems/n-th-tribonacci-number",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "cruise-automation",
    title: "Cruise Automation",
    icon: "🚗",
    totalProblems: 15,
    solvedProblems: 0,
    problems: [
      {
        name: "Synonymous Sentences",
        url: "https://leetcode.com/problems/synonymous-sentences",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Minesweeper",
        url: "https://leetcode.com/problems/minesweeper",
        difficulty: "Medium",
      },
      {
        name: "Zigzag Iterator",
        url: "https://leetcode.com/problems/zigzag-iterator",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Range Sum Query 2D - Immutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-immutable",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Wildcard Matching",
        url: "https://leetcode.com/problems/wildcard-matching",
        difficulty: "Hard",
      },
      {
        name: "Max Area of Island",
        url: "https://leetcode.com/problems/max-area-of-island",
        difficulty: "Medium",
      },
      {
        name: "Interval List Intersections",
        url: "https://leetcode.com/problems/interval-list-intersections",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Word Search",
        url: "https://leetcode.com/problems/word-search",
        difficulty: "Medium",
      },
      {
        name: "Unique Paths II",
        url: "https://leetcode.com/problems/unique-paths-ii",
        difficulty: "Medium",
      },
      {
        name: "Valid Sudoku",
        url: "https://leetcode.com/problems/valid-sudoku",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "citadel",
    title: "Citadel",
    icon: "🏛️",
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "Consecutive Numbers Sum",
        url: "https://leetcode.com/problems/consecutive-numbers-sum",
        difficulty: "Hard",
      },
      {
        name: "Longest String Chain",
        url: "https://leetcode.com/problems/longest-string-chain",
        difficulty: "Medium",
      },
      {
        name: "Different Ways to Add Parentheses",
        url: "https://leetcode.com/problems/different-ways-to-add-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Palindromic Substrings",
        url: "https://leetcode.com/problems/palindromic-substrings",
        difficulty: "Medium",
      },
      {
        name: "Inorder Successor in BST",
        url: "https://leetcode.com/problems/inorder-successor-in-bst",
        difficulty: "Medium",
      },
      {
        name: "Longest Valid Parentheses",
        url: "https://leetcode.com/problems/longest-valid-parentheses",
        difficulty: "Hard",
      },
      {
        name: "Knight Dialer",
        url: "https://leetcode.com/problems/knight-dialer",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Best Time to Buy and Sell Stock II",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii",
        difficulty: "Easy",
      },
      {
        name: "Maximal Square",
        url: "https://leetcode.com/problems/maximal-square",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Design Circular Queue",
        url: "https://leetcode.com/problems/design-circular-queue",
        difficulty: "Medium",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Find Pivot Index",
        url: "https://leetcode.com/problems/find-pivot-index",
        difficulty: "Easy",
      },
      {
        name: "Reconstruct Itinerary",
        url: "https://leetcode.com/problems/reconstruct-itinerary",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock III",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Right Side View",
        url: "https://leetcode.com/problems/binary-tree-right-side-view",
        difficulty: "Medium",
      },
      {
        name: "Construct Binary Tree from Preorder and Inorder Traversal",
        url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal",
        difficulty: "Medium",
      },
      {
        name: "Maximum Product of Three Numbers",
        url: "https://leetcode.com/problems/maximum-product-of-three-numbers",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Implement Stack using Queues",
        url: "https://leetcode.com/problems/implement-stack-using-queues",
        difficulty: "Easy",
      },
      {
        name: "Longest Substring with At Most K Distinct Characters",
        url: "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters",
        difficulty: "Hard",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Maximal Rectangle",
        url: "https://leetcode.com/problems/maximal-rectangle",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs",
        difficulty: "Easy",
      },
      {
        name: "Implement strStr()",
        url: "https://leetcode.com/problems/implement-strstr",
        difficulty: "Easy",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Maximum Length of Repeated Subarray",
        url: "https://leetcode.com/problems/maximum-length-of-repeated-subarray",
        difficulty: "Medium",
      },
      {
        name: "Best Position for a Service Centre",
        url: "https://leetcode.com/problems/best-position-for-a-service-centre",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "data-bricks",
    title: "Data Bricks",
    icon: "🧱",
    totalProblems: 18,
    solvedProblems: 0,
    problems: [
      {
        name: "Closest Leaf in a Binary Tree",
        url: "https://leetcode.com/problems/closest-leaf-in-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Vertical Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-vertical-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Remove Comments",
        url: "https://leetcode.com/problems/remove-comments",
        difficulty: "Medium",
      },
      {
        name: "Web Crawler Multithreaded",
        url: "https://leetcode.com/problems/web-crawler-multithreaded",
        difficulty: "Medium",
      },
      {
        name: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways",
        difficulty: "Medium",
      },
      {
        name: "The Skyline Problem",
        url: "https://leetcode.com/problems/the-skyline-problem",
        difficulty: "Hard",
      },
      {
        name: "Second Degree Follower",
        url: "https://leetcode.com/problems/second-degree-follower",
        difficulty: "Medium",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Convert Binary Search Tree to Sorted Doubly Linked List",
        url: "https://leetcode.com/problems/convert-binary-search-tree-to-sorted-doubly-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1) - Duplicates allowed",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1-duplicates-allowed",
        difficulty: "Hard",
      },
      {
        name: "Vertical Order Traversal of a Binary Tree",
        url: "https://leetcode.com/problems/vertical-order-traversal-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Intersection of Two Arrays II",
        url: "https://leetcode.com/problems/intersection-of-two-arrays-ii",
        difficulty: "Easy",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Flatten Binary Tree to Linked List",
        url: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Time Based Key-Value Store",
        url: "https://leetcode.com/problems/time-based-key-value-store",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "doordash",
    title: "DoorDash",
    icon: "🚚",
    totalProblems: 22,
    solvedProblems: 0,
    problems: [
      {
        name: "Employee Free Time",
        url: "https://leetcode.com/problems/employee-free-time",
        difficulty: "Hard",
      },
      {
        name: "Count All Valid Pickup and Delivery Options",
        url: "https://leetcode.com/problems/count-all-valid-pickup-and-delivery-options",
        difficulty: "Hard",
      },
      {
        name: "Max Area of Island",
        url: "https://leetcode.com/problems/max-area-of-island",
        difficulty: "Medium",
      },
      {
        name: "Meeting Scheduler",
        url: "https://leetcode.com/problems/meeting-scheduler",
        difficulty: "Medium",
      },
      {
        name: "Design Twitter",
        url: "https://leetcode.com/problems/design-twitter",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Basic Calculator II",
        url: "https://leetcode.com/problems/basic-calculator-ii",
        difficulty: "Medium",
      },
      {
        name: "Course Schedule II",
        url: "https://leetcode.com/problems/course-schedule-ii",
        difficulty: "Medium",
      },
      {
        name: "Immediate Food Delivery II",
        url: "https://leetcode.com/problems/immediate-food-delivery-ii",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Immediate Food Delivery I",
        url: "https://leetcode.com/problems/immediate-food-delivery-i",
        difficulty: "Easy",
      },
      {
        name: "Sudoku Solver",
        url: "https://leetcode.com/problems/sudoku-solver",
        difficulty: "Hard",
      },
      {
        name: "Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Design Tic-Tac-Toe",
        url: "https://leetcode.com/problems/design-tic-tac-toe",
        difficulty: "Medium",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Interval List Intersections",
        url: "https://leetcode.com/problems/interval-list-intersections",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Valid Sudoku",
        url: "https://leetcode.com/problems/valid-sudoku",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Basic Calculator III",
        url: "https://leetcode.com/problems/basic-calculator-iii",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "dropbox",
    title: "DropBox",
    icon: "📦",
    totalProblems: 22,
    solvedProblems: 0,
    problems: [
      {
        name: "Find Duplicate File in System",
        url: "https://leetcode.com/problems/find-duplicate-file-in-system",
        difficulty: "Medium",
      },
      {
        name: "Game of Life",
        url: "https://leetcode.com/problems/game-of-life",
        difficulty: "Medium",
      },
      {
        name: "Minimize Malware Spread",
        url: "https://leetcode.com/problems/minimize-malware-spread",
        difficulty: "Hard",
      },
      {
        name: "Design Phone Directory",
        url: "https://leetcode.com/problems/design-phone-directory",
        difficulty: "Medium",
      },
      {
        name: "Word Pattern II",
        url: "https://leetcode.com/problems/word-pattern-ii",
        difficulty: "Hard",
      },
      {
        name: "Design Hit Counter",
        url: "https://leetcode.com/problems/design-hit-counter",
        difficulty: "Medium",
      },
      {
        name: "Minimize Malware Spread II",
        url: "https://leetcode.com/problems/minimize-malware-spread-ii",
        difficulty: "Hard",
      },
      {
        name: "Web Crawler Multithreaded",
        url: "https://leetcode.com/problems/web-crawler-multithreaded",
        difficulty: "Medium",
      },
      {
        name: "Number of Valid Words for Each Puzzle",
        url: "https://leetcode.com/problems/number-of-valid-words-for-each-puzzle",
        difficulty: "Hard",
      },
      {
        name: "Grid Illumination",
        url: "https://leetcode.com/problems/grid-illumination",
        difficulty: "Hard",
      },
      {
        name: "Design Search Autocomplete System",
        url: "https://leetcode.com/problems/design-search-autocomplete-system",
        difficulty: "Hard",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Word Pattern",
        url: "https://leetcode.com/problems/word-pattern",
        difficulty: "Easy",
      },
      {
        name: "Web Crawler",
        url: "https://leetcode.com/problems/web-crawler",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Pairs of Songs With Total Durations Divisible by 60",
        url: "https://leetcode.com/problems/pairs-of-songs-with-total-durations-divisible-by-60",
        difficulty: "Easy",
      },
      {
        name: "Word Break II",
        url: "https://leetcode.com/problems/word-break-ii",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Minimum Path Sum",
        url: "https://leetcode.com/problems/minimum-path-sum",
        difficulty: "Medium",
      },
      {
        name: "Implement strStr()",
        url: "https://leetcode.com/problems/implement-strstr",
        difficulty: "Easy",
      },
      {
        name: "Check If It Is a Good Array",
        url: "https://leetcode.com/problems/check-if-it-is-a-good-array",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "ebay",
    title: "Ebay",
    icon: "🛒",
    totalProblems: 65,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Boundary of Binary Tree",
        url: "https://leetcode.com/problems/boundary-of-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "N-Queens",
        url: "https://leetcode.com/problems/n-queens",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix",
        difficulty: "Medium",
      },
      {
        name: "Copy List with Random Pointer",
        url: "https://leetcode.com/problems/copy-list-with-random-pointer",
        difficulty: "Medium",
      },
      {
        name: "Hand of Straights",
        url: "https://leetcode.com/problems/hand-of-straights",
        difficulty: "Medium",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Diagonal Traverse",
        url: "https://leetcode.com/problems/diagonal-traverse",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Right Side View",
        url: "https://leetcode.com/problems/binary-tree-right-side-view",
        difficulty: "Medium",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Basic Calculator II",
        url: "https://leetcode.com/problems/basic-calculator-ii",
        difficulty: "Medium",
      },
      {
        name: "Search in a Sorted Array of Unknown Size",
        url: "https://leetcode.com/problems/search-in-a-sorted-array-of-unknown-size",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Serialize and Deserialize N-ary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-n-ary-tree",
        difficulty: "Hard",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Reverse String",
        url: "https://leetcode.com/problems/reverse-string",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Cameras",
        url: "https://leetcode.com/problems/binary-tree-cameras",
        difficulty: "Hard",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Find Leaves of Binary Tree",
        url: "https://leetcode.com/problems/find-leaves-of-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Rotate String",
        url: "https://leetcode.com/problems/rotate-string",
        difficulty: "Easy",
      },
      {
        name: "Surrounded Regions",
        url: "https://leetcode.com/problems/surrounded-regions",
        difficulty: "Medium",
      },
      {
        name: "Linked List Cycle",
        url: "https://leetcode.com/problems/linked-list-cycle",
        difficulty: "Easy",
      },
      {
        name: "Reorder List",
        url: "https://leetcode.com/problems/reorder-list",
        difficulty: "Medium",
      },
      {
        name: "Rearrange String k Distance Apart",
        url: "https://leetcode.com/problems/rearrange-string-k-distance-apart",
        difficulty: "Hard",
      },
      {
        name: "Serialize and Deserialize BST",
        url: "https://leetcode.com/problems/serialize-and-deserialize-bst",
        difficulty: "Medium",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
      {
        name: "Kth Largest Element in a Stream",
        url: "https://leetcode.com/problems/kth-largest-element-in-a-stream",
        difficulty: "Easy",
      },
      {
        name: "Maximum Width Ramp",
        url: "https://leetcode.com/problems/maximum-width-ramp",
        difficulty: "Medium",
      },
      {
        name: "Count Univalue Subtrees",
        url: "https://leetcode.com/problems/count-univalue-subtrees",
        difficulty: "Medium",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change",
        difficulty: "Medium",
      },
      {
        name: "Relative Sort Array",
        url: "https://leetcode.com/problems/relative-sort-array",
        difficulty: "Easy",
      },
      {
        name: "Shortest Word Distance II",
        url: "https://leetcode.com/problems/shortest-word-distance-ii",
        difficulty: "Medium",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Snapshot Array",
        url: "https://leetcode.com/problems/snapshot-array",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Odd Even Linked List",
        url: "https://leetcode.com/problems/odd-even-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Implement Trie (Prefix Tree)",
        url: "https://leetcode.com/problems/implement-trie-prefix-tree",
        difficulty: "Medium",
      },
      {
        name: "Asteroid Collision",
        url: "https://leetcode.com/problems/asteroid-collision",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Subarray Sum Equals K",
        url: "https://leetcode.com/problems/subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Flatten Nested List Iterator",
        url: "https://leetcode.com/problems/flatten-nested-list-iterator",
        difficulty: "Medium",
      },
      {
        name: "Sort Colors",
        url: "https://leetcode.com/problems/sort-colors",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Zigzag Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive",
        difficulty: "Hard",
      },
      {
        name: "Next Permutation",
        url: "https://leetcode.com/problems/next-permutation",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "facebook",
    title: "Facebook",
    icon: "👤",
    totalProblems: 60,
    solvedProblems: 0,
    problems: [
      {
        name: "Remove Invalid Parentheses",
        url: "https://leetcode.com/problems/remove-invalid-parentheses",
        difficulty: "Hard",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "Verifying an Alien Dictionary",
        url: "https://leetcode.com/problems/verifying-an-alien-dictionary",
        difficulty: "Easy",
      },
      {
        name: "Read N Characters Given Read4 II - Call multiple times",
        url: "https://leetcode.com/problems/read-n-characters-given-read4-ii-call-multiple-times",
        difficulty: "Hard",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways",
        difficulty: "Medium",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Valid Palindrome II",
        url: "https://leetcode.com/problems/valid-palindrome-ii",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Subarray Sum Equals K",
        url: "https://leetcode.com/problems/subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "First Bad Version",
        url: "https://leetcode.com/problems/first-bad-version",
        difficulty: "Easy",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "K Closest Points to Origin",
        url: "https://leetcode.com/problems/k-closest-points-to-origin",
        difficulty: "Medium",
      },
      {
        name: "Add Binary",
        url: "https://leetcode.com/problems/add-binary",
        difficulty: "Easy",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
      {
        name: "Minimum Remove to Make Valid Parentheses",
        url: "https://leetcode.com/problems/minimum-remove-to-make-valid-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Valid Palindrome",
        url: "https://leetcode.com/problems/valid-palindrome",
        difficulty: "Easy",
      },
      {
        name: "Divide Two Integers",
        url: "https://leetcode.com/problems/divide-two-integers",
        difficulty: "Medium",
      },
      {
        name: "Next Permutation",
        url: "https://leetcode.com/problems/next-permutation",
        difficulty: "Medium",
      },
      {
        name: "Binary Search Tree Iterator",
        url: "https://leetcode.com/problems/binary-search-tree-iterator",
        difficulty: "Medium",
      },
      {
        name: "Expression Add Operators",
        url: "https://leetcode.com/problems/expression-add-operators",
        difficulty: "Hard",
      },
      {
        name: "Add and Search Word - Data structure design",
        url: "https://leetcode.com/problems/add-and-search-word-data-structure-design",
        difficulty: "Medium",
      },
      {
        name: "Valid Number",
        url: "https://leetcode.com/problems/valid-number",
        difficulty: "Hard",
      },
      {
        name: "Read N Characters Given Read4",
        url: "https://leetcode.com/problems/read-n-characters-given-read4",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Maximum Path Sum",
        url: "https://leetcode.com/problems/binary-tree-maximum-path-sum",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Vertical Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-vertical-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Convert Binary Search Tree to Sorted Doubly Linked List",
        url: "https://leetcode.com/problems/convert-binary-search-tree-to-sorted-doubly-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Clone Graph",
        url: "https://leetcode.com/problems/clone-graph",
        difficulty: "Medium",
      },
      {
        name: "Maximum Size Subarray Sum Equals k",
        url: "https://leetcode.com/problems/maximum-size-subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "Find All Anagrams in a String",
        url: "https://leetcode.com/problems/find-all-anagrams-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Sparse Matrix Multiplication",
        url: "https://leetcode.com/problems/sparse-matrix-multiplication",
        difficulty: "Medium",
      },
      {
        name: "Add Strings",
        url: "https://leetcode.com/problems/add-strings",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Palindrome Pairs",
        url: "https://leetcode.com/problems/palindrome-pairs",
        difficulty: "Hard",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Diameter of Binary Tree",
        url: "https://leetcode.com/problems/diameter-of-binary-tree",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Paths",
        url: "https://leetcode.com/problems/binary-tree-paths",
        difficulty: "Easy",
      },
      {
        name: "Continuous Subarray Sum",
        url: "https://leetcode.com/problems/continuous-subarray-sum",
        difficulty: "Medium",
      },
      {
        name: "Find the Celebrity",
        url: "https://leetcode.com/problems/find-the-celebrity",
        difficulty: "Medium",
      },
      {
        name: "Task Scheduler",
        url: "https://leetcode.com/problems/task-scheduler",
        difficulty: "Medium",
      },
      {
        name: "Multiply Strings",
        url: "https://leetcode.com/problems/multiply-strings",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Maximum Sum of 3 Non-Overlapping Subarrays",
        url: "https://leetcode.com/problems/maximum-sum-of-3-non-overlapping-subarrays",
        difficulty: "Hard",
      },
      {
        name: "Intersection of Two Arrays",
        url: "https://leetcode.com/problems/intersection-of-two-arrays",
        difficulty: "Easy",
      },
      {
        name: "Longest Substring with At Most K Distinct Characters",
        url: "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters",
        difficulty: "Hard",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Flatten Binary Tree to Linked List",
        url: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Copy List with Random Pointer",
        url: "https://leetcode.com/problems/copy-list-with-random-pointer",
        difficulty: "Medium",
      },
      {
        name: "Exclusive Time of Functions",
        url: "https://leetcode.com/problems/exclusive-time-of-functions",
        difficulty: "Medium",
      },
      {
        name: "Accounts Merge",
        url: "https://leetcode.com/problems/accounts-merge",
        difficulty: "Medium",
      },
      {
        name: "One Edit Distance",
        url: "https://leetcode.com/problems/one-edit-distance",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "flipkart",
    title: "Flipkart",
    icon: "🛍️",
    totalProblems: 13,
    solvedProblems: 0,
    problems: [
      {
        name: "Cherry Pickup",
        url: "https://leetcode.com/problems/cherry-pickup",
        difficulty: "Hard",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Largest Rectangle in Histogram",
        url: "https://leetcode.com/problems/largest-rectangle-in-histogram",
        difficulty: "Hard",
      },
      {
        name: "Best Time to Buy and Sell Stock III",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-iii",
        difficulty: "Hard",
      },
      {
        name: "Rotting Oranges",
        url: "https://leetcode.com/problems/rotting-oranges",
        difficulty: "Medium",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack",
        difficulty: "Easy",
      },
      {
        name: "Numbers With Same Consecutive Differences",
        url: "https://leetcode.com/problems/numbers-with-same-consecutive-differences",
        difficulty: "Medium",
      },
      {
        name: "Triples with Bitwise AND Equal To Zero",
        url: "https://leetcode.com/problems/triples-with-bitwise-and-equal-to-zero",
        difficulty: "Hard",
      },
      {
        name: "Maximum Points You Can Obtain from Cards",
        url: "https://leetcode.com/problems/maximum-points-you-can-obtain-from-cards",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "goldman-sachs",
    title: "Goldman Sachs",
    icon: "🏛️",
    totalProblems: 60,
    solvedProblems: 0,
    problems: [
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "High Five",
        url: "https://leetcode.com/problems/high-five",
        difficulty: "Easy",
      },
      {
        name: "Minimum Size Subarray Sum",
        url: "https://leetcode.com/problems/minimum-size-subarray-sum",
        difficulty: "Medium",
      },
      {
        name: "Game of Life",
        url: "https://leetcode.com/problems/game-of-life",
        difficulty: "Medium",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Knight Probability in Chessboard",
        url: "https://leetcode.com/problems/knight-probability-in-chessboard",
        difficulty: "Medium",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string",
        difficulty: "Easy",
      },
      {
        name: "Fraction Addition and Subtraction",
        url: "https://leetcode.com/problems/fraction-addition-and-subtraction",
        difficulty: "Medium",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
      {
        name: "Shortest Subarray with Sum at Least K",
        url: "https://leetcode.com/problems/shortest-subarray-with-sum-at-least-k",
        difficulty: "Hard",
      },
      {
        name: "Fraction to Recurring Decimal",
        url: "https://leetcode.com/problems/fraction-to-recurring-decimal",
        difficulty: "Medium",
      },
      {
        name: "Remove Comments",
        url: "https://leetcode.com/problems/remove-comments",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Reaching Points",
        url: "https://leetcode.com/problems/reaching-points",
        difficulty: "Hard",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Robot Bounded In Circle",
        url: "https://leetcode.com/problems/robot-bounded-in-circle",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Container With Most Water",
        url: "https://leetcode.com/problems/container-with-most-water",
        difficulty: "Medium",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Robot Return to Origin",
        url: "https://leetcode.com/problems/robot-return-to-origin",
        difficulty: "Easy",
      },
      {
        name: "Last Substring in Lexicographical Order",
        url: "https://leetcode.com/problems/last-substring-in-lexicographical-order",
        difficulty: "Hard",
      },
      {
        name: "Minimum Path Sum",
        url: "https://leetcode.com/problems/minimum-path-sum",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Longest Word in Dictionary through Deleting",
        url: "https://leetcode.com/problems/longest-word-in-dictionary-through-deleting",
        difficulty: "Medium",
      },
      {
        name: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways",
        difficulty: "Medium",
      },
      {
        name: "K-diff Pairs in an Array",
        url: "https://leetcode.com/problems/k-diff-pairs-in-an-array",
        difficulty: "Easy",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change",
        difficulty: "Medium",
      },
      {
        name: "Super Egg Drop",
        url: "https://leetcode.com/problems/super-egg-drop",
        difficulty: "Hard",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix",
        difficulty: "Medium",
      },
      {
        name: "Pairs of Songs With Total Durations Divisible by 60",
        url: "https://leetcode.com/problems/pairs-of-songs-with-total-durations-divisible-by-60",
        difficulty: "Easy",
      },
      {
        name: "DI String Match",
        url: "https://leetcode.com/problems/di-string-match",
        difficulty: "Easy",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "The Skyline Problem",
        url: "https://leetcode.com/problems/the-skyline-problem",
        difficulty: "Hard",
      },
      {
        name: "Linked List Cycle",
        url: "https://leetcode.com/problems/linked-list-cycle",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock II",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii",
        difficulty: "Easy",
      },
      {
        name: "Pascal's Triangle II",
        url: "https://leetcode.com/problems/pascals-triangle-ii",
        difficulty: "Easy",
      },
      {
        name: "Wildcard Matching",
        url: "https://leetcode.com/problems/wildcard-matching",
        difficulty: "Hard",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "Power of Three",
        url: "https://leetcode.com/problems/power-of-three",
        difficulty: "Easy",
      },
      {
        name: "Subarrays with K Different Integers",
        url: "https://leetcode.com/problems/subarrays-with-k-different-integers",
        difficulty: "Hard",
      },
      {
        name: "Subarray Sum Equals K",
        url: "https://leetcode.com/problems/subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Reverse String",
        url: "https://leetcode.com/problems/reverse-string",
        difficulty: "Easy",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack",
        difficulty: "Easy",
      },
      {
        name: "Reconstruct Itinerary",
        url: "https://leetcode.com/problems/reconstruct-itinerary",
        difficulty: "Medium",
      },
      {
        name: "Minimum Falling Path Sum",
        url: "https://leetcode.com/problems/minimum-falling-path-sum",
        difficulty: "Medium",
      },
      {
        name: "Valid Anagram",
        url: "https://leetcode.com/problems/valid-anagram",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Unique Paths",
        url: "https://leetcode.com/problems/unique-paths",
        difficulty: "Medium",
      },
      {
        name: "LFU Cache",
        url: "https://leetcode.com/problems/lfu-cache",
        difficulty: "Hard",
      },
      {
        name: "Edit Distance",
        url: "https://leetcode.com/problems/edit-distance",
        difficulty: "Hard",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "google",
    title: "Google",
    icon: "🔍",
    totalProblems: 100,
    solvedProblems: 0,
    problems: [
      {
        name: "Longest Absolute File Path",
        url: "https://leetcode.com/problems/longest-absolute-file-path",
        difficulty: "Medium",
      },
      {
        name: "K Empty Slots",
        url: "https://leetcode.com/problems/k-empty-slots",
        difficulty: "Hard",
      },
      {
        name: "Next Closest Time",
        url: "https://leetcode.com/problems/next-closest-time",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Unique Email Addresses",
        url: "https://leetcode.com/problems/unique-email-addresses",
        difficulty: "Easy",
      },
      {
        name: "Fruit Into Baskets",
        url: "https://leetcode.com/problems/fruit-into-baskets",
        difficulty: "Medium",
      },
      {
        name: "License Key Formatting",
        url: "https://leetcode.com/problems/license-key-formatting",
        difficulty: "Easy",
      },
      {
        name: "Range Sum Query 2D - Mutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-mutable",
        difficulty: "Hard",
      },
      {
        name: "Minimum Domino Rotations For Equal Row",
        url: "https://leetcode.com/problems/minimum-domino-rotations-for-equal-row",
        difficulty: "Medium",
      },
      {
        name: "Guess the Word",
        url: "https://leetcode.com/problems/guess-the-word",
        difficulty: "Hard",
      },
      {
        name: "Unique Word Abbreviation",
        url: "https://leetcode.com/problems/unique-word-abbreviation",
        difficulty: "Medium",
      },
      {
        name: "Robot Room Cleaner",
        url: "https://leetcode.com/problems/robot-room-cleaner",
        difficulty: "Hard",
      },
      {
        name: "Evaluate Division",
        url: "https://leetcode.com/problems/evaluate-division",
        difficulty: "Medium",
      },
      {
        name: "Odd Even Jump",
        url: "https://leetcode.com/problems/odd-even-jump",
        difficulty: "Hard",
      },
      {
        name: "Repeated String Match",
        url: "https://leetcode.com/problems/repeated-string-match",
        difficulty: "Easy",
      },
      {
        name: "Sentence Screen Fitting",
        url: "https://leetcode.com/problems/sentence-screen-fitting",
        difficulty: "Medium",
      },
      {
        name: "Cracking the Safe",
        url: "https://leetcode.com/problems/cracking-the-safe",
        difficulty: "Hard",
      },
      {
        name: "Encode and Decode Strings",
        url: "https://leetcode.com/problems/encode-and-decode-strings",
        difficulty: "Medium",
      },
      {
        name: "Bomb Enemy",
        url: "https://leetcode.com/problems/bomb-enemy",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/binary-tree-longest-consecutive-sequence",
        difficulty: "Medium",
      },
      {
        name: "Longest Absolute File Path",
        url: "https://leetcode.com/problems/longest-absolute-file-path",
        difficulty: "Medium",
      },
      {
        name: "K Empty Slots",
        url: "https://leetcode.com/problems/k-empty-slots",
        difficulty: "Hard",
      },
      {
        name: "Next Closest Time",
        url: "https://leetcode.com/problems/next-closest-time",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Unique Email Addresses",
        url: "https://leetcode.com/problems/unique-email-addresses",
        difficulty: "Easy",
      },
      {
        name: "Fruit Into Baskets",
        url: "https://leetcode.com/problems/fruit-into-baskets",
        difficulty: "Medium",
      },
      {
        name: "License Key Formatting",
        url: "https://leetcode.com/problems/license-key-formatting",
        difficulty: "Easy",
      },
      {
        name: "Range Sum Query 2D - Mutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-mutable",
        difficulty: "Hard",
      },
      {
        name: "Minimum Domino Rotations For Equal Row",
        url: "https://leetcode.com/problems/minimum-domino-rotations-for-equal-row",
        difficulty: "Medium",
      },
      {
        name: "Guess the Word",
        url: "https://leetcode.com/problems/guess-the-word",
        difficulty: "Hard",
      },
      {
        name: "Unique Word Abbreviation",
        url: "https://leetcode.com/problems/unique-word-abbreviation",
        difficulty: "Medium",
      },
      {
        name: "Robot Room Cleaner",
        url: "https://leetcode.com/problems/robot-room-cleaner",
        difficulty: "Hard",
      },
      {
        name: "Evaluate Division",
        url: "https://leetcode.com/problems/evaluate-division",
        difficulty: "Medium",
      },
      {
        name: "Odd Even Jump",
        url: "https://leetcode.com/problems/odd-even-jump",
        difficulty: "Hard",
      },
      {
        name: "Repeated String Match",
        url: "https://leetcode.com/problems/repeated-string-match",
        difficulty: "Easy",
      },
      {
        name: "Sentence Screen Fitting",
        url: "https://leetcode.com/problems/sentence-screen-fitting",
        difficulty: "Medium",
      },
      {
        name: "Cracking the Safe",
        url: "https://leetcode.com/problems/cracking-the-safe",
        difficulty: "Hard",
      },
      {
        name: "Encode and Decode Strings",
        url: "https://leetcode.com/problems/encode-and-decode-strings",
        difficulty: "Medium",
      },
      {
        name: "Bomb Enemy",
        url: "https://leetcode.com/problems/bomb-enemy",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/binary-tree-longest-consecutive-sequence",
        difficulty: "Medium",
      },
      {
        name: "Longest Absolute File Path",
        url: "https://leetcode.com/problems/longest-absolute-file-path",
        difficulty: "Medium",
      },
      {
        name: "K Empty Slots",
        url: "https://leetcode.com/problems/k-empty-slots",
        difficulty: "Hard",
      },
      {
        name: "Next Closest Time",
        url: "https://leetcode.com/problems/next-closest-time",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Unique Email Addresses",
        url: "https://leetcode.com/problems/unique-email-addresses",
        difficulty: "Easy",
      },
      {
        name: "Fruit Into Baskets",
        url: "https://leetcode.com/problems/fruit-into-baskets",
        difficulty: "Medium",
      },
      {
        name: "License Key Formatting",
        url: "https://leetcode.com/problems/license-key-formatting",
        difficulty: "Easy",
      },
      {
        name: "Range Sum Query 2D - Mutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-mutable",
        difficulty: "Hard",
      },
      {
        name: "Minimum Domino Rotations For Equal Row",
        url: "https://leetcode.com/problems/minimum-domino-rotations-for-equal-row",
        difficulty: "Medium",
      },
      {
        name: "Guess the Word",
        url: "https://leetcode.com/problems/guess-the-word",
        difficulty: "Hard",
      },
      {
        name: "Unique Word Abbreviation",
        url: "https://leetcode.com/problems/unique-word-abbreviation",
        difficulty: "Medium",
      },
      {
        name: "Robot Room Cleaner",
        url: "https://leetcode.com/problems/robot-room-cleaner",
        difficulty: "Hard",
      },
      {
        name: "Evaluate Division",
        url: "https://leetcode.com/problems/evaluate-division",
        difficulty: "Medium",
      },
      {
        name: "Odd Even Jump",
        url: "https://leetcode.com/problems/odd-even-jump",
        difficulty: "Hard",
      },
      {
        name: "Repeated String Match",
        url: "https://leetcode.com/problems/repeated-string-match",
        difficulty: "Easy",
      },
      {
        name: "Sentence Screen Fitting",
        url: "https://leetcode.com/problems/sentence-screen-fitting",
        difficulty: "Medium",
      },
      {
        name: "Cracking the Safe",
        url: "https://leetcode.com/problems/cracking-the-safe",
        difficulty: "Hard",
      },
      {
        name: "Encode and Decode Strings",
        url: "https://leetcode.com/problems/encode-and-decode-strings",
        difficulty: "Medium",
      },
      {
        name: "Bomb Enemy",
        url: "https://leetcode.com/problems/bomb-enemy",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/binary-tree-longest-consecutive-sequence",
        difficulty: "Medium",
      },
      {
        name: "Longest Absolute File Path",
        url: "https://leetcode.com/problems/longest-absolute-file-path",
        difficulty: "Medium",
      },
      {
        name: "K Empty Slots",
        url: "https://leetcode.com/problems/k-empty-slots",
        difficulty: "Hard",
      },
      {
        name: "Next Closest Time",
        url: "https://leetcode.com/problems/next-closest-time",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Unique Email Addresses",
        url: "https://leetcode.com/problems/unique-email-addresses",
        difficulty: "Easy",
      },
      {
        name: "Fruit Into Baskets",
        url: "https://leetcode.com/problems/fruit-into-baskets",
        difficulty: "Medium",
      },
      {
        name: "License Key Formatting",
        url: "https://leetcode.com/problems/license-key-formatting",
        difficulty: "Easy",
      },
      {
        name: "Range Sum Query 2D - Mutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-mutable",
        difficulty: "Hard",
      },
      {
        name: "Minimum Domino Rotations For Equal Row",
        url: "https://leetcode.com/problems/minimum-domino-rotations-for-equal-row",
        difficulty: "Medium",
      },
      {
        name: "Guess the Word",
        url: "https://leetcode.com/problems/guess-the-word",
        difficulty: "Hard",
      },
      {
        name: "Unique Word Abbreviation",
        url: "https://leetcode.com/problems/unique-word-abbreviation",
        difficulty: "Medium",
      },
      {
        name: "Robot Room Cleaner",
        url: "https://leetcode.com/problems/robot-room-cleaner",
        difficulty: "Hard",
      },
      {
        name: "Evaluate Division",
        url: "https://leetcode.com/problems/evaluate-division",
        difficulty: "Medium",
      },
      {
        name: "Odd Even Jump",
        url: "https://leetcode.com/problems/odd-even-jump",
        difficulty: "Hard",
      },
      {
        name: "Repeated String Match",
        url: "https://leetcode.com/problems/repeated-string-match",
        difficulty: "Easy",
      },
      {
        name: "Sentence Screen Fitting",
        url: "https://leetcode.com/problems/sentence-screen-fitting",
        difficulty: "Medium",
      },
      {
        name: "Cracking the Safe",
        url: "https://leetcode.com/problems/cracking-the-safe",
        difficulty: "Hard",
      },
      {
        name: "Encode and Decode Strings",
        url: "https://leetcode.com/problems/encode-and-decode-strings",
        difficulty: "Medium",
      },
      {
        name: "Bomb Enemy",
        url: "https://leetcode.com/problems/bomb-enemy",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/binary-tree-longest-consecutive-sequence",
        difficulty: "Medium",
      },
      {
        name: "Longest Absolute File Path",
        url: "https://leetcode.com/problems/longest-absolute-file-path",
        difficulty: "Medium",
      },
      {
        name: "K Empty Slots",
        url: "https://leetcode.com/problems/k-empty-slots",
        difficulty: "Hard",
      },
      {
        name: "Next Closest Time",
        url: "https://leetcode.com/problems/next-closest-time",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Unique Email Addresses",
        url: "https://leetcode.com/problems/unique-email-addresses",
        difficulty: "Easy",
      },
      {
        name: "Fruit Into Baskets",
        url: "https://leetcode.com/problems/fruit-into-baskets",
        difficulty: "Medium",
      },
      {
        name: "License Key Formatting",
        url: "https://leetcode.com/problems/license-key-formatting",
        difficulty: "Easy",
      },
      {
        name: "Range Sum Query 2D - Mutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-mutable",
        difficulty: "Hard",
      },
      {
        name: "Minimum Domino Rotations For Equal Row",
        url: "https://leetcode.com/problems/minimum-domino-rotations-for-equal-row",
        difficulty: "Medium",
      },
      {
        name: "Guess the Word",
        url: "https://leetcode.com/problems/guess-the-word",
        difficulty: "Hard",
      },
      {
        name: "Unique Word Abbreviation",
        url: "https://leetcode.com/problems/unique-word-abbreviation",
        difficulty: "Medium",
      },
      {
        name: "Robot Room Cleaner",
        url: "https://leetcode.com/problems/robot-room-cleaner",
        difficulty: "Hard",
      },
      {
        name: "Evaluate Division",
        url: "https://leetcode.com/problems/evaluate-division",
        difficulty: "Medium",
      },
      {
        name: "Odd Even Jump",
        url: "https://leetcode.com/problems/odd-even-jump",
        difficulty: "Hard",
      },
      {
        name: "Repeated String Match",
        url: "https://leetcode.com/problems/repeated-string-match",
        difficulty: "Easy",
      },
      {
        name: "Sentence Screen Fitting",
        url: "https://leetcode.com/problems/sentence-screen-fitting",
        difficulty: "Medium",
      },
      {
        name: "Cracking the Safe",
        url: "https://leetcode.com/problems/cracking-the-safe",
        difficulty: "Hard",
      },
      {
        name: "Encode and Decode Strings",
        url: "https://leetcode.com/problems/encode-and-decode-strings",
        difficulty: "Medium",
      },
      {
        name: "Bomb Enemy",
        url: "https://leetcode.com/problems/bomb-enemy",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/binary-tree-longest-consecutive-sequence",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "hulu",
    title: "Hulu",
    icon: "📺",
    totalProblems: 17,
    solvedProblems: 0,
    problems: [
      {
        name: "Snakes and Ladders",
        url: "https://leetcode.com/problems/snakes-and-ladders",
        difficulty: "Medium",
      },
      {
        name: "Power of Three",
        url: "https://leetcode.com/problems/power-of-three",
        difficulty: "Easy",
      },
      {
        name: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Sum of Subarray Minimums",
        url: "https://leetcode.com/problems/sum-of-subarray-minimums",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "All Nodes Distance K in Binary Tree",
        url: "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Sum of Two Integers",
        url: "https://leetcode.com/problems/sum-of-two-integers",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Kth Smallest Element in a BST",
        url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst",
        difficulty: "Medium",
      },
      {
        name: "Top K Frequent Elements",
        url: "https://leetcode.com/problems/top-k-frequent-elements",
        difficulty: "Medium",
      },
      {
        name: "Remove Duplicates from Sorted Array",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "K-th Smallest in Lexicographical Order",
        url: "https://leetcode.com/problems/k-th-smallest-in-lexicographical-order",
        difficulty: "Hard",
      },
      {
        name: "Basic Calculator III",
        url: "https://leetcode.com/problems/basic-calculator-iii",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Pruning",
        url: "https://leetcode.com/problems/binary-tree-pruning",
        difficulty: "Medium",
      },
      {
        name: "Number of Valid Subarrays",
        url: "https://leetcode.com/problems/number-of-valid-subarrays",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "ibm",
    title: "IBM",
    icon: "💙",
    totalProblems: 12,
    solvedProblems: 0,
    problems: [
      {
        name: "Gas Station",
        url: "https://leetcode.com/problems/gas-station",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Missing Number",
        url: "https://leetcode.com/problems/missing-number",
        difficulty: "Easy",
      },
      {
        name: "3Sum Smaller",
        url: "https://leetcode.com/problems/3sum-smaller",
        difficulty: "Medium",
      },
      {
        name: "Search in a Binary Search Tree",
        url: "https://leetcode.com/problems/search-in-a-binary-search-tree",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Longest Common Prefix",
        url: "https://leetcode.com/problems/longest-common-prefix",
        difficulty: "Easy",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Activity Participants",
        url: "https://leetcode.com/problems/activity-participants",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "intel",
    title: "Intel",
    icon: "🔵",
    totalProblems: 11,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Count Primes",
        url: "https://leetcode.com/problems/count-primes",
        difficulty: "Easy",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Palindrome Linked List",
        url: "https://leetcode.com/problems/palindrome-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Diameter of Binary Tree",
        url: "https://leetcode.com/problems/diameter-of-binary-tree",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "intuit",
    title: "Intuit",
    icon: "💰",
    totalProblems: 24,
    solvedProblems: 0,
    problems: [
      {
        name: "Subdomain Visit Count",
        url: "https://leetcode.com/problems/subdomain-visit-count",
        difficulty: "Easy",
      },
      {
        name: "Basic Calculator IV",
        url: "https://leetcode.com/problems/basic-calculator-iv",
        difficulty: "Hard",
      },
      {
        name: "Text Justification",
        url: "https://leetcode.com/problems/text-justification",
        difficulty: "Hard",
      },
      {
        name: "Basic Calculator",
        url: "https://leetcode.com/problems/basic-calculator",
        difficulty: "Hard",
      },
      {
        name: "Maximum Length of Repeated Subarray",
        url: "https://leetcode.com/problems/maximum-length-of-repeated-subarray",
        difficulty: "Medium",
      },
      {
        name: "My Calendar I",
        url: "https://leetcode.com/problems/my-calendar-i",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule",
        difficulty: "Medium",
      },
      {
        name: "Basic Calculator II",
        url: "https://leetcode.com/problems/basic-calculator-ii",
        difficulty: "Medium",
      },
      {
        name: "Employee Free Time",
        url: "https://leetcode.com/problems/employee-free-time",
        difficulty: "Hard",
      },
      {
        name: "Word Search",
        url: "https://leetcode.com/problems/word-search",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindrome",
        url: "https://leetcode.com/problems/longest-palindrome",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Course Schedule II",
        url: "https://leetcode.com/problems/course-schedule-ii",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Maximum Path Sum",
        url: "https://leetcode.com/problems/binary-tree-maximum-path-sum",
        difficulty: "Hard",
      },
      {
        name: "Max Area of Island",
        url: "https://leetcode.com/problems/max-area-of-island",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack",
        difficulty: "Easy",
      },
      {
        name: "Edit Distance",
        url: "https://leetcode.com/problems/edit-distance",
        difficulty: "Hard",
      },
      {
        name: "Find the Duplicate Number",
        url: "https://leetcode.com/problems/find-the-duplicate-number",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Maximum Product of Three Numbers",
        url: "https://leetcode.com/problems/maximum-product-of-three-numbers",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "jp-morgan",
    title: "JP Morgan",
    icon: "🏦",
    totalProblems: 22,
    solvedProblems: 0,
    problems: [
      {
        name: "Happy Number",
        url: "https://leetcode.com/problems/happy-number",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Break a Palindrome",
        url: "https://leetcode.com/problems/break-a-palindrome",
        difficulty: "Medium",
      },
      {
        name: "Next Permutation",
        url: "https://leetcode.com/problems/next-permutation",
        difficulty: "Medium",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "Palindrome Number",
        url: "https://leetcode.com/problems/palindrome-number",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Reverse Integer",
        url: "https://leetcode.com/problems/reverse-integer",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Intersection of Two Arrays",
        url: "https://leetcode.com/problems/intersection-of-two-arrays",
        difficulty: "Easy",
      },
      {
        name: "Word Search",
        url: "https://leetcode.com/problems/word-search",
        difficulty: "Medium",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Combination Sum",
        url: "https://leetcode.com/problems/combination-sum",
        difficulty: "Medium",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    icon: "💼",
    totalProblems: 60,
    solvedProblems: 0,
    problems: [
      {
        name: "Shortest Word Distance II",
        url: "https://leetcode.com/problems/shortest-word-distance-ii",
        difficulty: "Medium",
      },
      {
        name: "Nested List Weight Sum II",
        url: "https://leetcode.com/problems/nested-list-weight-sum-ii",
        difficulty: "Medium",
      },
      {
        name: "Two Sum III - Data structure design",
        url: "https://leetcode.com/problems/two-sum-iii-data-structure-design",
        difficulty: "Easy",
      },
      {
        name: "Nested List Weight Sum",
        url: "https://leetcode.com/problems/nested-list-weight-sum",
        difficulty: "Easy",
      },
      {
        name: "Closest Binary Search Tree Value II",
        url: "https://leetcode.com/problems/closest-binary-search-tree-value-ii",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Upside Down",
        url: "https://leetcode.com/problems/binary-tree-upside-down",
        difficulty: "Medium",
      },
      {
        name: "Max Stack",
        url: "https://leetcode.com/problems/max-stack",
        difficulty: "Easy",
      },
      {
        name: "Factor Combinations",
        url: "https://leetcode.com/problems/factor-combinations",
        difficulty: "Medium",
      },
      {
        name: "Shortest Word Distance",
        url: "https://leetcode.com/problems/shortest-word-distance",
        difficulty: "Easy",
      },
      {
        name: "Find Leaves of Binary Tree",
        url: "https://leetcode.com/problems/find-leaves-of-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Paint House",
        url: "https://leetcode.com/problems/paint-house",
        difficulty: "Easy",
      },
      {
        name: "Paint House II",
        url: "https://leetcode.com/problems/paint-house-ii",
        difficulty: "Hard",
      },
      {
        name: "Max Points on a Line",
        url: "https://leetcode.com/problems/max-points-on-a-line",
        difficulty: "Hard",
      },
      {
        name: "Valid Number",
        url: "https://leetcode.com/problems/valid-number",
        difficulty: "Hard",
      },
      {
        name: "Can Place Flowers",
        url: "https://leetcode.com/problems/can-place-flowers",
        difficulty: "Easy",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "All O`one Data Structure",
        url: "https://leetcode.com/problems/all-oone-data-structure",
        difficulty: "Hard",
      },
      {
        name: "Text Justification",
        url: "https://leetcode.com/problems/text-justification",
        difficulty: "Hard",
      },
      {
        name: "Flatten Nested List Iterator",
        url: "https://leetcode.com/problems/flatten-nested-list-iterator",
        difficulty: "Medium",
      },
      {
        name: "Evaluate Reverse Polish Notation",
        url: "https://leetcode.com/problems/evaluate-reverse-polish-notation",
        difficulty: "Medium",
      },
      {
        name: "Isomorphic Strings",
        url: "https://leetcode.com/problems/isomorphic-strings",
        difficulty: "Easy",
      },
      {
        name: "Shortest Word Distance III",
        url: "https://leetcode.com/problems/shortest-word-distance-iii",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Graph Valid Tree",
        url: "https://leetcode.com/problems/graph-valid-tree",
        difficulty: "Medium",
      },
      {
        name: "Valid Triangle Number",
        url: "https://leetcode.com/problems/valid-triangle-number",
        difficulty: "Medium",
      },
      {
        name: "Count Different Palindromic Subsequences",
        url: "https://leetcode.com/problems/count-different-palindromic-subsequences",
        difficulty: "Hard",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Repeated DNA Sequences",
        url: "https://leetcode.com/problems/repeated-dna-sequences",
        difficulty: "Medium",
      },
      {
        name: "Partition to K Equal Sum Subsets",
        url: "https://leetcode.com/problems/partition-to-k-equal-sum-subsets",
        difficulty: "Medium",
      },
      {
        name: "Maximum Product Subarray",
        url: "https://leetcode.com/problems/maximum-product-subarray",
        difficulty: "Medium",
      },
      {
        name: "Edit Distance",
        url: "https://leetcode.com/problems/edit-distance",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Find the Celebrity",
        url: "https://leetcode.com/problems/find-the-celebrity",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Subsequence",
        url: "https://leetcode.com/problems/longest-palindromic-subsequence",
        difficulty: "Medium",
      },
      {
        name: "Second Minimum Node In a Binary Tree",
        url: "https://leetcode.com/problems/second-minimum-node-in-a-binary-tree",
        difficulty: "Easy",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Can I Win",
        url: "https://leetcode.com/problems/can-i-win",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Integer to Roman",
        url: "https://leetcode.com/problems/integer-to-roman",
        difficulty: "Medium",
      },
      {
        name: "Find K Pairs with Smallest Sums",
        url: "https://leetcode.com/problems/find-k-pairs-with-smallest-sums",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Search Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1) - Duplicates allowed",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1-duplicates-allowed",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Pow(x;n)",
        url: "https://leetcode.com/problems/powx-n",
        difficulty: "Medium",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "Find First and Last Position of Element in Sorted Array",
        url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Insert Interval",
        url: "https://leetcode.com/problems/insert-interval",
        difficulty: "Hard",
      },
      {
        name: "Exclusive Time of Functions",
        url: "https://leetcode.com/problems/exclusive-time-of-functions",
        difficulty: "Medium",
      },
      {
        name: "Shuffle an Array",
        url: "https://leetcode.com/problems/shuffle-an-array",
        difficulty: "Medium",
      },
      {
        name: "Building H2O",
        url: "https://leetcode.com/problems/building-h2o",
        difficulty: "Medium",
      },
      {
        name: "Sqrt(x)",
        url: "https://leetcode.com/problems/sqrtx",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Print Binary Tree",
        url: "https://leetcode.com/problems/print-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Roman to Integer",
        url: "https://leetcode.com/problems/roman-to-integer",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "lyft",
    title: "Lyft",
    icon: "🚗",
    totalProblems: 54,
    solvedProblems: 0,
    problems: [
      {
        name: "Asteroid Collision",
        url: "https://leetcode.com/problems/asteroid-collision",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Max Stack",
        url: "https://leetcode.com/problems/max-stack",
        difficulty: "Easy",
      },
      {
        name: "Read N Characters Given Read4 II - Call multiple times",
        url: "https://leetcode.com/problems/read-n-characters-given-read4-ii-call-multiple-times",
        difficulty: "Hard",
      },
      {
        name: "Design Search Autocomplete System",
        url: "https://leetcode.com/problems/design-search-autocomplete-system",
        difficulty: "Hard",
      },
      {
        name: "Time Based Key-Value Store",
        url: "https://leetcode.com/problems/time-based-key-value-store",
        difficulty: "Medium",
      },
      {
        name: "Water and Jug Problem",
        url: "https://leetcode.com/problems/water-and-jug-problem",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Intersection of Two Arrays",
        url: "https://leetcode.com/problems/intersection-of-two-arrays",
        difficulty: "Easy",
      },
      {
        name: "Text Justification",
        url: "https://leetcode.com/problems/text-justification",
        difficulty: "Hard",
      },
      {
        name: "Word Ladder II",
        url: "https://leetcode.com/problems/word-ladder-ii",
        difficulty: "Hard",
      },
      {
        name: "Convert Binary Search Tree to Sorted Doubly Linked List",
        url: "https://leetcode.com/problems/convert-binary-search-tree-to-sorted-doubly-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Decode Ways",
        url: "https://leetcode.com/problems/decode-ways",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Perfect Squares",
        url: "https://leetcode.com/problems/perfect-squares",
        difficulty: "Medium",
      },
      {
        name: "Flatten 2D Vector",
        url: "https://leetcode.com/problems/flatten-2d-vector",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Range Sum Query 2D - Immutable",
        url: "https://leetcode.com/problems/range-sum-query-2d-immutable",
        difficulty: "Medium",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack",
        difficulty: "Easy",
      },
      {
        name: "Find Duplicate Subtrees",
        url: "https://leetcode.com/problems/find-duplicate-subtrees",
        difficulty: "Medium",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Largest BST Subtree",
        url: "https://leetcode.com/problems/largest-bst-subtree",
        difficulty: "Medium",
      },
      {
        name: "Convert Sorted List to Binary Search Tree",
        url: "https://leetcode.com/problems/convert-sorted-list-to-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Flatten Nested List Iterator",
        url: "https://leetcode.com/problems/flatten-nested-list-iterator",
        difficulty: "Medium",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Container With Most Water",
        url: "https://leetcode.com/problems/container-with-most-water",
        difficulty: "Medium",
      },
      {
        name: "Smallest Range Covering Elements from K Lists",
        url: "https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists",
        difficulty: "Hard",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Subsets",
        url: "https://leetcode.com/problems/subsets",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Car Pooling",
        url: "https://leetcode.com/problems/car-pooling",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Word Search",
        url: "https://leetcode.com/problems/word-search",
        difficulty: "Medium",
      },
      {
        name: "Number of Distinct Islands",
        url: "https://leetcode.com/problems/number-of-distinct-islands",
        difficulty: "Medium",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Sqrt(x)",
        url: "https://leetcode.com/problems/sqrtx",
        difficulty: "Easy",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Reverse Integer",
        url: "https://leetcode.com/problems/reverse-integer",
        difficulty: "Easy",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Find All Duplicates in an Array",
        url: "https://leetcode.com/problems/find-all-duplicates-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Missing Element in Sorted Array",
        url: "https://leetcode.com/problems/missing-element-in-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Permutation in String",
        url: "https://leetcode.com/problems/permutation-in-string",
        difficulty: "Medium",
      },
      {
        name: "Swap Nodes in Pairs",
        url: "https://leetcode.com/problems/swap-nodes-in-pairs",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "mathworks",
    title: "MathWorks",
    icon: "📊",
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "Minimum Cost Tree From Leaf Values",
        url: "https://leetcode.com/problems/minimum-cost-tree-from-leaf-values",
        difficulty: "Medium",
      },
      {
        name: "Verify Preorder Sequence in Binary Search Tree",
        url: "https://leetcode.com/problems/verify-preorder-sequence-in-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Last Substring in Lexicographical Order",
        url: "https://leetcode.com/problems/last-substring-in-lexicographical-order",
        difficulty: "Hard",
      },
      {
        name: "Reverse Nodes in k-Group",
        url: "https://leetcode.com/problems/reverse-nodes-in-k-group",
        difficulty: "Hard",
      },
      {
        name: "Beautiful Arrangement",
        url: "https://leetcode.com/problems/beautiful-arrangement",
        difficulty: "Medium",
      },
      {
        name: "Keyboard Row",
        url: "https://leetcode.com/problems/keyboard-row",
        difficulty: "Easy",
      },
      {
        name: "Shortest Distance from All Buildings",
        url: "https://leetcode.com/problems/shortest-distance-from-all-buildings",
        difficulty: "Hard",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Degree of an Array",
        url: "https://leetcode.com/problems/degree-of-an-array",
        difficulty: "Easy",
      },
      {
        name: "Bulb Switcher",
        url: "https://leetcode.com/problems/bulb-switcher",
        difficulty: "Medium",
      },
      {
        name: "Cherry Pickup",
        url: "https://leetcode.com/problems/cherry-pickup",
        difficulty: "Hard",
      },
      {
        name: "Unique Paths II",
        url: "https://leetcode.com/problems/unique-paths-ii",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Right Side View",
        url: "https://leetcode.com/problems/binary-tree-right-side-view",
        difficulty: "Medium",
      },
      {
        name: "3Sum Smaller",
        url: "https://leetcode.com/problems/3sum-smaller",
        difficulty: "Medium",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "Counting Bits",
        url: "https://leetcode.com/problems/counting-bits",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Implement Stack using Queues",
        url: "https://leetcode.com/problems/implement-stack-using-queues",
        difficulty: "Easy",
      },
      {
        name: "Distinct Subsequences",
        url: "https://leetcode.com/problems/distinct-subsequences",
        difficulty: "Hard",
      },
      {
        name: "Unique Paths",
        url: "https://leetcode.com/problems/unique-paths",
        difficulty: "Medium",
      },
      {
        name: "Clone Graph",
        url: "https://leetcode.com/problems/clone-graph",
        difficulty: "Medium",
      },
      {
        name: "Number of Operations to Make Network Connected",
        url: "https://leetcode.com/problems/number-of-operations-to-make-network-connected",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Vertical Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-vertical-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Rectangle Overlap",
        url: "https://leetcode.com/problems/rectangle-overlap",
        difficulty: "Easy",
      },
      {
        name: "Palindromic Substrings",
        url: "https://leetcode.com/problems/palindromic-substrings",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Fibonacci Number",
        url: "https://leetcode.com/problems/fibonacci-number",
        difficulty: "Easy",
      },
      {
        name: "Sum of Left Leaves",
        url: "https://leetcode.com/problems/sum-of-left-leaves",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Max Area of Island",
        url: "https://leetcode.com/problems/max-area-of-island",
        difficulty: "Medium",
      },
      {
        name: "Multiply Strings",
        url: "https://leetcode.com/problems/multiply-strings",
        difficulty: "Medium",
      },
      {
        name: "Construct Binary Tree from Inorder and Postorder Traversal",
        url: "https://leetcode.com/problems/construct-binary-tree-from-inorder-and-postorder-traversal",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Reshape the Matrix",
        url: "https://leetcode.com/problems/reshape-the-matrix",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "microsoft",
    title: "Microsoft",
    icon: "🪟",
    totalProblems: 100,
    solvedProblems: 0,
    problems: [
      {
        name: "Copy List with Random Pointer",
        url: "https://leetcode.com/problems/copy-list-with-random-pointer",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Spiral Matrix",
        url: "https://leetcode.com/problems/spiral-matrix",
        difficulty: "Medium",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "Find the Celebrity",
        url: "https://leetcode.com/problems/find-the-celebrity",
        difficulty: "Medium",
      },
      {
        name: "Design Tic-Tac-Toe",
        url: "https://leetcode.com/problems/design-tic-tac-toe",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Reverse Words in a String II",
        url: "https://leetcode.com/problems/reverse-words-in-a-string-ii",
        difficulty: "Medium",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "The Skyline Problem",
        url: "https://leetcode.com/problems/the-skyline-problem",
        difficulty: "Hard",
      },
      {
        name: "Compare Version Numbers",
        url: "https://leetcode.com/problems/compare-version-numbers",
        difficulty: "Medium",
      },
      {
        name: "Reverse Nodes in k-Group",
        url: "https://leetcode.com/problems/reverse-nodes-in-k-group",
        difficulty: "Hard",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers II",
        url: "https://leetcode.com/problems/add-two-numbers-ii",
        difficulty: "Medium",
      },
      {
        name: "Populating Next Right Pointers in Each Node",
        url: "https://leetcode.com/problems/populating-next-right-pointers-in-each-node",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Remove K Digits",
        url: "https://leetcode.com/problems/remove-k-digits",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String III",
        url: "https://leetcode.com/problems/reverse-words-in-a-string-iii",
        difficulty: "Easy",
      },
      {
        name: "Remove Comments",
        url: "https://leetcode.com/problems/remove-comments",
        difficulty: "Medium",
      },
      {
        name: "Sort Colors",
        url: "https://leetcode.com/problems/sort-colors",
        difficulty: "Medium",
      },
      {
        name: "Swap Nodes in Pairs",
        url: "https://leetcode.com/problems/swap-nodes-in-pairs",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Encode and Decode TinyURL",
        url: "https://leetcode.com/problems/encode-and-decode-tinyurl",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Excel Sheet Column Title",
        url: "https://leetcode.com/problems/excel-sheet-column-title",
        difficulty: "Easy",
      },
      {
        name: "Construct Binary Tree from Preorder and Inorder Traversal",
        url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal",
        difficulty: "Medium",
      },
      {
        name: "Battleships in a Board",
        url: "https://leetcode.com/problems/battleships-in-a-board",
        difficulty: "Medium",
      },
      {
        name: "Rectangle Area",
        url: "https://leetcode.com/problems/rectangle-area",
        difficulty: "Medium",
      },
      {
        name: "Excel Sheet Column Number",
        url: "https://leetcode.com/problems/excel-sheet-column-number",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Basic Calculator",
        url: "https://leetcode.com/problems/basic-calculator",
        difficulty: "Hard",
      },
      {
        name: "Maximum Length of a Concatenated String with Unique Characters",
        url: "https://leetcode.com/problems/maximum-length-of-a-concatenated-string-with-unique-characters",
        difficulty: "Medium",
      },
      {
        name: "Wildcard Matching",
        url: "https://leetcode.com/problems/wildcard-matching",
        difficulty: "Hard",
      },
      {
        name: "Valid Tic-Tac-Toe State",
        url: "https://leetcode.com/problems/valid-tic-tac-toe-state",
        difficulty: "Medium",
      },
      {
        name: "Boundary of Binary Tree",
        url: "https://leetcode.com/problems/boundary-of-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Gas Station",
        url: "https://leetcode.com/problems/gas-station",
        difficulty: "Medium",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Set Matrix Zeroes",
        url: "https://leetcode.com/problems/set-matrix-zeroes",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize N-ary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-n-ary-tree",
        difficulty: "Hard",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
      {
        name: "Delete Node in a BST",
        url: "https://leetcode.com/problems/delete-node-in-a-bst",
        difficulty: "Medium",
      },
      {
        name: "Roman to Integer",
        url: "https://leetcode.com/problems/roman-to-integer",
        difficulty: "Easy",
      },
      {
        name: "Lowest Common Ancestor of a Binary Search Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Zigzag Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Populating Next Right Pointers in Each Node II",
        url: "https://leetcode.com/problems/populating-next-right-pointers-in-each-node-ii",
        difficulty: "Medium",
      },
      {
        name: "Reverse String",
        url: "https://leetcode.com/problems/reverse-string",
        difficulty: "Easy",
      },
      {
        name: "Implement Trie (Prefix Tree)",
        url: "https://leetcode.com/problems/implement-trie-prefix-tree",
        difficulty: "Medium",
      },
      {
        name: "Multiply Strings",
        url: "https://leetcode.com/problems/multiply-strings",
        difficulty: "Medium",
      },
      {
        name: "Inorder Successor in BST",
        url: "https://leetcode.com/problems/inorder-successor-in-bst",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Simplify Path",
        url: "https://leetcode.com/problems/simplify-path",
        difficulty: "Medium",
      },
      {
        name: "Recover Binary Search Tree",
        url: "https://leetcode.com/problems/recover-binary-search-tree",
        difficulty: "Hard",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Linked List Cycle",
        url: "https://leetcode.com/problems/linked-list-cycle",
        difficulty: "Easy",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "Integer to Roman",
        url: "https://leetcode.com/problems/integer-to-roman",
        difficulty: "Medium",
      },
      {
        name: "Sudoku Solver",
        url: "https://leetcode.com/problems/sudoku-solver",
        difficulty: "Hard",
      },
      {
        name: "Edit Distance",
        url: "https://leetcode.com/problems/edit-distance",
        difficulty: "Hard",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Intersection of Two Linked Lists",
        url: "https://leetcode.com/problems/intersection-of-two-linked-lists",
        difficulty: "Easy",
      },
      {
        name: "Valid Sudoku",
        url: "https://leetcode.com/problems/valid-sudoku",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Reorder List",
        url: "https://leetcode.com/problems/reorder-list",
        difficulty: "Medium",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "N-Queens",
        url: "https://leetcode.com/problems/n-queens",
        difficulty: "Hard",
      },
      {
        name: "Binary Search Tree Iterator",
        url: "https://leetcode.com/problems/binary-search-tree-iterator",
        difficulty: "Medium",
      },
      {
        name: "Restore IP Addresses",
        url: "https://leetcode.com/problems/restore-ip-addresses",
        difficulty: "Medium",
      },
      {
        name: "Exclusive Time of Functions",
        url: "https://leetcode.com/problems/exclusive-time-of-functions",
        difficulty: "Medium",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Max Points on a Line",
        url: "https://leetcode.com/problems/max-points-on-a-line",
        difficulty: "Hard",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Next Permutation",
        url: "https://leetcode.com/problems/next-permutation",
        difficulty: "Medium",
      },
      {
        name: "Rotate List",
        url: "https://leetcode.com/problems/rotate-list",
        difficulty: "Medium",
      },
      // ...and more to reach 100
    ],
  },
  {
    id: "nvidia",
    title: "Nvidia",
    icon: "🎮",
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Rectangle Area",
        url: "https://leetcode.com/problems/rectangle-area",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Power of Two",
        url: "https://leetcode.com/problems/power-of-two",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Minimum Area Rectangle",
        url: "https://leetcode.com/problems/minimum-area-rectangle",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Right Side View",
        url: "https://leetcode.com/problems/binary-tree-right-side-view",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs",
        difficulty: "Easy",
      },
      {
        name: "Minimum Path Sum",
        url: "https://leetcode.com/problems/minimum-path-sum",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Interleaving String",
        url: "https://leetcode.com/problems/interleaving-string",
        difficulty: "Hard",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Flatten Binary Tree to Linked List",
        url: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list",
        difficulty: "Medium",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Daily Temperatures",
        url: "https://leetcode.com/problems/daily-temperatures",
        difficulty: "Medium",
      },
      {
        name: "Add Strings",
        url: "https://leetcode.com/problems/add-strings",
        difficulty: "Easy",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "oracle",
    title: "Oracle",
    icon: "🗃️",
    totalProblems: 45,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Reaching Points",
        url: "https://leetcode.com/problems/reaching-points",
        difficulty: "Hard",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "K-diff Pairs in an Array",
        url: "https://leetcode.com/problems/k-diff-pairs-in-an-array",
        difficulty: "Easy",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Find the Smallest Divisor Given a Threshold",
        url: "https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold",
        difficulty: "Medium",
      },
      {
        name: "LFU Cache",
        url: "https://leetcode.com/problems/lfu-cache",
        difficulty: "Hard",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "Design Search Autocomplete System",
        url: "https://leetcode.com/problems/design-search-autocomplete-system",
        difficulty: "Hard",
      },
      {
        name: "Maximum Frequency Stack",
        url: "https://leetcode.com/problems/maximum-frequency-stack",
        difficulty: "Hard",
      },
      {
        name: "The Skyline Problem",
        url: "https://leetcode.com/problems/the-skyline-problem",
        difficulty: "Hard",
      },
      {
        name: "Flatten 2D Vector",
        url: "https://leetcode.com/problems/flatten-2d-vector",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Remove Duplicates from Sorted List II",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii",
        difficulty: "Medium",
      },
      {
        name: "Design Tic-Tac-Toe",
        url: "https://leetcode.com/problems/design-tic-tac-toe",
        difficulty: "Medium",
      },
      {
        name: "Shuffle an Array",
        url: "https://leetcode.com/problems/shuffle-an-array",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Largest Number",
        url: "https://leetcode.com/problems/largest-number",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Find the Duplicate Number",
        url: "https://leetcode.com/problems/find-the-duplicate-number",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Design Snake Game",
        url: "https://leetcode.com/problems/design-snake-game",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Remove Duplicates from Sorted List",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-list",
        difficulty: "Easy",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Longest Increasing Subsequence",
        url: "https://leetcode.com/problems/longest-increasing-subsequence",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Isomorphic Strings",
        url: "https://leetcode.com/problems/isomorphic-strings",
        difficulty: "Easy",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive",
        difficulty: "Hard",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Find Pivot Index",
        url: "https://leetcode.com/problems/find-pivot-index",
        difficulty: "Easy",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "Candy",
        url: "https://leetcode.com/problems/candy",
        difficulty: "Hard",
      },
      {
        name: "Top K Frequent Words",
        url: "https://leetcode.com/problems/top-k-frequent-words",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Add and Search Word - Data structure design",
        url: "https://leetcode.com/problems/add-and-search-word-data-structure-design",
        difficulty: "Medium",
      },
      {
        name: "Invert Binary Tree",
        url: "https://leetcode.com/problems/invert-binary-tree",
        difficulty: "Easy",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Binary Tree Vertical Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-vertical-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Simplify Path",
        url: "https://leetcode.com/problems/simplify-path",
        difficulty: "Medium",
      },
      {
        name: "Fizz Buzz",
        url: "https://leetcode.com/problems/fizz-buzz",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String III",
        url: "https://leetcode.com/problems/reverse-words-in-a-string-iii",
        difficulty: "Easy",
      },
      {
        name: "Symmetric Tree",
        url: "https://leetcode.com/problems/symmetric-tree",
        difficulty: "Easy",
      },
      {
        name: "Friend Circles",
        url: "https://leetcode.com/problems/friend-circles",
        difficulty: "Medium",
      },
      {
        name: "Integer to Roman",
        url: "https://leetcode.com/problems/integer-to-roman",
        difficulty: "Medium",
      },
      {
        name: "Valid Sudoku",
        url: "https://leetcode.com/problems/valid-sudoku",
        difficulty: "Medium",
      },
      {
        name: "Set Matrix Zeroes",
        url: "https://leetcode.com/problems/set-matrix-zeroes",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Intersection of Two Arrays II",
        url: "https://leetcode.com/problems/intersection-of-two-arrays-ii",
        difficulty: "Easy",
      },
      {
        name: "Check If a Number Is Majority Element in a Sorted Array",
        url: "https://leetcode.com/problems/check-if-a-number-is-majority-element-in-a-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Height Checker",
        url: "https://leetcode.com/problems/height-checker",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "salesforce",
    title: "SalesForce",
    icon: "☁️",
    totalProblems: 55,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Reaching Points",
        url: "https://leetcode.com/problems/reaching-points",
        difficulty: "Hard",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "K-diff Pairs in an Array",
        url: "https://leetcode.com/problems/k-diff-pairs-in-an-array",
        difficulty: "Easy",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Find the Smallest Divisor Given a Threshold",
        url: "https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold",
        difficulty: "Medium",
      },
      {
        name: "LFU Cache",
        url: "https://leetcode.com/problems/lfu-cache",
        difficulty: "Hard",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "Design Search Autocomplete System",
        url: "https://leetcode.com/problems/design-search-autocomplete-system",
        difficulty: "Hard",
      },
      {
        name: "Maximum Frequency Stack",
        url: "https://leetcode.com/problems/maximum-frequency-stack",
        difficulty: "Hard",
      },
      {
        name: "The Skyline Problem",
        url: "https://leetcode.com/problems/the-skyline-problem",
        difficulty: "Hard",
      },
      {
        name: "Flatten 2D Vector",
        url: "https://leetcode.com/problems/flatten-2d-vector",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Remove Duplicates from Sorted List II",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-list-ii",
        difficulty: "Medium",
      },
      {
        name: "Design Tic-Tac-Toe",
        url: "https://leetcode.com/problems/design-tic-tac-toe",
        difficulty: "Medium",
      },
      {
        name: "Shuffle an Array",
        url: "https://leetcode.com/problems/shuffle-an-array",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Largest Number",
        url: "https://leetcode.com/problems/largest-number",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Find the Duplicate Number",
        url: "https://leetcode.com/problems/find-the-duplicate-number",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Design Snake Game",
        url: "https://leetcode.com/problems/design-snake-game",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Remove Duplicates from Sorted List",
        url: "https://leetcode.com/problems/remove-duplicates-from-sorted-list",
        difficulty: "Easy",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Longest Increasing Subsequence",
        url: "https://leetcode.com/problems/longest-increasing-subsequence",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Isomorphic Strings",
        url: "https://leetcode.com/problems/isomorphic-strings",
        difficulty: "Easy",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive",
        difficulty: "Hard",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Find Pivot Index",
        url: "https://leetcode.com/problems/find-pivot-index",
        difficulty: "Easy",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "Candy",
        url: "https://leetcode.com/problems/candy",
        difficulty: "Hard",
      },
      {
        name: "Top K Frequent Words",
        url: "https://leetcode.com/problems/top-k-frequent-words",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "samsung",
    title: "Samsung",
    icon: "📱",
    totalProblems: 35,
    solvedProblems: 0,
    problems: [
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Maximum Path Sum",
        url: "https://leetcode.com/problems/binary-tree-maximum-path-sum",
        difficulty: "Hard",
      },
      {
        name: "Gas Station",
        url: "https://leetcode.com/problems/gas-station",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Diameter of Binary Tree",
        url: "https://leetcode.com/problems/diameter-of-binary-tree",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Moving Average from Data Stream",
        url: "https://leetcode.com/problems/moving-average-from-data-stream",
        difficulty: "Easy",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Minimum Size Subarray Sum",
        url: "https://leetcode.com/problems/minimum-size-subarray-sum",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "sap",
    title: "SAP",
    icon: "💼",
    totalProblems: 30,
    solvedProblems: 0,
    problems: [
      {
        name: "Clone Graph",
        url: "https://leetcode.com/problems/clone-graph",
        difficulty: "Medium",
      },
      {
        name: "Count All Valid Pickup and Delivery Options",
        url: "https://leetcode.com/problems/count-all-valid-pickup-and-delivery-options",
        difficulty: "Hard",
      },
      {
        name: "Encode and Decode TinyURL",
        url: "https://leetcode.com/problems/encode-and-decode-tinyurl",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "servicenow",
    title: "ServiceNow",
    icon: "🔧",
    totalProblems: 25,
    solvedProblems: 0,
    problems: [
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Sort Colors",
        url: "https://leetcode.com/problems/sort-colors",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "snapchat",
    title: "Snapchat",
    icon: "👻",
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Maximum Path Sum",
        url: "https://leetcode.com/problems/binary-tree-maximum-path-sum",
        difficulty: "Hard",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Find All Numbers Disappeared in an Array",
        url: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array",
        difficulty: "Easy",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "splunk",
    title: "Splunk",
    icon: "📈",
    totalProblems: 30,
    solvedProblems: 0,
    problems: [
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "spotify",
    title: "Spotify",
    icon: "🎵",
    totalProblems: 35,
    solvedProblems: 0,
    problems: [
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "square",
    title: "Square",
    icon: "⬜",
    totalProblems: 30,
    solvedProblems: 0,
    problems: [
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "sumologic",
    title: "SumoLogic",
    icon: "📊",
    totalProblems: 20,
    solvedProblems: 0,
    problems: [
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "tableau",
    title: "Tableau",
    icon: "📊",
    totalProblems: 25,
    solvedProblems: 0,
    problems: [
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Diameter",
        url: "https://leetcode.com/problems/diameter-of-binary-tree",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "tencent",
    title: "Tencent",
    icon: "🐧",
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Zigzag Conversion",
        url: "https://leetcode.com/problems/zigzag-conversion",
        difficulty: "Medium",
      },
      {
        name: "Reverse Integer",
        url: "https://leetcode.com/problems/reverse-integer",
        difficulty: "Easy",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Palindrome Number",
        url: "https://leetcode.com/problems/palindrome-number",
        difficulty: "Easy",
      },
      {
        name: "Container With Most Water",
        url: "https://leetcode.com/problems/container-with-most-water",
        difficulty: "Medium",
      },
      {
        name: "Integer to Roman",
        url: "https://leetcode.com/problems/integer-to-roman",
        difficulty: "Medium",
      },
      {
        name: "Roman to Integer",
        url: "https://leetcode.com/problems/roman-to-integer",
        difficulty: "Easy",
      },
      {
        name: "Longest Common Prefix",
        url: "https://leetcode.com/problems/longest-common-prefix",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "3Sum Closest",
        url: "https://leetcode.com/problems/3sum-closest",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "tesla",
    title: "Tesla",
    icon: "⚡",
    totalProblems: 35,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "tripadvisor",
    title: "TripAdvisor",
    icon: "✈️",
    totalProblems: 25,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "triplebyte",
    title: "TripleByte",
    icon: "💻",
    totalProblems: 30,
    solvedProblems: 0,
    problems: [
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "twilio",
    title: "Twilio",
    icon: "📞",
    totalProblems: 25,
    solvedProblems: 0,
    problems: [
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "twitch",
    title: "Twitch",
    icon: "🎮",
    totalProblems: 30,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "twitter",
    title: "Twitter",
    icon: "🐦",
    totalProblems: 50,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },

      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },

      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },

      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },

      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "two-sigma",
    title: "Two Sigma",
    icon: "📊",
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "uber",
    title: "Uber",
    icon: "🚗",
    totalProblems: 70,
    solvedProblems: 0,
    problems: [
      {
        name: "Construct Quad Tree",
        url: "https://leetcode.com/problems/construct-quad-tree",
        difficulty: "Medium",
      },
      {
        name: "Word Pattern II",
        url: "https://leetcode.com/problems/word-pattern-ii",
        difficulty: "Hard",
      },
      {
        name: "Minesweeper",
        url: "https://leetcode.com/problems/minesweeper",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands II",
        url: "https://leetcode.com/problems/number-of-islands-ii",
        difficulty: "Hard",
      },
      {
        name: "Cherry Pickup",
        url: "https://leetcode.com/problems/cherry-pickup",
        difficulty: "Hard",
      },
      {
        name: "Set Intersection Size At Least Two",
        url: "https://leetcode.com/problems/set-intersection-size-at-least-two",
        difficulty: "Hard",
      },
      {
        name: "Reconstruct Itinerary",
        url: "https://leetcode.com/problems/reconstruct-itinerary",
        difficulty: "Medium",
      },
      {
        name: "Flatten Nested List Iterator",
        url: "https://leetcode.com/problems/flatten-nested-list-iterator",
        difficulty: "Medium",
      },
      {
        name: "Text Justification",
        url: "https://leetcode.com/problems/text-justification",
        difficulty: "Hard",
      },
      {
        name: "Optimal Account Balancing",
        url: "https://leetcode.com/problems/optimal-account-balancing",
        difficulty: "Hard",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Trips and Users",
        url: "https://leetcode.com/problems/trips-and-users",
        difficulty: "Hard",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Palindrome Permutation II",
        url: "https://leetcode.com/problems/palindrome-permutation-ii",
        difficulty: "Medium",
      },
      {
        name: "Valid Sudoku",
        url: "https://leetcode.com/problems/valid-sudoku",
        difficulty: "Medium",
      },
      {
        name: "Print Binary Tree",
        url: "https://leetcode.com/problems/print-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Basic Calculator II",
        url: "https://leetcode.com/problems/basic-calculator-ii",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Interval List Intersections",
        url: "https://leetcode.com/problems/interval-list-intersections",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Serialize and Deserialize N-ary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-n-ary-tree",
        difficulty: "Hard",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Sliding Puzzle",
        url: "https://leetcode.com/problems/sliding-puzzle",
        difficulty: "Hard",
      },
      {
        name: "Logger Rate Limiter",
        url: "https://leetcode.com/problems/logger-rate-limiter",
        difficulty: "Easy",
      },
      {
        name: "Basic Calculator III",
        url: "https://leetcode.com/problems/basic-calculator-iii",
        difficulty: "Hard",
      },
      {
        name: "Fraction to Recurring Decimal",
        url: "https://leetcode.com/problems/fraction-to-recurring-decimal",
        difficulty: "Medium",
      },
      {
        name: "Reaching Points",
        url: "https://leetcode.com/problems/reaching-points",
        difficulty: "Hard",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Basic Calculator",
        url: "https://leetcode.com/problems/basic-calculator",
        difficulty: "Hard",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Design Search Autocomplete System",
        url: "https://leetcode.com/problems/design-search-autocomplete-system",
        difficulty: "Hard",
      },
      {
        name: "Bomb Enemy",
        url: "https://leetcode.com/problems/bomb-enemy",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Walls and Gates",
        url: "https://leetcode.com/problems/walls-and-gates",
        difficulty: "Medium",
      },
      {
        name: "Tag Validator",
        url: "https://leetcode.com/problems/tag-validator",
        difficulty: "Hard",
      },
      {
        name: "Palindrome Pairs",
        url: "https://leetcode.com/problems/palindrome-pairs",
        difficulty: "Hard",
      },
      {
        name: "Exclusive Time of Functions",
        url: "https://leetcode.com/problems/exclusive-time-of-functions",
        difficulty: "Medium",
      },
      {
        name: "Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/longest-consecutive-sequence",
        difficulty: "Hard",
      },
      {
        name: "Insert Delete GetRandom O(1) - Duplicates allowed",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1-duplicates-allowed",
        difficulty: "Hard",
      },
      {
        name: "Find First and Last Position of Element in Sorted Array",
        url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Water and Jug Problem",
        url: "https://leetcode.com/problems/water-and-jug-problem",
        difficulty: "Medium",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Factor Combinations",
        url: "https://leetcode.com/problems/factor-combinations",
        difficulty: "Medium",
      },
      {
        name: "Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight",
        difficulty: "Medium",
      },
      {
        name: "Max Points on a Line",
        url: "https://leetcode.com/problems/max-points-on-a-line",
        difficulty: "Hard",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "24 Game",
        url: "https://leetcode.com/problems/24-game",
        difficulty: "Hard",
      },
    ],
  },
  {
    id: "visa",
    title: "Visa",
    icon: "💳",
    totalProblems: 35,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "vmware",
    title: "VMWARE",
    icon: "☁️",
    totalProblems: 30,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Degree of an Array",
        url: "https://leetcode.com/problems/degree-of-an-array",
        difficulty: "Easy",
      },
      {
        name: "LFU Cache",
        url: "https://leetcode.com/problems/lfu-cache",
        difficulty: "Hard",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Sudoku Solver",
        url: "https://leetcode.com/problems/sudoku-solver",
        difficulty: "Hard",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Interleaving String",
        url: "https://leetcode.com/problems/interleaving-string",
        difficulty: "Hard",
      },
      {
        name: "Restore IP Addresses",
        url: "https://leetcode.com/problems/restore-ip-addresses",
        difficulty: "Medium",
      },
      {
        name: "Longest String Chain",
        url: "https://leetcode.com/problems/longest-string-chain",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Sort Colors",
        url: "https://leetcode.com/problems/sort-colors",
        difficulty: "Medium",
      },
      {
        name: "Maximal Rectangle",
        url: "https://leetcode.com/problems/maximal-rectangle",
        difficulty: "Hard",
      },
      {
        name: "Maximal Square",
        url: "https://leetcode.com/problems/maximal-square",
        difficulty: "Medium",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change",
        difficulty: "Medium",
      },
      {
        name: "Break a Palindrome",
        url: "https://leetcode.com/problems/break-a-palindrome",
        difficulty: "Medium",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Design HashMap",
        url: "https://leetcode.com/problems/design-hashmap",
        difficulty: "Easy",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Longest Increasing Subsequence",
        url: "https://leetcode.com/problems/longest-increasing-subsequence",
        difficulty: "Medium",
      },
      {
        name: "Find Duplicate File in System",
        url: "https://leetcode.com/problems/find-duplicate-file-in-system",
        difficulty: "Medium",
      },
      {
        name: "Flood Fill",
        url: "https://leetcode.com/problems/flood-fill",
        difficulty: "Easy",
      },
      {
        name: "Shortest Word Distance",
        url: "https://leetcode.com/problems/shortest-word-distance",
        difficulty: "Easy",
      },
      {
        name: "Time Based Key-Value Store",
        url: "https://leetcode.com/problems/time-based-key-value-store",
        difficulty: "Medium",
      },
      {
        name: "Permutations II",
        url: "https://leetcode.com/problems/permutations-ii",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Find the Celebrity",
        url: "https://leetcode.com/problems/find-the-celebrity",
        difficulty: "Medium",
      },
      {
        name: "Populating Next Right Pointers in Each Node",
        url: "https://leetcode.com/problems/populating-next-right-pointers-in-each-node",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Reverse Nodes in k-Group",
        url: "https://leetcode.com/problems/reverse-nodes-in-k-group",
        difficulty: "Hard",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive",
        difficulty: "Hard",
      },
      {
        name: "Convert Binary Search Tree to Sorted Doubly Linked List",
        url: "https://leetcode.com/problems/convert-binary-search-tree-to-sorted-doubly-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Consecutive Numbers Sum",
        url: "https://leetcode.com/problems/consecutive-numbers-sum",
        difficulty: "Hard",
      },
      {
        name: "Reverse Words in a String II",
        url: "https://leetcode.com/problems/reverse-words-in-a-string-ii",
        difficulty: "Medium",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Combination Sum",
        url: "https://leetcode.com/problems/combination-sum",
        difficulty: "Medium",
      },
      {
        name: "Alien Dictionary",
        url: "https://leetcode.com/problems/alien-dictionary",
        difficulty: "Hard",
      },
      {
        name: "Clone Graph",
        url: "https://leetcode.com/problems/clone-graph",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Partition to K Equal Sum Subsets",
        url: "https://leetcode.com/problems/partition-to-k-equal-sum-subsets",
        difficulty: "Medium",
      },
      {
        name: "Next Greater Element III",
        url: "https://leetcode.com/problems/next-greater-element-iii",
        difficulty: "Medium",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Flatten Nested List Iterator",
        url: "https://leetcode.com/problems/flatten-nested-list-iterator",
        difficulty: "Medium",
      },
      {
        name: "Contiguous Array",
        url: "https://leetcode.com/problems/contiguous-array",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Linked List Cycle",
        url: "https://leetcode.com/problems/linked-list-cycle",
        difficulty: "Easy",
      },
      {
        name: "Edit Distance",
        url: "https://leetcode.com/problems/edit-distance",
        difficulty: "Hard",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "wayfair",
    title: "WayFair",
    icon: "🏠",
    totalProblems: 35,
    solvedProblems: 0,
    problems: [
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "wish",
    title: "Wish",
    icon: "🎁",
    totalProblems: 25,
    solvedProblems: 0,
    problems: [
      {
        name: "Longest Mountain in Array",
        url: "https://leetcode.com/problems/longest-mountain-in-array",
        difficulty: "Medium",
      },
      {
        name: "RLE Iterator",
        url: "https://leetcode.com/problems/rle-iterator",
        difficulty: "Medium",
      },
      {
        name: "Longest Absolute File Path",
        url: "https://leetcode.com/problems/longest-absolute-file-path",
        difficulty: "Medium",
      },
      {
        name: "Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Vertical Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-vertical-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Unique Binary Search Trees",
        url: "https://leetcode.com/problems/unique-binary-search-trees",
        difficulty: "Medium",
      },
      {
        name: "Add Bold Tag in String",
        url: "https://leetcode.com/problems/add-bold-tag-in-string",
        difficulty: "Medium",
      },
      {
        name: "Max Area of Island",
        url: "https://leetcode.com/problems/max-area-of-island",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Minimum Path Sum",
        url: "https://leetcode.com/problems/minimum-path-sum",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Longest Consecutive Sequence",
        url: "https://leetcode.com/problems/longest-consecutive-sequence",
        difficulty: "Hard",
      },
      {
        name: "Min Stack",
        url: "https://leetcode.com/problems/min-stack",
        difficulty: "Easy",
      },
      {
        name: "Sudoku Solver",
        url: "https://leetcode.com/problems/sudoku-solver",
        difficulty: "Hard",
      },
      {
        name: "ZigZag Conversion",
        url: "https://leetcode.com/problems/zigzag-conversion",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring with At Most K Distinct Characters",
        url: "https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters",
        difficulty: "Hard",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "First Missing Positive",
        url: "https://leetcode.com/problems/first-missing-positive",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Factorial Trailing Zeroes",
        url: "https://leetcode.com/problems/factorial-trailing-zeroes",
        difficulty: "Easy",
      },
      {
        name: "Valid Palindrome",
        url: "https://leetcode.com/problems/valid-palindrome",
        difficulty: "Easy",
      },
      {
        name: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule",
        difficulty: "Medium",
      },
      {
        name: "Subarray Sum Equals K",
        url: "https://leetcode.com/problems/subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Rabbits in Forest",
        url: "https://leetcode.com/problems/rabbits-in-forest",
        difficulty: "Medium",
      },
      {
        name: "Monthly Transactions I",
        url: "https://leetcode.com/problems/monthly-transactions-i",
        difficulty: "Medium",
      },
      {
        name: "Monthly Transactions II",
        url: "https://leetcode.com/problems/monthly-transactions-ii",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "yahoo",
    title: "Yahoo",
    icon: "🟣",
    totalProblems: 40,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Largest Palindrome Product",
        url: "https://leetcode.com/problems/largest-palindrome-product",
        difficulty: "Hard",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "Roman to Integer",
        url: "https://leetcode.com/problems/roman-to-integer",
        difficulty: "Easy",
      },
      {
        name: "Shuffle an Array",
        url: "https://leetcode.com/problems/shuffle-an-array",
        difficulty: "Medium",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string",
        difficulty: "Easy",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Product of Array Except Self",
        url: "https://leetcode.com/problems/product-of-array-except-self",
        difficulty: "Medium",
      },
      {
        name: "Isomorphic Strings",
        url: "https://leetcode.com/problems/isomorphic-strings",
        difficulty: "Easy",
      },
      {
        name: "Find Median from Data Stream",
        url: "https://leetcode.com/problems/find-median-from-data-stream",
        difficulty: "Hard",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Coin Change",
        url: "https://leetcode.com/problems/coin-change",
        difficulty: "Medium",
      },
      {
        name: "Sort Colors",
        url: "https://leetcode.com/problems/sort-colors",
        difficulty: "Medium",
      },
      {
        name: "Reverse Integer",
        url: "https://leetcode.com/problems/reverse-integer",
        difficulty: "Easy",
      },
      {
        name: "Integer to Roman",
        url: "https://leetcode.com/problems/integer-to-roman",
        difficulty: "Medium",
      },
      {
        name: "Optimize Water Distribution in a Village",
        url: "https://leetcode.com/problems/optimize-water-distribution-in-a-village",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Combine Two Tables",
        url: "https://leetcode.com/problems/combine-two-tables",
        difficulty: "Easy",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Unique Binary Search Trees II",
        url: "https://leetcode.com/problems/unique-binary-search-trees-ii",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Count Primes",
        url: "https://leetcode.com/problems/count-primes",
        difficulty: "Easy",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Design Hit Counter",
        url: "https://leetcode.com/problems/design-hit-counter",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Search a 2D Matrix II",
        url: "https://leetcode.com/problems/search-a-2d-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "Intersection of Two Linked Lists",
        url: "https://leetcode.com/problems/intersection-of-two-linked-lists",
        difficulty: "Easy",
      },
      {
        name: "Permutations",
        url: "https://leetcode.com/problems/permutations",
        difficulty: "Medium",
      },
      {
        name: "Remove Duplicate Letters",
        url: "https://leetcode.com/problems/remove-duplicate-letters",
        difficulty: "Hard",
      },
      {
        name: "Binary Tree Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize Binary Tree",
        url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree",
        difficulty: "Hard",
      },
      {
        name: "Trim a Binary Search Tree",
        url: "https://leetcode.com/problems/trim-a-binary-search-tree",
        difficulty: "Easy",
      },
      {
        name: "Linked List Cycle",
        url: "https://leetcode.com/problems/linked-list-cycle",
        difficulty: "Easy",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Kth Largest Element in an Array",
        url: "https://leetcode.com/problems/kth-largest-element-in-an-array",
        difficulty: "Medium",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Combinations",
        url: "https://leetcode.com/problems/combinations",
        difficulty: "Medium",
      },
      {
        name: "Palindrome Number",
        url: "https://leetcode.com/problems/palindrome-number",
        difficulty: "Easy",
      },
      {
        name: "Majority Element",
        url: "https://leetcode.com/problems/majority-element",
        difficulty: "Easy",
      },
      {
        name: "H-Index",
        url: "https://leetcode.com/problems/h-index",
        difficulty: "Medium",
      },
      {
        name: "Contains Duplicate",
        url: "https://leetcode.com/problems/contains-duplicate",
        difficulty: "Easy",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Find First and Last Position of Element in Sorted Array",
        url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Peeking Iterator",
        url: "https://leetcode.com/problems/peeking-iterator",
        difficulty: "Medium",
      },
      {
        name: "Copy List with Random Pointer",
        url: "https://leetcode.com/problems/copy-list-with-random-pointer",
        difficulty: "Medium",
      },
      {
        name: "Restore IP Addresses",
        url: "https://leetcode.com/problems/restore-ip-addresses",
        difficulty: "Medium",
      },
      {
        name: "Word Search",
        url: "https://leetcode.com/problems/word-search",
        difficulty: "Medium",
      },
      {
        name: "4Sum",
        url: "https://leetcode.com/problems/4sum",
        difficulty: "Medium",
      },
      {
        name: "Next Greater Element II",
        url: "https://leetcode.com/problems/next-greater-element-ii",
        difficulty: "Medium",
      },
      {
        name: "Delete Node in a BST",
        url: "https://leetcode.com/problems/delete-node-in-a-bst",
        difficulty: "Medium",
      },
      {
        name: "Convert Sorted Array to Binary Search Tree",
        url: "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree",
        difficulty: "Easy",
      },
      {
        name: "Top K Frequent Elements",
        url: "https://leetcode.com/problems/top-k-frequent-elements",
        difficulty: "Medium",
      },
      {
        name: "Excel Sheet Column title",
        url: "https://leetcode.com/problems/excel-sheet-column-title",
        difficulty: "Easy",
      },
      {
        name: "Can Place Flowers",
        url: "https://leetcode.com/problems/can-place-flowers",
        difficulty: "Easy",
      },
      {
        name: "Container With Most Water",
        url: "https://leetcode.com/problems/container-with-most-water",
        difficulty: "Medium",
      },
      {
        name: "Edit Distance",
        url: "https://leetcode.com/problems/edit-distance",
        difficulty: "Hard",
      },
      {
        name: "Jewels and Stones",
        url: "https://leetcode.com/problems/jewels-and-stones",
        difficulty: "Easy",
      },
      {
        name: "Palindrome Partitioning",
        url: "https://leetcode.com/problems/palindrome-partitioning",
        difficulty: "Medium",
      },
      {
        name: "Maximum Depth of Binary Tree",
        url: "https://leetcode.com/problems/maximum-depth-of-binary-tree",
        difficulty: "Easy",
      },
      {
        name: "Valid Anagram",
        url: "https://leetcode.com/problems/valid-anagram",
        difficulty: "Easy",
      },
      {
        name: "Delete Node in a Linked List",
        url: "https://leetcode.com/problems/delete-node-in-a-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Partition Equal Subset Sum",
        url: "https://leetcode.com/problems/partition-equal-subset-sum",
        difficulty: "Medium",
      },
      {
        name: "Coin Change 2",
        url: "https://leetcode.com/problems/coin-change-2",
        difficulty: "Medium",
      },
      {
        name: "Minimum Window Substring",
        url: "https://leetcode.com/problems/minimum-window-substring",
        difficulty: "Hard",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder II",
        url: "https://leetcode.com/problems/word-ladder-ii",
        difficulty: "Hard",
      },
      {
        name: "Kth Smallest Element in a Sorted Matrix",
        url: "https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix",
        difficulty: "Medium",
      },
      {
        name: "Construct Binary Tree from Preorder and Inorder Traversal",
        url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal",
        difficulty: "Medium",
      },
      {
        name: "Implement Stack using Queues",
        url: "https://leetcode.com/problems/implement-stack-using-queues",
        difficulty: "Easy",
      },
      {
        name: "Increasing Triplet Subsequence",
        url: "https://leetcode.com/problems/increasing-triplet-subsequence",
        difficulty: "Medium",
      },
      {
        name: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule",
        difficulty: "Medium",
      },
      {
        name: "Permutation in String",
        url: "https://leetcode.com/problems/permutation-in-string",
        difficulty: "Medium",
      },
      {
        name: "Longest Valid Parentheses",
        url: "https://leetcode.com/problems/longest-valid-parentheses",
        difficulty: "Hard",
      },
      {
        name: "Add Two Numbers II",
        url: "https://leetcode.com/problems/add-two-numbers-ii",
        difficulty: "Medium",
      },
      {
        name: "Implement strStr()",
        url: "https://leetcode.com/problems/implement-strstr",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock II",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii",
        difficulty: "Easy",
      },
      {
        name: "Subarray Sum Equals K",
        url: "https://leetcode.com/problems/subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "Subsets",
        url: "https://leetcode.com/problems/subsets",
        difficulty: "Medium",
      },
      {
        name: "Count Complete Tree Nodes",
        url: "https://leetcode.com/problems/count-complete-tree-nodes",
        difficulty: "Medium",
      },
      {
        name: "Second Highest Salary",
        url: "https://leetcode.com/problems/second-highest-salary",
        difficulty: "Easy",
      },
      {
        name: "Valid Palindrome II",
        url: "https://leetcode.com/problems/valid-palindrome-ii",
        difficulty: "Easy",
      },
      {
        name: "Flatten Binary Tree to Linked List",
        url: "https://leetcode.com/problems/flatten-binary-tree-to-linked-list",
        difficulty: "Medium",
      },
      {
        name: "Find All Numbers Disappeared in an Array",
        url: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array",
        difficulty: "Easy",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "K Closest Points to Origin",
        url: "https://leetcode.com/problems/k-closest-points-to-origin",
        difficulty: "Medium",
      },
      {
        name: "Min Cost Climbing Stairs",
        url: "https://leetcode.com/problems/min-cost-climbing-stairs",
        difficulty: "Easy",
      },
      {
        name: "Permutation Sequence",
        url: "https://leetcode.com/problems/permutation-sequence",
        difficulty: "Hard",
      },
      {
        name: "All Nodes Distance K in Binary Tree",
        url: "https://leetcode.com/problems/all-nodes-distance-k-in-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Rank Scores",
        url: "https://leetcode.com/problems/rank-scores",
        difficulty: "Medium",
      },
      {
        name: "Defanging an IP Address",
        url: "https://leetcode.com/problems/defanging-an-ip-address",
        difficulty: "Easy",
      },
      {
        name: "Fibonacci Number",
        url: "https://leetcode.com/problems/fibonacci-number",
        difficulty: "Easy",
      },
      {
        name: "Reverse Words in a String III",
        url: "https://leetcode.com/problems/reverse-words-in-a-string-iii",
        difficulty: "Easy",
      },
      {
        name: "Single Number III",
        url: "https://leetcode.com/problems/single-number-iii",
        difficulty: "Medium",
      },
      {
        name: "Binary Tree Zigzag Level Order Traversal",
        url: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal",
        difficulty: "Medium",
      },
      {
        name: "Increasing Subsequences",
        url: "https://leetcode.com/problems/increasing-subsequences",
        difficulty: "Medium",
      },
      {
        name: "Maximum Distance in Arrays",
        url: "https://leetcode.com/problems/maximum-distance-in-arrays",
        difficulty: "Easy",
      },
      {
        name: "Binary Number with Alternating Bits",
        url: "https://leetcode.com/problems/binary-number-with-alternating-bits",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "yandex",
    title: "Yandex",
    icon: "🔴",
    totalProblems: 30,
    solvedProblems: 0,
    problems: [
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Summary Ranges",
        url: "https://leetcode.com/problems/summary-ranges",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Valid Palindrome",
        url: "https://leetcode.com/problems/valid-palindrome",
        difficulty: "Easy",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Zigzag Iterator",
        url: "https://leetcode.com/problems/zigzag-iterator",
        difficulty: "Medium",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
      {
        name: "Subarray Sum Equals K",
        url: "https://leetcode.com/problems/subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Max Consecutive Ones III",
        url: "https://leetcode.com/problems/max-consecutive-ones-iii",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Implement Queue using Stacks",
        url: "https://leetcode.com/problems/implement-queue-using-stacks",
        difficulty: "Easy",
      },
      {
        name: "Permutation in String",
        url: "https://leetcode.com/problems/permutation-in-string",
        difficulty: "Medium",
      },
      {
        name: "Max Consecutive Ones II",
        url: "https://leetcode.com/problems/max-consecutive-ones-ii",
        difficulty: "Medium",
      },
      {
        name: "Merge Two Sorted Lists",
        url: "https://leetcode.com/problems/merge-two-sorted-lists",
        difficulty: "Easy",
      },
      {
        name: "Spiral Matrix II",
        url: "https://leetcode.com/problems/spiral-matrix-ii",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Merge Sorted Array",
        url: "https://leetcode.com/problems/merge-sorted-array",
        difficulty: "Easy",
      },
      {
        name: "Symmetric Tree",
        url: "https://leetcode.com/problems/symmetric-tree",
        difficulty: "Easy",
      },
      {
        name: "Reconstruct Itinerary",
        url: "https://leetcode.com/problems/reconstruct-itinerary",
        difficulty: "Medium",
      },
      {
        name: "Number of Recent Calls",
        url: "https://leetcode.com/problems/number-of-recent-calls",
        difficulty: "Easy",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Subarray Sums Divisible by K",
        url: "https://leetcode.com/problems/subarray-sums-divisible-by-k",
        difficulty: "Medium",
      },
      {
        name: "Count Primes",
        url: "https://leetcode.com/problems/count-primes",
        difficulty: "Easy",
      },
      {
        name: "Longest Palindromic Substring",
        url: "https://leetcode.com/problems/longest-palindromic-substring",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize BST",
        url: "https://leetcode.com/problems/serialize-and-deserialize-bst",
        difficulty: "Medium",
      },
      {
        name: "Rotate Image",
        url: "https://leetcode.com/problems/rotate-image",
        difficulty: "Medium",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Remove Nth Node From End of List",
        url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list",
        difficulty: "Medium",
      },
      {
        name: "Simplify Path",
        url: "https://leetcode.com/problems/simplify-path",
        difficulty: "Medium",
      },
      {
        name: "Evaluate Reverse Polish Notation",
        url: "https://leetcode.com/problems/evaluate-reverse-polish-notation",
        difficulty: "Medium",
      },
      {
        name: "Intersection of Two Arrays II",
        url: "https://leetcode.com/problems/intersection-of-two-arrays-ii",
        difficulty: "Easy",
      },
      {
        name: "Find First and Last Position of Element in Sorted Array",
        url: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Perfect Squares",
        url: "https://leetcode.com/problems/perfect-squares",
        difficulty: "Medium",
      },
      {
        name: "Implement strStr()",
        url: "https://leetcode.com/problems/implement-strstr",
        difficulty: "Easy",
      },
      {
        name: "3Sum Closest",
        url: "https://leetcode.com/problems/3sum-closest",
        difficulty: "Medium",
      },
      {
        name: "Longest Subarray of 1's After Deleting One Element",
        url: "https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element",
        difficulty: "Medium",
      },
    ],
  },
  {
    id: "yelp",
    title: "Yelp",
    icon: "⭐",
    totalProblems: 35,
    solvedProblems: 0,
    problems: [
      {
        name: "Minimum Index Sum of Two Lists",
        url: "https://leetcode.com/problems/minimum-index-sum-of-two-lists",
        difficulty: "Easy",
      },
      {
        name: "Find the Closest Palindrome",
        url: "https://leetcode.com/problems/find-the-closest-palindrome",
        difficulty: "Hard",
      },
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "Reconstruct Itinerary",
        url: "https://leetcode.com/problems/reconstruct-itinerary",
        difficulty: "Medium",
      },
      {
        name: "Design Twitter",
        url: "https://leetcode.com/problems/design-twitter",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Top K Frequent Words",
        url: "https://leetcode.com/problems/top-k-frequent-words",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "The Skyline Problem",
        url: "https://leetcode.com/problems/the-skyline-problem",
        difficulty: "Hard",
      },
      {
        name: "Top K Frequent Elements",
        url: "https://leetcode.com/problems/top-k-frequent-elements",
        difficulty: "Medium",
      },
      {
        name: "Active Businesses",
        url: "https://leetcode.com/problems/active-businesses",
        difficulty: "Medium",
      },
      {
        name: "Random Pick with Weight",
        url: "https://leetcode.com/problems/random-pick-with-weight",
        difficulty: "Medium",
      },
      {
        name: "Meeting Rooms II",
        url: "https://leetcode.com/problems/meeting-rooms-ii",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Filter Restaurants by Vegan-Friendly & Price and Distance",
        url: "https://leetcode.com/problems/filter-restaurants-by-vegan-friendly-price-and-distance",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Longest Common Prefix",
        url: "https://leetcode.com/problems/longest-common-prefix",
        difficulty: "Easy",
      },
      {
        name: "Isomorphic Strings",
        url: "https://leetcode.com/problems/isomorphic-strings",
        difficulty: "Easy",
      },
      {
        name: "Word Ladder II",
        url: "https://leetcode.com/problems/word-ladder-ii",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Generate Parentheses",
        url: "https://leetcode.com/problems/generate-parentheses",
        difficulty: "Medium",
      },
      {
        name: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule",
        difficulty: "Medium",
      },
      {
        name: "Word frequency",
        url: "https://leetcode.com/problems/word-frequency",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1)",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1",
        difficulty: "Medium",
      },
      {
        name: "Letter Case Permutation",
        url: "https://leetcode.com/problems/letter-case-permutation",
        difficulty: "Medium",
      },
      {
        name: "Combination Sum",
        url: "https://leetcode.com/problems/combination-sum",
        difficulty: "Medium",
      },
      {
        name: "Sliding Window Maximum",
        url: "https://leetcode.com/problems/sliding-window-maximum",
        difficulty: "Hard",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Intersection of Two Arrays",
        url: "https://leetcode.com/problems/intersection-of-two-arrays",
        difficulty: "Easy",
      },
      {
        name: "Valid Anagram",
        url: "https://leetcode.com/problems/valid-anagram",
        difficulty: "Easy",
      },
      {
        name: "Decode String",
        url: "https://leetcode.com/problems/decode-string",
        difficulty: "Medium",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Insert Delete GetRandom O(1) - Duplicates allowed",
        url: "https://leetcode.com/problems/insert-delete-getrandom-o1-duplicates-allowed",
        difficulty: "Hard",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
      {
        name: "Destination City",
        url: "https://leetcode.com/problems/destination-city",
        difficulty: "Easy",
      },
      {
        name: "Check If a Word Occurs As a Prefix of Any Word in a Sentence",
        url: "https://leetcode.com/problems/check-if-a-word-occurs-as-a-prefix-of-any-word-in-a-sentence",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "zenefits",
    title: "Zenefits",
    icon: "🏢",
    totalProblems: 20,
    solvedProblems: 0,
    problems: [
      {
        name: "Subarray Sum Equals K",
        url: "https://leetcode.com/problems/subarray-sum-equals-k",
        difficulty: "Medium",
      },
      {
        name: "Letter Combinations of a Phone Number",
        url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Validate Binary Search Tree",
        url: "https://leetcode.com/problems/validate-binary-search-tree",
        difficulty: "Medium",
      },
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Find Peak Element",
        url: "https://leetcode.com/problems/find-peak-element",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "Reverse Linked List",
        url: "https://leetcode.com/problems/reverse-linked-list",
        difficulty: "Easy",
      },
      {
        name: "Find Minimum in Rotated Sorted Array",
        url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Trapping Rain Water",
        url: "https://leetcode.com/problems/trapping-rain-water",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "zillow",
    title: "Zillow",
    icon: "🏠",
    totalProblems: 45,
    solvedProblems: 0,
    problems: [
      {
        name: "Integer to English Words",
        url: "https://leetcode.com/problems/integer-to-english-words",
        difficulty: "Hard",
      },
      {
        name: "LRU Cache",
        url: "https://leetcode.com/problems/lru-cache",
        difficulty: "Medium",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string",
        difficulty: "Easy",
      },
      {
        name: "Lowest Common Ancestor of a Binary Tree",
        url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree",
        difficulty: "Medium",
      },
      {
        name: "Design Snake Game",
        url: "https://leetcode.com/problems/design-snake-game",
        difficulty: "Medium",
      },
      {
        name: "Serialize and Deserialize BST",
        url: "https://leetcode.com/problems/serialize-and-deserialize-bst",
        difficulty: "Medium",
      },
      {
        name: "Time Based Key-Value Store",
        url: "https://leetcode.com/problems/time-based-key-value-store",
        difficulty: "Medium",
      },
      {
        name: "Word Ladder",
        url: "https://leetcode.com/problems/word-ladder",
        difficulty: "Medium",
      },
      {
        name: "Daily Temperatures",
        url: "https://leetcode.com/problems/daily-temperatures",
        difficulty: "Medium",
      },
      {
        name: "Multiply Strings",
        url: "https://leetcode.com/problems/multiply-strings",
        difficulty: "Medium",
      },
      {
        name: "Path Sum II",
        url: "https://leetcode.com/problems/path-sum-ii",
        difficulty: "Medium",
      },
      {
        name: "Design Hit Counter",
        url: "https://leetcode.com/problems/design-hit-counter",
        difficulty: "Medium",
      },
      {
        name: "Word Break",
        url: "https://leetcode.com/problems/word-break",
        difficulty: "Medium",
      },
      {
        name: "Path Sum III",
        url: "https://leetcode.com/problems/path-sum-iii",
        difficulty: "Medium",
      },
      {
        name: "Path Sum",
        url: "https://leetcode.com/problems/path-sum",
        difficulty: "Easy",
      },
      {
        name: "String Compression",
        url: "https://leetcode.com/problems/string-compression",
        difficulty: "Easy",
      },
      {
        name: "Valid Parentheses",
        url: "https://leetcode.com/problems/valid-parentheses",
        difficulty: "Easy",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Maximum Subarray",
        url: "https://leetcode.com/problems/maximum-subarray",
        difficulty: "Easy",
      },
      {
        name: "Best Time to Buy and Sell Stock",
        url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        difficulty: "Easy",
      },
      {
        name: "Merge k Sorted Lists",
        url: "https://leetcode.com/problems/merge-k-sorted-lists",
        difficulty: "Hard",
      },
      {
        name: "Inorder Successor in BST",
        url: "https://leetcode.com/problems/inorder-successor-in-bst",
        difficulty: "Medium",
      },
      {
        name: "Word Search II",
        url: "https://leetcode.com/problems/word-search-ii",
        difficulty: "Hard",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Missing Number",
        url: "https://leetcode.com/problems/missing-number",
        difficulty: "Easy",
      },
      {
        name: "Reverse Words in a String",
        url: "https://leetcode.com/problems/reverse-words-in-a-string",
        difficulty: "Medium",
      },
      {
        name: "Game of Life",
        url: "https://leetcode.com/problems/game-of-life",
        difficulty: "Medium",
      },
      {
        name: "Bulls and Cows",
        url: "https://leetcode.com/problems/bulls-and-cows",
        difficulty: "Easy",
      },
      {
        name: "Word Search",
        url: "https://leetcode.com/problems/word-search",
        difficulty: "Medium",
      },
      {
        name: "Evaluate Reverse Polish Notation",
        url: "https://leetcode.com/problems/evaluate-reverse-polish-notation",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "Roman to Integer",
        url: "https://leetcode.com/problems/roman-to-integer",
        difficulty: "Easy",
      },
      {
        name: "Max Area of Island",
        url: "https://leetcode.com/problems/max-area-of-island",
        difficulty: "Medium",
      },
      {
        name: "Word Break II",
        url: "https://leetcode.com/problems/word-break-ii",
        difficulty: "Hard",
      },
      {
        name: "String to Integer (atoi)",
        url: "https://leetcode.com/problems/string-to-integer-atoi",
        difficulty: "Medium",
      },
      {
        name: "Move Zeroes",
        url: "https://leetcode.com/problems/move-zeroes",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "zoho",
    title: "Zoho",
    icon: "💼",
    totalProblems: 25,
    solvedProblems: 0,
    problems: [
      {
        name: "Two Sum",
        url: "https://leetcode.com/problems/two-sum",
        difficulty: "Easy",
      },
      {
        name: "Add Two Numbers",
        url: "https://leetcode.com/problems/add-two-numbers",
        difficulty: "Medium",
      },
      {
        name: "Longest Substring Without Repeating Characters",
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        difficulty: "Medium",
      },
      {
        name: "3Sum",
        url: "https://leetcode.com/problems/3sum",
        difficulty: "Medium",
      },
      {
        name: "Find Winner on a Tic Tac Toe Game",
        url: "https://leetcode.com/problems/find-winner-on-a-tic-tac-toe-game",
        difficulty: "Easy",
      },
    ],
  },
  {
    id: "zulily",
    title: "Zulily",
    icon: "🛍️",
    totalProblems: 20,
    solvedProblems: 0,
    problems: [
      {
        name: "Merge Intervals",
        url: "https://leetcode.com/problems/merge-intervals",
        difficulty: "Medium",
      },
      {
        name: "Alphabet Board Path",
        url: "https://leetcode.com/problems/alphabet-board-path",
        difficulty: "Medium",
      },
      {
        name: "Valid Anagram",
        url: "https://leetcode.com/problems/valid-anagram",
        difficulty: "Easy",
      },
      {
        name: "Regular Expression Matching",
        url: "https://leetcode.com/problems/regular-expression-matching",
        difficulty: "Hard",
      },
      {
        name: "Number of Islands",
        url: "https://leetcode.com/problems/number-of-islands",
        difficulty: "Medium",
      },
      {
        name: "First Unique Character in a String",
        url: "https://leetcode.com/problems/first-unique-character-in-a-string",
        difficulty: "Easy",
      },
      {
        name: "Median of Two Sorted Arrays",
        url: "https://leetcode.com/problems/median-of-two-sorted-arrays",
        difficulty: "Hard",
      },
      {
        name: "Group Anagrams",
        url: "https://leetcode.com/problems/group-anagrams",
        difficulty: "Medium",
      },
      {
        name: "Search in Rotated Sorted Array",
        url: "https://leetcode.com/problems/search-in-rotated-sorted-array",
        difficulty: "Medium",
      },
      {
        name: "Climbing Stairs",
        url: "https://leetcode.com/problems/climbing-stairs",
        difficulty: "Easy",
      },
    ],
  },
];
