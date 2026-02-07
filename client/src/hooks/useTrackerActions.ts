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
import type { Task } from '../types';
import { getRandomProjectColor } from '../constants/colors';

export const useTrackerActions = () => {
    const handleAddTask = async (projectId: string, taskName: string, userId: string | undefined, complexity?: 'simple' | 'complex') => {
        if (!userId || !taskName.trim()) return;
        try {
            await addDoc(collection(db, 'tasks'), {
                name: taskName,
                projectId: projectId,
                userId: userId,
                complexity: complexity || 'simple',
                timestamp: serverTimestamp(),
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleAddProject = async (name: string, description: string, userId: string | undefined) => {
        if (!userId || !name.trim()) return;
        try {
            return await addDoc(collection(db, 'projects'), {
                name,
                description,
                userId,
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
                    const timeStr = dayjs(now).format('HH:mm');

                    // Update task timestamp to current time for accurate duration calculation
                    await updateDoc(doc(db, 'tasks', id), {
                        isTracking: true,
                        timestamp: now
                    });

                    // Add a note in Ideas section
                    await addDoc(collection(db, 'ideas'), {
                        content: `Focus started: ${task.name} at ${timeStr}`,
                        userId: userId,
                        createdAt: serverTimestamp(),
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

    return {
        handleAddTask,
        handleAddProject,
        handleToggleProjectFocus,
        handleRenameProject,
        handleDeleteTask,
        handleCompleteTask,
        handleUncompleteTask,
        handleSetTaskActive,
        handleAddIdea,
        handleUpdateIdeaNotes,
        handleDeleteIdea,
    };
};
