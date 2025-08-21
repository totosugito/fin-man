import React from "react";
import { Button } from "@/components/ui/button";
import { CiEdit, CiTrash } from "react-icons/ci";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { IoEllipsisVertical } from "react-icons/io5";
import { getProjectStatusStyle } from "@/lib/app-utils";
import { getDaysFromCurrentDate } from "@/lib/my-utils";
import { useTranslation } from "react-i18next";

type ProjectCardViewProps = {
  data: any[];
  loading: boolean;
  onEditClicked: (item: any) => void;
  onDeleteClicked: (item: any) => void;
  onShowDetail: (id: string) => void;
  t?: (key: string) => string;
};

export const ProjectCardView: React.FC<ProjectCardViewProps> = ({
  data,
  loading,
  onEditClicked,
  onDeleteClicked,
  onShowDetail,
  t = (key) => key, // Default translation function that returns the key
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No projects found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle
                  className="text-lg cursor-pointer hover:underline"
                  onClick={() => onShowDetail(item.id)}
                >
                  {item.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {item.description}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                    <IoEllipsisVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => onEditClicked(item)}>
                      <CiEdit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteClicked(item)}
                    >
                      <CiTrash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <Badge className={getProjectStatusStyle(item.status)}>
                  {item.status}
                </Badge>
                <Badge variant="outline">
                  {item.type}
                </Badge>
              </div>
              {item.updatedAt && (
                <div className="text-xs text-muted-foreground">
                  {t('labels.lastUpdated')}: {getDaysFromCurrentDate(t, item.updatedAt)?.value}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
