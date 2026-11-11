import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  ParseIntPipe,
  Header,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { PlayersService } from './players.service';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  async getAll(@Query() query: GetPlayersQueryDto) {
    return await this.playersService.findAll(query);
  }

  @Get('export/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="players.csv"')
  async exportCsv(@Query() query: GetPlayersQueryDto, @Res() res: Response) {
    const csvData = await this.playersService.getExportData(query);
    return res.send(csvData);
  }


  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.playersService.findOne(id);
  }

  @Get(':id/history')
  async getHistory(@Param('id', ParseIntPipe) id: number) {
    return await this.playersService.getHistory(id);
  }

  @Get(':id/narrative')
  async getNarrative(@Param('id', ParseIntPipe) id: number) {
    return await this.playersService.generateHistoricalNarrative(id);
  }


  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPlayerDto: CreatePlayerDto) {
    return await this.playersService.create(createPlayerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ) {
    return await this.playersService.update(id, updatePlayerDto);
  }
}