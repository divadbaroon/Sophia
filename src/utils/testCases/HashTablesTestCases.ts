
export const hashTableTestCases: Record<string, string> = {
  stringFoldHash: `
    System.out.println("Running test cases for stringFoldHash function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: "aaaabbbb" with table size 101
    System.out.println("Test 1: string = 'aaaabbbb', tableSize = 101");
    System.out.print("Expected: 75, Got: ");
    
    int result1 = StringHasher.sfold("aaaabbbb", 101);
    System.out.println(result1);
    
    if (result1 == 75) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: "test" with table size 101 - CORRECTED EXPECTED VALUE
    System.out.println("Test 2: string = 'test', tableSize = 101");
    System.out.print("Expected: 9, Got: ");
    
    int result2 = StringHasher.sfold("test", 101);
    System.out.println(result2);
    
    if (result2 == 9) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: "verylongstringfortesting" with table size 101 - CORRECTED EXPECTED VALUE
    System.out.println("Test 3: string = 'verylongstringfortesting', tableSize = 101");
    System.out.print("Expected: 12, Got: ");
    
    int result3 = StringHasher.sfold("verylongstringfortesting", 101);
    System.out.println(result3);
    
    if (result3 == 12) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your string folding hash function works correctly.");
    } else {
        System.out.println("Some tests failed. Check your implementation of the folding algorithm.");
    }`,

  linearProbing: `
    System.out.println("Running test cases for linearProbing function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Insert 15, 25, 35, delete 25, search 35
    System.out.println("Test 1: Insert [15, 25, 35], Delete 25, Search 35");
    LinearProbingHash hash1 = new LinearProbingHash(10);
    
    hash1.insert(15);
    hash1.insert(25);
    hash1.insert(35);
    
    // Verify initial insertions work correctly
    int pos15_before = hash1.search(15);
    int pos25_before = hash1.search(25);
    int pos35_before = hash1.search(35);
    
    System.out.println("After insertions:");
    System.out.println("Position of 15: " + pos15_before);
    System.out.println("Position of 25: " + pos25_before);
    System.out.println("Position of 35: " + pos35_before);
    
    // Delete 25
    hash1.delete(25);
    
    // Verify deletion and search behavior
    int pos15_after = hash1.search(15);
    int pos25_after = hash1.search(25);  // Should be -1 (not found)
    int pos35_after = hash1.search(35);  // Should still be found
    
    System.out.println("After deleting 25:");
    System.out.println("Position of 15: " + pos15_after);
    System.out.println("Position of 25: " + pos25_after + " (should be -1)");
    System.out.println("Position of 35: " + pos35_after);
    
    // Test passes if:
    // - 15 hashes to index 5 (15 % 10 = 5)
    // - 25 hashes to index 5 but goes to 6 due to collision
    // - 35 hashes to index 5 but goes to 7 due to collisions
    // - After deletion, 25 is not found (-1)
    // - 15 and 35 are still found at their original positions
    if (pos15_before == 5 && pos25_before == 6 && pos35_before == 7 && 
        pos15_after == 5 && pos25_after == -1 && pos35_after == 7) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED - Check your linear probing and tombstone implementation");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Collision resolution with keys 5, 15, 25
    System.out.println("Test 2: Insert [5, 15, 25] (all hash to index 5)");
    LinearProbingHash hash2 = new LinearProbingHash(10);
    
    hash2.insert(5);
    hash2.insert(15);
    hash2.insert(25);
    
    int search5 = hash2.search(5);
    int search15 = hash2.search(15);
    int search25 = hash2.search(25);
    
    System.out.println("Position of 5: " + search5);
    System.out.println("Position of 15: " + search15);
    System.out.println("Position of 25: " + search25);
    
    // All keys hash to 5, so linear probing should place them at 5, 6, 7
    if (search5 == 5 && search15 == 6 && search25 == 7) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED - Linear probing should place colliding keys in consecutive slots");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Tombstone allows reuse of deleted slot
    System.out.println("Test 3: Insert 10, Delete 10, Insert 20 at same slot");
    LinearProbingHash hash3 = new LinearProbingHash(10);
    
    hash3.insert(10);
    int pos10_before = hash3.search(10);
    System.out.println("Original position of 10: " + pos10_before);
    
    hash3.delete(10);
    int pos10_after_delete = hash3.search(10);
    System.out.println("Position of 10 after deletion: " + pos10_after_delete + " (should be -1)");
    
    hash3.insert(20);  // Should reuse the tombstone slot
    int pos20 = hash3.search(20);
    System.out.println("Position of 20 after insertion: " + pos20);
    
    // Both 10 and 20 hash to index 0 (10 % 10 = 0, 20 % 10 = 0)
    // After deletion, 20 should be able to use the tombstone slot at index 0
    if (pos10_before == 0 && pos10_after_delete == -1 && pos20 == 0) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED - Tombstone should allow reuse of deleted slots");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your linear probing implementation works correctly.");
    } else {
        System.out.println("Some tests failed. Review your collision resolution and tombstone handling.");
    }`,

  quadraticProbing: `
    System.out.println("Running test cases for quadraticProbing function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Insert keys that all hash to same index
    System.out.println("Test 1: Insert [11, 22, 33] into table size 11 (all hash to index 0)");
    QuadraticProbing hash1 = new QuadraticProbing(11);
    
    hash1.insert(11);
    hash1.insert(22);
    hash1.insert(33);
    
    int pos11 = hash1.search(11);
    int pos22 = hash1.search(22);
    int pos33 = hash1.search(33);
    
    System.out.println("Position of 11: " + pos11);
    System.out.println("Position of 22: " + pos22);
    System.out.println("Position of 33: " + pos33);
    
    // Quadratic probing: 11 at index 0, 22 at index (0+1²)%11=1, 33 at index (0+2²)%11=4
    if (pos11 == 0 && pos22 == 1 && pos33 == 4) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED - Check quadratic probing formula: (hash + i²) % size");
        System.out.println("Expected: 11→index 0, 22→index 1, 33→index 4");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Search functionality
    System.out.println("Test 2: Search for existing and non-existing keys");
    QuadraticProbing hash2 = new QuadraticProbing(13);
    
    hash2.insert(13);
    hash2.insert(26);
    hash2.insert(39);
    
    int search26 = hash2.search(26);
    int search99 = hash2.search(99);
    
    System.out.println("Search for 26: " + (search26 != -1 ? "Found at index " + search26 : "Not found"));
    System.out.println("Search for 99: " + (search99 != -1 ? "Found at index " + search99 : "Not found"));
    
    // 26 should be found (at index 1: (0+1²)%13=1), 99 should not be found
    if (search26 == 1 && search99 == -1) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED - Check search implementation with quadratic probing");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: No collision case
    System.out.println("Test 3: Insert key with no collision");
    QuadraticProbing hash3 = new QuadraticProbing(10);
    
    hash3.insert(7);
    int pos7 = hash3.search(7);
    
    System.out.println("Position of 7: " + pos7);
    
    // 7 % 10 = 7, no collision, should be at index 7
    if (pos7 == 7) {
        System.out.println("PASSED");
        passedCount++;
    } else {
        System.out.println("FAILED - Single key should be placed at its hash value");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your quadratic probing implementation works correctly.");
    } else {
        System.out.println("Some tests failed. Review your quadratic probing implementation.");
    }`
};

export const supportedHashTableMethods = ["stringFoldHash", "linearProbing", "quadraticProbing"];