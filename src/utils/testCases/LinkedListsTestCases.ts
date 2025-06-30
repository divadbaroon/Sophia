export interface TestCase {
  methodId: string;
  testCode: string;
}

export const linkedListTestCases: Record<string, string> = {
  printList: `
    // Test Case 1: 5 -> 10 -> 20 -> 30 -> null
    Link list1 = new Link(5);
    list1.next = new Link(10);
    list1.next.next = new Link(20);
    list1.next.next.next = new Link(30);
    
    // Test Case 2: 42 -> null
    Link list2 = new Link(42);
    
    // Test Case 3: null (empty list)
    Link list3 = null;
    
    System.out.println("Running test cases for printList function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1
    System.out.println("Test 1: Example 1: 5 -> 10 -> 20 -> 30 -> null");
    System.out.print("Expected: '5 10 20 30', Got: '");
    
    // Capture output to validate
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    printList(list1);
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("5 10 20 30")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2
    System.out.println("Test 2: Example 2: 42 -> null");
    System.out.print("Expected: '42', Got: '");
    
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    printList(list2);
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("42")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3
    System.out.println("Test 3: Example 3: null (empty list)");
    System.out.print("Expected: '', Got: '");
    
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    printList(list3);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("")) {
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

  traverseList: `
    // Test Case 1: 5 -> 10 -> 20 -> 30 -> null
    Link list1 = new Link(5);
    list1.next = new Link(10);
    list1.next.next = new Link(20);
    list1.next.next.next = new Link(30);
    
    // Test Case 2: 42 -> null
    Link list2 = new Link(42);
    
    // Test Case 3: null (empty list)
    Link list3 = null;
    
    System.out.println("Running test cases for traverseList function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1
    System.out.println("Test 1: Example 1: 5 -> 10 -> 20 -> 30 -> null");
    System.out.print("Expected: '5 10 20 30', Got: '");
    
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    LinkedListTraversal.traverseList(list1);
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("5 10 20 30")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2
    System.out.println("Test 2: Example 2: 42 -> null");
    System.out.print("Expected: '42', Got: '");
    
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    LinkedListTraversal.traverseList(list2);
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("42")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3
    System.out.println("Test 3: Example 3: null (empty list)");
    System.out.print("Expected: '', Got: '");
    
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    LinkedListTraversal.traverseList(list3);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("")) {
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

  insertAtBeginning: `
    System.out.println("Running test cases for insertAtBeginning function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Insert 5 at beginning of 10 -> 20 -> 30 -> null
    Link list1 = new Link(10);
    list1.next = new Link(20);
    list1.next.next = new Link(30);
    
    System.out.println("Test 1: new_value = 5, initial_list = '10 20 30'");
    System.out.print("Expected: '5 10 20 30', Got: '");
    Link result1 = LinkedListInsertion.insertAtBeginning(list1, 5);
    
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    printHelper(result1);
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("5 10 20 30")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Insert 7 at beginning of empty list
    Link list2 = null;
    
    System.out.println("Test 2: new_value = 7, initial_list = 'null (empty)'");
    System.out.print("Expected: '7', Got: '");
    Link result2 = LinkedListInsertion.insertAtBeginning(list2, 7);
    
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    printHelper(result2);
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("7")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Insert 0 at beginning of 1 -> null
    Link list3 = new Link(1);
    
    System.out.println("Test 3: new_value = 0, initial_list = '1'");
    System.out.print("Expected: '0 1', Got: '");
    Link result3 = LinkedListInsertion.insertAtBeginning(list3, 0);
    
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    printHelper(result3);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("0 1")) {
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

  removeFirst: `
    System.out.println("Running test cases for removeFirst function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Remove first from 5 -> 10 -> 20 -> 30 -> null
    Link list1 = new Link(5);
    list1.next = new Link(10);
    list1.next.next = new Link(20);
    list1.next.next.next = new Link(30);
    
    System.out.println("Test 1: list = '5 10 20 30'");
    System.out.print("Expected: '10 20 30', Got: '");
    Link result1 = LinkedListRemoval.removeFirst(list1);
    
    String output1 = "";
    if (result1 == null) {
        output1 = "";
    } else {
        java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
        java.io.PrintStream old1 = System.out;
        System.setOut(ps1);
        printHelper(result1);
        System.out.flush();
        System.setOut(old1);
        output1 = baos1.toString().trim();
    }
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("10 20 30")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Remove first from 42 -> null
    Link list2 = new Link(42);
    
    System.out.println("Test 2: list = '42'");
    System.out.print("Expected: '(empty)', Got: '");
    Link result2 = LinkedListRemoval.removeFirst(list2);
    
    String output2 = "";
    if (result2 == null) {
        output2 = "(empty)";
    } else {
        java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
        java.io.PrintStream old2 = System.out;
        System.setOut(ps2);
        printHelper(result2);
        System.out.flush();
        System.setOut(old2);
        output2 = baos2.toString().trim();
    }
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("(empty)")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Remove first from empty list
    Link list3 = null;
    
    System.out.println("Test 3: list = 'null (empty)'");
    System.out.print("Expected: '(empty)', Got: '");
    Link result3 = LinkedListRemoval.removeFirst(list3);
    
    String output3 = "";
    if (result3 == null) {
        output3 = "(empty)";
    } else {
        java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
        java.io.PrintStream old3 = System.out;
        System.setOut(ps3);
        printHelper(result3);
        System.out.flush();
        System.setOut(old3);
        output3 = baos3.toString().trim();
    }
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("(empty)")) {
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

// Define which methods need the Link class definition
export const supportedLinkedListMethods = ["printList", "traverseList", "insertAtBeginning", "removeFirst"];

// Link class definition to inject
export const linkClassDefinition = `
class Link {
    int element;
    Link next;
    
    public Link() {}
    
    public Link(int element) {
        this.element = element;
        this.next = null;
    }
    
    public Link(int element, Link next) {
        this.element = element;
        this.next = next;
    }
}
`;