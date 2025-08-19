export type ProjectMember = {
  id: string;
  parentId: string;
  name: number;
  description: string;
  eventType: string;
  sortOrder: number;
  path: string;
  depth: number;
  cost: Record<string, any>;
  children?: ProjectMember[];
  subRows?: ProjectMember[];
};

export const convertToTableData = (data: ProjectMember[]) => {
  return data.map((member) => {
    if (!member.children?.length) return;

    const newMember: ProjectMember = {
      ...member,
      subRows: member.children!.map((child) => {
        if (!child.children?.length) return child;

        const newChild: ProjectMember = {
          ...child,
          subRows: child.children
        };

        delete newChild.children;
        return newChild;
      })
    };

    delete newMember.children;
    return newMember;
  });
};
