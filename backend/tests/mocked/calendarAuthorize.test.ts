/**
 * Interface: GET /api/calendar/oauth/authorize
 * Tests with mocking - testing calendar OAuth authorization with mocked dependencies
 */

import { Request, Response } from 'express';
import { CalendarController } from '../../src/features/calendar/calendar.controller';
import { calendarService } from '../../src/features/calendar/calendar.service';
import mongoose from 'mongoose';

// Mock the calendar service
jest.mock('../../src/features/calendar/calendar.service');

describe('Mocked: GET /api/calendar/oauth/authorize', () => {
  let calendarController: CalendarController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseData: any;

  const mockUserId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    calendarController = new CalendarController();
    responseData = {};

    mockRequest = {
      user: { _id: mockUserId } as any
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((data) => {
        responseData = data;
        return mockResponse;
      })
    };

    jest.clearAllMocks();
  });

  test('should generate authorization URL when user is authenticated', async () => {
    const mockAuthUrl = 'https://accounts.google.com/oauth2/auth?client_id=test&redirect_uri=callback&scope=calendar';
    
    (calendarService.generateAuthUrl as jest.Mock).mockReturnValue(mockAuthUrl);

    await calendarController.authorizeCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).not.toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      authUrl: `${mockAuthUrl}&state=${mockUserId}`
    });
    expect(calendarService.generateAuthUrl).toHaveBeenCalled();
  });

  test('should return 401 when user is not authenticated', async () => {
    // Remove user from request
    mockRequest.user = undefined;

    await calendarController.authorizeCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(responseData.error).toBe('Unauthorized');
  });

  test('should return 500 when calendar service fails', async () => {
    (calendarService.generateAuthUrl as jest.Mock).mockImplementation(() => {
      throw new Error('Calendar service error');
    });

    await calendarController.authorizeCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseData.error).toBe('Failed to generate authorization URL');
  });
});