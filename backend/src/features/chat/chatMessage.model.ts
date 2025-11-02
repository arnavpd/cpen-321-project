import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'system';
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  createdAt: Date;
  isDeleted: boolean;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ['text', 'system'],
      default: 'text',
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Create indexes for performance
chatMessageSchema.index({ projectId: 1, createdAt: 1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ isDeleted: 1 });

export class ChatMessageModel {
  private chatMessage: mongoose.Model<IChatMessage>;

  constructor() {
    this.chatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
  }

  async create(messageData: Partial<IChatMessage>): Promise<IChatMessage> {
    try {
      return await this.chatMessage.create(messageData);
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw new Error('Failed to create chat message');
    }
  }

  async findById(messageId: mongoose.Types.ObjectId): Promise<IChatMessage | null> {
    try {
      return await this.chatMessage.findById(messageId)
        .populate('senderId', 'name email profilePicture');
    } catch (error) {
      console.error('Error finding chat message by ID:', error);
      throw new Error('Failed to find chat message');
    }
  }

  async findByProjectId(
    projectId: mongoose.Types.ObjectId, 
    limit = 50, 
    skip = 0
  ): Promise<IChatMessage[]> {
    try {
      return await this.chatMessage.find({ 
        projectId, 
        isDeleted: false 
      })
        .populate('senderId', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      console.error('Error finding chat messages by project:', error);
      throw new Error('Failed to find chat messages');
    }
  }

  async findByProjectIdChronological(
    projectId: mongoose.Types.ObjectId, 
    limit: number = 50, 
    skip: number = 0
  ): Promise<IChatMessage[]> {
    try {
      return await this.chatMessage.find({ 
        projectId, 
        isDeleted: false 
      })
        .sort({ createdAt: 1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      console.error('Error finding chat messages by project (chronological):', error);
      throw new Error('Failed to find chat messages');
    }
  }

  async findBySenderId(senderId: mongoose.Types.ObjectId, limit = 20): Promise<IChatMessage[]> {
    try {
      return await this.chatMessage.find({ 
        senderId, 
        isDeleted: false 
      })
        .populate('projectId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error finding chat messages by sender:', error);
      throw new Error('Failed to find chat messages');
    }
  }

  async findRecentMessages(projectId: mongoose.Types.ObjectId, hours = 24): Promise<IChatMessage[]> {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hours);

      return await this.chatMessage.find({
        projectId,
        createdAt: { $gte: since },
        isDeleted: false
      })
        .populate('senderId', 'name email profilePicture')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding recent chat messages:', error);
      throw new Error('Failed to find recent chat messages');
    }
  }

  async update(messageId: mongoose.Types.ObjectId, updateData: Partial<IChatMessage>): Promise<IChatMessage | null> {
    try {
      return await this.chatMessage.findByIdAndUpdate(messageId, updateData, { new: true })
        .populate('senderId', 'name email profilePicture');
    } catch (error) {
      console.error('Error updating chat message:', error);
      throw new Error('Failed to update chat message');
    }
  }

  async delete(messageId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Soft delete
      await this.chatMessage.findByIdAndUpdate(messageId, { isDeleted: true });
    } catch (error) {
      console.error('Error deleting chat message:', error);
      throw new Error('Failed to delete chat message');
    }
  }

  async hardDelete(messageId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.chatMessage.findByIdAndDelete(messageId);
    } catch (error) {
      console.error('Error hard deleting chat message:', error);
      throw new Error('Failed to hard delete chat message');
    }
  }

  async getMessageCount(projectId: mongoose.Types.ObjectId): Promise<number> {
    try {
      return await this.chatMessage.countDocuments({ 
        projectId, 
        isDeleted: false 
      });
    } catch (error) {
      console.error('Error getting message count:', error);
      throw new Error('Failed to get message count');
    }
  }

  async searchMessages(projectId: mongoose.Types.ObjectId, searchTerm: string): Promise<IChatMessage[]> {
    try {
      return await this.chatMessage.find({
        projectId,
        content: { $regex: searchTerm, $options: 'i' },
        isDeleted: false
      })
        .populate('senderId', 'name email profilePicture')
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (error) {
      console.error('Error searching chat messages:', error);
      throw new Error('Failed to search chat messages');
    }
  }
}

export const chatMessageModel = new ChatMessageModel();
