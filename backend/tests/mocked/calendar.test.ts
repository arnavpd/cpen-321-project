/**
 * Calendar API - Mocked Integration Tests
 * 
 * Tests the calendar integration endpoints with mocked dependencies
 * for isolated unit testing.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createTestApp } from '../testApp';

// Mock the user model
jest.mock('../../src/features/users/user.model', () => ({
  userModel: {
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
  }
}));

// Mock the calendar controller
jest.mock('../../src/features/calendar/calendar.controller', () => ({
  calendarController: {
    getCalendarStatus: {
      bind: jest.fn().mockReturnValue(jest.fn((req: any, res: any) => {
        res.json({ enabled: false });
      }))
    },
    enableCalendar: {
      bind: jest.fn().mockReturnValue(jest.fn((req: any, res: any) => {
        res.json({ message: 'Calendar enabled', enabled: true });
      }))
    },
    disableCalendar: {
      bind: jest.fn().mockReturnValue(jest.fn((req: any, res: any) => {
        res.json({ message: 'Calendar disabled', enabled: false });
      }))
    },
    disconnectCalendar: {
      bind: jest.fn().mockReturnValue(jest.fn((req: any, res: any) => {
        res.json({ message: 'Calendar disconnected successfully' });
      }))
    },
    authorizeCalendar: {
      bind: jest.fn().mockReturnValue(jest.fn((req: any, res: any) => {
        res.json({ authUrl: 'https://accounts.google.com/oauth/authorize?...' });
      }))
    },
    handleOAuthCallback: {
      bind: jest.fn().mockReturnValue(jest.fn((req: any, res: any) => {
        res.redirect('/calendar-success');
      }))
    }
  }
}));

// Mock the authentication middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied' });
    }
    
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test_secret');
      req.user = { _id: new mongoose.Types.ObjectId() };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Access denied' });
    }
  })
}));

describe('Calendar API - Mocked Tests', () => {
  let app: any;
  let validToken: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Calendar API mocked tests...');
    
    // Create test app
    app = await createTestApp();
    console.log('✅ Test app created');
    
    // Generate valid JWT token
    const jwtSecret = process.env.JWT_SECRET || 'test_secret';
    validToken = jwt.sign(
      { id: new mongoose.Types.ObjectId() },
      jwtSecret
    );
    console.log('✅ Valid JWT token generated');
  });

  describe('GET /api/calendar/status', () => {
    it('should return mocked calendar status', async () => {
      console.log('🔍 Testing mocked calendar status endpoint...');
      
      const response = await request(app)
        .get('/api/calendar/status')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('enabled', false);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing mocked calendar status without auth...');
      
      const response = await request(app)
        .get('/api/calendar/status')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('POST /api/calendar/dev/enable-calendar-test', () => {
    it('should return mocked success response for dev enable', async () => {
      console.log('🔍 Testing mocked dev calendar enable...');
      
      const response = await request(app)
        .post('/api/calendar/dev/enable-calendar-test')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      // This will use the mocked dev route behavior
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing mocked dev calendar enable without auth...');
      
      const response = await request(app)
        .post('/api/calendar/dev/enable-calendar-test')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('POST /api/calendar/disable', () => {
    it('should return mocked disable response', async () => {
      console.log('🔍 Testing mocked calendar disable...');
      
      const response = await request(app)
        .post('/api/calendar/disable')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('message', 'Calendar disabled');
      expect(response.body).toHaveProperty('enabled', false);
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing mocked calendar disable without auth...');
      
      const response = await request(app)
        .post('/api/calendar/disable')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('POST /api/calendar/disconnect', () => {
    it('should return mocked disconnect response', async () => {
      console.log('🔍 Testing mocked calendar disconnect...');
      
      const response = await request(app)
        .post('/api/calendar/disconnect')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('message', 'Calendar disconnected successfully');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing mocked calendar disconnect without auth...');
      
      const response = await request(app)
        .post('/api/calendar/disconnect')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/calendar/oauth/authorize', () => {
    it('should return mocked OAuth authorize response', async () => {
      console.log('🔍 Testing mocked OAuth authorize endpoint...');
      
      const response = await request(app)
        .get('/api/calendar/oauth/authorize')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      console.log('📝 Response:', response.body);
      
      expect(response.body).toHaveProperty('authUrl');
      expect(response.body.authUrl).toContain('google.com');
    });

    it('should return 401 for unauthenticated request', async () => {
      console.log('🔍 Testing mocked OAuth authorize without auth...');
      
      const response = await request(app)
        .get('/api/calendar/oauth/authorize')
        .expect(401);

      console.log('📝 Response:', response.body);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  describe('GET /api/calendar/oauth/callback', () => {
    it('should handle mocked OAuth callback (no auth required)', async () => {
      console.log('🔍 Testing mocked OAuth callback endpoint...');
      
      const response = await request(app)
        .get('/api/calendar/oauth/callback?code=test_code&state=test_state')
        .expect(302); // Redirect response

      console.log('📝 Response status:', response.status);
      console.log('📝 Response headers:', response.headers.location);
      
      expect(response.headers.location).toContain('calendar-success');
    });
  });
});