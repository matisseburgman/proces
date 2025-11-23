import {
  IoCheckmarkOutline,
  IoEllipseOutline,
  IoSquareOutline, // ← Deze moet erbij staan!
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProjectFilter({
  projects,
  selectedProjects,
  setSelectedProjects,
}) {
  const toggleProject = (projectId) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const isSelected = (projectId) => {
    return selectedProjects.includes(projectId);
  };

  // Verberg de component als er geen projecten zijn
  if (projects.length === 0) {
    return null;
  }

  return (
    <div>
      <div>
        <Table>
          <TableHeader>
            <TableRow className="text-sm pl-0 font-small hover:bg-transparent">
              <TableHead className="w-full pl-3">Filter projects</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      <div className="border border-border rounded-lg overflow-hidden ">
        {/* Project list */}
        <div className="divide-y divide-border">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => toggleProject(project.id)}
              className="w-full px-3 py-[13.5px] flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isSelected(project.id) ? (
<IoCheckmarkOutline
                    className="w-4 h-4 text-muted-foreground flex-shrink-0"
                    style={{ color: project.color }}
                  />
                ) : (
                                    <IoEllipseOutline
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: project.color }}
                  />
                  
                )}

                <span className="text-sm pl-[3px] truncate">
                  {project.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
