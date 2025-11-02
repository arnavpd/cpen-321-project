import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectInvitation extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  invitationCode: string;
  invitedEmail: string;
  invitedBy: mongoose.Types.ObjectId;
  role: 'user';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

const projectInvitationSchema = new Schema<IProjectInvitation>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    invitationCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitedEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['user'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Create indexes for performance
projectInvitationSchema.index({ invitationCode: 1 }, { unique: true });
projectInvitationSchema.index({ invitedEmail: 1 });
projectInvitationSchema.index({ projectId: 1 });
projectInvitationSchema.index({ status: 1 });
projectInvitationSchema.index({ expiresAt: 1 });

export class ProjectInvitationModel {
  private projectInvitation: mongoose.Model<IProjectInvitation>;

  constructor() {
    this.projectInvitation = mongoose.model<IProjectInvitation>('ProjectInvitation', projectInvitationSchema);
  }

  async create(invitationData: Partial<IProjectInvitation>): Promise<IProjectInvitation> {
    try {
      return await this.projectInvitation.create(invitationData);
    } catch (error) {
      console.error('Error creating project invitation:', error);
      throw new Error('Failed to create project invitation');
    }
  }

  async findById(invitationId: mongoose.Types.ObjectId): Promise<IProjectInvitation | null> {
    try {
      return await this.projectInvitation.findById(invitationId)
        .populate('projectId', 'name description')
        .populate('invitedBy', 'name email');
    } catch (error) {
      console.error('Error finding project invitation by ID:', error);
      throw new Error('Failed to find project invitation');
    }
  }

  async findByInvitationCode(invitationCode: string): Promise<IProjectInvitation | null> {
    try {
      return await this.projectInvitation.findOne({ invitationCode })
        .populate('projectId', 'name description ownerId')
        .populate('invitedBy', 'name email');
    } catch (error) {
      console.error('Error finding project invitation by code:', error);
      throw new Error('Failed to find project invitation');
    }
  }

  async findByEmail(email: string): Promise<IProjectInvitation[]> {
    try {
      return await this.projectInvitation.find({ invitedEmail: email })
        .populate('projectId', 'name description')
        .populate('invitedBy', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding project invitations by email:', error);
      throw new Error('Failed to find project invitations');
    }
  }

  async findByProjectId(projectId: mongoose.Types.ObjectId): Promise<IProjectInvitation[]> {
    try {
      return await this.projectInvitation.find({ projectId })
        .populate('invitedBy', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding project invitations by project:', error);
      throw new Error('Failed to find project invitations');
    }
  }

  async findByStatus(status: string, projectId?: mongoose.Types.ObjectId): Promise<IProjectInvitation[]> {
    try {
      const query: unknown = { status };
      if (projectId) query.projectId = projectId;

      return await this.projectInvitation.find(query)
        .populate('projectId', 'name description')
        .populate('invitedBy', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding project invitations by status:', error);
      throw new Error('Failed to find project invitations');
    }
  }

  async findPendingInvitations(projectId?: mongoose.Types.ObjectId): Promise<IProjectInvitation[]> {
    try {
      const query: unknown = { 
        status: 'pending',
        expiresAt: { $gt: new Date() }
      };
      if (projectId) query.projectId = projectId;

      return await this.projectInvitation.find(query)
        .populate('projectId', 'name description')
        .populate('invitedBy', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding pending project invitations:', error);
      throw new Error('Failed to find pending project invitations');
    }
  }

  async updateStatus(
    invitationId: mongoose.Types.ObjectId, 
    status: 'accepted' | 'declined' | 'expired'
  ): Promise<IProjectInvitation | null> {
    try {
      return await this.projectInvitation.findByIdAndUpdate(
        invitationId,
        { status },
        { new: true }
      ).populate('projectId', 'name description')
       .populate('invitedBy', 'name email');
    } catch (error) {
      console.error('Error updating project invitation status:', error);
      throw new Error('Failed to update project invitation status');
    }
  }

  async updateStatusByCode(
    invitationCode: string, 
    status: 'accepted' | 'declined' | 'expired'
  ): Promise<IProjectInvitation | null> {
    try {
      return await this.projectInvitation.findOneAndUpdate(
        { invitationCode },
        { status },
        { new: true }
      ).populate('projectId', 'name description')
       .populate('invitedBy', 'name email');
    } catch (error) {
      console.error('Error updating project invitation status by code:', error);
      throw new Error('Failed to update project invitation status');
    }
  }

  async delete(invitationId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.projectInvitation.findByIdAndDelete(invitationId);
    } catch (error) {
      console.error('Error deleting project invitation:', error);
      throw new Error('Failed to delete project invitation');
    }
  }

  async deleteByProjectId(projectId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.projectInvitation.deleteMany({ projectId });
    } catch (error) {
      console.error('Error deleting project invitations by project:', error);
      throw new Error('Failed to delete project invitations');
    }
  }

  async cleanupExpiredInvitations(): Promise<number> {
    try {
      const result = await this.projectInvitation.updateMany(
        { 
          status: 'pending',
          expiresAt: { $lt: new Date() }
        },
        { status: 'expired' }
      );

      return result.modifiedCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired invitations:', error);
      throw new Error('Failed to cleanup expired invitations');
    }
  }

  async generateInvitationCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  async createInvitation(
    projectId: mongoose.Types.ObjectId,
    invitedEmail: string,
    invitedBy: mongoose.Types.ObjectId,
    expiresInDays = 7
  ): Promise<IProjectInvitation> {
    try {
      const invitationCode = await this.generateInvitationCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      return await this.create({
        projectId,
        invitationCode,
        invitedEmail,
        invitedBy,
        role: 'user',
        status: 'pending',
        expiresAt,
      });
    } catch (error) {
      console.error('Error creating project invitation:', error);
      throw new Error('Failed to create project invitation');
    }
  }

  async isInvitationValid(invitationCode: string): Promise<boolean> {
    try {
      const invitation = await this.findByInvitationCode(invitationCode);
      return invitation !== null && 
             invitation.status === 'pending' && 
             invitation.expiresAt > new Date();
    } catch (error) {
      console.error('Error checking invitation validity:', error);
      return false;
    }
  }
}

export const projectInvitationModel = new ProjectInvitationModel();
