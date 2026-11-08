import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreatePlayerDto {
  @IsNotEmpty()
  @IsString()
  fifaVersion: string;

  @IsNotEmpty()
  @IsString()
  fifaUpdate: string;

  @IsNotEmpty()
  @IsString()
  playerFaceUrl: string;

  @IsNotEmpty()
  @IsString()
  longName: string;

  @IsNotEmpty()
  @IsString()
  playerPositions: string;

  @IsOptional()
  @IsString()
  clubName?: string;

  @IsOptional()
  @IsString()
  nationalityName?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(99)
  overall: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(99)
  potential: number;

  @IsOptional()
  @IsInt()
  valueEur?: number;

  @IsOptional()
  @IsInt()
  wageEur?: number;

  @IsNotEmpty()
  @IsInt()
  @Min(15)
  @Max(60)
  age: number;

  @IsOptional()
  @IsInt()
  heightCm?: number;

  @IsOptional()
  @IsInt()
  weightKg?: number;

  @IsOptional()
  @IsString()
  preferredFoot?: string;

  @IsOptional()
  @IsInt()
  weakFoot?: number;

  @IsOptional()
  @IsInt()
  skillMoves?: number;

  // Habilidades numéricas principales (para el gráfico Radar)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  pace?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  shooting?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  passing?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  dribbling?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  defending?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  physic?: number;
}