import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

import { createPortal } from "react-dom";
import Tag from "@/components/ui/tag";

// External libraries
import { IoTrashOutline, IoCreateOutline } from "react-icons/io5";

const ProjectSelector = forwardRef(({
  task,
  projectId,
  projects,
  onUpdate,
  onAddNew,
  disabled,
  onDelete,
  onComplete,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

    // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      triggerRef.current?.click();
    }
  }));

  // Gebruik task.project_id als die er is, anders projectId
  const selectedProjectId = task?.project_id ?? projectId;
  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const sortedProjects = [...projects].sort((a, b) => {
    if (a.last_used_at && b.last_used_at) {
      return new Date(b.last_used_at) - new Date(a.last_used_at);
    }
    if (a.last_used_at) return -1;
    if (b.last_used_at) return 1;
    return a.name.localeCompare(b.name);
  });

  // Sluit dropdown bij click buiten
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsAddingNew(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Herbereken positie bij resize/scroll
  useEffect(() => {
    function handleResize() {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
      }
    }

    if (isOpen) {
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [isOpen]);

  // Focus input wanneer "Add new" geklikt wordt
  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  const handleOpen = () => {
    if (disabled) return; // ← Voeg deze check toe
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
      setIsOpen(true);
    }
  };

const handleSelect = (newProjectId) => {
  onUpdate(task?.id ?? null, newProjectId);
  setIsOpen(false);
  
  if (onComplete) {
    onComplete(newProjectId); // ← Geef ID door
  }
};

const handleAddNew = async () => {
  if (!newProjectName.trim()) return;

  const newProject = await onAddNew(newProjectName.trim());

  // Selecteer het nieuwe project meteen
  if (newProject) {
    onUpdate(task?.id ?? null, newProject.id);
  }

  setNewProjectName("");
  setIsAddingNew(false);
  setIsOpen(false);
  
  // Trigger onComplete
  if (onComplete && newProject) {
    onComplete(newProject.id); // ← Geef ID door
  }
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleAddNew();
    }
    if (e.key === "Escape") {
      setIsAddingNew(false);
      setNewProjectName("");
    }
  };

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className="cursor-pointer block min-w-0 w-full py-1" // ← Voeg py-1 toe
      >
        {currentProject ? (
          <Tag name={currentProject.name} color={currentProject.color} />
        ) : (
          <span className="text-muted-foreground text-sm truncate">&nbsp;</span>
          // ↑ Gebruik &nbsp; voor hoogte
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
            className="bg-background border border-border rounded-md shadow-lg z-[1010] w-[270px] min-w-[120px] py-1"
          >
            {/* Projects */}
            {sortedProjects.map((project) => (
              <div
                key={project.id}
                className="px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between group"
              >
                <div
                  onClick={() => handleSelect(project.id)}
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                >
                  <Tag name={project.name} color={project.color} />
                </div>

                {/* Edit button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open edit modal
                    console.log("Edit project:", project.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                  title="Edit project"
                >
                  <IoCreateOutline className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${project.name}" project?`)) {
                      onDelete(project.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted hover:text-red-500"
                  title="Delete project"
                >
                  <IoTrashOutline className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* No project optie */}
            <div
              onClick={() => handleSelect(null)}
              className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors text-sm text-muted-foreground"
            >
              No project
            </div>

            {/* Divider */}
            <div className="border-t border-border my-1"></div>

            {/* Add new */}
            {!isAddingNew ? (
              <div
                onClick={() => setIsAddingNew(true)}
                className="px-3 py-2 hover:bg-muted cursor-pointer transition-colors flex items-center gap-2 text-sm text-muted-foreground"
              >
                <span className="text-lg">+</span>
                Add new
              </div>
            ) : (
              <div className="px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Project name..."
                  className="w-full bg-transparent border border-border rounded-sm px-2 py-1 text-sm outline-none text-foreground"
                />
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
});

ProjectSelector.displayName = 'ProjectSelector';

export default ProjectSelector;
