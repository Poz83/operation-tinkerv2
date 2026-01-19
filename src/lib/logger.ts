/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type LogChannel = 'AI' | 'SYSTEM' | 'UI' | 'NETWORK' | 'USER';

export interface LogEntry {
    id: string;
    timestamp: number;
    level: LogLevel;
    channel: LogChannel;
    message: string;
    data?: any;
}

export interface LoggerConfig {
    maxMemoryLogs: number;
    enabledChannels: Record<LogChannel, boolean>;
    minLevel: LogLevel;
}

type LogListener = (entry: LogEntry) => void;

class LoggerService {
    private static instance: LoggerService;
    private logs: LogEntry[] = [];
    private listeners: Set<LogListener> = new Set();

    private config: LoggerConfig = {
        maxMemoryLogs: 1000,
        enabledChannels: {
            AI: true,
            SYSTEM: true,
            UI: true,
            NETWORK: true,
            USER: true,
        },
        minLevel: 'DEBUG', // Default to showing everything for now
    };

    private constructor() {
        // Private constructor for singleton
        this.system('Logger initialized');
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    public debug(channel: LogChannel, message: string, data?: any) {
        this.log('DEBUG', channel, message, data);
    }

    public info(channel: LogChannel, message: string, data?: any) {
        this.log('INFO', channel, message, data);
    }

    public warn(channel: LogChannel, message: string, data?: any) {
        this.log('WARN', channel, message, data);
    }

    public error(channel: LogChannel, message: string, data?: any) {
        this.log('ERROR', channel, message, data);
    }

    // Convenience methods for common channels
    public ai(message: string, data?: any) {
        this.info('AI', message, data);
    }

    public system(message: string, data?: any) {
        this.info('SYSTEM', message, data);
    }

    private log(level: LogLevel, channel: LogChannel, message: string, data?: any) {
        // 1. Check configs
        if (!this.config.enabledChannels[channel]) return;
        if (this.getLevelPriority(level) < this.getLevelPriority(this.config.minLevel)) return;

        const entry: LogEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            level,
            channel,
            message,
            data,
        };

        // 2. Add to memory
        this.logs.push(entry);
        if (this.logs.length > this.config.maxMemoryLogs) {
            this.logs.shift(); // Remove oldest
        }

        // 3. Notify listeners (hooks/UI)
        this.listeners.forEach(listener => listener(entry));

        // 4. Console output (formatted)
        this.consoleOutput(entry);
    }

    private consoleOutput(entry: LogEntry) {
        const style = this.getChannelStyle(entry.channel);
        const time = new Date(entry.timestamp).toLocaleTimeString();

        // Group complex data to keep console clean
        if (entry.data) {
            console.groupCollapsed(`%c[${time}] [${entry.channel}] ${entry.message}`, style);
            console.log('Level:', entry.level);
            console.log('Data:', entry.data);
            if (entry.level === 'ERROR' && entry.data instanceof Error) {
                console.error(entry.data);
            }
            console.groupEnd();
        } else {
            console.log(`%c[${time}] [${entry.channel}] ${entry.message}`, style);
        }
    }

    private getChannelStyle(channel: LogChannel): string {
        switch (channel) {
            case 'AI': return 'color: #8b5cf6; font-weight: bold;'; // Violet
            case 'SYSTEM': return 'color: #64748b; font-weight: bold;'; // Slate
            case 'UI': return 'color: #06b6d4; font-weight: bold;'; // Cyan
            case 'NETWORK': return 'color: #10b981; font-weight: bold;'; // Emerald
            case 'USER': return 'color: #f59e0b; font-weight: bold;'; // Amber
            default: return 'color: inherit;';
        }
    }

    private getLevelPriority(level: LogLevel): number {
        switch (level) {
            case 'DEBUG': return 0;
            case 'INFO': return 1;
            case 'WARN': return 2;
            case 'ERROR': return 3;
            default: return 1;
        }
    }

    // --- Pub/Sub for React Hooks ---

    public subscribe(listener: LogListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public clear() {
        this.logs = [];
        this.system('Logs cleared');
        // Notify listeners of clear? Or just let them react to empty list if they pull?
        // For simplicity, we might just emit a special system event or let hooks re-fetch.
        // Actually, sending a "clear" event might be better, but simpler for now is just clear memory.
    }
}

export const Logger = LoggerService.getInstance();
