import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientsService } from 'src/clients/clients.service';
import { DatabaseService } from 'src/database/database.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { TransactionsService } from 'src/transactions/transactions.service';
import { InvoicesService } from 'src/invoices/invoices.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clientsService: ClientsService,
    private readonly transactionsService: TransactionsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const { orderItems, storeId, clientName, ...orderData } = createOrderDto;

    let client = await this.clientsService.findByName(clientName, storeId);

    if (!client) {
      try {
        client = await this.clientsService.create({
          name: createOrderDto.clientName.toLocaleLowerCase(),
          storeId: createOrderDto.storeId,
          email: '',
          phone: '',
          address: '',
          city: '',
        });
      } catch (error) {
        throw error;
      }
    }

    try {
      const order = await this.databaseService.order.create({
        data: {
          ...orderData,
          store: { connect: { id: storeId } },
          client: { connect: { id: client.id } },
          orderItems: {
            create: orderItems.map((item) => ({
              article: { connect: { id: item.articleId } },
              quantity: item.quantity,
            })),
          },
        },
        include: {
          store: {
            include: {
              cashDesk: true,
            },
          },
        },
      });

      // Création de la facture associée à la commande
      await this.invoicesService.create({
        orderId: order.id,
        clientId: client.id,
      });

      // Mise à jour de la caisse si la commande est payée
      if (orderData.isPaid) {
        const totalAmount = await this.calculateTotalAmount(orderItems);

        // Create transaction
        await this.transactionsService.create({
          type: 'IN',
          amount: totalAmount,
          label: 'Vente',
          articles: orderItems.map((item) => item.articleId),
          cashDeskId: order.store.cashDesk.id,
        });
      }

      // Mise à jour du stock si la commande est livrée
      if (orderData.isDelivered) {
        await this.updateStock(orderItems);
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  async findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return await this.databaseService.order.findMany({
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
      where: {
        client: {
          storeId,
        },
      },
      include: {
        client: true,
        orderItems: {
          include: {
            article: true,
          },
        },
        invoice: true,
      },
    });
  }

  async count(storeId: string) {
    return await this.databaseService.order.count({
      where: {
        storeId,
      },
    });
  }

  async findOne(id: string) {
    const order = await this.databaseService.order.findUnique({
      where: {
        id,
      },
      include: {
        orderItems: {
          include: {
            article: true,
          },
        },
        client: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    try {
      const existingOrder = await this.findOne(id);

      // Prevent updating isPaid to true if it's already true
      if (existingOrder.isPaid && updateOrderDto.isPaid === false) {
        throw new BadRequestException(
          'Cannot set isPaid to false as it is already true',
        );
      }

      // Prevent updating isDelivered to true if it's already true
      if (existingOrder.isDelivered && updateOrderDto.isDelivered === false) {
        throw new BadRequestException(
          'Cannot set isDelivered to false as it is already true',
        );
      }

      const updatedOrder = await this.databaseService.order.update({
        where: { id },
        data: updateOrderDto,
        include: {
          client: true,
          orderItems: true,
          store: {
            include: {
              cashDesk: true,
            },
          },
        },
      });

      const invoice = await this.databaseService.invoice.findUnique({
        where: {
          orderId: id,
        },
      });

      if (invoice) {
        // Mise à jour ou création de la facture associée à la commande
        await this.databaseService.invoice.update({
          where: {
            id: invoice.id,
          },
          data: {
            isPaid: updateOrderDto.isPaid,
          },
        });
      }

      // Mise à jour de la caisse si la commande est payée
      if (updateOrderDto.isPaid) {
        const totalAmount = await this.calculateTotalAmount(
          updatedOrder.orderItems,
        );

        // Create transaction
        await this.transactionsService.create({
          type: 'IN',
          amount: totalAmount,
          label: 'Vente',
          articles: updatedOrder.orderItems.map((item) => item.articleId),
          cashDeskId: updatedOrder.store.cashDesk.id,
        });
      }

      // Mise à jour du stock si la commande est livrée
      if (updateOrderDto.isDelivered) {
        await this.updateStock(updatedOrder.orderItems);
      }

      return updatedOrder;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const order = await this.databaseService.order.delete({
        where: { id },
      });
      return order;
    } catch (error) {
      throw error;
    }
  }

  private async calculateTotalAmount(
    orderItems: { articleId: string; quantity: number }[],
  ): Promise<number> {
    let totalAmount = 0;

    for (const item of orderItems) {
      const price = await this.getArticlePrice(item.articleId);
      totalAmount += item.quantity * price;
    }

    return totalAmount;
  }

  private async getArticlePrice(articleId: string): Promise<number> {
    const article = await this.databaseService.article.findUnique({
      where: { id: articleId },
      select: { sellingPrice: true },
    });
    return article.sellingPrice;
  }

  private async updateStock(items: { articleId: string; quantity: number }[]) {
    for (const item of items) {
      await this.databaseService.article.update({
        where: { id: item.articleId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }
  }
}
