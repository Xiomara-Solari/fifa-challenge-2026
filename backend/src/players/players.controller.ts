import { Controller, Param, ParseIntPipe, Get, Query } from '@nestjs/common';
import { PlayersService } from './players.service';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  async getAll(@Query() query: GetPlayersQueryDto) {
    return await this.playersService.findAll(query);
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return await this.playersService.findOne(id);
  }
}
