import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Path aliases (e.g. the ones added by `nest g library`) live in tsconfig.json,
// so they are read from there instead of being duplicated here.
const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    // TypeScript 6 exige rootDir explícito (TS5011) y ts-jest compila cada
    // suite de forma aislada, por lo que se sobreescriben las opciones de
    // tsconfig.json que solo aplican a la compilación de producción.
    //
    // Nota: NestJS 12 publica sus paquetes como ESM puro y Jest solo admite
    // require(esm) nativo en Node >= 24.9 (la app en sí funciona en Node 22
    // porque Node soporta require(esm) desde la 22.12). Para ejecutar estos
    // tests se necesita Node >= 24.9.
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: {
          rootDir: '.',
          declaration: false,
          incremental: false,
        },
      },
    ],
  },
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
