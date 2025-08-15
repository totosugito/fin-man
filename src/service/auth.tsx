import {useMutation} from "@tanstack/react-query";
import {useAuth} from "@/hooks/use-auth";
import {useNavigate, useRouter} from "@tanstack/react-router";
import {fetchApi} from "@/lib/fetch-api";
import {AppApi} from "@/constants/api";
import {authClient} from "@/lib/auth-client";
import {AuthProps} from "@/types/auth";

export const useLoginMutation = () => {
  const auth = useAuth();

  return useMutation({
    mutationKey: ['login'],
    mutationFn: async ({body}: { body: Record<string, any> }) => {
      const response = await fetchApi({method: "POST", url: `${AppApi.auth.login}`, body: body, withCredentials: true, headers: {'Content-Type': 'multipart/form-data'}});

      let userData: AuthProps = {token: null, user: null};
      if (response?.token) {
        userData = {
          token: response.token,
          user: response.user
        }
      } else {
        throw new Error("Error get session");
      }

      await (auth.login(userData));
      return(userData);
    },
  });
}

export const useLoginMutationEmail = () => {
  return useMutation({
    mutationKey: ['login-email'],
    mutationFn: async ({body}: { body: any }) => {
      return await fetchApi({method: "POST", url: AppApi.auth.login, body: body, withCredentials: true});
    },
  });
}

export const useLogoutMutation = () => {
  const auth = useAuth();
  const router = useRouter()
  const navigate = useNavigate()

  return (
    useMutation({
      mutationKey: ['logout'],
      mutationFn: async () => {
        auth.logout().then(() => {
          router.invalidate().finally(() => {
          })
        })

        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
            },
            onError: () => {
            },
          },
        });
        navigate({to: '/'}).then(() => {});
      },
    })
  )
}