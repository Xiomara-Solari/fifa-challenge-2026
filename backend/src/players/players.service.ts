import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parser } from '@json2csv/plainjs';
import { Player } from './entities/player.entity';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  // 1. Listado paginado con filtros
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

  // 2. Búsqueda individual por ID
  async findOne(id: number): Promise<Player> {
    const player = await this.playerRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException(`El jugador con ID ${id} no fue encontrado`);
    }

    return player;
  }

  // 3. Creación de jugador
  async create(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const newPlayer = this.playerRepository.create(createPlayerDto);
    return await this.playerRepository.save(newPlayer);
  }

  // 4. Modificación de jugador
  async update(id: number, updatePlayerDto: UpdatePlayerDto): Promise<Player> {
    const player = await this.findOne(id);
    const updatedPlayer = Object.assign(player, updatePlayerDto);
    return await this.playerRepository.save(updatedPlayer);
  }

  // 5. Exportación CSV filtrada con BOM UTF-8
  async getExportData(query: GetPlayersQueryDto): Promise<string> {
    const { name, club, position, fifaVersion } = query;

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

    queryBuilder.orderBy('player.overall', 'DESC');

    const players = await queryBuilder.getMany();

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Nombre', value: 'longName' },
      { label: 'Posiciones', value: 'playerPositions' },
      { label: 'Club', value: 'clubName' },
      { label: 'Nacionalidad', value: 'nationalityName' },
      { label: 'Valoración (Overall)', value: 'overall' },
      { label: 'Potencial', value: 'potential' },
      { label: 'Edad', value: 'age' },
      { label: 'Versión FIFA', value: 'fifaVersion' },
      { label: 'Ritmo (Pace)', value: 'pace' },
      { label: 'Tiro (Shooting)', value: 'shooting' },
      { label: 'Pase (Passing)', value: 'passing' },
      { label: 'Regate (Dribbling)', value: 'dribbling' },
      { label: 'Defensa (Defending)', value: 'defending' },
      { label: 'Físico (Physic)', value: 'physic' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(players);

    return `\uFEFF${csv}`;
  }
}