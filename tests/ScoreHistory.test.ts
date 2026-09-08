import { describe, expect, it } from 'vitest';
import { ScoreHistory, StorageAdapter } from '../src/core/ScoreHistory';
import { MatchRecord } from '../src/core/types';

class MockStorage implements StorageAdapter {
    private memory = new Map<string, string>();

    public getItem(key: string): string | null {
        return this.memory.get(key) || null;
    }

    public setItem(key: string, value: string): void {
        this.memory.set(key, value);
    }
}

function createSampleRecord(overrides: Partial<MatchRecord> = {}): MatchRecord {
    return {
        id: `rec_${Math.random()}`,
        playerName: 'Tiago',
        playerScore: 12,
        cpuScore: 18,
        outcome: 'PLAYER_WON',
        reason: 'Pouso bem-sucedido',
        timestamp: Date.now(),
        ...overrides,
    };
}

describe('ScoreHistory', () => {
    it('should remember and retrieve last player name', () => {
        const mockStorage = new MockStorage();
        const history = new ScoreHistory(mockStorage);

        expect(history.getLastPlayerName()).toBe('Comandante');

        history.setLastPlayerName('Piloto Maverick');
        expect(history.getLastPlayerName()).toBe('Piloto Maverick');
    });

    it('should record matches and order recent matches by timestamp descending', () => {
        const mockStorage = new MockStorage();
        const history = new ScoreHistory(mockStorage);

        const matchOne = createSampleRecord({
            playerName: 'Player A',
            playerScore: 15,
            timestamp: 1000,
        });
        const matchTwo = createSampleRecord({
            playerName: 'Player B',
            playerScore: 8,
            timestamp: 2000,
        });

        history.recordMatch(matchOne);
        history.recordMatch(matchTwo);

        const recent = history.getRecentMatches();
        expect(recent.length).toBe(2);
        expect(recent[0].timestamp).toBe(2000);
        expect(recent[1].timestamp).toBe(1000);
        expect(history.getLastPlayerName()).toBe('Player B');
    });

    it('should order best scores by lowest score ascending with timestamp tiebreaker', () => {
        const mockStorage = new MockStorage();
        const history = new ScoreHistory(mockStorage);

        const highCardMatch = createSampleRecord({
            playerName: 'Player High',
            playerScore: 22,
            timestamp: 500,
        });
        const lowCardMatch = createSampleRecord({
            playerName: 'Player Low',
            playerScore: 6,
            timestamp: 600,
        });
        const mediumCardMatch = createSampleRecord({
            playerName: 'Player Mid',
            playerScore: 14,
            timestamp: 700,
        });

        history.recordMatch(highCardMatch);
        history.recordMatch(lowCardMatch);
        history.recordMatch(mediumCardMatch);

        const best = history.getBestScores();
        expect(best.length).toBe(3);
        // Lower score is better!
        expect(best[0].playerScore).toBe(6);
        expect(best[1].playerScore).toBe(14);
        expect(best[2].playerScore).toBe(22);
    });

    it('should strictly limit records to 10 entries', () => {
        const mockStorage = new MockStorage();
        const history = new ScoreHistory(mockStorage);

        for (let count = 1; count <= 15; count++) {
            history.recordMatch(
                createSampleRecord({
                    playerName: `Player ${count}`,
                    playerScore: count * 2,
                    timestamp: 1000 + count,
                })
            );
        }

        const recent = history.getRecentMatches();
        const best = history.getBestScores();

        expect(recent.length).toBe(10);
        expect(best.length).toBe(10);

        // Most recent is count 15
        expect(recent[0].timestamp).toBe(1015);
        // Best score is count 1 (score = 2)
        expect(best[0].playerScore).toBe(2);
    });

    it('should only record matches when the player has won', () => {
        const mockStorage = new MockStorage();
        const history = new ScoreHistory(mockStorage);

        const defeatMatch = createSampleRecord({
            outcome: 'CPU_WON',
            playerName: 'Defeated Pilot',
        });
        const drawMatch = createSampleRecord({
            outcome: 'DRAW',
            playerName: 'Tied Pilot',
        });

        history.recordMatch(defeatMatch);
        history.recordMatch(drawMatch);

        expect(history.getRecentMatches().length).toBe(0);
        expect(history.getBestScores().length).toBe(0);
    });
});
