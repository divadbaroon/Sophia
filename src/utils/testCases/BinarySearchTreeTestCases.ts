// src/utils/testCases/BinarySearchTreeTestCases.ts

export interface TestCase {
  methodId: string;
  testCode: string;
}

export const binarySearchTreeTestCases: Record<string, string> = {
  findMinMax: `
    System.out.println("Running test cases for findMinMax function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Tree with multiple nodes - root 23, left 14, right 31, left-left 7, left-left-right 9
    TreeNode root1 = new TreeNode(23);
    root1.left = new TreeNode(14);
    root1.right = new TreeNode(31);
    root1.left.left = new TreeNode(7);
    root1.left.left.right = new TreeNode(9);
    
    System.out.println("Test 1: Tree with root 23, left 14, right 31, left-left 7, left-left-right 9");
    System.out.print("Expected: 'findMin: 7, findMax: 31', Got: '");
    
    TreeNode min1 = BinarySearchTree.findMin(root1);
    TreeNode max1 = BinarySearchTree.findMax(root1);
    String result1 = "findMin: " + (min1 != null ? min1.val : "null") + 
                    ", findMax: " + (max1 != null ? max1.val : "null");
    
    System.out.print(result1);
    System.out.println("'");
    
    if (result1.equals("findMin: 7, findMax: 31")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Single node with value 42
    TreeNode root2 = new TreeNode(42);
    
    System.out.println("Test 2: Single node with value 42");
    System.out.print("Expected: 'findMin: 42, findMax: 42', Got: '");
    
    TreeNode min2 = BinarySearchTree.findMin(root2);
    TreeNode max2 = BinarySearchTree.findMax(root2);
    String result2 = "findMin: " + (min2 != null ? min2.val : "null") + 
                    ", findMax: " + (max2 != null ? max2.val : "null");
    
    System.out.print(result2);
    System.out.println("'");
    
    if (result2.equals("findMin: 42, findMax: 42")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Empty tree (null)
    TreeNode root3 = null;
    
    System.out.println("Test 3: Empty tree (null)");
    System.out.print("Expected: 'findMin: null, findMax: null', Got: '");
    
    TreeNode min3 = BinarySearchTree.findMin(root3);
    TreeNode max3 = BinarySearchTree.findMax(root3);
    String result3 = "findMin: " + (min3 != null ? min3.val : "null") + 
                    ", findMax: " + (max3 != null ? max3.val : "null");
    
    System.out.print(result3);
    System.out.println("'");
    
    if (result3.equals("findMin: null, findMax: null")) {
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

  inOrderTraversal: `
    System.out.println("Running test cases for inOrderTraversal function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Tree with multiple nodes - root 23, left 14, right 31, left-left 7, left-left-right 9
    TreeNode root1 = new TreeNode(23);
    root1.left = new TreeNode(14);
    root1.right = new TreeNode(31);
    root1.left.left = new TreeNode(7);
    root1.left.left.right = new TreeNode(9);
    
    System.out.println("Test 1: Tree with root 23, left 14, right 31, left-left 7, left-left-right 9");
    System.out.print("Expected: '7 9 14 23 31', Got: '");
    
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    BinarySearchTreeTraversal.inOrderTraversal(root1);
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("7 9 14 23 31")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Right-skewed tree: 1→2→3
    TreeNode root2 = new TreeNode(1);
    root2.right = new TreeNode(2);
    root2.right.right = new TreeNode(3);
    
    System.out.println("Test 2: Right-skewed tree: 1→2→3");
    System.out.print("Expected: '1 2 3', Got: '");
    
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    BinarySearchTreeTraversal.inOrderTraversal(root2);
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
    
    // Test 3: Single node with value 5
    TreeNode root3 = new TreeNode(5);
    
    System.out.println("Test 3: Single node with value 5");
    System.out.print("Expected: '5', Got: '");
    
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    BinarySearchTreeTraversal.inOrderTraversal(root3);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("5")) {
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

  insertNode: `
    System.out.println("Running test cases for insertNode function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Insert into existing tree
    TreeNode root1 = new TreeNode(23);
    root1.left = new TreeNode(14);
    root1.right = new TreeNode(31);
    root1.left.left = new TreeNode(7);
    
    System.out.println("Test 1: Insert 16 into existing tree (7, 14, 23, 31)");
    System.out.print("Expected: '7 14 16 23 31', Got: '");
    
    TreeNode result1 = BinarySearchTreeInsertion.insertNode(root1, 16);
    
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    printInOrderHelper(result1);
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print(output1);
    System.out.println("'");
    
    if (output1.equals("7 14 16 23 31")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Insert into single node tree
    TreeNode root2 = new TreeNode(10);
    
    System.out.println("Test 2: Insert 5 into single node tree (10)");
    System.out.print("Expected: '5 10', Got: '");
    
    TreeNode result2 = BinarySearchTreeInsertion.insertNode(root2, 5);
    
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    printInOrderHelper(result2);
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print(output2);
    System.out.println("'");
    
    if (output2.equals("5 10")) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Insert into empty tree
    TreeNode root3 = null;
    
    System.out.println("Test 3: Insert 42 into empty tree");
    System.out.print("Expected: '42', Got: '");
    
    TreeNode result3 = BinarySearchTreeInsertion.insertNode(root3, 42);
    
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    printInOrderHelper(result3);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print(output3);
    System.out.println("'");
    
    if (output3.equals("42")) {
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

// Define which methods need the TreeNode class definition
export const supportedBinarySearchTreeMethods = ["findMinMax", "inOrderTraversal", "insertNode"];

// TreeNode class definition to inject
export const treeNodeClassDefinition = `
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    
    public TreeNode() {}
    
    public TreeNode(int val) {
        this.val = val;
        this.left = null;
        this.right = null;
    }
    
    public TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
`;