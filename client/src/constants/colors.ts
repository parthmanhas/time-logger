export const PROJECT_COLORS = [
    '#2563eb', // Blue
    '#db2777', // Pink
    '#059669', // Emerald
    '#d97706', // Amber
    '#7c3aed', // Violet
    '#dc2626', // Red
    '#0891b2', // Cyan
    '#4b5563', // Gray
    '#ea580c', // Orange
    '#65a30d', // Lime
    '#9333ea', // Purple
    '#2dd4bf', // Teal
];

export const getRandomProjectColor = () => {
    return PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)];
};

export const getDeterministicColor = (id: string) => {
    if (!id) return PROJECT_COLORS[0];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PROJECT_COLORS.length;
    return PROJECT_COLORS[index];
};
