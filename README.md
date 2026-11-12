# FIFA Challenge — Plataforma de Gestión Histórica de Jugadores

Plataforma full-stack para explorar, administrar y analizar la evolución histórica de futbolistas a través de múltiples ediciones de FIFA (2015–2023). Combina un panel administrativo completo con visualización estadística interactiva, exportación de reportes, línea de tiempo cronológica y análisis narrativo generado con Inteligencia Artificial.

---

## Arquitectura y Tecnologías

El proyecto sigue una arquitectura desacoplada en **monorepo** (`frontend/`, `backend/`, `docker/`) orquestada con contenedores:

| Capa | Tecnología | Detalles principales |
| :--- | :--- | :--- |
| **Frontend** | **Angular 21 (Standalone)** (`@angular/core ^21.2.0`) | Signals (`input()`, `output()`, `computed()`, `effect()`), Reactive Forms, Lazy Loading (`loadComponent`), Control Flow moderno (`@if`, `@for`) y Vitest (`^4.0.8`) |
| **Visualización y Markdown** | **Chart.js** (`^4.6.1`), **marked** (`^18.2.0`), **DOMPurify** (`^3.4.17`) | Gráficos Radar de habilidades, gráficos de Líneas históricos y renderizado Markdown saneado contra XSS |
| **Backend** | **NestJS** (`^12.0.1`) | Arquitectura modular, Guards (`JwtAuthGuard`), Estrategia Passport JWT, `ValidationPipe` global con DTOs (`class-validator`) |
| **ORM y Base de Datos** | **TypeORM** (`^1.1.2`) + **MySQL 8.0** | `mysql2` con conexión `utf8mb4` y esquema relacional pre-cargado vía `docker/db/init.sql` |
| **IA Generativa** | **LangChain** (`@langchain/core ^1.3.5`, `@langchain/google-genai ^2.3.5`) | Composición LCEL (`PromptTemplate` → Modelo Google Gemini → `StringOutputParser`) |
| **Exportación** | **`@json2csv/plainjs`** (`^7.0.8`) | Generación dinámica de archivos CSV con BOM UTF-8 (`\uFEFF`) |
| **Infraestructura** | **Docker & Docker Compose + Nginx** (`nginx:1.27-alpine`, `node:22-alpine`) | *Multi-stage builds* en frontend y backend conectados en red privada (`fifa_network`) |

---

## Funcionalidades Principales

* **Autenticación y Seguridad JWT (`AuthModule`, `JwtAuthGuard` y `authGuard`):**
  * Registro (`POST /auth/register`) e inicio de sesión (`POST /auth/login`) con hashing seguro mediante `bcrypt`.
  * Interceptor HTTP en Angular para adjuntar automáticamente el token Bearer y `authGuard` protegiendo las rutas administrativas (`/players`, `/players/new`, `/players/edit/:id`, `/players/:id`).
* **Gestión CRUD de Jugadores:**
  * Listado paginado (`GET /players`) con filtros reactivos por **nombre**, **club**, **posición** y **edición de FIFA**.
  * Formulario reactivo único y reutilizable (`PlayerFormComponent`) para **creación** (`/players/new` → `POST /players`) y **edición** (`/players/edit/:id` → `PATCH /players/:id`) con validaciones estrictas tipadas en frontend y backend.
  * Vista de detalle (`/players/:id` → `GET /players/:id`) con perfil biográfico completo y **gráfico de radar (`Chart.js`)** para las 6 métricas core (*Ritmo, Tiro, Pase, Regate, Defensa, Físico*).
* **Exportación CSV Filtrada (`GET /players/export/csv`):**
  * Descarga directa desde el listado aplicando los filtros activos de búsqueda y añadiendo BOM UTF-8 para abrir tildes y caracteres especiales correctamente en Excel.

---

## Puntos Extra Implementados

