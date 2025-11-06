// React core
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// External libraries
import {
  IoEyeOutline,
  IoEyeOffOutline,
  IoCheckmarkCircleOutline,
  IoSwapVertical,
  IoSparklesOutline, // ← Voor confetti
  IoVolumeHighOutline, // ← Voor sound
  IoVolumeMuteOutline, // ← Voor sound muted
} from "react-icons/io5";

// Services
import { supabase } from "@/lib/supabaseClient";

// Components
import TagsList from "@/components/TagsList";
import PrioritySelector from "@/components/PrioritySelector";
import ProjectSelector from "@/components/ProjectSelector";
import EditableText from "@/components/EditableText";
import TaskTable from "@/components/TaskTable";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

// Helper: check of een datum vandaag is (na 3:00 AM Amsterdam tijd)
function isToday(dateString) {
  if (!dateString) return false;
  
  // Parse de completed_at tijd in Amsterdam timezone
  const completedDate = new Date(dateString);
  
  // Krijg huidige tijd in Amsterdam
  const now = new Date();
  const amsterdamTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
  
  // Bereken de "day boundary" (vandaag om 3:00 AM Amsterdam tijd)
  const todayAt3AM = new Date(amsterdamTime);
  todayAt3AM.setHours(3, 0, 0, 0);
  
  // Als het nu vóór 3:00 AM is, gebruik gisteren om 3:00 AM als boundary
  if (amsterdamTime.getHours() < 3) {
    todayAt3AM.setDate(todayAt3AM.getDate() - 1);
  }
  
  // Bereken morgen om 3:00 AM als upper boundary
  const tomorrowAt3AM = new Date(todayAt3AM);
  tomorrowAt3AM.setDate(tomorrowAt3AM.getDate() + 1);
  
  // Check of completed_at tussen vandaag 3AM en morgen 3AM valt
  return completedDate >= todayAt3AM && completedDate < tomorrowAt3AM;
}

