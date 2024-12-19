# 📖 Manual Whisperer

## Documentation

### Basics

- [SolidJS Tutorial](https://www.solidjs.com/tutorial/introduction_basics) - learn the basics
- [SolidJS Docs](https://docs.solidjs.com/) - official docs
- [File-Based Routing](https://docs.solidjs.com/solid-start/building-your-application/routing#file-based-routing) - routing docs

### Libraries

- [Solid Primitives](https://primitives.solidjs.community/) - helpers
- [Solid Query](https://tanstack.com/query/latest/docs/framework/solid/overview) - data fetching and async state management
- [Kobalte (Headless UI)](https://kobalte.dev/docs/core/overview/introduction/) - UI components
- [Tailwindcss](https://tailwindcss.com/) - styling
- [Icones](https://icones.js.org/collection/material-symbols) - icons, copied to `src/components/icons/*Icon.tsx`

### Useful Links

- [SolidUI](https://www.solid-ui.com/docs/introduction) - reference reusable components built with Kobalte and Tailwind

## Prerequisites

- Node.js v20 (use [fnm](https://github.com/Schniz/fnm))
- pnpm v9
- VSCode with Prettier, ESLint, and Tailwind CSS IntelliSense extensions
- Docker (for pgvector)

## Setup environment variables

1. Copy `.env.example` to `.env` and supply the missing values

## Developing

Once you've created a project and installed dependencies with `pnpm install`, start a development server:

```bash
pnpm dev

# or start the server and open the app in a new browser tab
pnpm dev -- --open
```

### Linting

Run ESLint and Prettier to check and fix.

```bash
pnpm lint
```

## Building

Solid apps are built with _presets_, which optimise your project for deployment to different environments. You specify this in `app.config.js`.

We will use the default `node` preset.

```bash
pnpm build
```

## Transferring existing data store into docker volume

(Only needs to be done once)

Most manuals are already indexed, so we can use the existing data store in the `volume_data.tar` file to transfer into the docker volume. To transfer the existing data store into the docker volume, do the following:

1. Download the `volume_data.tar` file from this dropbox <a href="https://www.dropbox.com/scl/fo/pcyjdhn9u0gbc3cg4bqcr/AP00bJlP6axyt3-CGkqbmgo?rlkey=wtx9qxb61u2mel7w29lahfpix&st=0nm2or4x&dl=0">volume_data.tar</a>

2. Move the `volume_data.tar` file to the root of this project folder

3. Create a new volume called `db_data`

```bash
docker volume create db_data
```

4. In the project root, run the following to copy the existing data store into the new volume

```bash
docker run --rm -v db_data:/volume_data -v $(pwd):/backup busybox sh -c "cd /volume_data && tar xvf /backup/volume_data.tar --strip 1"
```

## Starting production server

1. First complete the build step above. It will create a `.output` directory with the compiled files.
2. (Linux) Copy the `sqlite-vec-linux-x64` folder from `node_modules` to `.output/server/`
3. (Mac) Copy the `sqlite-vec-darwin-x64` folder from `node_modules` to `.output/server/`
4. Start the data base container

```bash
docker-compose -f docker-compose-db.yml up -d
```

4. Start the production server

```bash
pnpm start
# or directly
node .output/server/index.mjs
```

## Migrations

Migrations are stored in `src/db/migrations`.

To create a new migration, run `pnpm drizzle-kit generate`.

To apply migrations, run `pnpm drizzle-kit migrate`.

To drop migrations, run `pnpm drizzle-kit drop`; [documentation](https://orm.drizzle.team/kit-docs/commands#drop-migration) recommends not deleting files in migrations folder manually, might break drizzle-kit.

## Initial Database Setup

Do the following to start off with a new database:

1. Run `pnpm drizzle-kit generate` to generate SQL migration script
1. Run `pnpm drizzle-kit migrate` to apply the migration to create the database tables
1. Run `npx tsx src/db/scripts/setup.ts` to create the virtual tables and triggers
1. If alarm embeddings (`data/alarm_embeddings.json` not present) are not created or to be recreated, run `npx tsx src/db/scripts/embed_alarms.ts` to create the embeddings for the alarms
1. Run `npx tsx src/db/scripts/seed.ts` to seed the database with the initial data

## Indexing new manuals (via scripts)

Follow the instructions in `src/rag/README.md`.
