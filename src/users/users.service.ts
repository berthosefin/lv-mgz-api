import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { username, password, storeName } = createUserDto;

    const hashed_password = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10),
    );

    try {
      // Create user
      const user = await this.databaseService.user.create({
        data: {
          username,
          hashed_password,
        },
      });

      // Create user's store
      const storeId = randomUUID();
      await this.databaseService.store.create({
        data: {
          id: storeId,
          name: storeName,
          userId: user.id,
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
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Erreur de contrainte unique, par exemple pour un username déjà existant
        throw new ConflictException('Username already exists');
      }
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

    delete user.hashed_password;

    return user;
  }

  async findByUsername(username: string) {
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

    return user;
  }

  async findById(id: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        id,
      },
      include: {
        store: {
          include: {
            cashDesk: true,
          },
        },
      },
    });

    return user;
  }
}