export default function TasksPage({ session }) {
  // Constants
  const BUTTON_CLICK_AREA = 12; // px extra klikbare area rond buttons
  const userName = session?.user?.user_metadata?.full_name || "there";

  // Data state
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [showHistory, setShowHistory] = useState(true); // ← Nieuw!

  // UI state
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortByPriority, setSortByPriority] = useState(false);

  // Editing state
  const [editingTask, setEditingTask] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  // New task state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newProjectId, setNewProjectId] = useState(null);
  const [newPriorityId, setNewPriorityId] = useState(null);

  // Other state
  const [pendingComplete, setPendingComplete] = useState(new Set());
  // Settings state
  const [confettiEnabled, setConfettiEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio ref - initialize once
  const completeSoundRef = useRef(null);
  useEffect(() => {
    completeSoundRef.current = new Audio("/sounds/Success%20Sound%20Effect.mp3");
    completeSoundRef.current.volume = 0.3;
    return () => {
      if (completeSoundRef.current) {
        completeSoundRef.current.pause();
        completeSoundRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("last_used_at", { ascending: false, nullsFirst: false }) // ← Sorteer op recent gebruikt
        .order("name"); // ← Daarna alfabetisch als fallback

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data);
      }
    }

    fetchProjects();
  }, []);

  // Fetch tasks function - must be defined before functions that use it
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
      *,
      priorities (
        id,
        name,
        color,
        level
      ),
      projects (
        id,
        name,
        color
      )
    `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
    } else {
      setTasks(data);
    }
    setLoading(false);
  }, []);

  // Fetch tasks when component loads
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Update task project
  const updateTaskProject = useCallback(async (taskId, projectId) => {
    // Optimistic update
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const project = projects.find((p) => p.id === parseInt(projectId));
          return {
            ...t,
            project_id: projectId ? parseInt(projectId) : null,
            projects: project || null,
          };
        }
        return t;
      })
    );

    // Database update
    const { error } = await supabase
      .from("tasks")
      .update({ project_id: projectId || null })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating project:", error);
      fetchTasks();
      return; // ← Stop hier bij error
    }

    // ✨ NIEUW: Update last_used_at timestamp voor het project
    if (projectId) {
      const { error: projectError } = await supabase
        .from("projects")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", parseInt(projectId));

      if (projectError) {
        console.error("Error updating project timestamp:", projectError);
      }

      // ✨ NIEUW: Update lokale projects state met nieuwe timestamp
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === parseInt(projectId)
            ? { ...p, last_used_at: new Date().toISOString() }
            : p
        )
      );
    }
  }, [projects, fetchTasks]);

  // Add new project
  const addNewProject = useCallback(async (projectName) => {
    const colors = [
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          name: projectName,
          color: randomColor,
          user_id: session.user.id,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding project:", error);
    } else {
      // Update de projects lijst
      setProjects((prevProjects) => [...prevProjects, data[0]]);

      // Return het nieuwe project zodat ProjectSelector het kan gebruiken
      return data[0];
    }
  }, [session.user.id]);

  // Memoized computed values
  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed || pendingComplete.has(task.id)),
    [tasks, pendingComplete]
  );

  const todayCompleted = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.completed &&
          !pendingComplete.has(task.id) &&
          isToday(task.completed_at)
      ),
    [tasks, pendingComplete]
  );

  const historyCompleted = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.completed &&
          !pendingComplete.has(task.id) &&
          !isToday(task.completed_at)
      ),
    [tasks, pendingComplete]
  );

  const sortedActiveTasks = useMemo(
    () =>
      sortByPriority
        ? [...activeTasks].sort((a, b) => {
            if (!a.priority_id) return 1;
            if (!b.priority_id) return -1;
            const levelA = a.priorities?.level || 0;
            const levelB = b.priorities?.level || 0;
            return levelB - levelA;
          })
        : activeTasks,
    [activeTasks, sortByPriority]
  );

  // Delete task functie (voeg toe bij je andere functies)
  const deleteTask = useCallback(async (taskId) => {
    // Confirmation dialog
    if (!confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;

      // Update local state (verwijder task uit lijst)
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error.message);
      alert("Failed to delete task. Please try again.");
    }
  }, []);


  // Timeout refs for pending complete animations
  const timeoutRefs = useRef(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutRefs.current.clear();
    };
  }, []);

  const toggleTask = useCallback(async (taskId, clickEvent) => {
    const scrollY = window.scrollY;

    if (document.activeElement?.tagName === "INPUT") {
      document.activeElement.blur();
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const task = tasks.find((t) => t.id === taskId);
    const newCompletedState = !task.completed;

    // Confetti + sound bij completion
    if (newCompletedState && clickEvent) {
      const x = clickEvent.clientX / window.innerWidth;
      const y = clickEvent.clientY / window.innerHeight;

      if (confettiEnabled) {
        confetti({
          particleCount: 5,
          spread: 15,
          origin: { x, y },
          colors: ["#ff6b35", "#ef4444", "#a16207", "#f59e0b", "#fbbf24"],
          ticks: 70,
          startVelocity: 13,
          gravity: 1.4,
        });
      }

      if (soundEnabled && completeSoundRef.current) {
        completeSoundRef.current.currentTime = 0;
        completeSoundRef.current.play().catch((err) => console.log("Audio failed"));
      }
    }

    try {
      // ✨ NIEUWE CODE: sla completed_at timestamp op
      const updateData = {
        completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) throw error;

      if (newCompletedState) {
        if (timeoutRefs.current.has(taskId)) {
          clearTimeout(timeoutRefs.current.get(taskId));
        }

        setPendingComplete((prev) => new Set(prev).add(taskId));

        const timeoutId = setTimeout(() => {
          setPendingComplete((prev) => {
            const newSet = new Set(prev);
            newSet.delete(taskId);
            return newSet;
          });
          timeoutRefs.current.delete(taskId);
        }, 4000);

        timeoutRefs.current.set(taskId, timeoutId);
      } else {
        if (timeoutRefs.current.has(taskId)) {
          clearTimeout(timeoutRefs.current.get(taskId));
          timeoutRefs.current.delete(taskId);
        }

        setPendingComplete((prev) => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }

      // ✨ NIEUWE CODE: update ook completed_at in local state
      setTasks(
        tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: newCompletedState,
                completed_at: updateData.completed_at,
              }
            : t
        )
      );

      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    } catch (error) {
      console.error("Error updating task:", error.message);
    }
  }, [tasks, confettiEnabled, soundEnabled]);

  const addTask = useCallback(async () => {
    if (!newTask.trim()) return;

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            task: newTask,
            user_id: session.user.id,
            // priority_id en project_id zijn NULL (kun je later instellen)
          },
        ])
        .select();

      if (error) throw error;

      // Add to local state met optimistic update
      setTasks((prevTasks) => [...prevTasks, data[0]]);

      // Reset form
      setNewTask("");
      setIsAddingTask(false);
      setNewProjectId(null);
      setNewPriorityId(null);
    } catch (error) {
      console.error("Error adding task:", error.message);
    }
  }, [newTask, session.user.id]);

  const updateTaskPriority = useCallback(async (taskId, priorityId) => {
    // Update lokaal EERST (optimistic)
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === taskId) {
          // Vind de priority data
          const priority = priorities.find(
            (p) => p.id === parseInt(priorityId)
          );
          return {
            ...t,
            priority_id: priorityId ? parseInt(priorityId) : null,
            priorities: priority || null,
          };
        }
        return t;
      })
    );

    // Dan update database op achtergrond
    const { error } = await supabase
      .from("tasks")
      .update({ priority_id: priorityId || null })
      .eq("id", taskId);

    // Bij error, haal data opnieuw op
    if (error) {
      console.error("Error updating priority:", error);
      fetchTasks();
    }
  }, [priorities, fetchTasks]);

  const updateTask = useCallback(async (taskId, field, value) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ [field]: value })
        .eq("id", taskId);

      if (error) throw error;

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
      );
    } catch (error) {
      console.error("Error updating task:", error.message);
    }
  }, []);

  // Fetch user settings
useEffect(() => {
  async function fetchSettings() {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        const { error: insertError } = await supabase
          .from("settings")
          .insert([
            {
              user_id: session.user.id,
              confetti_enabled: true,
              sound_enabled: true,
              show_completed: true,
              show_history: true,
              sort_by_priority: false, // ← NIEUW
            },
          ]);

        if (insertError) {
          console.error("Error creating default settings:", insertError);
        }
      } else {
        console.error("Error fetching settings:", error);
      }
    } else {
      setConfettiEnabled(data.confetti_enabled);
      setSoundEnabled(data.sound_enabled);
      setShowCompleted(data.show_completed);
      setShowHistory(data.show_history);
      setSortByPriority(data.sort_by_priority); // ← NIEUW
    }
  }

  fetchSettings();
}, [session.user.id]);

  // Update settings in database
  const updateSetting = useCallback(async (key, value) => {
    const { error } = await supabase
      .from("settings")
      .update({ [key]: value })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error updating setting:", error);
    }
  }, [session.user.id]);

  const handleToggleConfetti = useCallback(() => {
    const newValue = !confettiEnabled;
    setConfettiEnabled(newValue);
    updateSetting("confetti_enabled", newValue);
  }, [confettiEnabled, updateSetting]);

  const handleToggleSound = useCallback(() => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    updateSetting("sound_enabled", newValue);
  }, [soundEnabled, updateSetting]);

  const handleToggleCompleted = useCallback(() => {
    const newValue = !showCompleted;
    setShowCompleted(newValue);
    updateSetting("show_completed", newValue);
  }, [showCompleted, updateSetting]);

  const handleToggleHistory = useCallback(() => {
    const newValue = !showHistory;
    setShowHistory(newValue);
    updateSetting("show_history", newValue);
  }, [showHistory, updateSetting]);

  // Fetch priorities when component loads
  useEffect(() => {
    async function fetchPriorities() {
      const { data, error } = await supabase
        .from("priorities")
        .select("*")
        .order("level", { ascending: false });

      if (error) {
        console.error("Error fetching priorities:", error);
      } else {
        setPriorities(data);
      }
    }

    fetchPriorities();
  }, []);

  const startEditing = (taskId, field, currentValue) => {
    setEditingTask(taskId);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingTask && editingField) {
      updateTask(editingTask, editingField, editValue);
    }
    setEditingTask(null);
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditingField(null);
    setEditValue("");
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-left">Welcome {userName}!</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-muted text-foreground rounded hover:bg-muted/80 transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Settings controls - rechts boven de tabel */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Tasks</h2>

          <div className="flex gap-2">
            {/* Confetti toggle */}
            <button
              onClick={handleToggleConfetti}
              className="p-2 rounded-md hover:bg-muted transition-colors relative"
              title={confettiEnabled ? "Disable confetti" : "Enable confetti"}
            >
              <IoSparklesOutline
                className={cn(
                  "w-5 h-5 transition-colors",
                  confettiEnabled ? "text-cosmic-orange" : "text-muted-foreground"
                )}
              />
            </button>

            {/* Sound toggle */}
            <button
              onClick={handleToggleSound}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title={soundEnabled ? "Disable sound" : "Enable sound"}
            >
              {soundEnabled ? (
                <IoVolumeHighOutline className="w-5 h-5 text-cosmic-orange transition-colors" />
              ) : (
                <IoVolumeMuteOutline className="w-5 h-5 text-muted-foreground transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Table */}

        {/* Completed Tasks Table */}
        {/* Today's Completed Tasks */}

        {/* History - Previous Completed Tasks */}
        {/* Active Tasks Table */}
        <TaskTable
          tasks={sortedActiveTasks}
          type="active"
          isAddingTask={isAddingTask}
          setIsAddingTask={setIsAddingTask}
          newTask={newTask}
          setNewTask={setNewTask}
          newProjectId={newProjectId}
          setNewProjectId={setNewProjectId}
          newPriorityId={newPriorityId}
          setNewPriorityId={setNewPriorityId}
          addTask={addTask}
          toggleTask={toggleTask}
          updateTaskProject={updateTaskProject}
          updateTaskPriority={updateTaskPriority}
          addNewProject={addNewProject}
          projects={projects}
          priorities={priorities}
          pendingComplete={pendingComplete}
          setTasks={setTasks}
          supabase={supabase}
          fetchTasks={fetchTasks}
          BUTTON_CLICK_AREA={BUTTON_CLICK_AREA}
          sortByPriority={sortByPriority}
          setSortByPriority={setSortByPriority}
          updateSetting={updateSetting} 
        />

        {/* Today's Completed Tasks */}
        {todayCompleted.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Today's Completed</h2>
              <button
                onClick={handleToggleCompleted}
                className="p-2 hover:bg-muted rounded transition-colors"
                title={
                  showCompleted
                    ? "Hide completed tasks"
                    : "Show completed tasks"
                }
              >
                {showCompleted ? (
                  <IoEyeOutline className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <IoEyeOffOutline className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>

            {showCompleted && (
              <TaskTable
                tasks={todayCompleted}
                type="completed"
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                projects={projects}
                priorities={priorities}
                pendingComplete={pendingComplete}
                BUTTON_CLICK_AREA={BUTTON_CLICK_AREA}
              />
            )}
          </div>
        )}

        {/* History - Previous Completed Tasks */}
        {historyCompleted.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-muted-foreground">
                History
              </h2>
              <button
                onClick={handleToggleHistory}
                className="p-2 hover:bg-muted rounded transition-colors"
                title={showHistory ? "Hide history" : "Show history"}
              >
                {showHistory ? (
                  <IoEyeOutline className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <IoEyeOffOutline className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
            </div>

            {showHistory && (
              <TaskTable
                tasks={historyCompleted}
                type="history"
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                projects={projects}
                priorities={priorities}
                pendingComplete={pendingComplete}
                BUTTON_CLICK_AREA={BUTTON_CLICK_AREA}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
