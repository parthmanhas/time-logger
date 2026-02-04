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
import type { Task } from '../types';
import { getRandomProjectColor } from '../constants/colors';

export const useTrackerActions = () => {
    const handleAddTask = async (projectId: string, taskName: string, userId: string | undefined) => {
        if (!userId || !taskName.trim()) return;
        try {
            await addDoc(collection(db, 'tasks'), {
                name: taskName,
                projectId: projectId,
                userId: userId,
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
                    duration: now - (startTs as number)
                });
            }
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const handleUncompleteTask = async (id: string) => {
        try {
            await updateDoc(doc(db, 'tasks', id), {
                completedAt: null,
                duration: null
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
        handleAddIdea,
        handleUpdateIdeaNotes,
        handleDeleteIdea,
    };
};
