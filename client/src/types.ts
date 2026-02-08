import { Timestamp } from 'firebase/firestore';

export type FirestoreDate = Timestamp | number;

export interface Project {
    id: string;
    userId: string;
    name: string;
    description?: string;
    isFocused?: boolean;
    color?: string;
    projectType?: 'everyday' | 'finishing';
    createdAt: FirestoreDate;
}

export interface Task {
    id: string;
    userId: string;
    projectId: string;
    name: string;
    timestamp: FirestoreDate;
    completedAt?: FirestoreDate;
    duration?: number;
    complexity?: 'simple' | 'complex';
    createdAt: FirestoreDate;
    isTracking?: boolean;
}

export interface Idea {
    id: string;
    userId: string;
    content: string;
    notes?: string;
    createdAt: FirestoreDate;
}
