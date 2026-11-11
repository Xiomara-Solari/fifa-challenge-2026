import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Validaciones alineadas con:
 * - La entidad `Player` (varchar(255) y columnas INT de MySQL).
 * - Los rangos de negocio ya definidos para valoraciones FIFA
 *   (overall/potencial 1-99, edad 15-60, habilidades 0-99).
 * - Los rangos derivados de los datos existentes en la tabla `players`
 *   (weak_foot/skill_moves 1-5, altura/peso humanos) y del límite de
 *   almacenamiento de un INT firmado (2.147.483.647) para importes en euros.
 */

// Debe contener al menos un carácter que no sea un espacio en blanco.
const NOT_BLANK = /\S/;
// URL absoluta con esquema http o https.
export const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;
// Límite de un INT firmado en MySQL (columnas `int` de la entidad).
export const INT_COLUMN_MAX = 2147483647;

export class CreatePlayerDto {
  @IsNotEmpty({ message: 'La versión FIFA es obligatoria' })
  @IsString()
  @MaxLength(255, { message: 'La versión FIFA no puede superar los 255 caracteres' })
  @Matches(NOT_BLANK, { message: 'La versión FIFA no puede estar vacía ni contener solo espacios' })
  fifaVersion: string;

  @IsNotEmpty({ message: 'La actualización FIFA es obligatoria' })
  @IsString()
  @MaxLength(255, { message: 'La actualización FIFA no puede superar los 255 caracteres' })
  @Matches(NOT_BLANK, { message: 'La actualización FIFA no puede estar vacía ni contener solo espacios' })
  fifaUpdate: string;

  @IsNotEmpty({ message: 'La URL de la foto del jugador es obligatoria' })
  @IsString()
  @MaxLength(255, { message: 'La URL de la foto no puede superar los 255 caracteres' })
  @Matches(HTTP_URL_PATTERN, { message: 'La URL de la foto debe empezar por http:// o https://' })
  playerFaceUrl: string;

  @IsNotEmpty({ message: 'El nombre del jugador es obligatorio' })
  @IsString()
  @MaxLength(255, { message: 'El nombre no puede superar los 255 caracteres' })
  @Matches(NOT_BLANK, { message: 'El nombre no puede estar vacío ni contener solo espacios' })
  longName: string;

  @IsNotEmpty({ message: 'Las posiciones del jugador son obligatorias' })
  @IsString()
  @MaxLength(255, { message: 'Las posiciones no pueden superar los 255 caracteres' })
  @Matches(NOT_BLANK, { message: 'Las posiciones no pueden estar vacías ni contener solo espacios' })
  playerPositions: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Si se indica, el club no puede estar vacío' })
  @MaxLength(255, { message: 'El club no puede superar los 255 caracteres' })
  @Matches(NOT_BLANK, { message: 'Si se indica, el club no puede contener solo espacios' })
  clubName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Si se indica, la nacionalidad no puede estar vacía' })
  @MaxLength(255, { message: 'La nacionalidad no puede superar los 255 caracteres' })
  @Matches(NOT_BLANK, { message: 'Si se indica, la nacionalidad no puede contener solo espacios' })
  nationalityName?: string;

  @IsNotEmpty({ message: 'La valoración general es obligatoria' })
  @IsInt({ message: 'La valoración general debe ser un número entero' })
  @Min(1, { message: 'La valoración general debe estar entre 1 y 99' })
  @Max(99, { message: 'La valoración general debe estar entre 1 y 99' })
  overall: number;

  @IsNotEmpty({ message: 'El potencial es obligatorio' })
  @IsInt({ message: 'El potencial debe ser un número entero' })
  @Min(1, { message: 'El potencial debe estar entre 1 y 99' })
  @Max(99, { message: 'El potencial debe estar entre 1 y 99' })
  potential: number;

  @IsOptional()
  @IsInt({ message: 'El valor de mercado debe ser un número entero' })
  @Min(0, { message: 'El valor de mercado no puede ser negativo' })
  @Max(INT_COLUMN_MAX, { message: 'El valor de mercado supera el máximo admitido por la base de datos' })
  valueEur?: number;

  @IsOptional()
  @IsInt({ message: 'El sueldo debe ser un número entero' })
  @Min(0, { message: 'El sueldo no puede ser negativo' })
  @Max(INT_COLUMN_MAX, { message: 'El sueldo supera el máximo admitido por la base de datos' })
  wageEur?: number;

  @IsNotEmpty({ message: 'La edad es obligatoria' })
  @IsInt({ message: 'La edad debe ser un número entero' })
  @Min(15, { message: 'La edad debe estar entre 15 y 60 años' })
  @Max(60, { message: 'La edad debe estar entre 15 y 60 años' })
  age: number;

  @IsOptional()
  @IsInt({ message: 'La altura debe ser un número entero en centímetros' })
  @Min(100, { message: 'La altura debe estar entre 100 y 250 cm' })
  @Max(250, { message: 'La altura debe estar entre 100 y 250 cm' })
  heightCm?: number;

  @IsOptional()
  @IsInt({ message: 'El peso debe ser un número entero en kilogramos' })
  @Min(30, { message: 'El peso debe estar entre 30 y 150 kg' })
  @Max(150, { message: 'El peso debe estar entre 30 y 150 kg' })
  weightKg?: number;

  @IsOptional()
  @IsIn(['Left', 'Right'], { message: 'El pie preferido debe ser "Left" o "Right"' })
  preferredFoot?: string;

  @IsOptional()
  @IsInt({ message: 'El pie débil debe ser un número entero' })
  @Min(1, { message: 'El pie débil debe estar entre 1 y 5' })
  @Max(5, { message: 'El pie débil debe estar entre 1 y 5' })
  weakFoot?: number;

  @IsOptional()
  @IsInt({ message: 'Las filigranas deben ser un número entero' })
  @Min(1, { message: 'Las filigranas deben estar entre 1 y 5' })
  @Max(5, { message: 'Las filigranas deben estar entre 1 y 5' })
  skillMoves?: number;

  // Habilidades numéricas principales (para el gráfico Radar)
  @IsOptional()
  @IsInt({ message: 'El ritmo debe ser un número entero' })
  @Min(0, { message: 'El ritmo debe estar entre 0 y 99' })
  @Max(99, { message: 'El ritmo debe estar entre 0 y 99' })
  pace?: number;

  @IsOptional()
  @IsInt({ message: 'El tiro debe ser un número entero' })
  @Min(0, { message: 'El tiro debe estar entre 0 y 99' })
  @Max(99, { message: 'El tiro debe estar entre 0 y 99' })
  shooting?: number;

  @IsOptional()
  @IsInt({ message: 'El pase debe ser un número entero' })
  @Min(0, { message: 'El pase debe estar entre 0 y 99' })
  @Max(99, { message: 'El pase debe estar entre 0 y 99' })
  passing?: number;

  @IsOptional()
  @IsInt({ message: 'El regate debe ser un número entero' })
  @Min(0, { message: 'El regate debe estar entre 0 y 99' })
  @Max(99, { message: 'El regate debe estar entre 0 y 99' })
  dribbling?: number;

  @IsOptional()
  @IsInt({ message: 'La defensa debe ser un número entero' })
  @Min(0, { message: 'La defensa debe estar entre 0 y 99' })
  @Max(99, { message: 'La defensa debe estar entre 0 y 99' })
  defending?: number;

  @IsOptional()
  @IsInt({ message: 'El físico debe ser un número entero' })
  @Min(0, { message: 'El físico debe estar entre 0 y 99' })
  @Max(99, { message: 'El físico debe estar entre 0 y 99' })
  physic?: number;
}
