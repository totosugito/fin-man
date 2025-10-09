### 1. Create user DB
```
psql -U postgres
CREATE USER fin WITH PASSWORD 'man';
ALTER USER fin WITH CREATEDB LOGIN;
ALTER USER fin WITH SUPERUSER;
```

### 2. Create database and extension
Create postgres user and create the database *fin_man*
Run the following commands to add extensions
```
psql -U fin -d fin_man -h localhost -W
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 3. install backend dependency
```
cd backend
npm install
```

### 4. generate migration file
```
npm run db:generate
npm run db:push_dev
npm run db:init_user_dev
npm run db:init_data_dev
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
or
```
pm2 start npm --name "finman-9091" -- run  start
```
