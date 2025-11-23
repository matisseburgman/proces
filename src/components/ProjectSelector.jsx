import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

import { createPortal } from "react-dom";
import Tag from "@/components/ui/tag";

// External libraries

import { IoEllipsisHorizontal } from "react-icons/io5";
import ProjectContextMenu from "./ProjectContextMenu";

const ProjectSelector = forwardRef(
  (
    {
      task,
      projectId,
      projects,
      onUpdate,
      onAddNew,
      disabled,
      onDelete,
      onComplete,
      onColorChange,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
    });
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const [contextMenuOpen, setContextMenuOpen] = useState(null);
    const [contextMenuPosition, setContextMenuPosition] = useState({
      top: 0,
      left: 0,
    });

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        triggerRef.current?.click();
      },
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
        // Als context menu open is, laat die z'n eigen outside click afhandelen
        if (contextMenuOpen) {
          return;
        }

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
    }, [isOpen, contextMenuOpen]); // ← Voeg contextMenuOpen toe als dependency

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

    // Close context menu on window resize
    useEffect(() => {
      function handleResize() {
        if (contextMenuOpen) {
          setContextMenuOpen(null);
        }
      }

      if (contextMenuOpen) {
        window.addEventListener("resize", handleResize);
      }

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, [contextMenuOpen]);

    const handleOpen = () => {
      if (disabled) return; // ← Voeg deze check toe
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 2,
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

    const handleOpenContextMenu = (e, project) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setContextMenuPosition({
        top: rect.bottom + window.scrollY + 6,
        left: rect.right + window.scrollX - 240 - 4, // 240px is breedte van menu
      });
      setContextMenuOpen(project.id);
    };

    return (
      <>
        {/* Trigger */}
        <div
          ref={triggerRef}
          onClick={handleOpen}
          className={`cursor-pointer block min-w-0 w-full py-1 rounded-sm transition-all ${
            !currentProject
              ? "hover:ring-1 hover:ring-border hover:bg-muted"
              : ""
          }`}
        >
          {currentProject ? (
            <div className="hover:brightness-125 transition-all">
              <Tag name={currentProject.name} color={currentProject.color} />
            </div>
          ) : (
            <span className="text-muted-foreground text-sm truncate">
              &nbsp;
            </span>
          )}
        </div>

        {/* Context Menu */}
        {contextMenuOpen && (
          <ProjectContextMenu
            project={projects.find((p) => p.id === contextMenuOpen)}
            isOpen={!!contextMenuOpen}
            onClose={() => setContextMenuOpen(null)}
            position={contextMenuPosition}
            onDelete={onDelete}
            onColorChange={onColorChange}
          />
        )}

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
              className="bg-background border border-border rounded-md shadow-lg z-[1010] w-[270px] min-w-[120px]"
            >
              {/* Projects */}
              {sortedProjects.map((project) => (
                <div
                  key={project.id}
                  className="px-3 min-h-[44px] hover:bg-muted/30 transition-colors flex items-center justify-between group"
                >
                  <div
                    onClick={() => handleSelect(project.id)}
                    className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                  >
                    <Tag name={project.name} color={project.color} />
                  </div>

                  {/* 3 dots menu button */}
                  <button
                    onClick={(e) => handleOpenContextMenu(e, project)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-muted"
                    title="More options"
                  >
                    <IoEllipsisHorizontal className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-border"></div>

              {/* No project optie */}
              <div
                onClick={() => handleSelect(null)}
                className="px-3 min-h-[44px] hover:bg-muted/30 cursor-pointer transition-colors text-sm text-muted-foreground flex items-center"
              >
                No project
              </div>

              {/* Divider */}
              <div className="border-t border-border"></div>

{/* Add new */}
{!isAddingNew ? (
  <div
    onClick={() => setIsAddingNew(true)}
    className="px-3 min-h-[44px] hover:bg-muted/30 cursor-pointer transition-colors flex items-center gap-2 text-sm text-muted-foreground group"
  >
    <span className=" py-1.5 rounded-md flex items-center gap-2  group-hover:text-foreground transition-all">
      <span>+</span>
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        Add new project
      </span>
    </span>
  </div>
) : (
  <div className="px-3 min-h-[48px] flex items-center">
    <input
      ref={inputRef}
      type="text"
      value={newProjectName}
      onChange={(e) => setNewProjectName(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Project name..."
      className="w-full py-2 px-2 bg-transparent border-0 focus:border-0 focus:ring-0 rounded-sm text-sm outline-none text-foreground placeholder:text-muted-foreground"
    />
  </div>
)}
            </div>,
            document.body
          )}
      </>
    );
  }
);

ProjectSelector.displayName = "ProjectSelector";

export default ProjectSelector;
