import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  findAll(
    @Query('cashDeskId') cashDeskId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : undefined;
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    if ((page && isNaN(parsedPage)) || (pageSize && isNaN(parsedPageSize))) {
      throw new BadRequestException(
        'Invalid page or pageSize values. Numeric values are expected.',
      );
    }

    return this.transactionsService.findAll(
      cashDeskId,
      parsedPage,
      parsedPageSize,
      type,
      parsedStartDate,
      parsedEndDate,
    );
  }

  @Get('totalIn')
  getTransactionsTotalIn(
    @Query('cashDeskId') cashDeskId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    return this.transactionsService.getTransactionsTotalIn(
      cashDeskId,
      parsedStartDate,
      parsedEndDate,
    );
  }

  @Get('totalOut')
  getTransactionsTotalOut(
    @Query('cashDeskId') cashDeskId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    return this.transactionsService.getTransactionsTotalOut(
      cashDeskId,
      parsedStartDate,
      parsedEndDate,
    );
  }

  @Get('count')
  count(
    @Query('cashDeskId') cashDeskId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    return this.transactionsService.count(
      cashDeskId,
      parsedStartDate,
      parsedEndDate,
    );
  }

  @Get('monthly-summary')
  async getMonthlySummary(
    @Query('storeId') storeId: string,
    @Query('year') year: number,
  ) {
    return this.transactionsService.getMonthlySummary(storeId, year);
  }
}
