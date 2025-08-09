export const graphAlgorithmTestCases: Record<string, string> = {
  depthFirstSearch: `
    System.out.println("Running test cases for depthFirstSearch function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Check if DFS visits all nodes in a connected graph
    System.out.println("Test 1: 6 vertices - verify all nodes are visited");
    DFSGraphTraversal graph1 = new DFSGraphTraversal(6);
    
    // Add edges exactly as in main method (bidirectional)
    graph1.addEdge(0, 2); graph1.addEdge(0, 4);
    graph1.addEdge(1, 2); graph1.addEdge(1, 5);
    graph1.addEdge(2, 0); graph1.addEdge(2, 1);
    graph1.addEdge(2, 3); graph1.addEdge(2, 5);
    graph1.addEdge(3, 2); graph1.addEdge(3, 5);
    graph1.addEdge(4, 0); graph1.addEdge(4, 5);
    graph1.addEdge(5, 1); graph1.addEdge(5, 2);
    graph1.addEdge(5, 3); graph1.addEdge(5, 4);
    
    // Capture output to check if all vertices are visited
    java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
    java.io.PrintStream old1 = System.out;
    System.setOut(ps1);
    
    try {
        graph1.DFS(0);
    } catch (Exception e) {
        System.setOut(old1);
        System.out.println("FAILED - DFS method not implemented or has errors");
        allPassed = false;
        System.out.println();
        
        // Continue to other tests
        System.out.println("Test 2: Skipped due to previous failure");
        System.out.println("Test 3: Skipped due to previous failure");
        System.out.println();
        System.out.println("Results: 0/3 tests passed");
        System.out.println("Please implement the DFS methods before running tests.");
        return;
    }
    
    System.out.flush();
    System.setOut(old1);
    String output1 = baos1.toString().trim();
    
    System.out.print("DFS output: " + output1);
    if (output1.isEmpty()) {
        System.out.println(" (empty - DFS not implemented)");
    } else {
        System.out.println();
    }
    
    // Check if output contains all vertices 0-5
    boolean hasAllVertices = output1.contains("0") && output1.contains("1") && 
                           output1.contains("2") && output1.contains("3") && 
                           output1.contains("4") && output1.contains("5");
    
    if (hasAllVertices && !output1.isEmpty()) {
        System.out.println("PASSED - All vertices visited");
        passedCount++;
    } else {
        System.out.println("FAILED - Not all vertices visited or DFS not implemented");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Linear path - should visit in sequence
    System.out.println("Test 2: Linear path - should visit 4 vertices");
    DFSGraphTraversal graph2 = new DFSGraphTraversal(4);
    
    graph2.addEdge(0, 1); graph2.addEdge(1, 0);
    graph2.addEdge(1, 2); graph2.addEdge(2, 1);
    graph2.addEdge(2, 3); graph2.addEdge(3, 2);
    
    java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
    java.io.PrintStream old2 = System.out;
    System.setOut(ps2);
    
    graph2.DFS(0);
    System.out.flush();
    System.setOut(old2);
    String output2 = baos2.toString().trim();
    
    System.out.print("DFS output: " + output2);
    if (output2.isEmpty()) {
        System.out.println(" (empty - DFS not implemented)");
    } else {
        System.out.println();
    }
    
    boolean hasAllLinearVertices = output2.contains("0") && output2.contains("1") && 
                                  output2.contains("2") && output2.contains("3");
    
    if (hasAllLinearVertices && !output2.isEmpty()) {
        System.out.println("PASSED - Linear path traversed correctly");
        passedCount++;
    } else {
        System.out.println("FAILED - Linear path not fully traversed");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Star graph - center should reach all
    System.out.println("Test 3: Star graph - center should reach all leaves");
    DFSGraphTraversal graph3 = new DFSGraphTraversal(5);
    
    graph3.addEdge(0, 1); graph3.addEdge(1, 0);
    graph3.addEdge(0, 2); graph3.addEdge(2, 0);
    graph3.addEdge(0, 3); graph3.addEdge(3, 0);
    graph3.addEdge(0, 4); graph3.addEdge(4, 0);
    
    java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
    java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
    java.io.PrintStream old3 = System.out;
    System.setOut(ps3);
    
    graph3.DFS(0);
    System.out.flush();
    System.setOut(old3);
    String output3 = baos3.toString().trim();
    
    System.out.print("DFS output: " + output3);
    if (output3.isEmpty()) {
        System.out.println(" (empty - DFS not implemented)");
    } else {
        System.out.println();
    }
    
    boolean hasAllStarVertices = output3.contains("0") && output3.contains("1") && 
                               output3.contains("2") && output3.contains("3") && 
                               output3.contains("4");
    
    if (hasAllStarVertices && !output3.isEmpty()) {
        System.out.println("PASSED - Star graph traversed correctly");
        passedCount++;
    } else {
        System.out.println("FAILED - Star graph not fully traversed");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your DFS implementation works correctly.");
    } else {
        System.out.println("Some tests failed. Please implement the DFS methods properly.");
    }`,

  dijkstraShortestPath: `
    System.out.println("Running test cases for dijkstraShortestPath function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: Complex weighted graph with 7 vertices
    System.out.println("Test 1: 7-vertex weighted graph");
    Dijkstra dijkstra1 = new Dijkstra(7);
    
    // Add weighted edges
    dijkstra1.addEdge(0, 3, 4);  // A-D: 4
    dijkstra1.addEdge(0, 6, 7);  // A-G: 7
    dijkstra1.addEdge(0, 2, 8);  // A-C: 8
    dijkstra1.addEdge(1, 3, 9);  // B-D: 9
    dijkstra1.addEdge(1, 4, 6);  // B-E: 6
    dijkstra1.addEdge(1, 5, 9);  // B-F: 9
    dijkstra1.addEdge(2, 4, 4);  // C-E: 4
    dijkstra1.addEdge(2, 5, 9);  // C-F: 9
    dijkstra1.addEdge(3, 5, 9);  // D-F: 9
    dijkstra1.addEdge(3, 6, 9);  // D-G: 9
    dijkstra1.addEdge(5, 6, 7);  // F-G: 7
    
    try {
        dijkstra1.runDijkstra(0);
        
        // Capture printDistances output
        java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
        java.io.PrintStream old1 = System.out;
        System.setOut(ps1);
        
        dijkstra1.printDistances();
        System.out.flush();
        System.setOut(old1);
        String output1 = baos1.toString();
        
        System.out.println("Dijkstra output:");
        System.out.print(output1);
        
        // Check for expected distances in output
        boolean test1Passed = output1.contains("vertex 0 to 0 is: 0") &&
                             output1.contains("vertex 0 to 3 is: 4") &&
                             output1.contains("vertex 0 to 6 is: 7") &&
                             output1.contains("vertex 0 to 2 is: 8") &&
                             output1.contains("vertex 0 to 1 is: 13") &&
                             output1.contains("vertex 0 to 4 is: 12") &&
                             output1.contains("vertex 0 to 5 is: 13");
        
        if (test1Passed) {
            System.out.println("PASSED - Correct shortest distances");
            passedCount++;
        } else {
            System.out.println("FAILED - Check your distance calculations");
            allPassed = false;
        }
    } catch (Exception e) {
        System.out.println("FAILED - runDijkstra method not implemented or has errors");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Simple triangle graph
    System.out.println("Test 2: Triangle graph with 3 vertices");
    Dijkstra dijkstra2 = new Dijkstra(3);
    
    dijkstra2.addEdge(0, 1, 5);  // A-B: 5
    dijkstra2.addEdge(1, 2, 3);  // B-C: 3
    dijkstra2.addEdge(0, 2, 10); // A-C: 10
    
    try {
        dijkstra2.runDijkstra(0);
        
        java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
        java.io.PrintStream old2 = System.out;
        System.setOut(ps2);
        
        dijkstra2.printDistances();
        System.out.flush();
        System.setOut(old2);
        String output2 = baos2.toString();
        
        System.out.println("Triangle graph distances:");
        System.out.print(output2);
        
        // A-C via B (5+3=8) is shorter than direct A-C (10)
        boolean test2Passed = output2.contains("vertex 0 to 0 is: 0") &&
                             output2.contains("vertex 0 to 1 is: 5") &&
                             output2.contains("vertex 0 to 2 is: 8");
        
        if (test2Passed) {
            System.out.println("PASSED - Correctly found indirect path is shorter");
            passedCount++;
        } else {
            System.out.println("FAILED - Should find path through B is shorter than direct A-C");
            allPassed = false;
        }
    } catch (Exception e) {
        System.out.println("FAILED - runDijkstra method not implemented or has errors");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Linear path graph
    System.out.println("Test 3: Linear weighted path");
    Dijkstra dijkstra3 = new Dijkstra(4);
    
    dijkstra3.addEdge(0, 1, 2);  // 0-1: 2
    dijkstra3.addEdge(1, 2, 3);  // 1-2: 3
    dijkstra3.addEdge(2, 3, 1);  // 2-3: 1
    dijkstra3.addEdge(0, 3, 10); // 0-3: 10 (direct but longer)
    
    try {
        dijkstra3.runDijkstra(0);
        
        java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
        java.io.PrintStream old3 = System.out;
        System.setOut(ps3);
        
        dijkstra3.printDistances();
        System.out.flush();
        System.setOut(old3);
        String output3 = baos3.toString();
        
        System.out.println("Linear path distances:");
        System.out.print(output3);
        
        // Path 0->1->2->3 (2+3+1=6) is shorter than direct 0->3 (10)
        boolean test3Passed = output3.contains("vertex 0 to 0 is: 0") &&
                             output3.contains("vertex 0 to 1 is: 2") &&
                             output3.contains("vertex 0 to 2 is: 5") &&
                             output3.contains("vertex 0 to 3 is: 6");
        
        if (test3Passed) {
            System.out.println("PASSED - Multi-hop path preferred over direct edge");
            passedCount++;
        } else {
            System.out.println("FAILED - Multi-hop path should be preferred over direct edge");
            allPassed = false;
        }
    } catch (Exception e) {
        System.out.println("FAILED - runDijkstra method not implemented or has errors");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your Dijkstra implementation works correctly.");
    } else {
        System.out.println("Some tests failed. Review your vertex selection and distance relaxation.");
    }`,

  kruskalMST: `
    System.out.println("Running test cases for kruskalMST function:");
    System.out.println("==================================================");
    
    int passedCount = 0;
    int totalCount = 3;
    boolean allPassed = true;
    
    // Test 1: 6-vertex graph - verify total cost
    System.out.println("Test 1: 6-vertex graph from textbook example");
    KruskalAlgorithm kruskal1 = new KruskalAlgorithm();
    List<Edge> edges1 = new ArrayList<>();
    
    edges1.add(new Edge(0, 1, 4));  // A-B: 4
    edges1.add(new Edge(0, 2, 3));  // A-C: 3  
    edges1.add(new Edge(0, 5, 8));  // A-F: 8
    edges1.add(new Edge(1, 2, 4));  // B-C: 4
    edges1.add(new Edge(1, 5, 9));  // B-F: 9
    edges1.add(new Edge(2, 3, 5));  // C-D: 5
    edges1.add(new Edge(2, 5, 3));  // C-F: 3
    edges1.add(new Edge(3, 4, 2));  // D-E: 2
    edges1.add(new Edge(3, 5, 1));  // D-F: 1
    edges1.add(new Edge(4, 5, 9));  // E-F: 9
    
    try {
        // Capture output to check total cost
        java.io.ByteArrayOutputStream baos1 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps1 = new java.io.PrintStream(baos1);
        java.io.PrintStream old1 = System.out;
        System.setOut(ps1);
        
        kruskal1.kruskalMST(6, edges1);
        System.out.flush();
        System.setOut(old1);
        String output1 = baos1.toString();
        
        System.out.println("Kruskal output:");
        System.out.print(output1);
        
        // Check for correct total cost (should be 13)
        boolean correctCost1 = output1.contains("Total cost") && 
                              (output1.contains(": 13") || output1.contains("13"));
        
        if (correctCost1) {
            System.out.println("PASSED - Correct MST total cost of 13");
            passedCount++;
        } else {
            System.out.println("FAILED - MST should have total cost of 13");
            allPassed = false;
        }
    } catch (Exception e) {
        System.out.println("FAILED - kruskalMST method not implemented or has errors");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 2: Simple triangle graph - verify cost
    System.out.println("Test 2: Triangle graph");
    KruskalAlgorithm kruskal2 = new KruskalAlgorithm();
    List<Edge> edges2 = new ArrayList<>();
    
    edges2.add(new Edge(0, 1, 10)); // A-B: 10
    edges2.add(new Edge(1, 2, 15)); // B-C: 15
    edges2.add(new Edge(0, 2, 5));  // A-C: 5
    
    try {
        java.io.ByteArrayOutputStream baos2 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps2 = new java.io.PrintStream(baos2);
        java.io.PrintStream old2 = System.out;
        System.setOut(ps2);
        
        kruskal2.kruskalMST(3, edges2);
        System.out.flush();
        System.setOut(old2);
        String output2 = baos2.toString();
        
        System.out.println("Triangle MST output:");
        System.out.print(output2);
        
        // MST should select A-C(5) and A-B(10) for total cost 15
        boolean correctCost2 = output2.contains("Total cost") && 
                              (output2.contains(": 15") || output2.contains("15"));
        
        if (correctCost2) {
            System.out.println("PASSED - Correct MST total cost of 15");
            passedCount++;
        } else {
            System.out.println("FAILED - MST should have total cost of 15");
            allPassed = false;
        }
    } catch (Exception e) {
        System.out.println("FAILED - kruskalMST method not implemented or has errors");
        allPassed = false;
    }
    
    System.out.println();
    
    // Test 3: Linear path - verify cost and edge count
    System.out.println("Test 3: Linear path graph");
    KruskalAlgorithm kruskal3 = new KruskalAlgorithm();
    List<Edge> edges3 = new ArrayList<>();
    
    edges3.add(new Edge(0, 1, 1)); // 0-1: 1
    edges3.add(new Edge(1, 2, 2)); // 1-2: 2
    edges3.add(new Edge(2, 3, 3)); // 2-3: 3
    edges3.add(new Edge(0, 3, 10)); // 0-3: 10 (should be rejected)
    
    try {
        java.io.ByteArrayOutputStream baos3 = new java.io.ByteArrayOutputStream();
        java.io.PrintStream ps3 = new java.io.PrintStream(baos3);
        java.io.PrintStream old3 = System.out;
        System.setOut(ps3);
        
        kruskal3.kruskalMST(4, edges3);
        System.out.flush();
        System.setOut(old3);
        String output3 = baos3.toString();
        
        System.out.println("Linear path MST output:");
        System.out.print(output3);
        
        // MST should form path 0-1-2-3 with total cost 6
        boolean correctCost3 = output3.contains("Total cost") && 
                              (output3.contains(": 6") || output3.contains("6"));
        
        if (correctCost3) {
            System.out.println("PASSED - Correct MST total cost 6");
            passedCount++;
        } else {
            System.out.println("FAILED - MST should have total cost 6");
            allPassed = false;
        }
    } catch (Exception e) {
        System.out.println("FAILED - kruskalMST method not implemented or has errors");
        allPassed = false;
    }
    
    System.out.println();
    System.out.println("Results: " + passedCount + "/" + totalCount + " tests passed");
    if (allPassed) {
        System.out.println("All tests passed! Your Kruskal implementation works correctly.");
    } else {
        System.out.println("Some tests failed. Review your union-find and sorting logic.");
    }`
};

export const supportedGraphAlgorithmMethods = ["depthFirstSearch", "dijkstraShortestPath", "kruskalMST"];