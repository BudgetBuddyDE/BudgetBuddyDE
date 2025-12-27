import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { WorkflowIcon } from "lucide-react";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions} links={[
      {
        type: "main",
        icon: <WorkflowIcon />,
        text: "CI Workflows",
        url: "https://ci.tklein.it",
      },
    ]}>
      {children}
    </DocsLayout>
  );
}
