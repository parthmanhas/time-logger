export interface Project {
    id: string; // Firestore uses string IDs by default
    name: string;
    createdAt: number;
}

export interface Task {
    id: string;
    projectId: string;
    name: string;
    timestamp: number;
    completedAt?: number;
    duration?: number;
}

export interface Idea {
    id: string;
    content: string;
    notes?: string;
    createdAt: number;
    completedAt?: number;
}
