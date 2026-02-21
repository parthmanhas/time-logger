import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';
import type { Task, Project } from '../types';
import { getRandomProjectColor } from '../constants/colors';

export const useTrackerActions = () => {
    const handleAddTask = async (projectId: string, taskName: string, userId: string | undefined, complexity?: 'simple' | 'complex', startTracking: boolean = false, taskId?: string) => {
        if (!userId || !taskName.trim()) return;
        try {
            const now = Date.now();
            const docRef = await addDoc(collection(db, 'tasks'), {
                name: taskName,
                projectId: projectId,
                userId: userId,
                taskId: taskId || '',
                complexity: complexity || 'simple',
                timestamp: startTracking ? now : serverTimestamp(),
                createdAt: serverTimestamp(),
                isTracking: startTracking
            });

            return docRef;
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleAddProject = async (name: string, description: string, userId: string | undefined, projectType: 'everyday' | 'finishing' = 'everyday') => {
        if (!userId || !name.trim()) return;
        try {
            return await addDoc(collection(db, 'projects'), {
                name,
                description,
                userId,
                projectType,
                color: getRandomProjectColor(),
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error adding project:', error);
        }
    };

    const handleToggleProjectFocus = async (id: string, isFocused: boolean) => {
        try {
            await updateDoc(doc(db, 'projects', id), { isFocused: !isFocused });
        } catch (error) {
            console.error('Error toggling project focus:', error);
        }
    };

    const handleRenameProject = async (id: string, newName: string) => {
        try {
            await updateDoc(doc(db, 'projects', id), { name: newName });
        } catch (error) {
            console.error('Error renaming project:', error);
        }
    };

    const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
        try {
            await updateDoc(doc(db, 'projects', id), updates);
        } catch (error) {
            console.error('Error updating project:', error);
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'tasks', id));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleCompleteTask = async (id: string) => {
        try {
            const now = Date.now();
            const taskSnap = await getDoc(doc(db, 'tasks', id));
            if (taskSnap.exists()) {
                const task = taskSnap.data() as Task;
                const startTs = task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp;
                await updateDoc(doc(db, 'tasks', id), {
                    completedAt: now,
                    duration: now - (startTs as number),
                    isTracking: false
                });
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const handleCompleteTaskWithDuration = async (id: string, durationMinutes: number) => {
        try {
            const now = Date.now();
            const durationMillis = durationMinutes * 60 * 1000;
            const startTs = now - durationMillis;
            await updateDoc(doc(db, 'tasks', id), {
                timestamp: startTs,
                completedAt: now,
                duration: durationMillis,
                isTracking: false
            });
        } catch (error) {
            console.error('Error completing task with duration:', error);
        }
    };

    const handleSetTaskActive = async (id: string, active: boolean, userId: string | undefined, tasks: Task[]) => {
        if (!userId) return;
        try {
            // Deactivate all other tasks first to ensure only one is active
            if (active) {
                const activeTasks = tasks.filter(t => t.isTracking && t.id !== id);
                for (const t of activeTasks) {
                    await updateDoc(doc(db, 'tasks', t.id), { isTracking: false });
                }

                // Auto note down focus start
                const task = tasks.find(t => t.id === id);
                if (task) {
                    const now = Date.now();

                    // Update task timestamp to current time for accurate duration calculation
                    await updateDoc(doc(db, 'tasks', id), {
                        isTracking: true,
                        timestamp: now
                    });

                }
            } else {
                await updateDoc(doc(db, 'tasks', id), { isTracking: false });
            }
        } catch (error) {
            console.error('Error setting task active:', error);
        }
    };

    const handleUncompleteTask = async (id: string) => {
        try {
            await updateDoc(doc(db, 'tasks', id), {
                completedAt: null,
                duration: null,
                isTracking: false
            });
        } catch (error) {
            console.error('Error uncompleting task:', error);
        }
    };

    const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
        try {
            await updateDoc(doc(db, 'tasks', id), updates);
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleAddIdea = async (content: string, userId: string | undefined) => {
        if (!userId || !content.trim()) return;
        try {
            await addDoc(collection(db, 'ideas'), {
                content,
                userId,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error adding idea:', error);
        }
    };

    const handleUpdateIdeaNotes = async (id: string, notes: string) => {
        try {
            await updateDoc(doc(db, 'ideas', id), { notes });
        } catch (error) {
            console.error('Error updating idea notes:', error);
        }
    };

    const handleDeleteIdea = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'ideas', id));
        } catch (error) {
            console.error('Error deleting idea:', error);
        }
    };

    const handleCompleteAndDuplicateTask = async (id: string, userId: string | undefined) => {
        if (!userId) return;
        try {
            const now = Date.now();
            const taskSnap = await getDoc(doc(db, 'tasks', id));
            if (taskSnap.exists()) {
                const task = taskSnap.data() as Task;
                const startTs = task.timestamp instanceof Timestamp ? task.timestamp.toMillis() : task.timestamp;

                // 1. Complete current task
                await updateDoc(doc(db, 'tasks', id), {
                    completedAt: now,
                    duration: now - (startTs as number),
                    isTracking: false
                });

                // 2. Create duplicate task (same name, project, complexity, taskId)
                await addDoc(collection(db, 'tasks'), {
                    name: task.name,
                    projectId: task.projectId,
                    userId: userId,
                    taskId: task.taskId || '',
                    complexity: task.complexity || 'simple',
                    timestamp: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    isTracking: false
                });

            }
        } catch (error) {
            console.error('Error completing and duplicating task:', error);
        }
    };

    const handleToggleEverydayTask = async (projectId: string, date: Date, userId: string | undefined, tasks: Task[]) => {
        if (!userId) return;
        try {
            const targetDate = dayjs(date).startOf('day');
            const existingTask = tasks.find(t => {
                const taskDate = dayjs(t.timestamp instanceof Timestamp ? t.timestamp.toDate() : t.timestamp);
                return t.projectId === projectId && taskDate.isSame(targetDate, 'day');
            });

            if (existingTask) {
                await deleteDoc(doc(db, 'tasks', existingTask.id));
            } else {
                const nextId = tasks && tasks.length > 0
                    ? Math.max(...tasks.map(t => parseInt(t.taskId || '0') || 0)) + 1
                    : 1;

                await addDoc(collection(db, 'tasks'), {
                    name: "Completed",
                    projectId: projectId,
                    userId: userId,
                    taskId: String(nextId),
                    complexity: 'simple',
                    timestamp: targetDate.toDate(),
                    createdAt: serverTimestamp(),
                    completedAt: targetDate.add(1, 'hour').toDate(),
                    duration: 3600000 // 1 hour
                });
            }
        } catch (error) {
            console.error('Error toggling everyday task:', error);
        }
    };

    return {
        handleAddTask,
        handleAddProject,
        handleToggleProjectFocus,
        handleRenameProject,
        handleUpdateProject,
        handleDeleteTask,
        handleUpdateTask,
        handleCompleteTask,
        handleCompleteTaskWithDuration,
        handleUncompleteTask,
        handleSetTaskActive,
        handleCompleteAndDuplicateTask,
        handleAddIdea,
        handleUpdateIdeaNotes,
        handleDeleteIdea,
        handleToggleEverydayTask,
    };
};
