import { Injectable, NotFoundException, InternalServerErrorException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parser } from '@json2csv/plainjs';
import { Player } from './entities/player.entity';
import { GetPlayersQueryDto } from './dto/get-players-query.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
    private readonly configService: ConfigService,
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
  // Helper compartido para consultar todas las apariciones históricas de un futbolista
  private async findHistoryByLongName(longName: string): Promise<Player[]> {
    const history = await this.playerRepository
      .createQueryBuilder('player')
      .select([
        'player.id',
        'player.fifaVersion',
        'player.fifaUpdate',
        'player.longName',
        'player.playerPositions',
        'player.clubName',
        'player.age',
        'player.overall',
        'player.potential',
        'player.valueEur',
        'player.pace',
        'player.shooting',
        'player.passing',
        'player.dribbling',
        'player.defending',
        'player.physic',
      ])
      .where('player.longName = :longName', { longName })
      .orderBy('CAST(player.fifaVersion AS UNSIGNED)', 'ASC')
      .addOrderBy('CAST(player.fifaUpdate AS UNSIGNED)', 'ASC')
      .addOrderBy('player.id', 'ASC')
      .getMany();

    if (!history.length) {
      throw new NotFoundException(
        `No se encontraron registros históricos para ${longName}`,
      );
    }

    return history;
  }

  // 6. Historial cronológico para la línea de tiempo (FIFA 15-23)
  async getHistory(id: number) {
    const basePlayer = await this.findOne(id);
    const history = await this.findHistoryByLongName(basePlayer.longName);

    return {
      playerId: basePlayer.id,
      playerName: basePlayer.longName,
      totalEditionsTracked: history.length,
      history,
    };
  }

  // 7. Análisis narrativo de evolución histórica con LangChain / LLM
  async generateHistoricalNarrative(id: number) {
    // Paso A: Obtener el jugador base y todas sus apariciones históricas
    const basePlayer = await this.findOne(id);
    const history = await this.findHistoryByLongName(basePlayer.longName);

    // Paso C: Transformar el array de datos en un resumen textual legible para el LLM
    const formattedData = history
      .map(
        (entry) =>
          `- FIFA ${entry.fifaVersion} (${entry.clubName ?? 'Sin Club'}, ${entry.age} años): Overall ${entry.overall}, Potencial ${entry.potential} | Ritmo: ${entry.pace ?? 'N/A'}, Tiro: ${entry.shooting ?? 'N/A'}, Pase: ${entry.passing ?? 'N/A'}, Regate: ${entry.dribbling ?? 'N/A'}, Defensa: ${entry.defending ?? 'N/A'}, Físico: ${entry.physic ?? 'N/A'}`,
      )
      .join('\n');

    // Paso D: Configurar el Prompt y el Modelo de LangChain
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException(
        'GEMINI_API_KEY no está configurada en las variables de entorno',
      );
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-3.8-flash',
      temperature: 0.7,
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
Eres un analista deportivo de élite y periodista de fútbol internacional.
A continuación tienes la evolución estadística año a año de un futbolista extraída de las ediciones del videojuego FIFA:

Futbolista: {playerName}
Historial de datos:
{historicalData}

Instrucciones para la redacción:
1. Genera un análisis narrativo estructurado en tres bloques: 
   - 'Punto de partida y progresión': Cómo inició y su curva de crecimiento.
   - 'Etapa de consagración o pico': Su mejor versión y estadísticas destacadas.
   - 'Transformación o madurez': Adaptación de su estilo de juego según la evolución de sus habilidades físicas y técnicas.
2. Mantén un tono analítico, apasionado y periodístico.
3. Formatea la respuesta en Markdown limpio.
`);

    // Composición funcional de LangChain (LCEL)
    const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

    try {
      const narrative = await chain.invoke({
        playerName: basePlayer.longName,
        historicalData: formattedData,
      });

      return {
        playerId: basePlayer.id,
        playerName: basePlayer.longName,
        totalEditionsTracked: history.length,
        narrative,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';

      throw new InternalServerErrorException(
        `Error al generar la narrativa con IA: ${errorMessage}`,
      );
    }
  }
}