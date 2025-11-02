import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import logger from '../../utils/logger.util';

export interface CalendarEventData {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export class CalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALENDAR_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth URL for user authorization
   */
  generateAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to always get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token received');
      }

      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date!,
      };
    } catch (error) {
      logger.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to get tokens from authorization code');
    }
  }

  /**
   * Set credentials using refresh token
   */
  setCredentials(refreshToken: string) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  /**
   * Create a calendar event
   */
  async createEvent(
    refreshToken: string,
    eventData: CalendarEventData
  ): Promise<string> {
    try {
      // Skip actual API call in test mode
      if (refreshToken.startsWith('test_token_')) {
        logger.info('⚠️ TEST MODE: Skipping Google Calendar API call');
        return 'test_event_' + Date.now();
      }

      this.setCredentials(refreshToken);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Set end time to be same as start time if not provided (all-day event)
      const endTime = eventData.end || eventData.start;

      // Format dates as YYYY-MM-DD for all-day events (avoids timezone issues)
      const formatDateOnly = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const event = {
        summary: eventData.summary,
        description: eventData.description ?? '',
        start: {
          date: formatDateOnly(eventData.start), // Use 'date' instead of 'dateTime' for all-day events
        },
        end: {
          date: formatDateOnly(new Date(endTime.getTime() + 24 * 60 * 60 * 1000)), // Add 1 day for Google Calendar all-day event format
        },
        reminders: eventData.reminders ?? {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      logger.info('Calendar event created:', response.data.id);
      return response.data.id!;
    } catch (error) {
      logger.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(
    refreshToken: string,
    eventId: string,
    eventData: CalendarEventData
  ): Promise<void> {
    try {
      // Skip actual API call in test mode
      if (refreshToken.startsWith('test_token_') || eventId.startsWith('test_event_')) {
        logger.info('⚠️ TEST MODE: Skipping Google Calendar API call');
        return;
      }

      this.setCredentials(refreshToken);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const endTime = eventData.end || eventData.start;

      // Format dates as YYYY-MM-DD for all-day events (avoids timezone issues)
      const formatDateOnly = (date: Date): string => {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        start: {
          date: formatDateOnly(eventData.start), // Use 'date' instead of 'dateTime' for all-day events
        },
        end: {
          date: formatDateOnly(new Date(endTime.getTime() + 24 * 60 * 60 * 1000)), // Add 1 day for Google Calendar all-day event format
        },
        reminders: eventData.reminders || {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      };

      await calendar.events.update({
        calendarId: 'primary',
        eventId,
        requestBody: event,
      });

      logger.info('Calendar event updated:', eventId);
    } catch (error) {
      logger.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(refreshToken: string, eventId: string): Promise<void> {
    try {
      // Skip actual API call in test mode
      if (refreshToken.startsWith('test_token_') || eventId.startsWith('test_event_')) {
        logger.info('⚠️ TEST MODE: Skipping Google Calendar API call');
        return;
      }

      this.setCredentials(refreshToken);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });

      logger.info('Calendar event deleted:', eventId);
    } catch (error) {
      logger.error('Error deleting calendar event:', error);
      // Don't throw error if event doesn't exist
      if (error instanceof Error && error.message.includes('404')) {
        logger.warn('Event not found, may have been already deleted');
        return;
      }
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Get user's calendar list to verify access
   */
  async verifyAccess(refreshToken: string): Promise<boolean> {
    try {
      this.setCredentials(refreshToken);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      await calendar.calendarList.list();
      
      return true;
    } catch (error) {
      logger.error('Error verifying calendar access:', error);
      return false;
    }
  }

  /**
   * Revoke calendar access
   */
  async revokeAccess(refreshToken: string): Promise<void> {
    try {
      this.setCredentials(refreshToken);
      await this.oauth2Client.revokeCredentials();
      logger.info('Calendar access revoked');
    } catch (error) {
      logger.error('Error revoking calendar access:', error);
      throw new Error('Failed to revoke calendar access');
    }
  }
}

export const calendarService = new CalendarService();
