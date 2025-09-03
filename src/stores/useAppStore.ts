import {create} from "zustand/index";
import {APP_CONFIG} from "@/constants/config";
import {persist} from "zustand/middleware";
import { EnumViewMode } from "@/constants/app-enum";

type Store = {
  projectList: {
    viewMode: string;
    pageView: number;
  },
  setProjectList: (projectList: any) => void;

  resetAll: () => void;
}

export const defaultStore = {
  projectList: {
    viewMode: EnumViewMode.card.value,
    pageView: 10,
  },
}

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      projectList: defaultStore.projectList,
      setProjectList: (projectList: any) => set({
        projectList
      }),

      resetAll: () => set({
        projectList: defaultStore.projectList
      }),
    }),
    {
      name: `${APP_CONFIG.prefixStore}-app`, // single storage key
    }
  )
);