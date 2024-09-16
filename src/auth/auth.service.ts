import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Wrong credential');
    }

    const isPasswordMatching = await bcrypt.compare(pass, user.hashedPassword);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Wrong credential');
    }

    delete user.hashedPassword;
    return user;
  }

  async login(userDto: LoginDto): Promise<any> {
    // Utilisez validateUser pour vérifier les informations d'identification
    const user = await this.validateUser(userDto.email, userDto.password);
    const { accessToken, refreshToken } = await this.getTokens(
      user.id,
      user.username,
      user.store.id,
      user.store.cashDesk.id,
      user.store.currency,
    );

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        storeId: user.store.id,
        cashDeskId: user.store.cashDesk.id,
        currency: user.store.currency,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async logout(token: string, refreshToken: string) {
    try {
      await this.tokenBlacklistService.create(token);
      await this.tokenBlacklistService.create(refreshToken);
      return {
        msg: 'User disconnected',
      };
    } catch (error) {
      throw new ConflictException('User already disconnected');
    }
  }

  async getTokens(
    userId: string,
    username: string,
    storeId: string,
    cashDeskId: string,
    currency: string,
  ) {
    const payload = { sub: userId, username, storeId, cashDeskId, currency };

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

  async refreshTokens(refreshToken: string) {
    const isBlacklisted =
      await this.tokenBlacklistService.findOne(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted');
    }

    try {
      const { sub } = await this.jwtService.verifyAsync(refreshToken, {
        secret: `${process.env.JWT_REFRESH_SECRET}`,
      });

      const user = await this.usersService.findById(sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const accessToken = await this.jwtService.signAsync(
        { sub: user.id, username: user.username },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: process.env.JWT_EXPIRATION_TIME,
        },
      );

      return {
        access_token: accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
