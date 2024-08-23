import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoreService {
  constructor(private readonly databaseService: DatabaseService) {}

  findOne(id: string) {
    return this.databaseService.store.findUnique({ where: { id } });
  }

  update(id: string, updateStoreDto: UpdateStoreDto) {
    return this.databaseService.store.update({
      where: { id },
      data: updateStoreDto,
    });
  }
}
