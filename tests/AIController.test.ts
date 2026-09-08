import { describe, expect, it } from 'vitest';
import { AIController } from '../src/core/AIController';
import { CardDeck } from '../src/core/CardDeck';
import { RulesEngine } from '../src/core/RulesEngine';
import { Card, Suit } from '../src/core/types';

function createMockCard(rank: number, suit: Suit = Suit.SPADES): Card {
    return {
        id: `${CardDeck.getRankLabel(rank)}_${suit}`,
        suit,
        rank,
        weight: rank,
        points: CardDeck.calculatePoints(rank),
        label: CardDeck.getRankLabel(rank),
    };
}

describe('AIController', () => {
    it('should choose POUSAR when hand sum is below or equal to threshold', () => {
        const ai = new AIController(7);
        const preparedCards = [
            createMockCard(5), // active
            createMockCard(2), // cpu 3 (sum = 2 + 2 + 1 = 5 <= 7)
            createMockCard(9), // player 3
            createMockCard(2), // cpu 2
            createMockCard(9), // player 2
            createMockCard(1), // cpu 1
            createMockCard(9), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        const decision = ai.decideNextMove(engine);
        expect(decision.action).toBe('POUSAR');
    });

    it('should choose PLAY_CARD when higher card exists in hand and sum is above threshold', () => {
        const ai = new AIController(7);
        const preparedCards = [
            createMockCard(4), // active card rank 4
            createMockCard(9), // cpu 3 (rank 9 > 4)
            createMockCard(9), // player 3
            createMockCard(10), // cpu 2 (rank 10 > 4, max advantage)
            createMockCard(9), // player 2
            createMockCard(2), // cpu 1 (rank 2 < 4)
            createMockCard(9), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        const decision = ai.decideNextMove(engine);
        expect(decision.action).toBe('PLAY_CARD');
        // Card with rank 10 is at index 1
        expect(decision.cardIndex).toBe(1);
    });

    it('should choose DRAW when no card can cover active card and sum is above threshold', () => {
        const ai = new AIController(7);
        const preparedCards = [
            createMockCard(12), // active card rank 12 (Queen)
            createMockCard(8), // cpu 3
            createMockCard(9), // player 3
            createMockCard(6), // cpu 2
            createMockCard(9), // player 2
            createMockCard(5), // cpu 1
            createMockCard(9), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        const decision = ai.decideNextMove(engine);
        expect(decision.action).toBe('DRAW');
    });
});
