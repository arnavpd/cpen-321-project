/**
 * Interface: POST /api/calendar/disconnect
 * Tests with mocking - testing calendar disconnection with mocked dependencies
 */

import { Request, Response } from 'express';
import { CalendarController } from '../../src/features/calendar/calendar.controller';
import { userModel } from '../../src/features/users/user.model';
import { calendarService } from '../../src/features/calendar/calendar.service';
import mongoose from 'mongoose';

// Mock the dependencies
jest.mock('../../src/features/users/user.model');
jest.mock('../../src/features/calendar/calendar.service');

describe('Mocked: POST /api/calendar/disconnect', () => {
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

  test('should successfully disconnect calendar and revoke access', async () => {
    const mockUser = {
      _id: mockUserId,
      calendarRefreshToken: 'valid_refresh_token',
      calendarEnabled: true
    };

    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (calendarService.revokeAccess as jest.Mock).mockResolvedValue(true);
    (userModel.update as jest.Mock).mockResolvedValue(true);

    await calendarController.disconnectCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Calendar disconnected successfully'
    });
    expect(calendarService.revokeAccess).toHaveBeenCalledWith('valid_refresh_token');
    expect(userModel.update).toHaveBeenCalledWith(mockUserId, {
      calendarRefreshToken: undefined,
      calendarEnabled: false
    });
  });

  test('should still work when user has no refresh token', async () => {
    const mockUser = {
      _id: mockUserId,
      calendarRefreshToken: null,
      calendarEnabled: false
    };

    (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (userModel.update as jest.Mock).mockResolvedValue(true);

    await calendarController.disconnectCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Calendar disconnected successfully'
    });
    expect(calendarService.revokeAccess).not.toHaveBeenCalled();
    expect(userModel.update).toHaveBeenCalledWith(mockUserId, {
      calendarRefreshToken: undefined,
      calendarEnabled: false
    });
  });

  test('should return 401 when user is not authenticated', async () => {
    // Remove user from request
    mockRequest.user = undefined;

    await calendarController.disconnectCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(responseData.error).toBe('Unauthorized');
  });
});