import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  attendeeEmails: string[];
  meetingLink?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export class GoogleCalendarService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/oauth2callback'
    );
  }

  /**
   * Sets the credentials for the OAuth2 client
   */
  setCredentials(accessToken: string, refreshToken: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Creates a calendar event for a meeting
   */
  async createMeetingEvent(
    accessToken: string,
    refreshToken: string,
    eventDetails: {
      subject: string;
      fromEmail: string;
      toEmail: string;
      meetingReason: string;
      duration?: number; // in minutes, default 30
    }
  ): Promise<CalendarEvent> {
    this.setCredentials(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Find the next available time slot
    const timeSlot = await this.findNextAvailableSlot(eventDetails.duration || 30);
    
    const event = {
      summary: `Meeting: ${eventDetails.subject}`,
      description: `Meeting requested regarding: ${eventDetails.meetingReason}\n\nInitiated from email discussion.`,
      start: {
        dateTime: timeSlot.startTime,
        timeZone: 'America/New_York', // You might want to make this configurable
      },
      end: {
        dateTime: timeSlot.endTime,
        timeZone: 'America/New_York',
      },
      attendees: [
        { email: eventDetails.fromEmail },
        { email: eventDetails.toEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 15 }, // 15 minutes before
        ],
      },
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      });

      const createdEvent = response.data;
      return {
        id: createdEvent.id!,
        summary: createdEvent.summary!,
        description: createdEvent.description || undefined,
        startDateTime: createdEvent.start!.dateTime!,
        endDateTime: createdEvent.end!.dateTime!,
        attendeeEmails: createdEvent.attendees?.map(a => a.email!) || [],
        meetingLink: createdEvent.conferenceData?.entryPoints?.[0]?.uri || undefined,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Finds the next available time slot for a meeting
   */
  private async findNextAvailableSlot(durationMinutes: number): Promise<TimeSlot> {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    // Get the current date and time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Start from 9 AM tomorrow
    
    const endOfWeek = new Date(tomorrow);
    endOfWeek.setDate(tomorrow.getDate() + 5); // Search for the next 5 days
    endOfWeek.setHours(17, 0, 0, 0); // End at 5 PM

    try {
      // Get busy times
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: tomorrow.toISOString(),
          timeMax: endOfWeek.toISOString(),
          items: [{ id: 'primary' }],
        },
      });

      const busyTimes = response.data.calendars?.primary?.busy || [];
      
      // Filter and convert busy times to the expected format
      const validBusyTimes = busyTimes
        .filter(busy => busy.start && busy.end)
        .map(busy => ({
          start: busy.start!,
          end: busy.end!
        }));
      
      // Find first available slot
      const slot = this.findFirstAvailableSlot(tomorrow, endOfWeek, validBusyTimes, durationMinutes);
      
      return {
        startTime: slot.start.toISOString(),
        endTime: slot.end.toISOString(),
      };
    } catch (error) {
      console.error('Error checking calendar availability:', error);
      // Fallback to tomorrow at 10 AM
      const fallbackStart = new Date(tomorrow);
      fallbackStart.setHours(10, 0, 0, 0);
      const fallbackEnd = new Date(fallbackStart);
      fallbackEnd.setMinutes(fallbackStart.getMinutes() + durationMinutes);
      
      return {
        startTime: fallbackStart.toISOString(),
        endTime: fallbackEnd.toISOString(),
      };
    }
  }

  /**
   * Finds the first available time slot given busy periods
   */
  private findFirstAvailableSlot(
    startSearch: Date,
    endSearch: Date,
    busyPeriods: Array<{ start: string; end: string }>,
    durationMinutes: number
  ): { start: Date; end: Date } {
    const workingHours = {
      start: 9, // 9 AM
      end: 17, // 5 PM
    };

    let currentSlot = new Date(startSearch);
    
    while (currentSlot < endSearch) {
      // Skip non-working hours
      if (currentSlot.getHours() < workingHours.start) {
        currentSlot.setHours(workingHours.start, 0, 0, 0);
        continue;
      }
      
      if (currentSlot.getHours() >= workingHours.end) {
        // Move to next day
        currentSlot.setDate(currentSlot.getDate() + 1);
        currentSlot.setHours(workingHours.start, 0, 0, 0);
        continue;
      }

      // Skip weekends (Saturday = 6, Sunday = 0)
      if (currentSlot.getDay() === 0 || currentSlot.getDay() === 6) {
        currentSlot.setDate(currentSlot.getDate() + 1);
        currentSlot.setHours(workingHours.start, 0, 0, 0);
        continue;
      }

      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(currentSlot.getMinutes() + durationMinutes);

      // Check if this slot conflicts with any busy period
      const hasConflict = busyPeriods.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return (currentSlot < busyEnd && slotEnd > busyStart);
      });

      if (!hasConflict && slotEnd.getHours() <= workingHours.end) {
        return { start: new Date(currentSlot), end: slotEnd };
      }

      // Move to next 30-minute slot
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    // Fallback if no slot found
    const fallback = new Date(startSearch);
    fallback.setHours(10, 0, 0, 0);
    const fallbackEnd = new Date(fallback);
    fallbackEnd.setMinutes(fallback.getMinutes() + durationMinutes);
    
    return { start: fallback, end: fallbackEnd };
  }

  /**
   * Updates an existing calendar event
   */
  async updateEvent(
    accessToken: string,
    refreshToken: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> {
    this.setCredentials(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const updateData: any = {};
    
    if (updates.summary) updateData.summary = updates.summary;
    if (updates.description) updateData.description = updates.description;
    if (updates.startDateTime) {
      updateData.start = { dateTime: updates.startDateTime, timeZone: 'America/New_York' };
    }
    if (updates.endDateTime) {
      updateData.end = { dateTime: updates.endDateTime, timeZone: 'America/New_York' };
    }
    if (updates.attendeeEmails) {
      updateData.attendees = updates.attendeeEmails.map(email => ({ email }));
    }

    try {
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updateData,
      });

      const updatedEvent = response.data;
      return {
        id: updatedEvent.id!,
        summary: updatedEvent.summary!,
        description: updatedEvent.description || undefined,
        startDateTime: updatedEvent.start!.dateTime!,
        endDateTime: updatedEvent.end!.dateTime!,
        attendeeEmails: updatedEvent.attendees?.map(a => a.email!) || [],
        meetingLink: updatedEvent.conferenceData?.entryPoints?.[0]?.uri || undefined,
      };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Deletes a calendar event
   */
  async deleteEvent(
    accessToken: string,
    refreshToken: string,
    eventId: string
  ): Promise<void> {
    this.setCredentials(accessToken, refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }
}

// Export a singleton instance
export const googleCalendarService = new GoogleCalendarService();