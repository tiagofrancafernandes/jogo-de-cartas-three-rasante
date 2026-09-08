import { MatchRecord } from './types';

const STORAGE_KEY_RECENT = 'rasante_recent_matches';
const STORAGE_KEY_BEST = 'rasante_best_scores';
const STORAGE_KEY_LAST_PLAYER = 'rasante_last_player_name';
const DEFAULT_PLAYER_NAME = 'Comandante';
const MAX_HISTORY_RECORDS = 10;

export interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

class MemoryStorage implements StorageAdapter {
    private store: Map<string, string> = new Map();

    public getItem(key: string): string | null {
        return this.store.get(key) || null;
    }

    public setItem(key: string, value: string): void {
        this.store.set(key, value);
    }
}

export class ScoreHistory {
    private storage: StorageAdapter;

    public constructor(customStorage?: StorageAdapter) {
        if (customStorage) {
            this.storage = customStorage;
            return;
        }

        if (typeof window !== 'undefined' && window.localStorage) {
            this.storage = window.localStorage;
            return;
        }

        this.storage = new MemoryStorage();
    }

    public getLastPlayerName(): string {
        const storedName = this.storage.getItem(STORAGE_KEY_LAST_PLAYER);

        if (!storedName) {
            return DEFAULT_PLAYER_NAME;
        }

        const trimmedName = storedName.trim();

        if (trimmedName.length === 0) {
            return DEFAULT_PLAYER_NAME;
        }

        return trimmedName;
    }

    public setLastPlayerName(name: string): void {
        const trimmedName = name.trim();

        if (trimmedName.length === 0) {
            return;
        }

        this.storage.setItem(STORAGE_KEY_LAST_PLAYER, trimmedName);
    }

    public recordMatch(record: MatchRecord): void {
        if (record.outcome !== 'PLAYER_WON') {
            return;
        }

        this.setLastPlayerName(record.playerName);

        this.updateRecentMatches(record);
        this.updateBestMatches(record);
    }

    public getRecentMatches(): MatchRecord[] {
        const rawData = this.storage.getItem(STORAGE_KEY_RECENT);

        if (!rawData) {
            return [];
        }

        try {
            const records: MatchRecord[] = JSON.parse(rawData);
            return this.sortRecentMatches(records);
        } catch {
            return [];
        }
    }

    public getBestScores(): MatchRecord[] {
        const rawData = this.storage.getItem(STORAGE_KEY_BEST);

        if (!rawData) {
            return [];
        }

        try {
            const records: MatchRecord[] = JSON.parse(rawData);
            return this.sortBestScores(records);
        } catch {
            return [];
        }
    }

    public clear(): void {
        this.storage.setItem(STORAGE_KEY_RECENT, JSON.stringify([]));
        this.storage.setItem(STORAGE_KEY_BEST, JSON.stringify([]));
    }

    private updateRecentMatches(newRecord: MatchRecord): void {
        const existingRecords = this.getRecentMatches();
        const updatedRecords = [newRecord, ...existingRecords];

        const sortedRecords = this.sortRecentMatches(updatedRecords);
        const trimmedRecords = sortedRecords.slice(0, MAX_HISTORY_RECORDS);

        this.storage.setItem(STORAGE_KEY_RECENT, JSON.stringify(trimmedRecords));
    }

    private updateBestMatches(newRecord: MatchRecord): void {
        const existingRecords = this.getBestScores();
        const updatedRecords = [...existingRecords, newRecord];

        const sortedRecords = this.sortBestScores(updatedRecords);
        const trimmedRecords = sortedRecords.slice(0, MAX_HISTORY_RECORDS);

        this.storage.setItem(STORAGE_KEY_BEST, JSON.stringify(trimmedRecords));
    }

    private sortRecentMatches(records: MatchRecord[]): MatchRecord[] {
        return [...records].sort((firstRecord, secondRecord) => {
            if (secondRecord.timestamp !== firstRecord.timestamp) {
                return secondRecord.timestamp - firstRecord.timestamp;
            }

            return firstRecord.playerScore - secondRecord.playerScore;
        });
    }

    private sortBestScores(records: MatchRecord[]): MatchRecord[] {
        return [...records].sort((firstRecord, secondRecord) => {
            if (firstRecord.playerScore !== secondRecord.playerScore) {
                return firstRecord.playerScore - secondRecord.playerScore;
            }

            return secondRecord.timestamp - firstRecord.timestamp;
        });
    }
}
