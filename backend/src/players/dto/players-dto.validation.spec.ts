import { ArgumentMetadata, BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreatePlayerDto } from './create-player.dto';
import { UpdatePlayerDto } from './update-player.dto';

// Misma configuración que el pipe global registrado en main.ts
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
});

const bodyMetadata = (metatype: new (...args: never[]) => object): ArgumentMetadata => ({
  type: 'body',
  metatype,
  data: undefined,
});

const validPayload = {
  fifaVersion: '23',
  fifaUpdate: '1',
  playerFaceUrl: 'https://cdn.sofifa.net/players/158/023/23_120.png',
  longName: 'Jugador De Prueba',
  playerPositions: 'ST, LW',
  overall: 85,
  potential: 90,
  age: 25,
  clubName: 'FC Barcelona',
  nationalityName: 'España',
  valueEur: 1000000,
  wageEur: 50000,
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
};

describe('CreatePlayerDto (a través del ValidationPipe global)', () => {
  it('acepta un payload completo válido', async () => {
    const result = await pipe.transform({ ...validPayload }, bodyMetadata(CreatePlayerDto));

    expect(result).toBeInstanceOf(CreatePlayerDto);
    expect(result.overall).toBe(85);
    expect(result.longName).toBe('Jugador De Prueba');
  });

  it('convierte números enviados como texto gracias a la conversión implícita', async () => {
    const result = await pipe.transform(
      { ...validPayload, overall: '88', age: '30' },
      bodyMetadata(CreatePlayerDto),
    );

    expect(result.overall).toBe(88);
    expect(result.age).toBe(30);
  });

  it.each([
    ['overall por encima del máximo', { overall: 100 }],
    ['overall por debajo del mínimo', { overall: 0 }],
    ['potencial fuera de rango', { potential: 150 }],
    ['edad por debajo del mínimo', { age: 14 }],
    ['edad por encima del máximo', { age: 61 }],
    ['ritmo fuera de rango', { pace: 100 }],
    ['pie débil fuera de rango', { weakFoot: 6 }],
    ['filigranas por debajo del mínimo', { skillMoves: 0 }],
    ['altura fuera de rango', { heightCm: 50 }],
    ['peso fuera de rango', { weightKg: 200 }],
    ['valor de mercado negativo', { valueEur: -1 }],
    ['sueldo por encima del límite de columna INT', { wageEur: 2147483648 }],
    ['decimales en un campo entero', { overall: 85.5 }],
    ['texto no numérico en un campo entero', { overall: 'abc' }],
    ['pie preferido inválido', { preferredFoot: 'Derecho' }],
    ['URL de foto sin esquema http/https', { playerFaceUrl: 'cdn.sofifa.net/foto.png' }],
    ['nombre compuesto solo por espacios', { longName: '   ' }],
    ['club enviado como cadena vacía', { clubName: '' }],
    ['nacionalidad compuesta solo por espacios', { nationalityName: '  ' }],
  ])('rechaza %s', async (_caso, cambios) => {
    await expect(
      pipe.transform({ ...validPayload, ...cambios }, bodyMetadata(CreatePlayerDto)),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza cuando faltan campos obligatorios', async () => {
    const incomplete = { ...validPayload } as Partial<typeof validPayload>;
    delete incomplete.longName;
    delete incomplete.overall;

    await expect(pipe.transform(incomplete, bodyMetadata(CreatePlayerDto))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('elimina propiedades no permitidas por la whitelist, incluido id', async () => {
    const result = await pipe.transform(
      { ...validPayload, id: 999, internationalReputation: 5, campoInventado: 'x' },
      bodyMetadata(CreatePlayerDto),
    );

    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('internationalReputation');
    expect(result).not.toHaveProperty('campoInventado');
  });

  it('permite null en opcionales y lo conserva sin convertirlo a cero', async () => {
    const result = await pipe.transform(
      { ...validPayload, clubName: null, valueEur: null },
      bodyMetadata(CreatePlayerDto),
    );

    expect(result.clubName).toBeNull();
    expect(result.valueEur).toBeNull();
  });
});

describe('UpdatePlayerDto (PartialType de CreatePlayerDto)', () => {
  it('acepta un objeto vacío (actualización parcial)', async () => {
    const result = await pipe.transform({}, bodyMetadata(UpdatePlayerDto));

    expect(result).toBeInstanceOf(UpdatePlayerDto);
  });

  it('acepta un subconjunto de campos válidos', async () => {
    const result = await pipe.transform({ overall: 91 }, bodyMetadata(UpdatePlayerDto));

    expect(result.overall).toBe(91);
  });

  it('rechaza valores fuera de rango', async () => {
    await expect(
      pipe.transform({ overall: 150 }, bodyMetadata(UpdatePlayerDto)),
    ).rejects.toThrow(BadRequestException);

    await expect(pipe.transform({ age: 10 }, bodyMetadata(UpdatePlayerDto))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza decimales en campos enteros', async () => {
    await expect(
      pipe.transform({ pace: 42.5 }, bodyMetadata(UpdatePlayerDto)),
    ).rejects.toThrow(BadRequestException);
  });

  it('elimina propiedades no permitidas (id no es editable)', async () => {
    const result = await pipe.transform({ id: 5, overall: 91 }, bodyMetadata(UpdatePlayerDto));

    expect(result).not.toHaveProperty('id');
    expect(result.overall).toBe(91);
  });

  it('conserva null en opcionales (borrado explícito de valores)', async () => {
    const result = await pipe.transform({ clubName: null }, bodyMetadata(UpdatePlayerDto));

    expect(result.clubName).toBeNull();
  });
});
