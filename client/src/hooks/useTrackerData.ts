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

    const [projectsSnapshot] = useCollection(
        user ? query(
            collection(db, 'projects'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        ) : null
    );
    const projects = projectsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Project));

    const [tasksSnapshot] = useCollection(
        user ? query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        ) : null
    );
    const tasks = tasksSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task));

    const [ideasSnapshotRaw] = useCollection(
        user ? query(
            collection(db, 'ideas'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        ) : null
    );
    const ideas = ideasSnapshotRaw?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Idea));

    return { user, projects, tasks, ideas };
};
