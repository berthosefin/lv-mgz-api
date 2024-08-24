import { Injectable, NotFoundException, Post } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post()
  async create(createClientDto: CreateClientDto) {
    try {
      const { name, ...clientData } = createClientDto;
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

  async findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return await this.databaseService.client.findMany({
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
    return await this.databaseService.client.count({
      where: {
        storeId,
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

    if (!client) {
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
    try {
      return await this.databaseService.client.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
