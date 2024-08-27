import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto);
  }

  @Get()
  findAll(
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('clientName') clientName?: string,
    @Query('isPaid') isPaid?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : undefined;
    return this.invoicesService.findAll(
      storeId,
      parsedPage,
      parsedPageSize,
      clientName,
      isPaid,
    );
  }

  @Get('count')
  count(
    @Query('storeId') storeId: string,
    @Query('clientName') clientName?: string,
    @Query('isPaid') isPaid?: string,
  ) {
    return this.invoicesService.count(storeId, clientName, isPaid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, updateInvoiceDto);
  }
}
