import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { StoreService } from 'src/store/store.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ReplenishArticleDto } from './dto/replenish-article.dto';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly storeService: StoreService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(createArticleDto: CreateArticleDto) {
    const { name, purchasePrice, sellingPrice, stock, unit, storeId } =
      createArticleDto;
    const articleCost = purchasePrice * stock;

    // Get user's store
    const store = await this.storeService.findOne(storeId);

    try {
      // Create article
      const article = await this.databaseService.article.create({
        data: {
          name,
          purchasePrice,
          sellingPrice,
          stock,
          unit,
          store: { connect: { id: storeId } },
        },
      });

      // Create transaction
      await this.transactionsService.create({
        type: 'OUT',
        amount: articleCost,
        label: 'Achat',
        articles: [article.id],
        cashDeskId: store.cashDesk.id,
      });

      return article;
    } catch (error) {
      throw error;
    }
  }

  async findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return await this.databaseService.article.findMany({
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

  async count(storeId: string) {
    return await this.databaseService.article.count({
      where: {
        storeId,
      },
    });
  }

  async low(storeId: string) {
    return await this.databaseService.article.findMany({
      where: {
        storeId,
        stock: {
          lt: 10, // Définit le seuil du stock bas
        },
      },
    });
  }

  async findOne(id: string) {
    const article = await this.databaseService.article.findUnique({
      where: {
        id,
      },
      include: {
        store: {
          include: {
            cashDesk: true,
          },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  async replenish(id: string, { replenishQuantity }: ReplenishArticleDto) {
    const article = await this.findOne(id);

    try {
      // Update article
      const updatedArticle = await this.databaseService.article.update({
        where: {
          id,
        },
        data: {
          stock: {
            increment: replenishQuantity,
          },
        },
      });

      // Create transaction
      await this.transactionsService.create({
        type: 'OUT',
        amount: article.purchasePrice * replenishQuantity,
        label: 'Approvisionnement',
        articles: [article.id],
        cashDeskId: article.store.cashDesk.id,
      });

      return updatedArticle;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.databaseService.article.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
