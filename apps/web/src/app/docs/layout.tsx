import { DocsSidebar } from "@/components/docs-sidebar";
import { DocsToc } from "@/components/docs-toc";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl gap-10 px-4 pt-24 pb-16 sm:px-6">
      <DocsSidebar />
      <main className="min-w-0 flex-1">{children}</main>
      <DocsToc />
    </div>
  );
}
