import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException('Missing authorization header');
    }

    // Vérifier si le token est blacklisté
    const isBlacklisted = await this.tokenBlacklistService.findOne(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been blacklisted');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: `${process.env.JWT_SECRET}`,
      });
      // 💡 On assigne le payload à l'objet request
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Invalid Token');
    }
    return true;
  }

  private extractTokenFromRequest(request: any): string | undefined {
    let token: string | undefined;

    // Vérifier dans les cookies
    if (request.cookies && request.cookies['access_token']) {
      token = request.cookies['access_token'];
    }

    // Vérifier dans le header Authorization si le token n'est pas dans les cookies
    if (!token && request.headers.authorization) {
      const [type, extractedToken] = request.headers.authorization.split(' ');
      if (type === 'Bearer') {
        token = extractedToken;
      }
    }

    return token;
  }
}
