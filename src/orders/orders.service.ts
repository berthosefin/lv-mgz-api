import { Injectable } from '@nestjs/common';
import { ClientsService } from 'src/clients/clients.service';
import { DatabaseService } from 'src/database/database.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly clientsService: ClientsService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    let client = await this.clientsService.findByName(
      createOrderDto.clientName,
    );

    if (!client) {
      client = await this.clientsService.create({
        name: createOrderDto.clientName,
        storeId: createOrderDto.storeId,
        email: '',
        phone: '',
        address: '',
        city: '',
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { storeId, orderItems, clientName, ...orderData } = createOrderDto;

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
    });

    // Mise à jour de la caisse si la commande est payée
    if (orderData.isPaid) {
      let totalAmount = 0;

      for (const item of orderItems) {
        const price = await this.getArticlePrice(item.articleId);
        totalAmount += item.quantity * price;
      }

      const updatedCashDesk = await this.databaseService.cashDesk.update({
        where: { storeId },
        data: { currentAmount: { increment: totalAmount } },
      });

      await this.databaseService.transaction.create({
        data: {
          type: 'IN',
          amount: totalAmount,
          label: `Achat`,
          cashDesk: { connect: { id: updatedCashDesk.id } },
          articles: {
            connect: orderItems.map((item) => ({ id: item.articleId })),
          },
        },
      });
    }

    // Mise à jour du stock si la commande est livrée
    if (orderData.isDelivered) {
      await this.updateStock(orderItems);
    }

    return order;
  }

  findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return this.databaseService.order.findMany({
      skip,
      take,
      orderBy: {
        updatedAt: 'desc',
      },
      where: {
        storeId,
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

  count(storeId: string) {
    return this.databaseService.order.count({
      where: {
        storeId,
      },
    });
  }

  findOne(id: string) {
    return this.databaseService.order.findUnique({
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
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const updatedOrder = await this.databaseService.order.update({
      where: { id },
      data: updateOrderDto,
      include: {
        store: true,
        client: true,
        orderItems: true,
      },
    });

    // Mise à jour de la caisse si la commande est payée
    if (updateOrderDto.isPaid) {
      let totalAmount = 0;

      for (const item of updatedOrder.orderItems) {
        const price = await this.getArticlePrice(item.articleId);
        totalAmount += item.quantity * price;
      }

      const updatedCashDesk = await this.databaseService.cashDesk.update({
        where: { storeId: updatedOrder.store.id },
        data: { currentAmount: { increment: totalAmount } },
      });

      await this.databaseService.transaction.create({
        data: {
          type: 'IN',
          amount: totalAmount,
          label: `Achat`,
          cashDesk: { connect: { id: updatedCashDesk.id } },
          articles: {
            connect: updatedOrder.orderItems.map((item) => ({
              id: item.articleId,
            })),
          },
        },
      });
    }

    // Mise à jour du stock si la commande est livrée
    if (updateOrderDto.isDelivered) {
      await this.updateStock(updatedOrder.orderItems);
    }

    return updatedOrder;
  }

  async remove(id: string) {
    const order = await this.databaseService.order.delete({
      where: { id },
    });
    return order;
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
