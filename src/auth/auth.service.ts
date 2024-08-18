import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly tokenBlaclkistService: TokenBlacklistService,
  ) {}
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UnauthorizedException('Wrong credential');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.hashed_password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Wrong credential');
    }

    delete user.hashed_password;
    return user;
  }

  async login(userDto: LoginDto): Promise<any> {
    const user = await this.usersService.findOne(userDto.username);
    const { accessToken } = await this.getTokens(user.id, user.username);
    return {
      access_token: accessToken,
    };
  }

  async logout(token: string) {
    try {
      await this.tokenBlaclkistService.create(token);
      return {
        msg: 'User disconnected',
      };
    } catch (error) {
      throw new ConflictException('User already disconnected');
    }
  }

  async getTokens(userId: string, username: string) {
    const payload = { sub: userId, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: `${process.env.JWT_SECRET}`,
        expiresIn: `${process.env.JWT_EXPIRATION_TIME}`,
      }),
      this.jwtService.signAsync(payload, {
        secret: `${process.env.JWT_REFRESH_SECRET}`,
        expiresIn: `${process.env.JWT_REFRESH_EXPIRATION_TIME}`,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
