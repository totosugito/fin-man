import {EnumProjectStatus} from "backend/src/db/schema";

export const getProjectStatusStyle = (status: string) => {
  switch (status) {
    case EnumProjectStatus.draft:
      return 'bg-blue-100 text-blue-800 border-blue-800';
    case EnumProjectStatus.ongoing:
      return 'bg-yellow-100 text-yellow-800 border-yellow-800';
    case EnumProjectStatus.completed:
      return 'bg-green-100 text-green-800 border-green-800';
    case EnumProjectStatus.archived:
      return 'bg-gray-100 text-gray-800 border-gray-800';
    case EnumProjectStatus.deleted:
      return 'bg-red-100 text-red-800 border-red-800';
    default:
  return 'bg-gray-100 text-gray-800 border-gray-800';
  }
}
