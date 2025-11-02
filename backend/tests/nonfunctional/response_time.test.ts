/**
 * Non-Functional Requirement Test: Performance (Response Time)
 * 
 * This test suite verifies that API endpoints respond within acceptable time limits
 * to ensure good user experience under normal operating conditions.
 */

import request from 'supertest';
import { createTestApp } from '../testApp';

describe('NFR: Performance - Response Time Tests', () => {
  let app: any;

  beforeAll(async () => {
    console.log('🚀 Setting up Performance (Response Time) NFR tests...');
    
    // Verify JWT_SECRET is available
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not found in environment variables');
    }
    
    // Create test app
    app = await createTestApp();
    console.log('✅ Test app created for performance testing');
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up Performance NFR tests...');
  });

  /**
   * Test: API Response Time Performance
   * Requirements: All API endpoints should respond within 1000ms under normal load
   * This test measures response times for key endpoints to ensure acceptable performance
   */
  describe('API Response Time Performance', () => {
    
    it('should respond to health check within 200ms', async () => {
      console.log('⏱️  Testing health check endpoint response time...');
      
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/user/profile') // Using user profile as endpoint check (requires auth)
        .expect(401); // Expecting 401 because no auth token provided, but endpoint should still respond quickly
      
      const responseTime = Date.now() - startTime;
      
      console.log(`📊 Response time: ${responseTime}ms`);
      
      // Assert response time is under 200ms for basic endpoint
      expect(responseTime).toBeLessThan(200);
      expect(response).toBeDefined();
    });

    it('should handle multiple concurrent requests within acceptable time', async () => {
      console.log('⏱️  Testing concurrent request performance...');
      
      const numberOfRequests = 5;
      const maxAcceptableTime = 1000; // 1 second
      
      const startTime = Date.now();
      
      // Create multiple concurrent requests
      const requests = Array(numberOfRequests).fill(0).map(() => 
        request(app)
          .get('/api/user/profile')
          .expect(401)
      );
      
      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / numberOfRequests;
      
      console.log(`📊 Total time for ${numberOfRequests} requests: ${totalTime}ms`);
      console.log(`📊 Average time per request: ${averageTime}ms`);
      
      // Assert all requests completed within acceptable time
      expect(totalTime).toBeLessThan(maxAcceptableTime);
      expect(responses.length).toBe(numberOfRequests);
      
      // Assert average response time is reasonable
      expect(averageTime).toBeLessThan(maxAcceptableTime / numberOfRequests);
    });

    it('should maintain performance under sequential load', async () => {
      console.log('⏱️  Testing sequential request performance...');
      
      const numberOfSequentialRequests = 10;
      const maxTimePerRequest = 500; // 500ms per request
      const responseTimes: number[] = [];
      
      for (let i = 0; i < numberOfSequentialRequests; i++) {
        const startTime = Date.now();
        
        await request(app)
          .get('/api/user/profile')
          .expect(401);
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        console.log(`📊 Request ${i + 1} response time: ${responseTime}ms`);
        
        // Each individual request should be under the limit
        expect(responseTime).toBeLessThan(maxTimePerRequest);
      }
      
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      
      console.log(`📊 Average response time across ${numberOfSequentialRequests} requests: ${averageResponseTime}ms`);
      console.log(`📊 Maximum response time: ${maxResponseTime}ms`);
      
      // Assert average performance is good
      expect(averageResponseTime).toBeLessThan(200);
      expect(maxResponseTime).toBeLessThan(maxTimePerRequest);
    });
  });
});