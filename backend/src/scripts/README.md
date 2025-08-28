# Database Initialization Scripts

This directory contains scripts to initialize the database with sample data.

## Scripts

### init-user.ts
Creates an admin user in the database. This should be run first before other initialization scripts.

**Usage:**
```bash
# Development
npm run db:init_user_dev

# Production  
npm run db:init_user
```

### init-data.ts
Creates sample project data from `data/project-rumah.json`. This script will:

1. Create a project named "Pembangunan Rumah" (House Construction)
2. Create a hierarchical structure of project events (folders and files)
3. Associate cost information with each event
4. Set up the ltree path structure for efficient querying

**Prerequisites:**
- Database must be set up and migrated
- Admin user must exist (run `init-user.ts` first)

**Usage:**
```bash
# Development
npm run db:init_data_dev

# Production
npm run db:init_data
```

**Data Structure:**
The script creates a realistic house construction project with the following main categories:
- **Perencanaan** (Planning): Architecture design, permits, land survey
- **Keuangan** (Financing): Personal savings, bank loans, family support  
- **Bahan Bangunan** (Building Materials): Foundation, walls, roof, finishing materials
- **Tenaga Kerja** (Labor): Foreman, daily workers, helpers
- **Instalasi** (Installations): Electrical, water & sanitation
- **Dokumentasi & Lain-lain** (Documentation & Others): Photo documentation, celebration

Each event includes:
- Budget and actual costs in IDR currency
- Transaction types (income/expense)
- Actual completion dates
- Hierarchical folder/file organization

## Environment Variables
Make sure your `.env.devel` or `.env` file contains the required database configuration:
```
POSTGRES_HOST=localhost
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
POSTGRES_PORT=5432
```

## Troubleshooting

**"No users found in database"**: Run `init-user.ts` first to create an admin user.

**"Project already exists"**: The script checks for duplicate projects and will skip creation if one exists.

**Database connection errors**: Verify your environment variables and ensure PostgreSQL is running.