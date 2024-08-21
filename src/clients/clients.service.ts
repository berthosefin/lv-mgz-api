import { Injectable, Post } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post()
  create(createClientDto: CreateClientDto) {
    return this.databaseService.client.create({
      data: createClientDto,
    });
  }

  findAll(storeId: string, page?: number, pageSize?: number) {
    const take = pageSize || undefined;
    const skip = page && pageSize ? (page - 1) * pageSize : undefined;

    return this.databaseService.client.findMany({
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
    return this.databaseService.client.count({
      where: {
        storeId,
      },
    });
  }

  findOne(id: string) {
    return this.databaseService.client.findUnique({ where: { id } });
  }

  update(id: string, updateClientDto: UpdateClientDto) {
    return this.databaseService.client.update({
      where: { id },
      data: updateClientDto,
    });
  }

  remove(id: string) {
    return this.databaseService.client.delete({ where: { id } });
  }
}