### 1. Línea de Tiempo Histórica Interactiva (`GET /players/:id/history`)
* **Backend dedicado:** En lugar de depender de búsquedas por subcadena en el cliente, `PlayersService.getHistory(id)` resuelve la fila base por clave primaria, obtiene su `longName` exacto y consulta todas sus apariciones ordenadas cronológicamente (`CAST(fifaVersion AS UNSIGNED) ASC`, con desempate por `fifaUpdate` e `id`).
* **Frontend (`PlayerTimelineComponent`):** Componente Standalone presentacional alimentado mediante Signal Inputs desde `PlayerDetailComponent`:
  * **Gráfico lineal (`Chart.js`)** comparando la evolución de `Overall` y `Potencial` entre ediciones FIFA 15–23 y destacando la edición actualmente abierta.
  * **Timeline vertical** con variación interanual (`+Δ / -Δ`), pico histórico, club por temporada, valor de mercado y navegación reactiva (`route.paramMap` + `switchMap`) para saltar entre ediciones sin recargar la página.

### 2. Análisis Narrativo con IA Bajo Demanda (`GET /players/:id/narrative`)
* **Pipeline LangChain:** El backend reutiliza la consulta cronológica compartida para construir un resumen estadístico y generar una crónica periodística en tres actos (*Punto de partida y progresión*, *Etapa de consagración o pico* y *Transformación o madurez*).
* **Renderizado seguro bajo demanda:** En Angular se invoca **exclusivamente al pulsar el botón** *"Generar análisis con IA"* (evitando consumo innecesario de cuota y latencia inicial) y se transforma a HTML con `marked` + `DOMPurify` en un pipe personalizado (`MarkdownPipe`).

---

## Decisiones Técnicas y Funcionales

### ¿Por qué elegimos NestJS?
NestJS comparte la filosofía arquitectónica de Angular: organización basada en **módulos**, **inyección de dependencias**, **decoradores** y separación explícita de responsabilidades (`Controller` ↔ `Service` ↔ `Entity/DTO`) sobre **TypeScript estricto**. Esta simetría reduce la fricción cognitiva en el desarrollo full-stack, permite reutilizar modelos mentales entre frontend y backend (como DTOs frente a interfaces/formularios y Guards frente a `authGuard`) y facilita la incorporación de pruebas unitarias e integración continua.

### Manejo de la Base de Datos y Codificación (Mojibake)
* **`synchronize: false` en TypeORM:** La base de datos parte de un dump histórico voluminoso (`docker/db/init.sql`). Mantener `synchronize: false` en `AppModule` garantiza que TypeORM nunca altere, trunque o reconstruya automáticamente la estructura ni los registros iniciales de producción al levantar el servidor.
* **Resolución del Mojibake europeo y `utf8mb4`:** Al trabajar con nombres internacionales de futbolistas y clubes europeos (por ejemplo, *FC Bayern München*, tildes, eñes y diéresis), configuramos explícitamente `charset: 'utf8mb4'` en TypeORM y agregamos `\uFEFF` (UTF-8 BOM) en la exportación CSV. Para corregir de forma definitiva los registros heredados con doble codificación persistidos en la base de datos, ejecutamos sentencias `UPDATE` SQL directas dentro del contenedor de MySQL tras deshabilitar temporalmente los *Safe Updates* (`SET SQL_SAFE_UPDATES = 0;` antes de la corrección masiva y `SET SQL_SAFE_UPDATES = 1;` al finalizar).

### Orquestación con Docker, Multi-Stage Build y Nginx
* **Imágenes ligeras con *Multi-Stage Build*:**
  * En `frontend/Dockerfile`, la etapa `builder` (`node:22-alpine`) instala dependencias con `npm ci` y compila Angular en modo producción (`dist/frontend/browser`). La etapa final (`nginx:1.27-alpine`) descarta Node.js, `node_modules` y el código TypeScript, copiando únicamente los archivos estáticos resultantes.
  * En `backend/Dockerfile`, el mismo patrón compila TypeScript a JavaScript (`dist/main`) e instala únicamente dependencias de producción (`npm ci --omit=dev`) ejecutándose bajo el usuario sin privilegios `node`.
