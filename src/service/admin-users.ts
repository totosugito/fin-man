import {useMutation, useQuery, UseQueryOptions} from "@tanstack/react-query";
import {fetchApi} from "@/lib/fetch-api";
import {AppApi} from "@/constants/api";

export const useAdminUserList = (options?: Partial<UseQueryOptions<any, Error>>) => {
  return useQuery({
    queryKey: ['admin-user-list'],
    queryFn: async () => {
      const response = await fetchApi({method: "GET", url: `${AppApi.admin.user.list}`, withCredentials: true});
      return(response);
    },
  });
}

export const useAdminUserCreate = () => {
  return useMutation({
    mutationKey: ['admin-user-create'],
    mutationFn: async ({body}: { body: any }) => {
      return await fetchApi({method: "POST", url: `${AppApi.admin.user.create}`, body: body, withCredentials: true});
    },
  });
}

export const useAdminUserPut = () => {
  return useMutation({
    mutationKey: ['admin-user-put'],
    mutationFn: async ({id, body}: {id: string, body: any }) => {
      return await fetchApi({method: "PUT", url: `${AppApi.admin.user.crud}/${id}`, body: body, withCredentials: true});
    },
  });
}

export const useAdminUserDelete = () => {
  return useMutation({
    mutationKey: ['admin-user-delete'],
    mutationFn: async ({body}: { body: any }) => {
      return await fetchApi({method: "DELETE", url: `${AppApi.admin.user.delete}`, body: body, withCredentials: true});
    },
  });
}

export const useAdminChangePassword = () => {
  return useMutation({
    mutationKey: ['admin-user-change-password'],
    mutationFn: async ({body}: { body: any }) => {
      return await fetchApi({method: "PUT", url: `${AppApi.admin.user.changePassword}`, body: body, withCredentials: true});
    },
  });
}