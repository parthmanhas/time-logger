import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
    collection,
    query,
    orderBy,
    where,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import type { Project, Task, Idea } from '../types';

export const useTrackerData = () => {
    const [user] = useAuthState(auth);
    const isDebugEnabled = import.meta.env.VITE_ENABLE_FIRESTORE_DEBUG === 'true';

    // Temporary check to confirm if env variable is being read correctly
    if (user && isDebugEnabled) {
        console.log("Firestore Debug Mode: ACTIVE");
    }

    const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
        user ? query(
            collection(db, 'projects'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        ) : null
    );

    if (isDebugEnabled) {
        console.log("Projects State:", {
            loading: projectsLoading,
            hasError: !!projectsError,
            error: projectsError?.message,
            count: projectsSnapshot?.size
        });
    }

    if (projectsError) console.error("Firestore Projects Error:", projectsError);
    const projects = projectsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));

    const [tasksSnapshot, tasksLoading, tasksError] = useCollection(
        user ? query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        ) : null
    );
    if (tasksError) console.error("Firestore Tasks Error:", tasksError);
    const tasks = tasksSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));

    const [ideasSnapshotRaw, ideasLoading, ideasError] = useCollection(
        user ? query(
            collection(db, 'ideas'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        ) : null
    );
    if (ideasError) console.error("Firestore Ideas Error:", ideasError);
    const ideas = ideasSnapshotRaw?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Idea));

    return {
        user,
        projects,
        tasks,
        ideas,
        loading: projectsLoading || tasksLoading || ideasLoading
    };
};
