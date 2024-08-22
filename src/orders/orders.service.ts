import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class OrdersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { storeId, clientId, orderItems, ...orderData } = createOrderDto;

    const order = await this.databaseService.order.create({
      data: {
        ...orderData,
        store: { connect: { id: storeId } },
        client: { connect: { id: clientId } },
        orderItems: {
          create: orderItems.map((item) => ({
            article: { connect: { id: item.articleId } },
            quantity: item.quantity,
          })),
        },
      },
    });

    await this.updateStock(orderItems);
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
    const order = await this.databaseService.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
        orderItems: {
          update: updateOrderDto.orderItems.map((item) => ({
            where: { id: item.id },
            data: { quantity: item.quantity },
          })),
        },
      },
    });

    await this.updateStock(updateOrderDto.orderItems);
    return order;
  }

  async remove(id: string) {
    const order = await this.databaseService.order.delete({
      where: { id },
    });
    return order;
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
