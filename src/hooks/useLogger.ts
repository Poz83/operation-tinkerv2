/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Logger, LogEntry, LogChannel, LogLevel } from '../lib/logger';

export function useLogger() {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        // Initial load
        setLogs(Logger.getLogs());

        // Subscribe to new logs
        const unsubscribe = Logger.subscribe((newEntry) => {
            setLogs(prev => [...prev, newEntry]);
        });

        return () => unsubscribe();
    }, []);

    const clearLogs = useCallback(() => {
        Logger.clear();
        setLogs([]);
    }, []);

    // Filtering helper (can be used by UI)
    const filterLogs = useCallback((
        entries: LogEntry[],
        channels: Set<LogChannel>,
        minLevel: LogLevel
    ) => {
        const levelPriority: Record<LogLevel, number> = {
            'DEBUG': 0,
            'INFO': 1,
            'WARN': 2,
            'ERROR': 3
        };

        return entries.filter(entry => {
            if (!channels.has(entry.channel)) return false;
            if (levelPriority[entry.level] < levelPriority[minLevel]) return false;
            return true;
        });
    }, []);

    return { logs, clearLogs, filterLogs };
}
