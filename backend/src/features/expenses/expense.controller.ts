import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

import { expenseModel } from './expense.model';
import logger from '../../utils/logger.util';

export class ExpenseController {
  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const { projectId, description, amount, paidBy, splitBetween } = req.body;

      if (!projectId || !description || !amount || !paidBy || !splitBetween || splitBetween.length === 0) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
      }

      // Calculate split amount per person
      const amountPerPerson = amount / splitBetween.length;

      // Create splits array
      const splits = splitBetween.map((userId: string) => ({
        userId: new mongoose.Types.ObjectId(userId),
        amount: amountPerPerson,
        isPaid: userId === paidBy, // Mark as paid if they're the one who paid
      }));

      const expense = await expenseModel.create({
        projectId: new mongoose.Types.ObjectId(projectId),
        title: description,
        description: description,
        amount: amount,
        createdBy: new mongoose.Types.ObjectId(paidBy),
        splits: splits,
        status: 'pending',
      });

      logger.info(`Expense created successfully: ${expense._id}`);

      res.status(201).json({
        message: 'Expense created successfully',
        data: {
          id: expense._id,
          projectId: expense.projectId,
          description: expense.description,
          amount: expense.amount,
          paidBy: expense.createdBy,
          splitBetween: expense.splits.map(s => s.userId),
          amountPerPerson: amountPerPerson,
          createdAt: expense.createdAt,
          status: expense.status,
        }
      });
    } catch (error) {
      logger.error('Error creating expense:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getProjectExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const { projectId } = req.params;

      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({ message: 'Invalid project ID' });
        return;
      }

      const expenses = await expenseModel.findByProjectId(new mongoose.Types.ObjectId(projectId));

      logger.info(`Retrieved ${expenses.length} expenses for project: ${projectId}`);

      res.status(200).json({
        message: 'Expenses retrieved successfully',
        data: {
          data: expenses.map(expense => {
            // Handle populated createdBy (could be ObjectId or populated User object)
            const paidByUserId = typeof expense.createdBy === 'object' && expense.createdBy !== null && '_id' in expense.createdBy
              ? (expense.createdBy as any)._id.toString()
              : (expense.createdBy as any).toString();

            // Handle populated splits.userId (could be ObjectId or populated User object)
            const splitBetweenUserIds = expense.splits.map(s => {
              return typeof s.userId === 'object' && s.userId !== null && '_id' in s.userId
                ? (s.userId as any)._id.toString()
                : (s.userId as any).toString();
            });

            return {
              id: expense._id.toString(),
              description: expense.description || expense.title,
              amount: expense.amount,
              paidBy: paidByUserId,
              splitBetween: splitBetweenUserIds,
              amountPerPerson: expense.splits.length > 0 ? expense.splits[0].amount : 0,
              date: expense.createdAt.toISOString(),
            };
          })
        }
      });
    } catch (error) {
      logger.error('Error retrieving expenses:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const { expenseId } = req.params;

      if (!expenseId || !mongoose.Types.ObjectId.isValid(expenseId)) {
        res.status(400).json({ message: 'Invalid expense ID' });
        return;
      }

      const expense = await expenseModel.findById(new mongoose.Types.ObjectId(expenseId));
      
      if (!expense) {
        res.status(404).json({ message: 'Expense not found' });
        return;
      }

      // Check if user is the creator or project owner
      if (expense.createdBy.toString() !== userId?.toString()) {
        res.status(403).json({ message: 'Unauthorized to delete this expense' });
        return;
      }

      await expenseModel.delete(new mongoose.Types.ObjectId(expenseId));

      logger.info(`Expense deleted successfully: ${expenseId}`);

      res.status(200).json({
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting expense:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const expenseController = new ExpenseController();
