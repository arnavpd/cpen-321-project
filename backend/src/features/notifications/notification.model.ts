import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  type: 'task_deadline' | 'expense_added' | 'chat_message' | 'task_assigned' | 'project_invitation' | 'task_completed' | 'expense_paid';
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['task_deadline', 'expense_added', 'chat_message', 'task_assigned', 'project_invitation', 'task_completed', 'expense_paid'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Create indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ projectId: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });

export class NotificationModel {
  private notification: mongoose.Model<INotification>;

  constructor() {
    this.notification = mongoose.model<INotification>('Notification', notificationSchema);
  }

  async create(notificationData: Partial<INotification>): Promise<INotification> {
    try {
      return await this.notification.create(notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  async findById(notificationId: mongoose.Types.ObjectId): Promise<INotification | null> {
    try {
      return await this.notification.findById(notificationId)
        .populate('projectId', 'name')
        .populate('userId', 'name email');
    } catch (error) {
      console.error('Error finding notification by ID:', error);
      throw new Error('Failed to find notification');
    }
  }

  async findByUserId(
    userId: mongoose.Types.ObjectId, 
    limit = 20, 
    skip = 0
  ): Promise<INotification[]> {
    try {
      return await this.notification.find({ userId })
        .populate('projectId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      console.error('Error finding notifications by user:', error);
      throw new Error('Failed to find notifications');
    }
  }

  async findByProjectId(projectId: mongoose.Types.ObjectId): Promise<INotification[]> {
    try {
      return await this.notification.find({ projectId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding notifications by project:', error);
      throw new Error('Failed to find notifications');
    }
  }

  async findUnreadByUserId(userId: mongoose.Types.ObjectId): Promise<INotification[]> {
    try {
      return await this.notification.find({ userId, isRead: false })
        .populate('projectId', 'name')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding unread notifications by user:', error);
      throw new Error('Failed to find unread notifications');
    }
  }

  async getUnreadCount(userId: mongoose.Types.ObjectId): Promise<number> {
    try {
      return await this.notification.countDocuments({ userId, isRead: false });
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw new Error('Failed to get unread notification count');
    }
  }

  async findByType(
    type: string, 
    userId?: mongoose.Types.ObjectId, 
    projectId?: mongoose.Types.ObjectId
  ): Promise<INotification[]> {
    try {
      const query: unknown = { type };
      if (userId) query.userId = userId;
      if (projectId) query.projectId = projectId;

      return await this.notification.find(query)
        .populate('projectId', 'name')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding notifications by type:', error);
      throw new Error('Failed to find notifications');
    }
  }

  async markAsRead(notificationId: mongoose.Types.ObjectId): Promise<INotification | null> {
    try {
      return await this.notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      ).populate('projectId', 'name');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllAsRead(userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  async markProjectNotificationsAsRead(userId: mongoose.Types.ObjectId, projectId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.notification.updateMany(
        { userId, projectId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking project notifications as read:', error);
      throw new Error('Failed to mark project notifications as read');
    }
  }

  async delete(notificationId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.notification.findByIdAndDelete(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  async deleteOldNotifications(daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.notification.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw new Error('Failed to delete old notifications');
    }
  }

  // Helper method to create common notification types
  async createTaskDeadlineNotification(
    userId: mongoose.Types.ObjectId,
    projectId: mongoose.Types.ObjectId,
    taskTitle: string,
    deadline: Date
  ): Promise<INotification> {
    return this.create({
      userId,
      projectId,
      type: 'task_deadline',
      title: 'Task Deadline Approaching',
      message: `Task "${taskTitle}" is due on ${deadline.toLocaleDateString()}`,
    });
  }

  async createTaskAssignedNotification(
    userId: mongoose.Types.ObjectId,
    projectId: mongoose.Types.ObjectId,
    taskTitle: string,
    assignedBy: string
  ): Promise<INotification> {
    return this.create({
      userId,
      projectId,
      type: 'task_assigned',
      title: 'New Task Assigned',
      message: `You have been assigned to task "${taskTitle}" by ${assignedBy}`,
    });
  }

  async createExpenseAddedNotification(
    userId: mongoose.Types.ObjectId,
    projectId: mongoose.Types.ObjectId,
    expenseTitle: string,
    amount: number,
    addedBy: string
  ): Promise<INotification> {
    return this.create({
      userId,
      projectId,
      type: 'expense_added',
      title: 'New Expense Added',
      message: `${addedBy} added expense "${expenseTitle}" for $${amount.toFixed(2)}`,
    });
  }

  async createProjectInvitationNotification(
    userId: mongoose.Types.ObjectId,
    projectId: mongoose.Types.ObjectId,
    projectName: string,
    invitedBy: string
  ): Promise<INotification> {
    return this.create({
      userId,
      projectId,
      type: 'project_invitation',
      title: 'Project Invitation',
      message: `${invitedBy} invited you to join project "${projectName}"`,
    });
  }
}

export const notificationModel = new NotificationModel();
