import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findOne(id: string) {
    const store = await this.databaseService.store.findUnique({
      where: {
        id,
      },
      include: {
        cashDesk: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async update(id: string, updateStoreDto: UpdateStoreDto) {
    try {
      return this.databaseService.store.update({
        where: { id },
        data: updateStoreDto,
      });
    } catch (error) {
      throw error;
    }
  }
}
