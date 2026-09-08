export enum Suit {
    HEARTS = 'HEARTS',
    DIAMONDS = 'DIAMONDS',
    CLUBS = 'CLUBS',
    SPADES = 'SPADES',
}

export type Actor = 'PLAYER' | 'CPU';

export type TurnState = 'IDLE' | 'BUSY' | 'GAME_OVER';

export type RoundOutcome = 'PLAYER_WON' | 'CPU_WON' | 'DRAW';

export interface Card {
    readonly id: string;
    readonly suit: Suit;
    readonly rank: number;
    readonly weight: number;
    readonly points: number;
    readonly label: string;
}

export interface DrawComparisonResult {
    readonly drawnCard: Card;
    readonly isHigher: boolean;
    readonly oldActiveCard: Card;
    readonly penaltyReplacedCard: Card | null;
    readonly penaltyIndex: number | null;
}

export interface PousoEvaluation {
    readonly caller: Actor;
    readonly hasCallerWon: boolean;
    readonly callerScore: number;
    readonly opponentScore: number;
    readonly outcome: RoundOutcome;
    readonly reason: string;
}

export interface MatchRecord {
    readonly id: string;
    readonly playerName: string;
    readonly playerScore: number;
    readonly cpuScore: number;
    readonly outcome: RoundOutcome;
    readonly reason: string;
    readonly timestamp: number;
}
