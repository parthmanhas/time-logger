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

export class TimeTrackerDB extends Dexie {
    projects!: Table<Project>;
    tasks!: Table<Task>;

    constructor() {
        super('TimeTrackerDB');
        this.version(1).stores({
            projects: '++id, name, createdAt',
            tasks: '++id, projectId, name, timestamp'
        });
    }
}

export const db = new TimeTrackerDB();
