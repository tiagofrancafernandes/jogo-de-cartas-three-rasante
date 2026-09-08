import { describe, expect, it } from 'vitest';
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

describe('CardDeck', () => {
    it('should generate standard 52-card deck with correct values', () => {
        const deck = new CardDeck();
        expect(deck.getRemainingCount()).toBe(52);

        const cards = deck.getCardsSnapshot();
        const kings = cards.filter((card) => card.rank === 13);
        const aces = cards.filter((card) => card.rank === 1);

        expect(kings.length).toBe(4);
        expect(aces.length).toBe(4);

        expect(aces[0].points).toBe(1);
        expect(kings[0].points).toBe(10);
    });

    it('should draw cards sequentially', () => {
        const cardOne = createMockCard(5);
        const cardTwo = createMockCard(8);
        const deck = new CardDeck([cardOne, cardTwo]);

        expect(deck.draw()?.rank).toBe(8);
        expect(deck.draw()?.rank).toBe(5);
        expect(deck.draw()).toBeNull();
        expect(deck.isEmpty()).toBe(true);
    });
});

describe('RulesEngine', () => {
    it('should deal 3 cards each and 1 active card', () => {
        const deck = new CardDeck();
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        expect(engine.getPlayerHand().length).toBe(3);
        expect(engine.getCpuHand().length).toBe(3);
        expect(engine.getActiveCard()).not.toBeNull();
        expect(engine.getActiveCard()?.rank).not.toBe(13); // King should be eliminated
        expect(engine.getCurrentTurn()).toBe('PLAYER');
        expect(engine.isGameOver()).toBe(false);
    });

    it('should evaluate canCover correctly', () => {
        const engine = new RulesEngine();
        const active = createMockCard(5);
        const higher = createMockCard(6);
        const lower = createMockCard(4);
        const equal = createMockCard(5);

        expect(engine.canCover(higher, active)).toBe(true);
        expect(engine.canCover(lower, active)).toBe(false);
        expect(engine.canCover(equal, active)).toBe(false);
    });

    it('should handle Action 1 (playCardFromHand): swaps active card and hands, and switches turn', () => {
        // Top of deck is popped in order:
        // dealInitialHands:
        // 1. player 1: 3
        // 2. cpu 1: 4
        // 3. player 2: 5
        // 4. cpu 2: 6
        // 5. player 3: 10
        // 6. cpu 3: 8
        // revealFirstActiveCard:
        // 7. active: 2
        const preparedCards = [
            createMockCard(2), // will be drawn for active card
            createMockCard(8), // cpu 3
            createMockCard(10), // player 3
            createMockCard(6), // cpu 2
            createMockCard(5), // player 2
            createMockCard(4), // cpu 1
            createMockCard(3), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        expect(engine.getActiveCard()?.rank).toBe(2);
        expect(engine.getPlayerHand()[2].rank).toBe(10);

        // Player plays card at index 2 (rank 10 > active 2)
        const playSucceeded = engine.playCardFromHand('PLAYER', 2);
        expect(playSucceeded).toBe(true);

        expect(engine.getActiveCard()?.rank).toBe(10);
        expect(engine.getPlayerHand()[2].rank).toBe(2);
        expect(engine.getCurrentTurn()).toBe('CPU');
    });

    it('should handle Action 2 (executeDraw) higher: replaces active card and discards old', () => {
        const preparedCards = [
            createMockCard(9), // draw pile next card
            createMockCard(4), // active card
            createMockCard(8), // cpu 3
            createMockCard(10), // player 3
            createMockCard(6), // cpu 2
            createMockCard(5), // player 2
            createMockCard(4), // cpu 1
            createMockCard(3), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        expect(engine.getActiveCard()?.rank).toBe(4);

        const drawResult = engine.executeDraw('PLAYER');
        expect(drawResult).not.toBeNull();
        expect(drawResult?.isHigher).toBe(true);
        expect(engine.getActiveCard()?.rank).toBe(9);
        expect(engine.getDiscardPile().length).toBe(1);
        expect(engine.getDiscardPile()[0].rank).toBe(4);
        expect(engine.getCurrentTurn()).toBe('CPU');
    });

    it('should handle Action 2 (executeDraw) lower/equal: applies penalty swap', () => {
        const preparedCards = [
            createMockCard(2), // drawn card (lower than active 7)
            createMockCard(7), // active card
            createMockCard(8), // cpu 3
            createMockCard(10), // player 3 (idx 2)
            createMockCard(6), // cpu 2
            createMockCard(5), // player 2 (idx 1)
            createMockCard(4), // cpu 1
            createMockCard(3), // player 1 (idx 0)
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        expect(engine.getActiveCard()?.rank).toBe(7);

        // Force replacement index to 1 (card with rank 5)
        const drawResult = engine.executeDraw('PLAYER', 1);
        expect(drawResult).not.toBeNull();
        expect(drawResult?.isHigher).toBe(false);

        // Drawn card (2) went to discard
        expect(engine.getDiscardPile().length).toBe(1);
        expect(engine.getDiscardPile()[0].rank).toBe(2);

        // Player received old active card (7) at index 1
        expect(engine.getPlayerHand()[1].rank).toBe(7);

        // Center active card is now the player's card from index 1 (5)
        expect(engine.getActiveCard()?.rank).toBe(5);
        expect(engine.getCurrentTurn()).toBe('CPU');
    });

    it('should eliminate King to cemetery and recursively draw replacement', () => {
        const preparedCards = [
            createMockCard(7), // replacement for second King
            createMockCard(13), // second King (recursive)
            createMockCard(13), // initial active card is King
            createMockCard(8), // cpu 3
            createMockCard(10), // player 3
            createMockCard(6), // cpu 2
            createMockCard(5), // player 2
            createMockCard(4), // cpu 1
            createMockCard(3), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        // The two Kings should have been moved to King Cemetery
        expect(engine.getKingCemetery().length).toBe(2);
        // Active card should now be the 7
        expect(engine.getActiveCard()?.rank).toBe(7);
    });

    it('should evaluate Pousar! correctly: player wins when score strictly lower', () => {
        const preparedCards = [
            createMockCard(5), // active
            createMockCard(10), // cpu 3 (sum = 8 + 6 + 10 = 24)
            createMockCard(2), // player 3 (sum = 1 + 2 + 2 = 5)
            createMockCard(6), // cpu 2
            createMockCard(2), // player 2
            createMockCard(8), // cpu 1
            createMockCard(1), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        const evaluation = engine.evaluatePouso('PLAYER');
        expect(evaluation.hasCallerWon).toBe(true);
        expect(evaluation.outcome).toBe('PLAYER_WON');
        expect(engine.isGameOver()).toBe(true);
    });

    it('should evaluate Pousar! correctly: player loses (Caiu!) when score equal or higher', () => {
        const preparedCards = [
            createMockCard(5), // active
            createMockCard(2), // cpu 3 (sum = 2 + 2 + 1 = 5)
            createMockCard(10), // player 3 (sum = 10 + 10 + 5 = 25)
            createMockCard(2), // cpu 2
            createMockCard(10), // player 2
            createMockCard(1), // cpu 1
            createMockCard(5), // player 1
        ];

        const deck = new CardDeck(preparedCards);
        const engine = new RulesEngine(deck);
        engine.startNewGame();

        const evaluation = engine.evaluatePouso('PLAYER');
        expect(evaluation.hasCallerWon).toBe(false);
        expect(evaluation.outcome).toBe('CPU_WON');
        expect(engine.isGameOver()).toBe(true);
    });
});
