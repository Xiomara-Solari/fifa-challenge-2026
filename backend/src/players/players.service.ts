import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async findAll(query: GetPlayersQueryDto) {
    const { page = 1, limit = 10, name, club, position, fifaVersion } = query;

    const queryBuilder = this.playerRepository.createQueryBuilder('player');

    if (name) {
      queryBuilder.andWhere('player.longName LIKE :name', {
        name: `%${name}%`,
      });
    }

    if (club) {
      queryBuilder.andWhere('player.clubName LIKE :club', {
        club: `%${club}%`,
      });
    }

    if (position) {
      queryBuilder.andWhere('player.playerPositions LIKE :position', {
        position: `%${position}%`,
      });
    }

    if (fifaVersion) {
      queryBuilder.andWhere('player.fifaVersion = :fifaVersion', {
        fifaVersion,
      });
    }

    const skip = (page - 1) * limit;

    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('player.overall', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Buscar un jugador individual por ID
  async findOne(id: number): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`El jugador con ID ${id} no fue encontrado`);
    }

    return player;
  }
}