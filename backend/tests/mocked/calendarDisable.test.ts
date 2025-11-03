/**
 * Interface: POST /api/calendar/disable
 * Tests with mocking - testing calendar disable functionality with mocked dependencies
 */

import { Request, Response } from 'express';
import { CalendarController } from '../../src/features/calendar/calendar.controller';
import { userModel } from '../../src/features/users/user.model';
import mongoose from 'mongoose';

// Mock the user model
jest.mock('../../src/features/users/user.model');

describe('Mocked: POST /api/calendar/disable', () => {
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

  test('should successfully disable calendar sync', async () => {
    (userModel.update as jest.Mock).mockResolvedValue(true);

    await calendarController.disableCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).not.toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Calendar sync disabled',
      enabled: false
    });
    expect(userModel.update).toHaveBeenCalledWith(mockUserId, {
      calendarEnabled: false
    });
  });

  test('should return 401 when user is not authenticated', async () => {
    // Remove user from request
    mockRequest.user = undefined;

    await calendarController.disableCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(responseData.error).toBe('Unauthorized');
  });

  test('should return 500 when database update fails', async () => {
    (userModel.update as jest.Mock).mockRejectedValue(new Error('Database error'));

    await calendarController.disableCalendar(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseData.error).toBe('Failed to disable calendar sync');
  });
});