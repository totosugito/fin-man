import {useMutation, useQuery} from "@tanstack/react-query";
import {fetchApi} from "@/lib/fetch-api";
import {AppApi} from "@/constants/api";

export const useProjectEventCreate = () => {
  return useMutation({
    mutationKey: ['project-event-create'],
    mutationFn: async ({body}: { body: any }) => {
      return await fetchApi({method: "POST", url: `${AppApi.projectEvent.create}`, body: body, withCredentials: true});
    },
  });
}

export const useProjectEventPut = () => {
  return useMutation({
    mutationKey: ['project-event-put'],
    mutationFn: async ({id, body}: {id: string, body: Record<string, any>}) => {
      return await fetchApi({method: "PUT", url: `${AppApi.projectEvent.crud}/${id}`, body: body, withCredentials: true});
    },
  });
}

export const useProjectEventDelete = () => {
  return useMutation({
    mutationKey: ['project-event-delete'],
    mutationFn: async ({id}: {id: string}) => {
      return await fetchApi({method: "DELETE", url: `${AppApi.projectEvent.crud}/${id}`, withCredentials: true});
    },
  });
}

export const useProjectEventsByYearMonth = ({
  projectId,
  yearMonth,
  page = 1,
  limit = 50,
  sort = 'actualCreatedAt',
  order = 'desc',
  enabled = false
}: {
  projectId: string;
  yearMonth: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: string;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: ['project-events-by-year-month', projectId, yearMonth, page, limit, sort, order],
    queryFn: async () => {
      const params = new URLSearchParams({
        yearMonth,
        page: page.toString(),
        limit: limit.toString(),
        sort,
        order
      });
      return await fetchApi({
        method: "GET",
        url: `${AppApi.project.crud}/${projectId}/events?${params.toString()}`,
        withCredentials: true
      });
    },
    enabled
  });
}