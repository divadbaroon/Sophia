import { TaskSidebarProps } from "@/types"
import { Database, Hash, FileText, Code, LucideIcon } from 'lucide-react';

export const textAnalyzerClassData = {
  description: "A utility class for analyzing and manipulating text data. Implement each method according to the description and example provided."
}

// Task Set 1 based on odd-numbered quiz questions (1, 3, 5)
export const textAnalyzerTasks: TaskSidebarProps[] = [
  {
    title: "1.) calculate_sum()",
    difficulty: "Easy",
    description: "Implement a function that calculates the sum of a range of numbers. Use a for loop to iterate through the range and accumulate the total.",
    examples: [
      {
        input: { start: 1, end: 6 },
        output: '15'
      },
      {
        input: { start: 5, end: 10 },
        output: '35',
      },
      {
        input: { start: 1, end: 1 },
        output: '0',
      },
    ],
    constraints: [
      "Use a for loop with the range function",
      "The end parameter is exclusive (like Python's range)",
      "Return the sum as an integer"
    ],
  },
  {
    title: "2.) create_pattern()",
    difficulty: "Medium",
    description: "Implement a function that processes a list of numbers and creates a pattern string. For each number in the list: if divisible by 3, add 'X' to the result string; if divisible by 2, add 'O' to the result string; otherwise, add the number itself as a string.",
    examples: [
      {
        input: { numbers: [7, 12, 9, 14, 6, 3] },
        output: '"7OXO6X"'
      },
      {
        input: { numbers: [1, 2, 3, 4, 5, 6] },
        output: '"1OX4OX"',
      },
      {
        input: { numbers: [3, 6, 9, 12, 15, 18] },
        output: '"XXXXXX"',
      },
    ],
    constraints: [
      "Check divisibility by 3 first, then by 2",
      "Convert non-matching numbers to string before adding to result",
      "Return the final pattern as a string"
    ],
  },
  {
    title: "3.) create_multiplier()",
    difficulty: "Medium",
    description: "Create a function that generates a multiplier lambda function. The function should return a lambda that multiplies its input by a specified factor.",
    examples: [
      {
        input: { factor: 8 },
        output: 'multiplier(6) → 48'
      },
      {
        input: { factor: 10 },
        output: 'multiplier(5) → 50',
      },
      {
        input: { factor: 2 },
        output: 'multiplier(7) → 14',
      },
    ],
    constraints: [
      "Must use a lambda function for the multiplier",
      "The lambda should take exactly one parameter (the number to multiply)",
      "The lambda should capture the factor from the outer function"
    ],
  },
];

// Task Set 2 based on even-numbered quiz questions (2, 4, 6)
export const textAnalyzerTasks2: TaskSidebarProps[] = [
  {
    title: "1.) filter_high_scores()",
    difficulty: "Easy",
    description: "Implement a function that filters a dictionary of scores to create a new dictionary containing only scores above or equal to a threshold. Loop through the input dictionary and add qualifying entries to the result dictionary.",
    examples: [
      {
        input: { scores: {'Alice': 92, 'Bob': 75, 'Charlie': 85, 'David': 70}, threshold: 80 },
        output: "{'Alice': 92, 'Charlie': 85}"
      },
      {
        input: { scores: {'Eva': 95, 'Frank': 68, 'Grace': 79, 'Henry': 88}, threshold: 85 },
        output: "{'Eva': 95, 'Henry': 88}",
      },
      {
        input: { scores: {'Ian': 75, 'Jane': 82, 'Kate': 90}, threshold: 70 },
        output: "{'Ian': 75, 'Jane': 82, 'Kate': 90}",
      },
    ],
    constraints: [
      "Create a new dictionary rather than modifying the input",
      "Use dictionary comprehension or a for loop to filter entries",
      "The threshold is inclusive (scores >= threshold should be included)"
    ],
  },
  {
    title: "2.) slice_string()",
    difficulty: "Easy",
    description: "Implement a function that extracts a substring using Python's slicing notation. The function should take a string and three slice parameters and return the sliced result.",
    examples: [
      {
        input: { text: "Python Programming", start: 2, end: -2, step: 2 },
        output: '"to rgamn"'
      },
      {
        input: { text: "Hello World", start: 0, end: 5, step: 1 },
        output: '"Hello"',
      },
      {
        input: { text: "abcdefghijk", start: 1, end: 9, step: 3 },
        output: '"bdg"',
      },
    ],
    constraints: [
      "Use Python's slice notation [start:end:step]",
      "Negative indices should count from the end of the string",
      "Step value determines which characters to include in the slice"
    ],
  },
  {
    title: "3.) flatten_matrix()",
    difficulty: "Medium",
    description: "Implement a function that flattens a 2D matrix (list of lists) into a single 1D list. Use list comprehension to concatenate all sub-lists into one flat list.",
    examples: [
      {
        input: { matrix: [[1, 2, 3], [4, 5, 6], [7, 8, 9]] },
        output: '[1, 2, 3, 4, 5, 6, 7, 8, 9]'
      },
      {
        input: { matrix: [[10, 20], [30, 40], [50, 60]] },
        output: '[10, 20, 30, 40, 50, 60]',
      },
      {
        input: { matrix: [[1, 2], [3]] },
        output: '[1, 2, 3]',
      },
    ],
    constraints: [
      "Use list comprehension rather than nested loops",
      "The order of elements should be preserved (row by row)",
      "Handle matrices with different row lengths"
    ],
  },
];

