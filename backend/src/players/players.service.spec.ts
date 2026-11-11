import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { Player } from './entities/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

describe('PlayersService', () => {
  let service: PlayersService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const playerRecord = {
    id: 5,
    fifaVersion: '23',
    fifaUpdate: '1',
    playerFaceUrl: 'https://cdn.sofifa.net/players/158/023/23_120.png',
    longName: 'Jugador De Prueba',
    playerPositions: 'ST',
    clubName: 'FC Test',
    nationalityName: 'España',
    overall: 85,
    potential: 90,
    valueEur: 1000000,
    wageEur: 50000,
    age: 25,
    heightCm: 180,
    weightKg: 75,
    preferredFoot: 'Left',
    weakFoot: 4,
    skillMoves: 4,
    pace: 80,
    shooting: 85,
    passing: 75,
    dribbling: 82,
    defending: 40,
    physic: 70,
  } as Player;

  const createDto: CreatePlayerDto = {
    fifaVersion: '23',
    fifaUpdate: '1',
    playerFaceUrl: 'https://cdn.sofifa.net/players/158/023/23_120.png',
    longName: 'Jugador De Prueba',
    playerPositions: 'ST',
    overall: 85,
    potential: 90,
    age: 25,
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: getRepositoryToken(Player), useValue: repository },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(PlayersService);
  });

  describe('findOne', () => {
    it('devuelve el jugador cuando existe', async () => {
      repository.findOne.mockResolvedValue(playerRecord);

      await expect(service.findOne(5)).resolves.toBe(playerRecord);
    });

    it('lanza NotFoundException cuando el jugador no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('crea y persiste el jugador con los datos del DTO', async () => {
      const created = { ...playerRecord };
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue({ ...created, id: 42 });

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result.id).toBe(42);
    });
  });

  describe('update', () => {
    it('actualiza un jugador existente conservando los campos no enviados', async () => {
      repository.findOne.mockResolvedValue(playerRecord);
      repository.save.mockImplementation(async (player: Player) => player);

      const dto: UpdatePlayerDto = { overall: 92, longName: 'Nuevo Nombre' };
      const result = await service.update(5, dto);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 5 } } as never);
      expect(result.overall).toBe(92);
      expect(result.longName).toBe('Nuevo Nombre');
      expect(result.age).toBe(25);
    });

    it('aplica null como borrado explícito de un campo opcional', async () => {
      repository.findOne.mockResolvedValue(playerRecord);
      repository.save.mockImplementation(async (player: Player) => player);

      const result = await service.update(5, { clubName: null });

      expect(result.clubName).toBeNull();
    });

    it('lanza NotFoundException si el jugador no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { overall: 50 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    const createQueryBuilderMock = (rows: Player[]) => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repository.createQueryBuilder.mockReturnValue(qb);
      return qb;
    };

    it('devuelve el historial cronológico ordenado para el longName del jugador', async () => {
      const historyRows = [
        { ...playerRecord, id: 1, fifaVersion: '21', overall: 82 },
        { ...playerRecord, id: 5, fifaVersion: '23', overall: 85 },
      ] as Player[];
      const qb = createQueryBuilderMock(historyRows);
      repository.findOne.mockResolvedValue(playerRecord);

      const result = await service.getHistory(5);

      expect(qb.where).toHaveBeenCalledWith('player.longName = :longName', {
        longName: playerRecord.longName,
      });
      expect(qb.orderBy).toHaveBeenCalledWith(
        'CAST(player.fifaVersion AS UNSIGNED)',
        'ASC',
      );
      expect(result).toEqual({
        playerId: 5,
        playerName: playerRecord.longName,
        totalEditionsTracked: 2,
        history: historyRows,
      });
    });

    it('lanza NotFoundException si el jugador base no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.getHistory(999)).rejects.toThrow(NotFoundException);
    });

    it('lanza NotFoundException si no existen registros históricos', async () => {
      createQueryBuilderMock([]);
      repository.findOne.mockResolvedValue(playerRecord);

      await expect(service.getHistory(5)).rejects.toThrow(NotFoundException);
    });
  });
});
