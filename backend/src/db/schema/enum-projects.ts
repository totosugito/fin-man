import { pgEnum } from "drizzle-orm/pg-core";

export const EnumProjectType = {
  project: "project",
  template: "template",
};
export const PgEnumProjectType = pgEnum('project_type', Object.values(EnumProjectType) as [string, ...string[]]);

export const EnumProjectStatus = {
  draft: "draft",
  completed: "completed",
  ongoing: "ongoing",
  archived: "archived",
  deleted: "deleted",
};
export const PgEnumProjectStatus = pgEnum('project_status', Object.values(EnumProjectStatus) as [string, ...string[]]);

export const EnumProjectEventType = {
  folder: "folder",
  file: "file",
};
export const PgEnumProjectEventType = pgEnum('project_event_type', Object.values(EnumProjectEventType) as [string, ...string[]]);
