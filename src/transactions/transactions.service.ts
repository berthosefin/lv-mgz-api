import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DatabaseService } from 'src/database/database.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { type, amount, label, articles, cashDeskId } = createTransactionDto;

    // Get user's cash desk
    const cashDesk = await this.databaseService.cashDesk.findUnique({
      where: { id: cashDeskId },
    });

    if (!cashDesk) {
      throw new NotFoundException('Cash desk not found');
    }

    try {
      // Update user's cash desk
      if (type === 'IN') {
        const newAmount = cashDesk.currentAmount + amount;
        await this.databaseService.cashDesk.update({
          where: { id: cashDeskId },
          data: { currentAmount: newAmount },
        });
      } else if (type === 'OUT') {
        if (amount > cashDesk.currentAmount) {
          throw new Error('Transaction amount exceeds cash desk balance');
        }
        const newAmount = cashDesk.currentAmount - amount;
        await this.databaseService.cashDesk.update({
          where: { id: cashDeskId },
          data: { currentAmount: newAmount },
        });
      }

      // Create transaction
      const transactionId = randomUUID();
      const transactionData: Prisma.TransactionCreateInput = {
        id: transactionId,
        type,
        amount,
        label,
        cashDesk: { connect: { id: cashDeskId } },
      };

      if (articles && articles.length > 0) {
        transactionData.articles = {
          connect: articles.map((articleId) => ({ id: articleId })),
        };
      }

      return this.databaseService.transaction.create({
        data: transactionData,
      });
    } catch (error) {
      throw error;
    }
  }

  findAll(
    cashDeskId: string,
    page?: number,
    pageSize?: number,
    type?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    const where: Prisma.TransactionWhereInput = {};

    where.cashDeskId = cashDeskId;

    if (type) where.type = type;

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const include: Prisma.TransactionInclude = {
      articles: true,
    };

    return this.databaseService.transaction.findMany({
      where,
      include,
      take,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getTransactionsTotalIn(
    cashDeskId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.TransactionWhereInput = {
      cashDeskId,
      type: 'IN',
      ...(startDate && endDate
        ? { createdAt: { gte: startDate, lte: endDate } }
        : {}),
    };

    const totalIn = await this.databaseService.transaction.aggregate({
      where,
      _sum: { amount: true },
    });

    return totalIn._sum.amount || 0;
  }

  async getTransactionsTotalOut(
    cashDeskId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.TransactionWhereInput = {
      cashDeskId,
      type: 'OUT',
      ...(startDate && endDate
        ? { createdAt: { gte: startDate, lte: endDate } }
        : {}),
    };

    const totalOut = await this.databaseService.transaction.aggregate({
      where,
      _sum: { amount: true },
    });

    return totalOut._sum.amount || 0;
  }

  count(cashDeskId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.TransactionWhereInput = {};

    where.cashDeskId = cashDeskId;

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    return this.databaseService.transaction.count({ where });
  }

  async getMonthlySummary(storeId: string, year: number) {
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const transactions = await this.databaseService.transaction.groupBy({
      by: ['createdAt', 'type'],
      where: {
        cashDesk: {
          storeId: storeId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    // Initialize the summary for all 12 months
    const summary = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      sales: 0,
      purchases: 0,
    }));

    transactions.forEach((transaction) => {
      const month = new Date(transaction.createdAt).getMonth();
      const type = transaction.type;

      if (type === 'IN') {
        summary[month].sales += transaction._sum.amount || 0;
      } else if (type === 'OUT') {
        summary[month].purchases += transaction._sum.amount || 0;
      }
    });

    return summary;
  }
}
