import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post()
  async create(createClientDto: CreateClientDto) {
    const { name, ...clientData } = createClientDto;

    const existingClient = await this.databaseService.client.findFirst({
      where: {
        name: name.toLocaleLowerCase(),
      },
    });

    if (existingClient && existingClient.deletedAt) {
      return await this.databaseService.client.update({
        where: { id: existingClient.id },
        data: {
          deletedAt: null,
          ...clientData,
        },
      });
    }

    if (existingClient) {
      throw new BadRequestException(`Client with name ${name} already exists.`);
    }

    try {
      return await this.databaseService.client.create({
        data: {
          name: name.toLocaleLowerCase(),
          ...clientData,
        },
      });
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
              email: {
                contains: search.toLocaleLowerCase(),
                // mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    const [clients, total] = await Promise.all([
      await this.databaseService.client.findMany({
        skip,
        take,
        orderBy: {
          updatedAt: 'desc',
        },
        where: {
          storeId,
          deletedAt: null, // Exclure les clients supprimés,
          ...searchCondition,
        },
      }),
      this.count(storeId, search),
    ]);

    return {
      clients,
      total,
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
              email: {
                contains: search.toLocaleLowerCase(),
                // mode: 'insensitive',
              },
            },
          ],
        }
      : {};

    return await this.databaseService.client.count({
      where: {
        storeId,
        deletedAt: null, // Compter uniquement les clients non supprimés
        ...searchCondition,
      },
    });
  }

  async findOne(id: string) {
    const client = await this.databaseService.client.findUnique({
      where: {
        id,
      },
      include: {
        store: {
          include: {
            cashDesk: true,
          },
        },
        orders: {
          include: {
            orderItems: true,
          },
        },
        invoices: {
          include: {
            invoiceItems: true,
          },
        },
      },
    });

    if (!client || client.deletedAt) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async findByName(name: string, storeId: string) {
    return await this.databaseService.client.findUnique({
      where: {
        name_storeId: {
          name,
          storeId,
        },
      },
    });
  }

  async update(id: string, updateClientDto: UpdateClientDto) {
    try {
      return await this.databaseService.client.update({
        where: {
          id,
        },
        data: updateClientDto,
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    // Vérifiez si le client existe
    const client = await this.databaseService.client.findUnique({
      where: { id },
      include: {
        orders: true,
        invoices: true,
      },
    });

    if (!client || client.deletedAt) {
      throw new NotFoundException('Client not found');
    }

    try {
      // Vérifiez si le client a des orders non payés ou non livrés
      const hasUnpaidOrUndeliveredOrders = client.orders.some(
        (order) => !order.isPaid || !order.isDelivered,
      );

      // Vérifiez si le client a des invoices non payées
      const hasUnpaidInvoices = client.invoices.some(
        (invoice) => !invoice.isPaid,
      );

      if (hasUnpaidOrUndeliveredOrders || hasUnpaidInvoices) {
        throw new BadRequestException(
          'Client cannot be deleted because they have unpaid or undelivered orders or unpaid invoices.',
        );
      }

      // Marquez le client comme supprimé
      return await this.databaseService.client.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      throw error;
    }
  }
}
