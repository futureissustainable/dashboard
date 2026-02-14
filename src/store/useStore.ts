import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";
import { getRandomIcon, getRandomColor } from "@/lib/constants";

export type Priority = 1 | 2 | 3;

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  subtasks: SubTask[];
  folderId: string | null;
}

export interface Folder {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  iconName: string;
  color: { name: string; bg: string; text: string };
  priority: Priority;
  folders: Folder[];
  tasks: Task[];
}

interface StoreState {
  projects: Project[];
  addProject: (name: string) => void;
  deleteProject: (projectId: string) => void;
  updateProjectName: (projectId: string, name: string) => void;
  updateProjectIcon: (projectId: string, iconName: string) => void;
  updateProjectPriority: (projectId: string, priority: Priority) => void;
  addFolder: (projectId: string, name: string) => void;
  deleteFolder: (projectId: string, folderId: string) => void;
  renameFolder: (projectId: string, folderId: string, name: string) => void;
  addTask: (
    projectId: string,
    title: string,
    folderId: string | null
  ) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  updateTask: (
    projectId: string,
    taskId: string,
    updates: Partial<Pick<Task, "title" | "description" | "priority" | "completed" | "folderId">>
  ) => void;
  addSubTask: (projectId: string, taskId: string, title: string) => void;
  deleteSubTask: (
    projectId: string,
    taskId: string,
    subTaskId: string
  ) => void;
  toggleSubTask: (
    projectId: string,
    taskId: string,
    subTaskId: string
  ) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      projects: [],

      addProject: (name) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: uuid(),
              name,
              iconName: getRandomIcon(),
              color: getRandomColor(),
              priority: 3 as Priority,
              folders: [],
              tasks: [],
            },
          ],
        })),

      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
        })),

      updateProjectName: (projectId, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, name } : p
          ),
        })),

      updateProjectIcon: (projectId, iconName) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, iconName } : p
          ),
        })),

      updateProjectPriority: (projectId, priority) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, priority } : p
          ),
        })),

      addFolder: (projectId, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, folders: [...p.folders, { id: uuid(), name }] }
              : p
          ),
        })),

      deleteFolder: (projectId, folderId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  folders: p.folders.filter((f) => f.id !== folderId),
                  tasks: p.tasks.map((t) =>
                    t.folderId === folderId ? { ...t, folderId: null } : t
                  ),
                }
              : p
          ),
        })),

      renameFolder: (projectId, folderId, name) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  folders: p.folders.map((f) =>
                    f.id === folderId ? { ...f, name } : f
                  ),
                }
              : p
          ),
        })),

      addTask: (projectId, title, folderId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: [
                    ...p.tasks,
                    {
                      id: uuid(),
                      title,
                      description: "",
                      priority: 3 as Priority,
                      completed: false,
                      subtasks: [],
                      folderId,
                    },
                  ],
                }
              : p
          ),
        })),

      deleteTask: (projectId, taskId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
              : p
          ),
        })),

      updateTask: (projectId, taskId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId ? { ...t, ...updates } : t
                  ),
                }
              : p
          ),
        })),

      addSubTask: (projectId, taskId, title) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          subtasks: [
                            ...t.subtasks,
                            { id: uuid(), title, completed: false },
                          ],
                        }
                      : t
                  ),
                }
              : p
          ),
        })),

      deleteSubTask: (projectId, taskId, subTaskId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          subtasks: t.subtasks.filter(
                            (s) => s.id !== subTaskId
                          ),
                        }
                      : t
                  ),
                }
              : p
          ),
        })),

      toggleSubTask: (projectId, taskId, subTaskId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) =>
                    t.id === taskId
                      ? {
                          ...t,
                          subtasks: t.subtasks.map((s) =>
                            s.id === subTaskId
                              ? { ...s, completed: !s.completed }
                              : s
                          ),
                        }
                      : t
                  ),
                }
              : p
          ),
        })),
    }),
    {
      name: "task-management-store",
    }
  )
);
