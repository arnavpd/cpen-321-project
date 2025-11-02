import mongoose, { Schema, Document } from 'mongoose';

export interface IExpenseSplit {
  userId: mongoose.Types.ObjectId;
  amount: number;
  isPaid: boolean;
}

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  amount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  splits: IExpenseSplit[];
  status: 'pending' | 'fully_paid' | 'cancelled';
}

const expenseSplitSchema = new Schema<IExpenseSplit>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
});

const expenseSchema = new Schema<IExpense>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    splits: [expenseSplitSchema],
    status: {
      type: String,
      enum: ['pending', 'fully_paid', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for performance
expenseSchema.index({ projectId: 1, createdAt: -1 });
expenseSchema.index({ 'splits.userId': 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });

export class ExpenseModel {
  private expense: mongoose.Model<IExpense>;

  constructor() {
    this.expense = mongoose.model<IExpense>('Expense', expenseSchema);
  }

  async create(expenseData: Partial<IExpense>): Promise<IExpense> {
    try {
      return await this.expense.create(expenseData);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw new Error('Failed to create expense');
    }
  }

  async findById(expenseId: mongoose.Types.ObjectId): Promise<IExpense | null> {
    try {
      return await this.expense.findById(expenseId)
        .populate('createdBy', 'name email profilePicture')
        .populate('splits.userId', 'name email profilePicture');
    } catch (error) {
      console.error('Error finding expense by ID:', error);
      throw new Error('Failed to find expense');
    }
  }

  async findByProjectId(projectId: mongoose.Types.ObjectId): Promise<IExpense[]> {
    try {
      return await this.expense.find({ projectId })
        .populate('createdBy', 'name email profilePicture')
        .populate('splits.userId', 'name email profilePicture')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding expenses by project:', error);
      throw new Error('Failed to find expenses');
    }
  }

  async findByUserId(userId: mongoose.Types.ObjectId): Promise<IExpense[]> {
    try {
      return await this.expense.find({
        $or: [
          { createdBy: userId },
          { 'splits.userId': userId }
        ]
      })
        .populate('projectId', 'name')
        .populate('createdBy', 'name email profilePicture')
        .populate('splits.userId', 'name email profilePicture')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding expenses by user:', error);
      throw new Error('Failed to find expenses');
    }
  }

  async findByStatus(status: string, projectId?: mongoose.Types.ObjectId): Promise<IExpense[]> {
    try {
      const query: unknown = { status };
      if (projectId) {
        query.projectId = projectId;
      }
      
      return await this.expense.find(query)
        .populate('createdBy', 'name email profilePicture')
        .populate('splits.userId', 'name email profilePicture')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error finding expenses by status:', error);
      throw new Error('Failed to find expenses');
    }
  }

  async update(expenseId: mongoose.Types.ObjectId, updateData: Partial<IExpense>): Promise<IExpense | null> {
    try {
      return await this.expense.findByIdAndUpdate(expenseId, updateData, { new: true })
        .populate('createdBy', 'name email profilePicture')
        .populate('splits.userId', 'name email profilePicture');
    } catch (error) {
      console.error('Error updating expense:', error);
      throw new Error('Failed to update expense');
    }
  }

  async delete(expenseId: mongoose.Types.ObjectId): Promise<void> {
    try {
      await this.expense.findByIdAndDelete(expenseId);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw new Error('Failed to delete expense');
    }
  }

  async addSplit(expenseId: mongoose.Types.ObjectId, splitData: IExpenseSplit): Promise<IExpense | null> {
    try {
      return await this.expense.findByIdAndUpdate(
        expenseId,
        { $push: { splits: splitData } },
        { new: true }
      ).populate('splits.userId', 'name email profilePicture');
    } catch (error) {
      console.error('Error adding split to expense:', error);
      throw new Error('Failed to add split to expense');
    }
  }

  async updateSplit(expenseId: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId, isPaid: boolean): Promise<IExpense | null> {
    try {
      return await this.expense.findOneAndUpdate(
        { _id: expenseId, 'splits.userId': userId },
        { $set: { 'splits.$.isPaid': isPaid } },
        { new: true }
      ).populate('splits.userId', 'name email profilePicture');
    } catch (error) {
      console.error('Error updating expense split:', error);
      throw new Error('Failed to update expense split');
    }
  }

  async calculateTotalOwed(userId: mongoose.Types.ObjectId, projectId?: mongoose.Types.ObjectId): Promise<number> {
    try {
      const query: unknown = { 'splits.userId': userId, 'splits.isPaid': false };
      if (projectId) {
        query.projectId = projectId;
      }

      const expenses = await this.expense.find(query);
      return expenses.reduce((total, expense) => {
        const userSplit = expense.splits.find(split => split.userId.equals(userId));
        return total + (userSplit?.amount ?? 0);
      }, 0);
    } catch (error) {
      console.error('Error calculating total owed:', error);
      throw new Error('Failed to calculate total owed');
    }
  }

  async updateExpenseStatus(expenseId: mongoose.Types.ObjectId): Promise<IExpense | null> {
    try {
      const expense = await this.expense.findById(expenseId);
      if (!expense) return null;

      const allPaid = expense.splits.every(split => split.isPaid);
      const status = allPaid ? 'fully_paid' : 'pending';

      return await this.expense.findByIdAndUpdate(
        expenseId,
        { status },
        { new: true }
      ).populate('splits.userId', 'name email profilePicture');
    } catch (error) {
      console.error('Error updating expense status:', error);
      throw new Error('Failed to update expense status');
    }
  }
}

export const expenseModel = new ExpenseModel();
