# Usage

## Setup

Ensure `.env` is set up with the correct values.
Ensure docker is running.

Run the following command to start the postgres db container with pgvector extension:

```bash
docker-compose -f docker-compose-db.yml up -d
```

There is a pgadmin container that you can use to view the database. Go to `localhost:8080`, select `PostgreSQL` for the `System`, put `db` for the `Server`, the username is `postgres` and password is `example`. `database` is `postgres` to view the pgadmin interface e.g. database data, schemas, tables, etc.

Showing the db container logs

```bash
docker-compose -f docker-compose-db.yml logs -f
```

## Parsing pdf manuals

1. Put the pdf manual(s) in the `data/manuals` folder.
1. Update the `fileName` in the `src/rag/scripts/parse.ts` file to the name of the pdf manual you want to parse. E.g. `B-63945EN_02_V2004-07-26.pdf`.
1. Run the following command to parse the pdf manuals i.e. convert the pdf pages (text, tables) into json objects:

```bash
pnpm run parse
```

## Indexing the parsed data

Index means generating the embeddings for the parsed pdf manual pages and storing the embeddings in the vector store, and the parsed text in a document store.

1. Update the `fileName` in the `src/rag/scripts/index.ts` file to the name of the parsed json file under `data/parsed` that you want to index. E.g. `B-63945EN_02_V2004-07-26.json`.
1. Run the following command to index the parsed data:
   This will take a while to complete e.g. ~10-15 mins for ~800 pages pdf manual.

```bash
pnpm run index # or npx tsx src/rag/scripts/index.ts
```

Update the `MODEL_TO_MANUALS_MAP` in the `src/rag/base.ts` file mapping the model name to the pdf manual names.

## Testing out the retrieval

1. Update the `collectionName` in the `src/rag/scripts/retrieve.ts` file to the name of the collection (which is the name of the pdf manual) you want to query. e.g. `B-63945EN_02_V2004-07-26`
1. Run the following command to test out the chunks retrieved are somewhat expected:

```bash
pnpm run retrieve # or npx tsx src/rag/scripts/retrieve.ts
```

## Shutdown

Shutdown db container (but preserve data)

```bash
docker-compose -f docker-compose-db.yml down
```

Shutdown db container and remove data (remove volumes)
Caution! Removing the volumes will remove all the database data.

```bash
docker-compose -f docker-compose-db.yml down -v
```
