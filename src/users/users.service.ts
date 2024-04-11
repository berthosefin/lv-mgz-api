import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { id, username, password, storeName } = createUserDto;

    try {
      // Create user
      const user = await this.databaseService.user.create({
        data: {
          id,
          username,
          hashed_password: password,
        },
      });

      // Create user's store
      const storeId = randomUUID();
      await this.databaseService.store.create({
        data: {
          id: storeId,
          name: storeName,
          userId: id,
        },
      });

      // Create user's cash desk
      const cashDeskId = randomUUID();
      await this.databaseService.cashDesk.create({
        data: {
          id: cashDeskId,
          currentAmount: 0,
          storeId,
        },
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  async findOne(username: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        username,
      },
      include: {
        store: {
          include: {
            cashDesk: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
