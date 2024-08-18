import { Module } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticlesController } from './articles.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TokenBlacklistService } from 'src/token-blacklist/token-blacklist.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, TokenBlacklistService],
})
export class ArticlesModule {}
