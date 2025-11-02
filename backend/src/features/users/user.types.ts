import mongoose, { Document } from 'mongoose';
import z from 'zod';

// User model
// ------------------------------------------------------------
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;

  // Project relationships (new fields for project management)
  ownedProjects: mongoose.Types.ObjectId[];
  memberProjects: mongoose.Types.ObjectId[];

  // Google Calendar integration (for future use)
  calendarRefreshToken?: string;
  calendarEnabled: boolean;
}

// Zod schemas
// ------------------------------------------------------------
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  googleId: z.string().min(1),
  profilePicture: z.string().optional(),
  bio: z.string().max(500).optional(),
  ownedProjects: z.array(z.string()).default([]),
  memberProjects: z.array(z.string()).default([]),
  calendarRefreshToken: z.string().optional(),
  calendarEnabled: z.boolean().default(false),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().max(500).optional(),
  profilePicture: z.string().min(1).optional(),
  calendarRefreshToken: z.string().optional(),
  calendarEnabled: z.boolean().optional(),
});

// Request types
// ------------------------------------------------------------
export interface GetProfileResponse {
  message: string;
  data?: {
    user: IUser;
  };
};

export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;

// Generic types
// ------------------------------------------------------------
export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  profilePicture?: string;
};
