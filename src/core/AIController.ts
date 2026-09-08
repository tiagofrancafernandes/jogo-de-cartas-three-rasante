import { Card } from './types';
import { RulesEngine } from './RulesEngine';

const DEFAULT_POUSO_THRESHOLD = 7;

export interface AIDecision {
    readonly action: 'POUSAR' | 'PLAY_CARD' | 'DRAW';
    readonly cardIndex?: number;
}

export class AIController {
    private pousoThreshold: number;

    public constructor(pousoThreshold: number = DEFAULT_POUSO_THRESHOLD) {
        this.pousoThreshold = pousoThreshold;
    }

    public decideNextMove(engine: RulesEngine): AIDecision {
        const cpuHand = engine.getCpuHand();
        const activeCard = engine.getActiveCard();

        const currentScore = engine.calculateHandScore(cpuHand);

        if (currentScore <= this.pousoThreshold) {
            return {
                action: 'POUSAR',
            };
        }

        if (!activeCard) {
            return {
                action: 'DRAW',
            };
        }

        const playableCardIndex = this.findBestCardToPlay(cpuHand, activeCard);

        if (playableCardIndex !== -1) {
            return {
                action: 'PLAY_CARD',
                cardIndex: playableCardIndex,
            };
        }

        return {
            action: 'DRAW',
        };
    }

    private findBestCardToPlay(hand: Card[], activeCard: Card): number {
        let optimalIndex = -1;
        let highestAdvantage = -9999;

        for (let index = 0; index < hand.length; index++) {
            const candidateCard = hand[index];

            if (candidateCard.weight <= activeCard.weight) {
                continue;
            }

            const pointDifference = candidateCard.points - activeCard.points;

            if (pointDifference > highestAdvantage) {
                highestAdvantage = pointDifference;
                optimalIndex = index;
            }
        }

        return optimalIndex;
    }
}
