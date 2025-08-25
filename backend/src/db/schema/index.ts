import {
  EnumUserRole, EnumDataStatus, EnumEventStatus, EnumDeviceType, EnumDataType, 
  PgEnumUserRole, PgEnumDataStatus, PgEnumDeviceType, PgEnumEventStatus, PgEnumDataType
} from './enum-db.ts';
import {
  EnumProjectType, PgEnumProjectType, EnumTransactionType,
  EnumProjectStatus, EnumProjectEventType,
  PgEnumProjectStatus, PgEnumProjectEventType, PgEnumTransactionType
} from './enum-projects.ts';
import {users, accounts, sessions, verifications} from './auth.ts';
import {projects, projectEvents, projectsCost} from './projects.ts';

// GROUP SCHEMA
export const schema = {
  PgEnumUserRole, PgEnumDataStatus, PgEnumDeviceType, PgEnumEventStatus,
  users, usersAccounts: accounts, usersSessions: sessions, usersVerifications: verifications,
  projects, projectEvents, projectsCost
};

export {
  EnumUserRole, EnumDataStatus, EnumEventStatus, EnumDeviceType, EnumDataType, 
  EnumProjectType, PgEnumProjectType, EnumProjectStatus, EnumProjectEventType, EnumTransactionType, 
  PgEnumUserRole, PgEnumDataStatus, PgEnumDeviceType, PgEnumEventStatus, PgEnumTransactionType,
  PgEnumDataType, PgEnumProjectStatus, PgEnumProjectEventType,
  users, accounts, sessions, verifications,
  projects, projectEvents, projectsCost
}
