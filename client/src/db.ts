import Dexie, { type Table } from 'dexie';

export interface Project {
    id?: number;
    name: string;
    createdAt: number;
}

export interface Task {
    id?: number;
    projectId: number;
    name: string;
    timestamp: number;
    completedAt?: number;
    duration?: number;
}

export interface Idea {
    id?: number;
    content: string;
    notes?: string;
    createdAt: number;
    completedAt?: number;
}

export class TimeTrackerDB extends Dexie {
    projects!: Table<Project>;
    tasks!: Table<Task>;
    ideas!: Table<Idea>;

    constructor() {
        super('TimeTrackerDB');
        this.version(3).stores({
            projects: '++id, name, createdAt',
            tasks: '++id, projectId, name, timestamp',
            ideas: '++id, content, createdAt, completedAt'
        });
    }
}

export const db = new TimeTrackerDB();
