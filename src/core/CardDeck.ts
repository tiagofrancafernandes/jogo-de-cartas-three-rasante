import { Card, Suit } from './types';

const ACE_RANK = 1;
const TEN_RANK = 10;
const JACK_RANK = 11;
const QUEEN_RANK = 12;
const KING_RANK = 13;
const COURT_CARD_POINTS = 10;

export class CardDeck {
    private cards: Card[] = [];

    public constructor(initialCards?: Card[]) {
        if (initialCards && initialCards.length > 0) {
            this.cards = [...initialCards];
            return;
        }

        this.cards = this.buildStandardDeck();
    }

    public static getRankLabel(rank: number): string {
        if (rank === ACE_RANK) {
            return 'A';
        }

        if (rank === JACK_RANK) {
            return 'J';
        }

        if (rank === QUEEN_RANK) {
            return 'Q';
        }

        if (rank === KING_RANK) {
            return 'K';
        }

        return rank.toString();
    }

    public static calculatePoints(rank: number): number {
        if (rank >= TEN_RANK) {
            return COURT_CARD_POINTS;
        }

        return rank;
    }

    public shuffle(): void {
        const totalCards = this.cards.length;

        for (let index = totalCards - 1; index > 0; index--) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            const currentCard = this.cards[index];
            this.cards[index] = this.cards[randomIndex];
            this.cards[randomIndex] = currentCard;
        }
    }

    public draw(): Card | null {
        if (this.cards.length === 0) {
            return null;
        }

        const drawnCard = this.cards.pop();

        if (!drawnCard) {
            return null;
        }

        return drawnCard;
    }

    public getRemainingCount(): number {
        return this.cards.length;
    }

    public isEmpty(): boolean {
        return this.cards.length === 0;
    }

    public getCardsSnapshot(): Card[] {
        return [...this.cards];
    }

    private buildStandardDeck(): Card[] {
        const generatedCards: Card[] = [];
        const suits: Suit[] = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

        for (const suit of suits) {
            for (let rank = ACE_RANK; rank <= KING_RANK; rank++) {
                const points = CardDeck.calculatePoints(rank);
                const label = CardDeck.getRankLabel(rank);
                const cardIdentifier = `${label}_${suit}`;

                generatedCards.push({
                    id: cardIdentifier,
                    suit,
                    rank,
                    weight: rank,
                    points,
                    label,
                });
            }
        }

        return generatedCards;
    }
}
