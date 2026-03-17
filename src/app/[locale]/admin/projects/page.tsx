import { prisma } from "@/lib/prisma";
import { AdminPageFrame } from "../AdminPageFrame";
import { PageTitleBar } from "@/components/PageTitleBar";
import { ProjectsExportClient } from "./ProjectsExportClient";

export default async function AdminProjects() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      receiptNumber: true,
      name: true,
      status: true,
      createdAt: true,
      registrationData: true,
      submissionData: true,
    },
  });

  return (
    <AdminPageFrame>
      <div className="space-y-6">
        <PageTitleBar title="Projects" className="top-0" />
        <ProjectsExportClient
          projects={projects.map((project) => ({
            ...project,
            createdAt: project.createdAt.toISOString(),
          }))}
        />
      </div>
    </AdminPageFrame>
  );
}
