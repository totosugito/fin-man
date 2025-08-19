import {createFileRoute} from '@tanstack/react-router'
import {PageTitle} from "@/components/app";
import * as React from "react";
import {useTranslation} from "react-i18next";
import {useQueryClient} from "@tanstack/react-query";
import {useProjectDetail} from "@/service/project";
import {SkeTable} from "@/components/custom/skeleton";
import {useEffect} from "react";

export const Route = createFileRoute('/__authenticated/project/$id')({
  component: RouteComponent,
})

type Project = {
  id: string
  name: string
  description: string
  status: string
  type: string
  createdAt: string
  updatedAt: string
}

function RouteComponent() {
  const {t} = useTranslation()
  const queryClient = useQueryClient();
  const {id} = Route.useParams();

  const projectDetailQuery = useProjectDetail(id);

  const [data, setData] = React.useState<Project | null>(null);
  const isLoading = () => {
    return (projectDetailQuery.isPending);
  }

  useEffect(() => {
    if (projectDetailQuery.data) {
      setData(projectDetailQuery.data);
    }
  }, [projectDetailQuery.isSuccess]);

  return (
    <div className={"divContent"}>
      {data && <PageTitle title={<div>{data?.name}</div>} description={<div>{data?.description}</div>} showSeparator={false}/>}
      {(projectDetailQuery.isPending) && <div className={"h-full w-full flex"}>
        <SkeTable/>
      </div>}

      {projectDetailQuery.isError &&
        <div className={"text-lg text-destructive"}>Error: {projectDetailQuery?.error?.message}</div>}

      {data &&
        <div className={""}>

        </div>
      }
    </div>
  )
}
