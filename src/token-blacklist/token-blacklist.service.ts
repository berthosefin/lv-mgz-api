import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  constructor(private databaseService: DatabaseService) {}

  async create(token: string) {
    try {
      return await this.databaseService.tokenBlacklist.create({
        data: {
          token,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  async findOne(token: string) {
    try {
      const blacklistedToken =
        await this.databaseService.tokenBlacklist.findUnique({
          where: {
            token: token,
          },
        });
      return blacklistedToken;
    } catch (error) {
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async handleCronDeleteToken() {
    this.logger.debug('Token cleanup cron job started');
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      await this.databaseService.tokenBlacklist.deleteMany({
        where: {
          createdAt: {
            lt: oneHourAgo,
          },
        },
      });

      this.logger.debug('Token cleanup cron job completed successfully');
    } catch (error) {
      this.logger.error(`An error occurred during token cleanup: ${error}`);
    }
  }
}
