import { CardDeck } from './CardDeck';
import { Actor, Card, DrawComparisonResult, PousoEvaluation, RoundOutcome, TurnState } from './types';

const INITIAL_HAND_SIZE = 3;
const KING_RANK = 13;

export interface RulesEngineEvents {
    onInitialDeal?: (playerHand: Card[], cpuHand: Card[], activeCard: Card) => void;
    onKingEliminated?: (eliminatedKing: Card, replacementCard: Card | null) => void;
    onCardPlayed?: (actor: Actor, playedCard: Card, collectedCard: Card, handIndex: number) => void;
    onDrawSuccess?: (actor: Actor, drawnCard: Card, oldActiveCard: Card) => void;
    onDrawPenalty?: (
        actor: Actor,
        drawnCard: Card,
        forcedCard: Card,
        replacementFromHand: Card,
        handIndex: number
    ) => void;
    onGameOver?: (outcome: RoundOutcome, reason: string) => void;
}

export class RulesEngine {
    private deck: CardDeck;
    private playerHand: Card[] = [];
    private cpuHand: Card[] = [];
    private activeCard: Card | null = null;
    private discardPile: Card[] = [];
    private kingCemetery: Card[] = [];
    private currentTurn: Actor = 'PLAYER';
    private turnState: TurnState = 'IDLE';
    private roundOutcome: RoundOutcome | null = null;
    private endReason: string | null = null;
    private events: RulesEngineEvents = {};

    public constructor(customDeck?: CardDeck, events?: RulesEngineEvents) {
        if (customDeck) {
            this.deck = customDeck;
        } else {
            this.deck = new CardDeck();
            this.deck.shuffle();
        }

        if (events) {
            this.events = events;
        }
    }

    public setEvents(events: RulesEngineEvents): void {
        this.events = events;
    }

    public startNewGame(): void {
        this.playerHand = [];
        this.cpuHand = [];
        this.discardPile = [];
        this.kingCemetery = [];
        this.activeCard = null;
        this.currentTurn = 'PLAYER';
        this.turnState = 'IDLE';
        this.roundOutcome = null;
        this.endReason = null;

        this.dealInitialHands();
        this.revealFirstActiveCard();

        if (this.events.onInitialDeal && this.activeCard) {
            this.events.onInitialDeal([...this.playerHand], [...this.cpuHand], this.activeCard);
        }
    }

    public canCover(handCard: Card, targetActiveCard?: Card | null): boolean {
        const activeToCheck = targetActiveCard !== undefined ? targetActiveCard : this.activeCard;

        if (!activeToCheck) {
            return false;
        }

        if (handCard.weight <= activeToCheck.weight) {
            return false;
        }

        return true;
    }

    public playCardFromHand(actor: Actor, cardIndex: number): boolean {
        if (this.turnState === 'GAME_OVER') {
            return false;
        }

        if (this.currentTurn !== actor) {
            return false;
        }

        if (!this.activeCard) {
            return false;
        }

        const hand = actor === 'PLAYER' ? this.playerHand : this.cpuHand;

        if (cardIndex < 0) {
            return false;
        }

        if (cardIndex >= hand.length) {
            return false;
        }

        const selectedHandCard = hand[cardIndex];

        if (!this.canCover(selectedHandCard, this.activeCard)) {
            return false;
        }

        const oldActiveCard = this.activeCard;
        this.activeCard = selectedHandCard;
        hand[cardIndex] = oldActiveCard;

        if (this.events.onCardPlayed) {
            this.events.onCardPlayed(actor, selectedHandCard, oldActiveCard, cardIndex);
        }

        this.handleKingEliminationLoop();

        if (!this.isGameOver()) {
            this.switchTurn();
        }

        return true;
    }

    public executeDraw(actor: Actor, forcedPenaltyIndex?: number): DrawComparisonResult | null {
        if (this.turnState === 'GAME_OVER') {
            return null;
        }

        if (this.currentTurn !== actor) {
            return null;
        }

        if (!this.activeCard) {
            return null;
        }

        if (this.deck.isEmpty()) {
            this.resolveDeckExhaustion();
            return null;
        }

        const drawnCard = this.deck.draw();

        if (!drawnCard) {
            this.resolveDeckExhaustion();
            return null;
        }

        const previousActiveCard = this.activeCard;
        const hand = actor === 'PLAYER' ? this.playerHand : this.cpuHand;

        if (drawnCard.weight > previousActiveCard.weight) {
            this.discardPile.push(previousActiveCard);
            this.activeCard = drawnCard;

            if (this.events.onDrawSuccess) {
                this.events.onDrawSuccess(actor, drawnCard, previousActiveCard);
            }

            this.handleKingEliminationLoop();

            if (!this.isGameOver()) {
                this.switchTurn();
            }

            return {
                drawnCard,
                isHigher: true,
                oldActiveCard: previousActiveCard,
                penaltyReplacedCard: null,
                penaltyIndex: null,
            };
        }

        this.discardPile.push(drawnCard);

        const chosenHandIndex =
            forcedPenaltyIndex !== undefined ? forcedPenaltyIndex : Math.floor(Math.random() * hand.length);

        const replacementFromHand = hand[chosenHandIndex];
        hand[chosenHandIndex] = previousActiveCard;
        this.activeCard = replacementFromHand;

        if (this.events.onDrawPenalty) {
            this.events.onDrawPenalty(actor, drawnCard, previousActiveCard, replacementFromHand, chosenHandIndex);
        }

        this.handleKingEliminationLoop();

        if (!this.isGameOver()) {
            this.switchTurn();
        }

        return {
            drawnCard,
            isHigher: false,
            oldActiveCard: previousActiveCard,
            penaltyReplacedCard: replacementFromHand,
            penaltyIndex: chosenHandIndex,
        };
    }

