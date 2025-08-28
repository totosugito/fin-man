import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import envConfig from "../config/env.config.ts";
import * as schema from '../db/schema/index.ts';
import { 
  projects, 
  projectEvents, 
  projectsCost, 
  users,
  EnumProjectStatus, 
  EnumProjectType, 
  EnumProjectEventType, 
  EnumTransactionType 
} from '../db/schema/index.ts';
import { computeEventCost } from '../services/project-event/update-cost.ts';

import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'development' ? '.env.devel' : '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface EventCost {
  transactionType: string;
  budgetCurrency: string;
  budget: string;
  actualCurrency: string;
  actual: string;
  hasActual: boolean;
  actualCreatedAt?: string;
}

interface ProjectEvent {
  name: string;
  eventType: string;
  cost?: EventCost;
  children?: ProjectEvent[];
}

interface ProjectData {
  name: string;
  description: string;
  events: ProjectEvent[];
}

// Track folder event IDs for cost computation
const folderEventIds: string[] = [];

async function createProjectEvents(
  db: any,
  events: ProjectEvent[],
  projectId: string,
  userId: string,
  parentId?: string,
  parentPath?: string
): Promise<void> {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const eventId = randomUUID();
    const eventPath = parentPath ? `${parentPath}.${eventId}` : eventId;

    try {
      // Insert project event
      console.log(`Creating event: ${event.name} (Type: ${event.eventType})`);
      
      await db.insert(projectEvents).values({
        id: eventId,
        projectId,
        userId,
        parentId: parentId || null,
        name: event.name,
        description: '',
        eventType: event.eventType as keyof typeof EnumProjectEventType,
        sortOrder: i,
        path: sql`${eventPath}::ltree`,
        extra: {},
      });

      // Insert project cost
      const costData: any = {
        projectEventId: eventId,
      };

      if (event.cost) {
        // Validate transaction type for file events
        if (event.eventType === 'file' && 
            event.cost.transactionType !== 'income' && 
            event.cost.transactionType !== 'expense') {
          throw new Error(`Invalid transaction type '${event.cost.transactionType}' for file event '${event.name}'. File events can only have 'income' or 'expense' transaction types.`);
        }
        
        costData.transactionType = event.cost.transactionType as keyof typeof EnumTransactionType;
        costData.budgetCurrency = event.cost.budgetCurrency;
        costData.budget = event.cost.budget;
        costData.actualCurrency = event.cost.actualCurrency;
        costData.actual = event.cost.actual;
        costData.hasActual = event.cost.hasActual;
        if (event.cost.actualCreatedAt) {
          costData.actualCreatedAt = new Date(event.cost.actualCreatedAt);
        }
        console.log(`  - Adding cost: ${event.cost.transactionType} ${event.cost.budgetCurrency} ${event.cost.budget}`);
      } else {
        // Default values for folder events
        costData.transactionType = EnumTransactionType.folder;
        costData.budgetCurrency = 'IDR';
        costData.budget = '0';
        costData.actualCurrency = 'IDR';
        costData.actual = '0';
        costData.hasActual = false;
      }

      await db.insert(projectsCost).values(costData);

      // Track folder events for later cost computation
      if (event.eventType === 'folder') {
        folderEventIds.push(eventId);
      }

      // Recursively create children
      if (event.children && event.children.length > 0) {
        console.log(`  - Creating ${event.children.length} child events for: ${event.name}`);
        await createProjectEvents(
          db,
          event.children,
          projectId,
          userId,
          eventId,
          eventPath
        );
      }
    } catch (error) {
      console.error(`Error creating event '${event.name}':`, error);
      throw error;
    }
  }
}

async function loadProjectDataFiles(): Promise<ProjectData[]> {
  const dataDir = join(__dirname, 'data');
  const files = await readdir(dataDir);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  const projectDataList: ProjectData[] = [];
  
  for (const file of jsonFiles) {
    try {
      const filePath = join(dataDir, file);
      const fileContent = await readFile(filePath, 'utf-8');
      const projectData = JSON.parse(fileContent) as ProjectData;
      projectDataList.push(projectData);
      console.log(`Loaded project data from: ${file}`);
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }
  
  return projectDataList;
}

async function createProject(
  db: any,
  projectData: ProjectData,
  userId: string
): Promise<void> {
  // Reset folder tracking array for this project
  folderEventIds.length = 0;

  // Check if project already exists
  const existingProject = await db.query.projects.findFirst({
    where: and(
      eq(projects.userId, userId),
      eq(projects.name, projectData.name)
    ),
  });

  if (existingProject) {
    console.log(`Project '${projectData.name}' already exists. Skipping.`);
    return;
  }

  // Use transaction to ensure all operations succeed or fail together
  await db.transaction(async (tx: any) => {
    // Create the project
    const [newProject] = await tx.insert(projects).values({
      userId,
      name: projectData.name,
      description: projectData.description,
      type: EnumProjectType.project,
      status: EnumProjectStatus.draft,
      tags: [],
      extra: {},
    }).returning({
      id: projects.id,
      name: projects.name,
    });

    console.log(`Created project: ${newProject.name} (ID: ${newProject.id})`);

    // Create project events from the JSON data
    await createProjectEvents(
      tx,
      projectData.events,
      newProject.id,
      userId
    );

    console.log('Project events and costs created successfully.');
    
    // Compute costs for all folder events to populate event_summary
    console.log(`Computing costs for ${folderEventIds.length} folder events...`);
    for (const folderId of folderEventIds) {
      await computeEventCost(folderId, tx);
    }
    console.log('Folder event summaries computed successfully.');
  });
}

async function seed() {
  const pool = new pg.Pool({
    connectionString: envConfig.db.url,
    max: 10,
  });

  const db = drizzle({ client: pool, schema });

  try {
    // Find an existing user (preferably admin) to associate with the project
    const existingUsers = await db.select().from(users).limit(1);
    
    if (existingUsers.length === 0) {
      console.log('No users found in database. Please run init-user script first.');
      return;
    }

    const userId = existingUsers[0].id;
    console.log(`Using user ID: ${userId}`);

    // Load all project data files
    const projectDataList = await loadProjectDataFiles();
    
    if (projectDataList.length === 0) {
      console.log('No project data files found in the data directory.');
      return;
    }

    console.log(`Found ${projectDataList.length} project data files. Processing...`);

    // Process each project
    for (const projectData of projectDataList) {
      console.log(`\n--- Processing project: ${projectData.name} ---`);
      await createProject(db, projectData, userId);
    }

    console.log('\nAll projects processed successfully.');

  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seed().then(() => {
  console.log('\n=== Project data seeding complete ===');
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
