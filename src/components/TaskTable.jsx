import { useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  IoCheckmarkCircleOutline,
  IoSwapVertical,
  IoTrashOutline,
} from "react-icons/io5";
import EditableText from "@/components/EditableText";
import ProjectSelector from "@/components/ProjectSelector";
import PrioritySelector from "@/components/PrioritySelector";
import Tag from "./ui/tag";
import { cn } from "@/lib/utils";

function TaskTable({
  tasks,
  type = "active", // "active" | "completed" | "history"

  // Props voor active tasks
  isAddingTask,
  setIsAddingTask,
  newTask,
  setNewTask,
  newProjectId,
  setNewProjectId,
  newPriorityId,
  setNewPriorityId,
  addTask,
  deleteTask,

  // Props voor alle types
  toggleTask,
  updateTaskProject,
  updateTaskPriority,
  deleteProjectTag,
  addNewProject,
  projects,
  priorities,
  pendingComplete,
  setTasks,
  supabase,
  fetchTasks,
  BUTTON_CLICK_AREA,

  // Props voor sorting (alleen active)
  sortByPriority,
  setSortByPriority,
  updateSetting,
}) {
  const isActive = type === "active";
  const isCompleted = type === "completed";
  const isHistory = type === "history";

  // Memoize handlers to prevent unnecessary re-renders
  const handleSortToggle = useCallback(() => {
    const newSortValue = !sortByPriority;
    setSortByPriority(newSortValue);
    updateSetting("sort_by_priority", newSortValue);
  }, [sortByPriority, setSortByPriority, updateSetting]);

  const handleTaskSave = useCallback(
    async (taskId, newValue) => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, task: newValue } : t))
      );

      const { error } = await supabase
        .from("tasks")
        .update({ task: newValue })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task:", error);
        fetchTasks();
      }
    },
    [setTasks, supabase, fetchTasks]
  );

  const handleNewTaskKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && newTask.trim()) {
        e.preventDefault();
        addTask();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsAddingTask(false);
        setNewTask("");
        setNewProjectId(null);
        setNewPriorityId(null);
      }
    },
    [
      newTask,
      addTask,
      setIsAddingTask,
      setNewTask,
      setNewProjectId,
      setNewPriorityId,
    ]
  );

  const handleNewTaskBlur = useCallback(() => {
    if (newTask.trim()) {
      addTask();
    } else {
      setIsAddingTask(false);
    }
  }, [newTask, addTask, setIsAddingTask]);

  const handleStartAddingTask = useCallback(() => {
    setIsAddingTask(true);
  }, [setIsAddingTask]);

  return (
    <div className={cn(isHistory && "opacity-50")}>
      <div className="border border-border rounded-lg overflow-hidden ">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="w-13">
                {isActive}
              </TableHead>
              <TableHead className="w-[80%]">Tasks</TableHead>
              <TableHead className="w-[20%]">Project</TableHead>
              <TableHead className="w-[117px]">
                {isActive ? (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Prio</span>
                    <button
                      onClick={handleSortToggle}
                      className="flex items-center gap-1.5 px-2 py-2 rounded-md hover:bg-muted transition-colors group"
                      aria-label={
                        sortByPriority
                          ? "Disable priority sorting"
                          : "Enable priority sorting"
                      }
                    >
                      <IoSwapVertical
                        className={cn(
                          "transition-colors",
                          sortByPriority
                            ? "text-cosmic-orange"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                    </button>
                  </div>
                ) : (
                  "Prio"
                )}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tasks.map((task) => {
              const isPending = pendingComplete.has(task.id);

              return (
                <TableRow
                  key={task.id}
                  className={cn(
                    "border-t border-border last:h-[48px]",
                    isCompleted && "opacity-60"
                  )}
                >
                  <TableCell>
                    <button
                      onClick={(e) => toggleTask(task.id, e)}
                      style={{ "--click-area": `-${BUTTON_CLICK_AREA}px` }}
                      className={cn(
                        "w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center",
                        "hover:border-primary transition-colors relative",
                        "before:absolute before:[inset:var(--click-area)] before:content-['']",
                        task.completed
                          ? "border-primary"
                          : "border-muted-foreground"
                      )}
                      aria-label={
                        task.completed
                          ? "Mark task as incomplete"
                          : "Mark task as complete"
                      }
                    >
                      {task.completed && (
                        <div className="w-3 h-3 rounded-full bg-primary" />
                      )}
                    </button>
                  </TableCell>

                  {/* Task field */}

                  <TableCell
                    className={cn(
                      "font-medium text-foreground",
                      (isCompleted || isHistory) && "opacity-80",
                      isPending && "text-muted-foreground line-through"
                    )}
                  >
                    {isActive ? (
                      <EditableText
                        value={task.task}
                        disabled={isPending}
                        onSave={(newValue) => handleTaskSave(task.id, newValue)}
                        placeholder="Task name"
                      />
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="truncate pr-2">{task.task}</span>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 mr-[-8px] group-hover:opacity-100 transition-opacity p-2 rounded-md hover:bg-muted hover:text-red-500"
                          title="Delete task"
                        >
                          <IoTrashOutline className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </TableCell>

                  {/* Project field */}
                  <TableCell className="w-[25%] min-w-0 py-1">
                    {isActive ? (
                      <ProjectSelector
                        task={task}
                        projects={projects}
                        onUpdate={updateTaskProject}
                        onAddNew={addNewProject}
                        disabled={isPending}
                        onDelete={deleteProjectTag}
                      />
                    ) : (
                      task.projects && (
                        <div
                          className={cn(
                            (isCompleted || isHistory) && "opacity-80"
                          )}
                        >
                          <Tag
                            name={task.projects.name}
                            color={task.projects.color}
                            variant="completed" // ← Voeg toe
                          />
                        </div>
                      )
                    )}
                  </TableCell>

                  {/* Priority field */}
                  <TableCell className="py-1">
                    {isActive ? (
                      <PrioritySelector
                        task={task}
                        priorities={priorities}
                        onUpdate={updateTaskPriority}
                        disabled={isPending}
                      />
                    ) : (
                      task.priorities && (
                        <div
                          className={cn(
                            (isCompleted || isHistory) && "opacity-80"
                          )}
                        >
                          <Tag
                            name={task.priorities.name}
                            color={task.priorities.color}
                            variant="completed" // ← Voeg toe
                          />
                        </div>
                      )
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {isActive && isAddingTask && (
              <TableRow className="border-t border-border h-[48px]">
                <TableCell>
                  {/* Dashed circle checkbox preview */}
                  <div className="w-5 h-5 rounded-full border-[1px] rotate-90 border-dashed border-muted-foreground/40"></div>
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    placeholder="No task name yet"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={handleNewTaskKeyDown}
                    onBlur={handleNewTaskBlur}
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </TableCell>
                <TableCell>
                  {newTask.trim() && (
                    <ProjectSelector
                      projectId={newProjectId}
                      projects={projects}
                      onUpdate={(_, projectId) => setNewProjectId(projectId)}
                      onAddNew={addNewProject}
                      onDelete={deleteProjectTag}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {newTask.trim() && (
                    <PrioritySelector
                      priorityId={newPriorityId}
                      priorities={priorities}
                      onUpdate={(_, priorityId) => setNewPriorityId(priorityId)}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Button wrapper met vaste hoogte */}
      <div className="">
        {isActive && !isAddingTask && (
          <button
            onClick={handleStartAddingTask}
            className="w-full h-[48px] text-left px-2 text-muted-foreground flex items-center gap-2 group rounded-b border border-transparent"
            aria-label="Add new task"
          >
            <span className="text-sm transition-all px-3 py-1.5 rounded-md flex items-center gap-2 group-hover:bg-muted group-hover:text-foreground group-hover:border group-hover:border-border border border-transparent">
              <span>+</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                Add new task
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default TaskTable;
