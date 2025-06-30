
export interface TestCase {
  methodId: string;
  testCode: string;
}

export const sortingTestCases: Record<string, string> = {
  bubbleSort: `
    System.out.println("Running test cases for bubbleSort function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Basic unsorted array [5,1,4,2]
    int[] array1 = {5, 1, 4, 2};
    System.out.println("Test 1: Sort array [5,1,4,2]");
    System.out.print("Expected: '1 2 4 5', Got: '");
    
    // Sort the array
    SortingAlgorithms.bubbleSort(array1);
    
    // Capture output
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    printArrayHelper(array1);
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("1 2 4 5")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Array with duplicates [3,3,3]
    int[] array2 = {3, 3, 3};
    System.out.println("Test 2: Sort array [3,3,3] (all duplicates)");
    System.out.print("Expected: '3 3 3', Got: '");
    
    // Sort the array
    SortingAlgorithms.bubbleSort(array2);
    
    // Capture output
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    printArrayHelper(array2);
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("3 3 3")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Single element array [1]
    int[] array3 = {1};
    System.out.println("Test 3: Sort array [1] (single element)");
    System.out.print("Expected: '1', Got: '");
    
    // Sort the array
    SortingAlgorithms.bubbleSort(array3);
    
    // Capture output
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    printArrayHelper(array3);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("1")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your solution works correctly.");
    } else {
        System.out.println("Some tests failed. Review your solution and try again.");
    }`,

  selectionSort: `
    System.out.println("Running test cases for selectionSort function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Basic unsorted array [5,1,4,2]
    int[] array1 = {5, 1, 4, 2};
    System.out.println("Test 1: Sort array [5,1,4,2] with swap tracking");
    System.out.print("Expected: 'Swapped 5 with 1\\nSwapped 5 with 2\\nSorted array: 1 2 4 5', Got: '");
    
    // Capture all output (swaps + final array)
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    
    // Sort the array (this will print swaps)
    SortingAlgorithms.selectionSort(array1);
    
    // Print final result
    System.out.print("Sorted array: ");
    printArrayHelper(array1);
    
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("Swapped 5 with 1\\nSwapped 5 with 2\\nSorted array: 1 2 4 5")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Array [2,1,3]
    int[] array2 = {2, 1, 3};
    System.out.println("Test 2: Sort array [2,1,3] with swap tracking");
    System.out.print("Expected: 'Swapped 2 with 1\\nSorted array: 1 2 3', Got: '");
    
    // Capture all output (swaps + final array)
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    
    // Sort the array (this will print swaps)
    SortingAlgorithms.selectionSort(array2);
    
    // Print final result
    System.out.print("Sorted array: ");
    printArrayHelper(array2);
    
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("Swapped 2 with 1\\nSorted array: 1 2 3")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Already sorted array [1,2,3]
    int[] array3 = {1, 2, 3};
    System.out.println("Test 3: Sort already sorted array [1,2,3] (no swaps needed)");
    System.out.print("Expected: 'Sorted array: 1 2 3', Got: '");
    
    // Capture all output (swaps + final array)
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    
    // Sort the array (this will print swaps)
    SortingAlgorithms.selectionSort(array3);
    
    // Print final result
    System.out.print("Sorted array: ");
    printArrayHelper(array3);
    
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("Sorted array: 1 2 3")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your solution works correctly.");
    } else {
        System.out.println("Some tests failed. Review your solution and try again.");
    }`,

  insertionSort: `
    System.out.println("Running test cases for insertionSort function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Basic unsorted array [5,1,4,2]
    int[] array1 = {5, 1, 4, 2};
    System.out.println("Test 1: Sort array [5,1,4,2]");
    System.out.print("Expected: '1 2 4 5', Got: '");
    
    // Sort the array
    SortingAlgorithms.insertionSort(array1);
    
    // Capture output
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    printArrayHelper(array1);
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("1 2 4 5")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Array [3,1,2]
    int[] array2 = {3, 1, 2};
    System.out.println("Test 2: Sort array [3,1,2]");
    System.out.print("Expected: '1 2 3', Got: '");
    
    // Sort the array
    SortingAlgorithms.insertionSort(array2);
    
    // Capture output
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    printArrayHelper(array2);
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("1 2 3")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Single element array [1]
    int[] array3 = {1};
    System.out.println("Test 3: Sort array [1] (single element)");
    System.out.print("Expected: '1', Got: '");
    
    // Sort the array
    SortingAlgorithms.insertionSort(array3);
    
    // Capture output
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    printArrayHelper(array3);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("1")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your solution works correctly.");
    } else {
        System.out.println("Some tests failed. Review your solution and try again.");
    }`
};

// Define which methods need special handling (none for sorting, just basic arrays)
export const supportedSortingMethods = ["bubbleSort", "selectionSort", "insertionSort"];

