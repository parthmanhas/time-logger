import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Timestamp } from 'firebase/firestore';

dayjs.extend(relativeTime);

export const getTimeAgo = (ts: Timestamp | number | undefined) => {
    if (!ts) return '';
    const date = ts instanceof Timestamp ? ts.toDate() : ts;
    return dayjs(date).fromNow();
};

export const formatDate = (ts: Timestamp | number | undefined, format: string) => {
    if (!ts) return 'Pending...';
    const date = ts instanceof Timestamp ? ts.toDate() : ts;
    return dayjs(date).format(format);
};

export const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / (1000 * 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m`;
};

export const formatTotalDuration = (ms: number) => {
    const mins = Math.floor(ms / (1000 * 60));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h === 0 && m === 0 ? '0m' : `${h > 0 ? `${h}h ` : ''}${m}m`;
};
