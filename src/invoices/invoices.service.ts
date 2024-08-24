import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { DatabaseService } from 'src/database/database.service';
import { TransactionsService } from 'src/transactions/transactions.service';

@Injectable()
export class InvoicesService {
  constructor(
    private databaseService: DatabaseService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto) {
    const order = await this.databaseService.order.findUnique({
      where: { id: createInvoiceDto.orderId },
      include: {
        orderItems: {
          include: {
            article: true,
          },
        },
        store: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const amount = order.orderItems.reduce((acc, item) => {
      return acc + item.quantity * item.article.sellingPrice;
    }, 0);

    try {
      return await this.databaseService.invoice.create({
        data: {
          orderId: createInvoiceDto.orderId,
          clientId: createInvoiceDto.clientId,
          amount,
          isPaid: order.isPaid,
          invoiceItems: {
            create: order.orderItems.map((item) => ({
              articleId: item.articleId,
              quantity: item.quantity,
            })),
          },
          storeId: order.storeId,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return await this.databaseService.invoice.findMany({
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
        store: true,
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
    const invoice = await this.databaseService.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        invoiceItems: {
          include: {
            article: true,
          },
        },
        store: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto) {
    try {
      // Retrieve the existing invoice to check its isPaid status
      const existingInvoice = await this.findOne(id);

      // Prevent updating isPaid to false if it's already true
      if (existingInvoice.isPaid && updateInvoiceDto.isPaid === false) {
        throw new BadRequestException(
          'Cannot set isPaid to false as it is already true',
        );
      }

      // Proceed with the update if the above condition is not met
      const updatedInvoice = await this.databaseService.invoice.update({
        where: { id },
        data: updateInvoiceDto,
      });

      if (updateInvoiceDto.isPaid) {
        const order = await this.databaseService.order.findUnique({
          where: { id: updatedInvoice.orderId },
          include: {
            orderItems: {
              include: {
                article: true,
              },
            },
            store: {
              include: {
                cashDesk: true,
              },
            },
          },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        const totalAmount = order.orderItems.reduce(
          (acc, item) => acc + item.quantity * item.article.sellingPrice,
          0,
        );

        await this.transactionsService.create({
          type: 'IN',
          amount: totalAmount,
          label: 'Vente',
          articles: order.orderItems.map((item) => item.articleId),
          cashDeskId: order.store.cashDesk.id,
        });

        // Also update the associated order's isPaid status
        await this.databaseService.order.update({
          where: { id: order.id },
          data: { isPaid: updateInvoiceDto.isPaid },
        });
      }

      return updatedInvoice;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return this.databaseService.invoice.delete({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }
}
