/**
 * Interface: POST /api/calendar/enable
 * Tests with mocking - testing calendar enable functionality with mocked dependencies
 */

import { Request, Response } from 'express';
import { CalendarController } from '../../src/features/calendar/calendar.controller';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the user model
jest.mock('../../src/features/users/user.model');

describe('Mocked: POST /api/calendar/enable', () => {
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

  test('should successfully enable calendar when user has refresh token', async () => {
    const mockUser = {
      _id: mockUserId,
      calendarRefreshToken: 'valid_refresh_token',
      calendarEnabled: false
    };

    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (userModel.update as jest.Mock).mockResolvedValue(true);

    await calendarController.enableCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).not.toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Calendar sync enabled',
      enabled: true
    });
    expect(userModel.update).toHaveBeenCalledWith(mockUserId, {
      calendarEnabled: true
    });
  });

  test('should return 400 when user has no refresh token', async () => {
    const mockUser = {
      _id: mockUserId,
      calendarRefreshToken: null,
      calendarEnabled: false
    };

    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);

    await calendarController.enableCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(responseData.error).toBe('Calendar not connected. Please authorize first.');
  });

  test('should return 401 when user is not authenticated', async () => {
    // Remove user from request
    mockRequest.user = undefined;

    await calendarController.enableCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(responseData.error).toBe('Unauthorized');
  });
});