* **Enrutamiento Standalone en Nginx (`frontend/nginx.conf`):** Al usar rutas HTML5 limpias (`/players/5`, `/login`, `/players/new`), cualquier recarga (F5) directa enviaría la petición a Nginx. La directiva `try_files $uri $uri/ /index.html;` redirige las rutas virtuales hacia `index.html` para que el Router de Angular tome el control sin devolver errores `404`.
* **Puerto 80 y arranque coordinado:** `docker-compose.yml` conecta los tres contenedores (`mysql_db`, `backend`, `frontend`) en la red `fifa_network`, protege los datos existentes en el volumen `mysql_data`, usa `healthcheck` (`mysqladmin ping`) con `condition: service_healthy` para esperar a MySQL antes de iniciar NestJS, y expone Angular directamente en `http://localhost` (puerto `80:80`) y la API en `http://localhost:3000`.

---

## Instrucciones de Instalación y Ejecución

### Prerrequisitos
* [Docker](https://www.docker.com/) y Docker Compose instalados y en ejecución.
* Una API Key de Google Gemini (opcional solo si deseas ejecutar el botón de análisis narrativo con IA).

### Paso 1: Clonar el repositorio
```bash
git clone <URL_DEL_REPOSITORIO>
cd fifa-challenge
```

### Paso 2: Configurar variables de entorno
Crea el archivo `.env` en la raíz del proyecto y en `backend/.env` a partir de las plantillas `.env.example`:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Asegúrate de completar las variables necesarias:

**Raíz (`.env` — usado por `mysql_db` en Docker Compose):**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=football_db
DB_USER=fifa_user
DB_PASSWORD=tu_password_seguro
MYSQL_ROOT_PASSWORD=tu_root_password_seguro
```

**Backend (`backend/.env` — usado por `backend` en Docker Compose; `DB_HOST` es sobrescrito a `mysql_db` dentro del contenedor):**
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=football_db
DB_USER=fifa_user
DB_PASSWORD=tu_password_seguro
MYSQL_ROOT_PASSWORD=tu_root_password_seguro
JWT_SECRET=clave_secreta_jwt_segura
JWT_EXPIRES_IN=24h
GEMINI_API_KEY=tu_api_key_de_gemini
```

### Paso 3: Construir y levantar todo el ecosistema
Desde la raíz del repositorio:

```bash
docker-compose up -d --build
```
*(Si utilizas el plugin Compose v2 del CLI de Docker, también puedes ejecutar `docker compose up -d --build`).*

El primer arranque inicializará MySQL con `docker/db/init.sql`, esperará a que `mysql_db` supere su `healthcheck`, levantará NestJS en el puerto `3000` y servirá Angular a través de Nginx en el puerto `80`.

### Paso 4: Verificar los servicios
```bash
docker-compose ps
```

* **Aplicación Web (Angular + Nginx):** `http://localhost`
* **API REST (NestJS):** `http://localhost:3000`

---

## Estructura del Proyecto

```text
fifa-challenge/
├── backend/
│   ├── src/
│   │   ├── auth/                # Registro, Login, JWT Strategy y JwtAuthGuard
│   │   ├── players/             # CRUD, filtros, CSV, historial y narrativa LangChain
│   │   ├── app.module.ts        # Configuración TypeORM (synchronize: false, utf8mb4)
│   │   └── main.ts              # CORS y ValidationPipe global
│   ├── Dockerfile
│   ├── .dockerignore
│   └── .env.example
├── frontend/
│   ├── src/app/
│   │   ├── core/                # authGuard, jwtInterceptor, servicios HTTP y MainLayoutComponent
│   │   ├── features/
│   │   │   ├── auth/            # LoginComponent
│   │   │   └── players/         # Lista, Formulario único, Detalle y PlayerTimelineComponent
│   │   └── shared/              # Modelos TypeScript y MarkdownPipe (marked + DOMPurify)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .dockerignore
├── docker/
│   └── db/init.sql              # Esquema y dataset inicial FIFA
├── .env.example
└── docker-compose.yml           # Orquestación mysql_db + backend + frontend
```
