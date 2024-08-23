import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class InvoicesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const order = await this.databaseService.order.findUnique({
      where: { id: createInvoiceDto.orderId },
      include: {
        orderItems: {
          include: {
            article: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const amount = order.orderItems.reduce((acc, item) => {
      return acc + item.quantity * item.article.sellingPrice;
    }, 0);

    return this.databaseService.invoice.create({
      data: {
        orderId: createInvoiceDto.orderId,
        clientId: createInvoiceDto.clientId,
        amount,
        status: 'UNPAID',
        invoiceItems: {
          create: order.orderItems.map((item) => ({
            articleId: item.articleId,
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return this.databaseService.invoice.findMany({
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
        order: true,
        client: true,
        invoiceItems: {
          include: {
            article: true,
          },
        },
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
    return this.databaseService.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        invoiceItems: {
          include: {
            article: true,
          },
        },
      },
    });
  }

  update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    return this.databaseService.invoice.update({
      where: { id },
      data: updateInvoiceDto,
    });
  }

  remove(id: string) {
    return this.databaseService.invoice.delete({
      where: { id },
    });
  }
}
