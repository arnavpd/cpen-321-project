import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';

import {
  createUserSchema,
  GoogleUserInfo,
  IUser,
  updateProfileSchema,
} from './user.types';
import logger from '../../utils/logger.util';

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    profilePicture: {
      type: String,
      required: false,
      trim: true,
    },
    bio: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    ownedProjects: {
      type: [Schema.Types.ObjectId],
      ref: 'Project',
      default: [],
      index: true,
    },
    memberProjects: {
      type: [Schema.Types.ObjectId],
      ref: 'Project',
      default: [],
      index: true,
    },
    calendarRefreshToken: {
      type: String,
      required: false,
    },
    calendarEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export class UserModel {
  private user: mongoose.Model<IUser>;

  constructor() {
    this.user = mongoose.model<IUser>('User', userSchema);
  }

  async create(userInfo: GoogleUserInfo): Promise<IUser> {
    try {
      const validatedData = createUserSchema.parse(userInfo);

      return await this.user.create(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.issues);
        throw new Error('Invalid update data');
      }
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async update(
    userId: mongoose.Types.ObjectId,
    user: Partial<IUser>
  ): Promise<IUser | null> {
    try {
      const validatedData = updateProfileSchema.parse(user);

      const updatedUser = await this.user.findByIdAndUpdate(
        userId,
        validatedData,
        {
          new: true,
        }
      );
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  async delete(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.user.findByIdAndDelete(userId);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  async findById(_id: mongoose.Types.ObjectId): Promise<IUser | null> {
    try {
      const user = await this.user.findOne({ _id });

      if (!user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw new Error('Failed to find user');
    }
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    try {
      const user = await this.user.findOne({ googleId });

      if (!user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error finding user by Google ID:', error);
      throw new Error('Failed to find user');
    }
  }

  async findByName(name: string): Promise<IUser | null> {
    try {
      console.log('🔍 UserModel.findByName() called for name:', name);
      const user = await this.user.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      
      if (!user) {
        console.log('❌ User not found with name:', name);
        return null;
      }
      
      console.log('✅ User found:', user.name, 'ID:', user._id.toString());
      return user;
    } catch (error) {
      console.error('❌ Error finding user by name:', error);
      throw new Error('Failed to find user by name');
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const user = await this.user.findOne({ email: trimmedEmail });
      
      if (!user) {
        return null;
      }
      
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw new Error('Failed to find user by email');
    }
  }

  async addOwnedProject(userId: mongoose.Types.ObjectId, projectId: mongoose.Types.ObjectId): Promise<IUser | null> {
    try {
      return await this.user.findByIdAndUpdate(
        userId,
        { $addToSet: { ownedProjects: projectId } },
        { new: true }
      );
    } catch (error) {
      console.error('Error adding owned project:', error);
      throw new Error('Failed to add owned project');
    }
  }

  async addMemberProject(userId: mongoose.Types.ObjectId, projectId: mongoose.Types.ObjectId): Promise<IUser | null> {
    try {
      return await this.user.findByIdAndUpdate(
        userId,
        { $addToSet: { memberProjects: projectId } },
        { new: true }
      );
    } catch (error) {
      console.error('Error adding member project:', error);
      throw new Error('Failed to add member project');
    }
  }

  async removeOwnedProject(userId: mongoose.Types.ObjectId, projectId: mongoose.Types.ObjectId): Promise<IUser | null> {
    try {
      return await this.user.findByIdAndUpdate(
        userId,
        { $pull: { ownedProjects: projectId } },
        { new: true }
      );
    } catch (error) {
      console.error('Error removing owned project:', error);
      throw new Error('Failed to remove owned project');
    }
  }

  async removeMemberProject(userId: mongoose.Types.ObjectId, projectId: mongoose.Types.ObjectId): Promise<IUser | null> {
    try {
      return await this.user.findByIdAndUpdate(
        userId,
        { $pull: { memberProjects: projectId } },
        { new: true }
      );
    } catch (error) {
      console.error('Error removing member project:', error);
      throw new Error('Failed to remove member project');
    }
  }

  async getUserProjects(userId: mongoose.Types.ObjectId): Promise<{ ownedProjects: IUser['ownedProjects'], memberProjects: IUser['memberProjects'] } | null> {
    try {
      const user = await this.user.findById(userId).select('ownedProjects memberProjects');
      if (!user) return null;

      return {
        ownedProjects: user.ownedProjects,
        memberProjects: user.memberProjects
      };
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw new Error('Failed to get user projects');
    }
  }

  async getAllUsers(): Promise<IUser[]> {
    try {
      console.log('🔍 UserModel.getAllUsers() called');
      const users = await this.user.find({}).select('name email _id');
      console.log('✅ UserModel.getAllUsers() found', users.length, 'users');
      return users;
    } catch (error) {
      console.error('❌ UserModel.getAllUsers() error:', error);
      throw new Error('Failed to get all users');
    }
  }
}

export const userModel = new UserModel();
