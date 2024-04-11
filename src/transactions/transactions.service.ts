import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
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
    type?: TransactionType,
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
}
