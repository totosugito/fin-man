## A. DB PREPARATION
### Create postgres user
```
psql -U postgres
CREATE USER sicerdas WITH PASSWORD 'a';
ALTER USER sicerdas WITH CREATEDB LOGIN;
ALTER USER sicerdas WITH SUPERUSER;
```

### Create database and extension
Create postgres user and create the database *fin_mot*
Run the following commands to add ltree extension
```
psql -U postgres -d fin_mot
CREATE EXTENSION IF NOT EXISTS ltree;
```

### generate migration file
```
npm run db:generate
npm run db:push
npm run db:init_user
```

### add table index
```
ALTER TABLE project_events DROP COLUMN depth;

ALTER TABLE project_events
  ALTER COLUMN path TYPE ltree
  USING path::ltree;

ALTER TABLE project_events
  ADD COLUMN depth int GENERATED ALWAYS AS (nlevel(path) - 1) STORED;
```

### Start the Fastify server as development mode
```
npm run dev
```
