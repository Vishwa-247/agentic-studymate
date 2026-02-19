export interface CSESuggestion {
  title: string;
  icon: string;
  description: string;
  category: string;
}

export const cseSuggestions: CSESuggestion[] = [
  {
    title: "Java Programming",
    icon: "☕",
    description: "Core Java concepts & OOP principles",
    category: "Core Subject"
  },
  {
    title: "Data Structures & Algorithms",
    icon: "🔢",
    description: "Arrays, Trees, Sorting, Searching",
    category: "Core Subject"
  },
  {
    title: "Machine Learning Basics",
    icon: "🤖",
    description: "ML algorithms & Python libraries",
    category: "AI/ML"
  }
];
