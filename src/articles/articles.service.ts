import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    // Vérifiez si un article avec le même nom existe dans le store
    const existingArticle = await this.databaseService.article.findFirst({
      where: {
        name,
        storeId,
      },
    });

    // Si l'article existe et est marqué comme supprimé, on le met à jour
    if (existingArticle && existingArticle.deletedAt) {
      const updatedArticle = await this.databaseService.article.update({
        where: { id: existingArticle.id },
        data: {
          purchasePrice,
          sellingPrice,
          stock,
          unit,
          deletedAt: null, // Réactive l'article
        },
        include: {
          store: {
            include: {
              cashDesk: true,
            },
          },
        },
      });

      // Create transaction
      await this.transactionsService.create({
        type: 'OUT',
        amount: articleCost,
        label: 'Achat',
        articles: [updatedArticle.id],
        cashDeskId: updatedArticle.store.cashDesk.id,
      });

      return updatedArticle;
    }

    // Si l'article existe et n'est pas supprimé, on lance une erreur
    if (existingArticle) {
      throw new BadRequestException(
        'An article with this name already exists in the store.',
      );
    }

    // Get user's store
    const store = await this.storeService.findOne(storeId);

    try {
      // Créez un nouvel article
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

  async findAll(
    storeId: string,
    page?: number,
    pageSize?: number,
    search?: string,
  ) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    // Créez une condition de recherche
    const searchCondition = search
      ? {
          OR: [
            {
              name: {
                contains: search.toLocaleLowerCase(),
                // mode: 'insensitive',
              },
            },
            {
              unit: {
                contains: search.toLocaleLowerCase(),
                // mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const [articles, total] = await Promise.all([
      this.databaseService.article.findMany({
        skip,
        take,
        orderBy: {
          updatedAt: 'desc',
        },
        where: {
          storeId,
          deletedAt: null,
          ...searchCondition, // Ajoutez la condition de recherche
        },
      }),
      this.count(storeId, search),
    ]);

    return {
      total,
      articles,
    };
  }

  async count(storeId: string, search?: string) {
    const searchCondition = search
      ? {
          OR: [
            {
              name: {
                contains: search.toLocaleLowerCase(),
                // mode: 'insensitive',
              },
            },
            {
              unit: {
                contains: search.toLocaleLowerCase(),
                // mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    return await this.databaseService.article.count({
      where: {
        storeId,
        deletedAt: null,
        ...searchCondition, // Ajoutez la condition de recherche
      },
    });
  }

  async low(storeId: string) {
    return await this.databaseService.article.findMany({
      where: {
        storeId,
        deletedAt: null,
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
    // Vérifiez si l'article existe
    const article = await this.databaseService.article.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!article || article.deletedAt) {
      throw new NotFoundException('Article not found');
    }

    try {
      // Vérifiez si l'article est associé à une commande
      if (article.orderItems.length > 0) {
        throw new BadRequestException(
          'Cannot delete an article associated with an order.',
        );
      }

      // Marquez le article comme supprimé
      return await this.databaseService.article.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw error;
    }
  }
}
