import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { ReplenishArticleDto } from './dto/replenish-article.dto';

@ApiTags('articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  findAll(
    @Query('storeId') storeId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : undefined;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : undefined;
    return this.articlesService.findAll(
      storeId,
      parsedPage,
      parsedPageSize,
      search,
    );
  }

  @Get('count')
  count(@Query('storeId') storeId: string, @Query('search') search?: string) {
    return this.articlesService.count(storeId, search);
  }

  @Get('low')
  low(@Query('storeId') storeId: string) {
    return this.articlesService.low(storeId);
  }

  @ApiParam({ name: 'id', type: String })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @ApiParam({ name: 'id', type: String })
  @Patch(':id')
  replenish(
    @Param('id') id: string,
    @Body() replenishArticleDto: ReplenishArticleDto,
  ) {
    return this.articlesService.replenish(id, replenishArticleDto);
  }

  @ApiParam({ name: 'id', type: String })
  @Delete(':id')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