    public evaluatePouso(caller: Actor): PousoEvaluation {
        const playerScore = this.calculateHandScore(this.playerHand);
        const cpuScore = this.calculateHandScore(this.cpuHand);
        const callerScore = caller === 'PLAYER' ? playerScore : cpuScore;
        const opponentScore = caller === 'PLAYER' ? cpuScore : playerScore;

        const hasCallerWon = callerScore < opponentScore;

        let outcome: RoundOutcome = 'DRAW';

        if (hasCallerWon) {
            outcome = caller === 'PLAYER' ? 'PLAYER_WON' : 'CPU_WON';
        }

        if (!hasCallerWon) {
            outcome = caller === 'PLAYER' ? 'CPU_WON' : 'PLAYER_WON';
        }

        const reason = hasCallerWon
            ? `${caller} pousou com sucesso! (${callerScore} pts contra ${opponentScore} pts)`
            : `${caller} tentou pousar e Caiu! (${callerScore} pts contra ${opponentScore} pts)`;

        this.turnState = 'GAME_OVER';
        this.roundOutcome = outcome;
        this.endReason = reason;

        if (this.events.onGameOver) {
            this.events.onGameOver(outcome, reason);
        }

        return {
            caller,
            hasCallerWon,
            callerScore,
            opponentScore,
            outcome,
            reason,
        };
    }

    public calculateHandScore(cards: Card[]): number {
        return cards.reduce((accumulator, card) => accumulator + card.points, 0);
    }

    public getPlayerHand(): Card[] {
        return [...this.playerHand];
    }

    public getCpuHand(): Card[] {
        return [...this.cpuHand];
    }

    public getActiveCard(): Card | null {
        return this.activeCard;
    }

    public getDiscardPile(): Card[] {
        return [...this.discardPile];
    }

    public getKingCemetery(): Card[] {
        return [...this.kingCemetery];
    }

    public getRemainingDeckCount(): number {
        return this.deck.getRemainingCount();
    }

    public getCurrentTurn(): Actor {
        return this.currentTurn;
    }

    public getTurnState(): TurnState {
        return this.turnState;
    }

    public getRoundOutcome(): RoundOutcome | null {
        return this.roundOutcome;
    }

    public getEndReason(): string | null {
        return this.endReason;
    }

    public isGameOver(): boolean {
        return this.turnState === 'GAME_OVER';
    }

    private dealInitialHands(): void {
        for (let round = 0; round < INITIAL_HAND_SIZE; round++) {
            const playerCard = this.deck.draw();

            if (playerCard) {
                this.playerHand.push(playerCard);
            }

            const cpuCard = this.deck.draw();

            if (cpuCard) {
                this.cpuHand.push(cpuCard);
            }
        }
    }

    private revealFirstActiveCard(): void {
        if (this.deck.isEmpty()) {
            this.resolveDeckExhaustion();
            return;
        }

        const initialCard = this.deck.draw();

        if (!initialCard) {
            this.resolveDeckExhaustion();
            return;
        }

        this.activeCard = initialCard;
        this.handleKingEliminationLoop();
    }

    private handleKingEliminationLoop(): void {
        while (this.activeCard && this.activeCard.rank === KING_RANK) {
            const kingCard = this.activeCard;
            this.kingCemetery.push(kingCard);

            if (this.deck.isEmpty()) {
                this.activeCard = null;
                if (this.events.onKingEliminated) {
                    this.events.onKingEliminated(kingCard, null);
                }
                this.resolveDeckExhaustion();
                return;
            }

            const replacementCard = this.deck.draw();

            if (!replacementCard) {
                this.activeCard = null;
                if (this.events.onKingEliminated) {
                    this.events.onKingEliminated(kingCard, null);
                }
                this.resolveDeckExhaustion();
                return;
            }

            this.activeCard = replacementCard;

            if (this.events.onKingEliminated) {
                this.events.onKingEliminated(kingCard, replacementCard);
            }
        }
    }

    private switchTurn(): void {
        this.currentTurn = this.currentTurn === 'PLAYER' ? 'CPU' : 'PLAYER';
    }

    private resolveDeckExhaustion(): void {
        const playerScore = this.calculateHandScore(this.playerHand);
        const cpuScore = this.calculateHandScore(this.cpuHand);

        let outcome: RoundOutcome = 'DRAW';

        if (playerScore < cpuScore) {
            outcome = 'PLAYER_WON';
        }

        if (cpuScore < playerScore) {
            outcome = 'CPU_WON';
        }

        const reason =
            outcome === 'DRAW'
                ? `Fim do baralho: Empate em ${playerScore} pontos!`
                : `Fim do baralho: ${outcome === 'PLAYER_WON' ? 'Jogador' : 'CPU'} venceu por menor soma (${playerScore} x ${cpuScore})!`;

        this.turnState = 'GAME_OVER';
        this.roundOutcome = outcome;
        this.endReason = reason;

        if (this.events.onGameOver) {
            this.events.onGameOver(outcome, reason);
        }
    }
}
