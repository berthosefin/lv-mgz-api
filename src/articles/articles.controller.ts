import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ReplenishArticleDto } from './dto/replenish-article.dto';
import { SellArticleDto } from './dto/sell-article.dto';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @ApiOperation({ summary: 'Create a new article in a store' })
  @Post()
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @ApiOperation({ summary: 'Get all articles in a store' })
  @ApiQuery({ name: 'storeId', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @Get()
  findAll(
    @Query('storeId') storeId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (page !== undefined && pageSize !== undefined) {
      const parsedPage = parseInt(page, 10);
      const parsedPageSize = parseInt(pageSize, 10);
      return this.articlesService.findAll(storeId, parsedPage, parsedPageSize);
    } else {
      return this.articlesService.findAll(storeId);
    }
  }

  @ApiOperation({ summary: 'Sell articles' })
  @Post('sell')
  sell(@Body() sellArticleDto: SellArticleDto) {
    return this.articlesService.sell(sellArticleDto);
  }

  @ApiOperation({ summary: 'Get the count of articles in a store' })
  @ApiQuery({ name: 'storeId', required: true, type: String })
  @Get('count')
  count(@Query('storeId') storeId: string) {
    return this.articlesService.count(storeId);
  }

  @ApiOperation({ summary: 'Get an article by ID' })
  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @ApiOperation({ summary: 'Replenish the stock of an article' })
  @ApiParam({ name: 'id', type: String })
  @Patch(':id')
  replenish(
    @Param('id') id: string,
    @Body() replenishArticleDto: ReplenishArticleDto,
  ) {
    return this.articlesService.replenish(id, replenishArticleDto);
  }

  @ApiOperation({ summary: 'Delete an article by ID' })
  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
