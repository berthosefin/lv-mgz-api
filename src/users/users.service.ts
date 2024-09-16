import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, storeName, currency } = createUserDto;

    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10),
    );

    try {
      return await this.databaseService.user.create({
        data: {
          username: username.toLowerCase(),
          email,
          hashedPassword,
          store: {
            create: {
              name: storeName,
              currency,
              cashDesk: {
                create: {
                  currentAmount: 0,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Erreur de contrainte unique, par exemple pour un username déjà existant
        throw new ConflictException('Username or Email already exists');
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

    delete user.hashedPassword;

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        email,
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
