import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DatabaseService } from 'src/database/database.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ReplenishArticleDto } from './dto/replenish-article.dto';
import { SellArticleDto } from './dto/sell-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createArticleDto: CreateArticleDto) {
    const { name, purchasePrice, sellingPrice, stock, unit, storeId } =
      createArticleDto;
    const articleCost = purchasePrice * stock;

    // Get user's store
    const store = await this.databaseService.store.findUnique({
      where: {
        id: storeId,
      },
      include: {
        cashDesk: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Get user's cash desk
    const cashDesk = store.cashDesk;

    if (!cashDesk) {
      throw new NotFoundException('Cash desk not found');
    }

    // Check user's cash desk current amount
    if (cashDesk.currentAmount < articleCost) {
      throw new Error('Insufficient funds in cash desk');
    }

    try {
      // Create article
      const articleId = randomUUID();
      const articleData: Prisma.ArticleCreateInput = {
        id: articleId,
        name,
        purchasePrice,
        sellingPrice,
        stock,
        unit,
        store: { connect: { id: storeId } },
      };

      const article = await this.databaseService.article.create({
        data: articleData,
      });

      // Update user's cash desk
      const updatedCashDesk = await this.databaseService.cashDesk.update({
        where: {
          id: cashDesk.id,
        },
        data: {
          currentAmount: cashDesk.currentAmount - articleCost,
        },
      });

      if (!updatedCashDesk) {
        throw new Error('Failed to update cash desk');
      }

      // Create transaction
      const transaction = await this.createTransaction(
        'OUT',
        articleCost,
        'STOCK IN',
        [article.id],
        cashDesk.id,
      );

      if (!transaction) {
        throw new Error('Failed to create transaction');
      }

      return article;
    } catch (error) {
      throw error;
    }
  }

  findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return this.databaseService.article.findMany({
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
      where: {
        storeId,
      },
    });
  }

  count(storeId: string) {
    return this.databaseService.article.count({
      where: {
        storeId,
      },
    });
  }

  async findOne(id: string) {
    const article = await this.databaseService.article.findUnique({
      where: {
        id,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async replenish(
    id: string,
    { replenishQuantity, cashDeskId }: ReplenishArticleDto,
  ) {
    const article = await this.findOne(id);
    const replenishCost = article.purchasePrice * replenishQuantity;

    // Get user's cash desk
    const cashDesk = await this.databaseService.cashDesk.findUnique({
      where: {
        id: cashDeskId,
      },
    });

    if (!cashDesk) {
      throw new NotFoundException('Cash desk not found');
    }

    // Check user's cash desk current amount
    if (cashDesk.currentAmount < replenishCost) {
      throw new Error('Insufficient funds in cash desk');
    }

    try {
      // Update article
      const updatedStock = article.stock + replenishQuantity;
      const updatedArticle = await this.databaseService.article.update({
        where: { id },
        data: { stock: updatedStock },
      });

      if (!updatedArticle) {
        throw new Error('Failed to update article');
      }

      // Update user's cash desk
      const updatedCashDesk = await this.databaseService.cashDesk.update({
        where: {
          id: cashDeskId,
        },
        data: {
          currentAmount: cashDesk.currentAmount - replenishCost,
        },
      });

      if (!updatedCashDesk) {
        throw new Error('Failed to update cash desk');
      }

      // Create transaction
      const transaction = await this.createTransaction(
        'OUT',
        replenishCost,
        'STOCK IN',
        [updatedArticle.id],
        cashDeskId,
      );

      if (!transaction) {
        throw new Error('Failed to create transaction');
      }

      return updatedArticle;
    } catch (error) {
      throw error;
    }
  }

  async sell(sellArticleDto: SellArticleDto) {
    const { articles, sellQuantities, cashDeskId } = sellArticleDto;

    // Get user's cash desk
    const cashDesk = await this.databaseService.cashDesk.findUnique({
      where: {
        id: cashDeskId,
      },
    });

    if (!cashDesk) {
      throw new NotFoundException('Cash desk not found');
    }

    // Get articles
    const fetchedArticles = await Promise.all(
      articles.map((articleId) =>
        this.databaseService.article.findUnique({
          where: { id: articleId },
        }),
      ),
    );

    // Chesk articles stock
    let sellCost = 0;
    fetchedArticles.forEach((article, index) => {
      const articleSellCost = article.sellingPrice * sellQuantities[index];
      sellCost += articleSellCost;

      if (article.stock < sellQuantities[index]) {
        throw new Error(`Insufficient stock for article ${article.id}`);
      }
    });

    try {
      // Update articles
      await Promise.all(
        fetchedArticles.map(async (article, index) => {
          const updatedStock = article.stock - sellQuantities[index];
          await this.databaseService.article.update({
            where: { id: article.id },
            data: { stock: updatedStock },
          });
        }),
      );

      // Update user's cash desk
      const updatedCashDesk = await this.databaseService.cashDesk.update({
        where: {
          id: cashDeskId,
        },
        data: {
          currentAmount: cashDesk.currentAmount + sellCost,
        },
      });

      if (!updatedCashDesk) {
        throw new Error('Failed to update cash desk');
      }

      // Create transaction
      const transaction = await this.createTransaction(
        'IN',
        sellCost,
        'STOCK OUT',
        articles,
        cashDeskId,
      );

      if (!transaction) {
        throw new Error('Failed to create transaction');
      }

      return updatedCashDesk;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    const article = await this.findOne(id);

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Check article stock
    if (article.stock <= 0) {
      this.databaseService.article.delete({
        where: {
          id,
        },
      });
    } else {
      throw new Error('Failed to remove article ! Stock must be 0');
    }

    return article;
  }

  private async createTransaction(
    type: 'IN' | 'OUT',
    amount: number,
    label: string,
    articles: string[],
    cashDeskId: string,
  ) {
    const transactionId = randomUUID();

    return this.databaseService.transaction.create({
      data: {
        id: transactionId,
        type,
        amount,
        label,
        articles: { connect: articles.map((id) => ({ id })) },
        cashDesk: { connect: { id: cashDeskId } },
      },
    });
  }
}
