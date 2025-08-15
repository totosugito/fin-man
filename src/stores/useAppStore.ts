import {create} from "zustand/index";
import {APP_CONFIG} from "@/constants/config";
import {persist} from "zustand/middleware";
import {
  EMPLOYEE_FILE_TYPE,
  EMPLOYEE_RANK_COMPLIANCE_DOC,
  EMPLOYEE_TYPE,
  RANK_HEALTH_OH_IH,
  RANK_HEALTH_TYPE,
  REPORT_TYPE
} from "@/constants/app-enum";
import {date_to_string} from "@/lib/my-utils";

export const defaultStore = {
}

type Store = {
  resetAll: () => void;
}

export const useAppStore = create<Store>()(
  persist(
    (set) => ({
      resetAll: () => set({
      }),
    }),
    {
      name: `${APP_CONFIG.prefixStore}-app`, // single storage key
    }
  )
);