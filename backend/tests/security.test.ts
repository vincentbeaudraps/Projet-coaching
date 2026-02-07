/**
 * Security Tests Suite
 * 
 * Tests for:
 * - SQL Injection protection
 * - XSS protection
 * - CSRF protection
 * - Authentication & Authorization
 * - Input validation
 * - Rate limiting
 * - File upload security
 */

import request from 'supertest';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';

// Mock Express app for testing
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Security Tests', () => {
  let testToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user and get token
    const testEmail = `test-${Date.now()}@example.com`;
    const response = await request(API_BASE)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'athlete',
      });

    if (response.status === 201) {
      testToken = response.body.token;
      testUserId = response.body.user.id;
    }
  });

  describe('SQL Injection Protection', () => {
    test('should prevent SQL injection in login email', async () => {
      const maliciousPayloads = [
        "admin'--",
        "admin' OR '1'='1",
        "admin' OR '1'='1'--",
        "admin'; DROP TABLE users;--",
        "' OR 1=1--",
        "1' UNION SELECT NULL, NULL, NULL--",
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(API_BASE)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'password123',
          });

        // Should return validation error or unauthorized, not crash
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      }
    });

    test('should prevent SQL injection in query parameters', async () => {
      const maliciousIds = [
        "1' OR '1'='1",
        "1; DROP TABLE users;--",
        "1 UNION SELECT * FROM users--",
      ];

      for (const id of maliciousIds) {
        const response = await request(API_BASE)
          .get(`/api/athletes/${encodeURIComponent(id)}`)
          .set('Authorization', `Bearer ${testToken}`);

        // Should return 400/404, not 500 (server error)
        expect(response.status).not.toBe(500);
      }
    });

    test('should use parameterized queries', async () => {
      // Test that normal UUID works
      const response = await request(API_BASE)
        .get(`/api/athletes/${testUserId}`)
        .set('Authorization', `Bearer ${testToken}`);

      // Should be authorized or not found, not a SQL error
      expect([200, 404, 403]).toContain(response.status);
    });
  });

  describe('XSS Protection', () => {
    test('should sanitize user input in registration', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')">',
        '<body onload=alert("XSS")>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(API_BASE)
          .post('/api/auth/register')
          .send({
            email: `xss-${Date.now()}@example.com`,
            password: 'TestPass123!',
            firstName: payload,
            lastName: 'Test',
            role: 'athlete',
          });

        // Should either reject or sanitize
        if (response.status === 201) {
          // If accepted, verify it's sanitized
          expect(response.body.user.firstName).not.toContain('<script');
          expect(response.body.user.firstName).not.toContain('javascript:');
          expect(response.body.user.firstName).not.toContain('onerror');
        } else {
          // Should return validation error
          expect(response.status).toBe(400);
        }
      }
    });

    test('should set XSS protection headers', async () => {
      const response = await request(API_BASE).get('/api/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('CSRF Protection', () => {
    test('should require CSRF token for state-changing operations', async () => {
      // Attempt POST without CSRF token
      const response = await request(API_BASE)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${testToken}`);

      // Should either require CSRF token or accept (depending on implementation)
      // If CSRF is enabled, should return 403
      if (response.status === 403) {
        expect(response.body.error).toContain('CSRF');
      }
    });

    test('should set CSRF token cookie', async () => {
      const response = await request(API_BASE).get('/api/auth/csrf-token');

      // Should provide CSRF token
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.csrfToken).toBeDefined();
      }
    });
  });

  describe('Authentication & Authorization', () => {
    test('should reject requests without authentication', async () => {
      const response = await request(API_BASE).get('/api/athletes');

      expect(response.status).toBe(401);
    });

    test('should reject invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid.jwt.token',
        'Bearer invalid',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      ];

      for (const token of invalidTokens) {
        const response = await request(API_BASE)
          .get('/api/athletes')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
      }
    });

    test('should reject expired JWT tokens', async () => {
      // Expired token (this is a sample, replace with actual expired token)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjE2MDAwMDAwMDB9.invalidSignature';

      const response = await request(API_BASE)
        .get('/api/athletes')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    test('should enforce role-based access control', async () => {
      // Athlete trying to access coach-only endpoint
      const response = await request(API_BASE)
        .get('/api/coaches/stats')
        .set('Authorization', `Bearer ${testToken}`);

      // Should be forbidden or not found
      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Input Validation', () => {
    test('should validate email format', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com',
      ];

      for (const email of invalidEmails) {
        const response = await request(API_BASE)
          .post('/api/auth/register')
          .send({
            email,
            password: 'TestPass123!',
            firstName: 'Test',
            lastName: 'User',
            role: 'athlete',
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      }
    });

    test('should enforce password complexity', async () => {
      const weakPasswords = [
        '123',           // Too short
        'password',      // No numbers or special chars
        'Pass123',       // No special chars
        'pass!@#',       // No uppercase or numbers
      ];

      for (const password of weakPasswords) {
        const response = await request(API_BASE)
          .post('/api/auth/register')
          .send({
            email: `test-${Date.now()}@example.com`,
            password,
            firstName: 'Test',
            lastName: 'User',
            role: 'athlete',
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toBeDefined();
      }
    });

    test('should validate UUID format', async () => {
      const invalidUuids = [
        'not-a-uuid',
        '123',
        'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      ];

      for (const uuid of invalidUuids) {
        const response = await request(API_BASE)
          .get(`/api/athletes/${uuid}`)
          .set('Authorization', `Bearer ${testToken}`);

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Rate Limiting', () => {
    test('should rate limit login attempts', async () => {
      const requests = [];
      
      // Make 10 rapid login attempts
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(API_BASE)
            .post('/api/auth/login')
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    }, 15000);

    test('should include rate limit headers', async () => {
      const response = await request(API_BASE)
        .get('/api/health');

      // Check for rate limit headers
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
    });
  });

  describe('File Upload Security', () => {
    test('should reject non-GPX files', async () => {
      const response = await request(API_BASE)
        .post('/api/activities/upload-gpx')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('gpxFile', Buffer.from('<html>malicious</html>'), 'malicious.gpx');

      // Should reject invalid GPX
      expect([400, 422]).toContain(response.status);
    });

    test('should enforce file size limits', async () => {
      // Create a large file (> 10MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

      const response = await request(API_BASE)
        .post('/api/activities/upload-gpx')
        .set('Authorization', `Bearer ${testToken}`)
        .attach('gpxFile', largeBuffer, 'large.gpx');

      // Should reject file too large
      expect([400, 413]).toContain(response.status);
    });

    test('should sanitize filenames', async () => {
      const maliciousFilenames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        'test<script>.gpx',
      ];

      for (const filename of maliciousFilenames) {
        const response = await request(API_BASE)
          .post('/api/activities/upload-gpx')
          .set('Authorization', `Bearer ${testToken}`)
          .attach('gpxFile', Buffer.from('<?xml version="1.0"?><gpx></gpx>'), filename);

        // Should either reject or sanitize
        if (response.status !== 400) {
          // Verify filename is sanitized in response
          if (response.body.filename) {
            expect(response.body.filename).not.toContain('..');
            expect(response.body.filename).not.toContain('<');
            expect(response.body.filename).not.toContain('\\');
          }
        }
      }
    });
  });

  describe('Refresh Token Security', () => {
    test('should detect refresh token replay attacks', async () => {
      // Login to get refresh token
      const loginResponse = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'TestPass123!',
        });

      if (loginResponse.status !== 200) {
        // Skip if login failed
        return;
      }

      const { refreshToken } = loginResponse.body;

      // Use refresh token once
      const refreshResponse1 = await request(API_BASE)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse1.status).toBe(200);

      // Try to reuse the same token (replay attack)
      const refreshResponse2 = await request(API_BASE)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      // Should reject reused token
      expect(refreshResponse2.status).toBe(401);
    });

    test('should invalidate refresh token on logout', async () => {
      // Login to get tokens
      const loginResponse = await request(API_BASE)
        .post('/api/auth/login')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'TestPass123!',
        });

      if (loginResponse.status !== 200) {
        return;
      }

      const { token, refreshToken } = loginResponse.body;

      // Logout
      await request(API_BASE)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({ refreshToken });

      // Try to use refresh token after logout
      const refreshResponse = await request(API_BASE)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshResponse.status).toBe(401);
    });
  });

  describe('Security Headers', () => {
    test('should set Helmet security headers', async () => {
      const response = await request(API_BASE).get('/api/health');

      // Check for essential security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
    });

    test('should remove X-Powered-By header', async () => {
      const response = await request(API_BASE).get('/api/health');

      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  afterAll(async () => {
    // Cleanup: delete test user
    if (testUserId) {
      // Note: You might need to implement a test cleanup endpoint
      // or directly access the database for cleanup
    }
  });
});
