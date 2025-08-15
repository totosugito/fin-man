import {pgEnum} from "drizzle-orm/pg-core";

export const EnumUserRole = {
  admin: 'admin',
  teacher: 'teacher',
  user: 'user',
} as const;
export const PgEnumUserRole = pgEnum('UserRole', Object.values(EnumUserRole) as [string, ...string[]]);

export const EnumDataType = {
  book: 'book',
  test: 'test',
  course: 'course',
}
export const PgEnumDataType = pgEnum('data_type', Object.values(EnumDataType) as [string, ...string[]]);

export const EnumDataStatus = {
  published: 'published',
  unpublished: 'unpublished',
  archived: 'archived',
  deleted: 'deleted'
} as const
export const PgEnumDataStatus = pgEnum('status', Object.values(EnumDataStatus) as [string, ...string[]]);

export const EnumEventStatus = {
  view: 'view',
  download: 'download',
  read: 'read',
  like: 'like',
  dislike: 'dislike',
  share: 'share',
  bookmark: 'bookmark',
} as const
export const PgEnumEventStatus = pgEnum('event_status', Object.values(EnumEventStatus) as [string, ...string[]]);

export const EnumDeviceType = {
  mobile: 'mobile',
  desktop: 'desktop'
} as const
export const PgEnumDeviceType = pgEnum('device_type', Object.values(EnumDeviceType) as [string, ...string[]]);
