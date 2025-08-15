import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__authenticated/project')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/__authenticated/project"!</div>
}
