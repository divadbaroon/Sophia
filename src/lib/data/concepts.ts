import { Variable, ActivityIcon as Function, RotateCcw, GitBranch, Database, Box } from "lucide-react"

export const programmingConcepts = [
  {
    id: "variables",
    title: "Variables & Data Types",
    description: "Learn how to store and manipulate different types of data in your programs.",
    icon: Variable,
    difficulty: "Beginner",
    xpReward: 100,
    estimatedTime: "10 min",
    quiz: {
      title: "Variables & Data Types",
      questions: [
        {
          question: "Which of the following is the correct way to declare a variable in JavaScript?",
          options: ["variable name = 'John';", "let name = 'John';", "declare name = 'John';", "var name := 'John';"],
          correctAnswer: 1,
          explanation:
            "In JavaScript, 'let' is the modern way to declare variables. 'var' also works but 'let' has better scoping rules.",
        },
        {
          question: "What data type would you use to store the value 'true' or 'false'?",
          options: ["String", "Number", "Boolean", "Array"],
          correctAnswer: 2,
          explanation:
            "Boolean data type is specifically designed to store true/false values, making it perfect for logical operations.",
        },
        {
          question: "Which of these is NOT a valid data type in most programming languages?",
          options: ["String", "Integer", "Boolean", "Color"],
          correctAnswer: 3,
          explanation:
            "While Color might be a custom type in some frameworks, String, Integer, and Boolean are fundamental data types in most programming languages.",
        },
      ],
    },
  },
  {
    id: "conditionals",
    title: "Conditionals",
    description: "Learn how to make your programs make decisions based on different conditions.",
    icon: GitBranch,
    difficulty: "Beginner",
    xpReward: 120,
    estimatedTime: "12 min",
    quiz: {
      title: "Conditionals",
      questions: [
        {
          question:
            "What will this code output? \n\nlet age = 16;\nif (age >= 18) {\n  console.log('Adult');\n} else {\n  console.log('Minor');\n}",
          options: ["Adult", "Minor", "16", "Error"],
          correctAnswer: 1,
          explanation:
            "Since 16 is less than 18, the condition (age >= 18) is false, so the else block executes, printing 'Minor'.",
        },
        {
          question: "Which operator is used to check if two values are equal in most programming languages?",
          options: ["=", "==", "!=", "==="],
          correctAnswer: 1,
          explanation:
            "The == operator checks for equality. A single = is for assignment, != is for not equal, and === checks for strict equality (value and type).",
        },
        {
          question: "What is the purpose of an 'else if' statement?",
          options: [
            "To end an if statement",
            "To check multiple conditions in sequence",
            "To repeat code multiple times",
            "To declare a variable",
          ],
          correctAnswer: 1,
          explanation:
            "'else if' allows you to check multiple conditions in order. If the first condition is false, it checks the next one, and so on.",
        },
      ],
    },
  },
  {
    id: "loops",
    title: "Loops",
    description: "Master the art of repeating code efficiently with different loop structures.",
    icon: RotateCcw,
    difficulty: "Intermediate",
    xpReward: 150,
    estimatedTime: "15 min",
    quiz: {
      title: "Loops",
      questions: [
        {
          question: "How many times will this loop run? \n\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}",
          options: ["4 times", "5 times", "6 times", "Infinite times"],
          correctAnswer: 1,
          explanation:
            "The loop starts at i=0 and continues while i<5, incrementing i each time. It runs for i=0,1,2,3,4 - that's 5 times total.",
        },
        {
          question: "What type of loop should you use when you don't know exactly how many times you need to repeat?",
          options: ["for loop", "while loop", "do-while loop", "Both while and do-while loops"],
          correctAnswer: 3,
          explanation:
            "Both while and do-while loops are condition-based, making them perfect when the number of iterations depends on a changing condition rather than a fixed count.",
        },
        {
          question: "What is the main risk when writing loops?",
          options: ["Using too much memory", "Creating infinite loops", "Slow execution", "Syntax errors"],
          correctAnswer: 1,
          explanation:
            "Infinite loops occur when the loop condition never becomes false, causing the program to run forever and potentially crash or freeze.",
        },
      ],
    },
  },
  {
    id: "functions",
    title: "Functions",
    description: "Discover how to create reusable blocks of code that perform specific tasks.",
    icon: Function,
    difficulty: "Intermediate",
    xpReward: 140,
    estimatedTime: "18 min",
    quiz: {
      title: "Functions",
      questions: [
        {
          question: "What is the main benefit of using functions in programming?",
          options: [
            "They make code run faster",
            "They reduce memory usage",
            "They make code reusable and organized",
            "They prevent errors",
          ],
          correctAnswer: 2,
          explanation:
            "Functions allow you to write code once and use it multiple times, making your programs more organized, maintainable, and reducing duplication.",
        },
        {
          question: "What will this function return? \n\nfunction add(a, b) {\n  return a + b;\n}\nadd(3, 5);",
          options: ["3", "5", "8", "undefined"],
          correctAnswer: 2,
          explanation: "The function takes two parameters (3 and 5) and returns their sum: 3 + 5 = 8.",
        },
        {
          question: "What are the inputs to a function called?",
          options: ["Arguments", "Parameters", "Variables", "Both arguments and parameters"],
          correctAnswer: 3,
          explanation:
            "Parameters are the variables defined in the function declaration, while arguments are the actual values passed when calling the function. Both terms are commonly used.",
        },
      ],
    },
  },
  {
    id: "arrays",
    title: "Arrays & Objects",
    description: "Understand how to organize and structure data using arrays and objects.",
    icon: Database,
    difficulty: "Intermediate",
    xpReward: 160,
    estimatedTime: "20 min",
    quiz: {
      title: "Arrays & Objects",
      questions: [
        {
          question: "How do you access the first element of an array called 'fruits'?",
          options: ["fruits[1]", "fruits[0]", "fruits.first()", "fruits.get(0)"],
          correctAnswer: 1,
          explanation:
            "Arrays use zero-based indexing, meaning the first element is at index 0. So fruits[0] gives you the first element.",
        },
        {
          question: "How do you access the 'name' property of an object called 'student'?",
          options: ["student->name", "student.name", "student[name]", "student::name"],
          correctAnswer: 1,
          explanation:
            "In JavaScript and many other languages, you use dot notation (student.name) to access object properties.",
        },
        {
          question: "What is the main difference between arrays and objects?",
          options: [
            "Arrays store numbers, objects store text",
            "Arrays use numbered indices, objects use named keys",
            "Arrays are faster than objects",
            "Objects can't store multiple values",
          ],
          correctAnswer: 1,
          explanation:
            "Arrays use numerical indices (0, 1, 2...) to access elements, while objects use named keys (like 'name', 'age') to access properties.",
        },
      ],
    },
  },
  {
    id: "classes",
    title: "Classes & Objects",
    description: "Explore object-oriented programming and how to create your own data types.",
    icon: Box,
    difficulty: "Advanced",
    xpReward: 200,
    estimatedTime: "25 min",
    quiz: {
      title: "Classes & Objects",
      questions: [
        {
          question: "What is a class in object-oriented programming?",
          options: [
            "A specific instance of an object",
            "A blueprint or template for creating objects",
            "A type of variable",
            "A programming language",
          ],
          correctAnswer: 1,
          explanation:
            "A class is like a blueprint that defines the structure and behavior that objects created from it will have. It's the template, not the actual object.",
        },
        {
          question: "What is the special method called that runs when you create a new object from a class?",
          options: ["init()", "create()", "constructor()", "new()"],
          correctAnswer: 2,
          explanation:
            "The constructor is a special method that automatically runs when a new object is created from a class, typically used to set up initial values.",
        },
        {
          question: "If you have a class called 'Car', what would you call a specific car created from that class?",
          options: ["A method", "A property", "An instance or object", "A function"],
          correctAnswer: 2,
          explanation:
            "When you create a specific car from the Car class (like 'myCar'), that specific car is called an instance or object of the class.",
        },
      ],
    },
  },
]
