import {
  IoCheckmarkOutline,
  IoSquareOutline,  // ← Deze moet erbij staan!
  IoCheckmarkCircleOutline,
} from "react-icons/io5";

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
    <div className="border border-border rounded-lg overflow-hidden">
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
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: project.color }}
                />
              ) : (
                <IoSquareOutline 
                  className="w-4 h-4 text-muted-foreground flex-shrink-0"
                  style={{ color: project.color }} 
                />
              )}

              <span className="text-sm pl-[3px] truncate">{project.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}