export const conceptIcons: Record<string, { icon: LucideIcon; className: string }> = {
  "Dictionary Operations": {
    icon: Hash,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  },
  "String Manipulation": {
    icon: FileText,
    className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  },
  "Array Manipulation": {
    icon: Database,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  "List Operations": {
    icon: Database,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
  },
  "Lambda Functions": {
    icon: Code,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  "Function Creation": {
    icon: Code,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  },
  "Property Decorators": {
    icon: Code,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  },
  "Dictionary Creation": {
    icon: Hash,
    className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
  },
};

export const methodConcepts = {
  0: ["Dictionary Operations", "String Manipulation"],
  1: ["Array Manipulation", "List Operations"],
  2: ["Lambda Functions", "Function Creation"],
  3: ["Property Decorators", "Dictionary Creation"]
};

export const textAnalyzerInfo = `
=== TEXTANALYZER CLASS REQUIREMENTS ===

The TextAnalyzer class should implement the following methods:

1. count_words(text):
  - Counts how many times each word appears in a text string
  - Returns a dictionary where each key is a unique word and the value is the count
  - Words are case-sensitive (e.g., 'Hello' and 'hello' are different words)
  - Should handle empty strings
  - Should split text by whitespace
  - Examples:
    * count_words("hello world hello") → {"hello": 2, "world": 1}
    * count_words("one two two three three three") → {"one": 1, "two": 2, "three": 3}
    * count_words("") → {}

2. format_text(words):
  - Modifies a list of words by adding special markers
  - Inserts "START" at the beginning of the list and "END" at index position 3
  - Returns the new modified list without changing the original list
  - Examples:
    * format_text(["this", "is", "a", "test"]) → ["START", "this", "is", "END", "a", "test"]
    * format_text(["hello", "world"]) → ["START", "hello", "world", "END"]
    * format_text([]) → ["START", "END"]
  - Constraints:
    * Do not modify the original list, return a new list
    * Handle cases where the list has fewer than 3 elements
    * Always insert "START" at index 0 and "END" at index 3

3. create_word_filter(min_length):
  - Generates a custom word filter function
  - Returns a lambda function that takes a word as input
  - The returned function returns True if word length > min_length, otherwise False
  - Examples:
    * create_word_filter(4)("hello") → True
    * create_word_filter(4)("hi") → False
    * create_word_filter(0)("a") → True
    * create_word_filter(10)("python") → False
  - Constraints:
    * Must use a lambda function, not a regular function definition
    * The returned function must take exactly one parameter (the word)
    * The returned function must return a boolean value (True/False)

4. word_stats (property):
  - Analyzes the text stored in self.text and returns statistics as a dictionary
  - The dictionary should contain:
    * 'total_words': the total number of words
    * 'avg_length': the average word length rounded to 2 decimal places
  - Examples:
    * word_stats with "hello world python" → {'total_words': 3, 'avg_length': 5.33}
    * word_stats with "a b c d" → {'total_words': 4, 'avg_length': 1.0}
    * word_stats with "" → {'total_words': 0, 'avg_length': 0.0}
  - Constraints:
    * Must be implemented as a property using the @property decorator
    * Average length should be rounded to 2 decimal places
    * Handle empty text appropriately (shouldn't cause division by zero)
    * Use self.text as the source text to analyze
`;