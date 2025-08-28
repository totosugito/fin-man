import {useMutation, useQuery} from "@tanstack/react-query";
import {fetchApi} from "@/lib/fetch-api";
import {AppApi} from "@/constants/api";

export const useProjectList = (params: { sort?: string; order?: 'asc' | 'desc' }) => {
  return useQuery({
    queryKey: ['project-list', params.sort, params.order],
    queryFn: async () => {
      const response = await fetchApi({method: "GET", url: `${AppApi.project.list}`, withCredentials: true, params: params});
      return(response);
    },
  });
}

export const useProjectGanttView = (params: { sort?: string; order?: 'asc' | 'desc'; details?: boolean }) => {
  return useQuery({
    queryKey: ['project-gantt-view', params.sort, params.order, params.details],
    queryFn: async () => {
      const response = await fetchApi({method: "GET", url: `${AppApi.project.ganttView}`, withCredentials: true, params: params});
      return(response);
    },
  });
}

export const useProjectCreate = () => {
  return useMutation({
    mutationKey: ['project-create'],
    mutationFn: async ({body}: { body: any }) => {
      return await fetchApi({method: "POST", url: `${AppApi.project.create}`, body: body, withCredentials: true});
    },
  });
}

export const useProjectPut = () => {
  return useMutation({
    mutationKey: ['project-put'],
    mutationFn: async ({id, body}: {id: string, body: any }) => {
      return await fetchApi({method: "PUT", url: `${AppApi.project.crud}/${id}`, body: body, withCredentials: true});
    },
  });
}

export const useProjectDetail = (id: string) => {
  return useQuery({
    queryKey: ['project-detail', id],
    queryFn: async () => {
      const response = await fetchApi({method: "GET", url: `${AppApi.project.crud}/${id}`, withCredentials: true});
      return(response?.data);
    },
  });
}

export const useProjectDelete = () => {
  return useMutation({
    mutationKey: ['project-delete'],
    mutationFn: async ({id}: {id: string}) => {
      return await fetchApi({method: "DELETE", url: `${AppApi.project.crud}/${id}`, withCredentials: true});
    },
  });
}
