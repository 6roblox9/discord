export type LogEntry = {
    id: string;
    color: "G" | "Y" | "C" | "X";
    text: string;
    time: string;
};

export const logs: LogEntry[] = [];
let listeners: (() => void)[] = [];

export function subscribe(callback: () => void) {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter(l => l !== callback);
    };
}

export function log(color: LogEntry["color"], text: string) {
    const time = new Date().toLocaleTimeString();
    logs.push({
        id: Math.random().toString(36).substring(7),
        color,
        text,
        time
    });
    listeners.forEach(l => l());
}

export function clearLogs() {
    logs.length = 0;
    listeners.forEach(l => l());
}
