import { Timestamp } from 'firebase/firestore';

export type FirestoreDate = Timestamp | number;

export interface Project {
    id: string;
    name: string;
    description?: string;
    isFocused?: boolean;
    createdAt: FirestoreDate;
}

export interface Task {
    id: string;
    projectId: string;
    name: string;
    timestamp: FirestoreDate;
    completedAt?: FirestoreDate;
    duration?: number;
}

export interface Idea {
    id: string;
    content: string;
    notes?: string;
    createdAt: FirestoreDate;
    completedAt?: FirestoreDate;
}
