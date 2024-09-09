import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshDto: RefreshDto) {
    return await this.authService.refreshTokens(refreshDto.refresh_token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('validate')
  validateUser(@Req() req) {
    const user = req.user; // req.user devrait être défini par JwtAuthGuard
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    return { valid: true, user };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto) {
    return await this.authService.logout(
      logoutDto.access_token,
      logoutDto.refresh_token,
    );
  }
}
