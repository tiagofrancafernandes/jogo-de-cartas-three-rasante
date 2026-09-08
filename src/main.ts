import 'iconify-icon';
import './style.css';
import * as THREE from 'three';
import { AIController } from './core/AIController';
import { CardDeck } from './core/CardDeck';
import { RulesEngine } from './core/RulesEngine';
import { ScoreHistory } from './core/ScoreHistory';
import { Card } from './core/types';
import { AnimationQueue } from './graphics/AnimationQueue';
import { CardVisual } from './graphics/CardVisual';
import { SceneManager, SLOTS } from './graphics/SceneManager';
import { i18n } from './i18n';
import { UIManager } from './ui/UIManager';

class GameApp {
    private rulesEngine: RulesEngine;
    private aiController: AIController;
    private scoreHistory: ScoreHistory;
    private sceneManager: SceneManager;
    private animationQueue: AnimationQueue;
    private uiManager: UIManager;
    private cardMeshMap: Map<string, THREE.Mesh> = new Map();
    private cpuTurnTimeoutId: number | null = null;

    public constructor() {
        this.scoreHistory = new ScoreHistory();
        this.aiController = new AIController();
        this.animationQueue = new AnimationQueue();

        this.uiManager = new UIManager(this.scoreHistory, {
            onDrawCard: () => {
                this.handlePlayerDraw();
            },
            onPousar: () => {
                this.handlePlayerPousar();
            },
            onNewGame: () => {
                this.startNewGame();
            },
            onToggleViewMode: () => {
                this.handleToggleViewMode();
            },
            onCycleDistance: () => {
                this.handleCycleDistance();
            },
        });

        const container = document.getElementById('canvas-container') as HTMLElement;
        this.sceneManager = new SceneManager(container);

        this.uiManager.updateViewModeButton(this.sceneManager.getViewMode());
        this.uiManager.updateDistanceButton(this.sceneManager.getCameraDistance());
        this.animationQueue.setViewMode(this.sceneManager.getViewMode());

        this.sceneManager.onPlayerCardClick((clickedIndex) => {
            this.handlePlayerCardClick(clickedIndex);
        });

        this.rulesEngine = new RulesEngine();
        this.startRenderLoop();
        this.uiManager.setGameInProgress(false);
        this.uiManager.setActionButtonsEnabled(false);
        this.uiManager.updateStatus(i18n.t().startMatchPrompt);
        this.uiManager.showStartModal();
    }

    private handleToggleViewMode(): void {
        const nextMode = this.sceneManager.toggleViewMode();
        this.animationQueue.setViewMode(nextMode);
        this.uiManager.updateViewModeButton(nextMode);
    }

    private handleCycleDistance(): void {
        const nextDist = this.sceneManager.cycleCameraDistance();
        this.uiManager.updateDistanceButton(nextDist);
    }

    public async startNewGame(): Promise<void> {
        if (this.cpuTurnTimeoutId !== null) {
            window.clearTimeout(this.cpuTurnTimeoutId);
            this.cpuTurnTimeoutId = null;
        }

        this.animationQueue.reset();
        this.uiManager.hideStartModal();
        this.uiManager.hideGameOverModal();
        this.uiManager.setGameInProgress(true);
        this.clearAllCardMeshes();

        const deck = new CardDeck();
        deck.shuffle();

        this.rulesEngine = new RulesEngine(deck);
        this.rulesEngine.startNewGame();

        this.buildInitialMeshes();

        const initialCemetery = this.rulesEngine.getKingCemetery();
        for (let idx = 0; idx < initialCemetery.length; idx++) {
            const kingCard = initialCemetery[idx];
            const kingMesh = this.getCardMesh(kingCard);
            kingMesh.position.set(SLOTS.KING_CEMETERY.x, SLOTS.KING_CEMETERY.y + idx * 0.02, SLOTS.KING_CEMETERY.z);
            kingMesh.rotation.set(0, 0, 0);
        }

        const playerMeshes = this.getPlayerCardMeshes();
        const cpuMeshes = this.getCpuCardMeshes();
        const activeCard = this.rulesEngine.getActiveCard();

        if (!activeCard) {
            return;
        }

        const activeMesh = this.getCardMesh(activeCard);

        this.uiManager.setActionButtonsEnabled(false);
        this.sceneManager.setInteractive(false);
        this.uiManager.updateStatus(i18n.t().yourTurn);

        await this.animationQueue.animateInitialDeal(playerMeshes, cpuMeshes, activeMesh);

        this.sceneManager.setPlayerCardMeshes(playerMeshes);
        this.sceneManager.setInteractive(true);
        this.uiManager.setActionButtonsEnabled(true);
        this.updateHUD();
    }

    private async handlePlayerCardClick(cardIndex: number): Promise<void> {
        if (this.animationQueue.isBusy()) {
            return;
        }

        if (this.rulesEngine.getCurrentTurn() !== 'PLAYER') {
            return;
        }

        if (this.rulesEngine.isGameOver()) {
            return;
        }

        const playerHand = this.rulesEngine.getPlayerHand();
        const activeCard = this.rulesEngine.getActiveCard();

        if (!activeCard || !playerHand[cardIndex]) {
            return;
        }

        const selectedCard = playerHand[cardIndex];

        if (!this.rulesEngine.canCover(selectedCard, activeCard)) {
            this.uiManager.updateStatus(i18n.t().invalidMoveDesc);
            return;
        }

        this.uiManager.setActionButtonsEnabled(false);
        this.sceneManager.setInteractive(false);

        const playedMesh = this.getCardMesh(selectedCard);
        const collectedMesh = this.getCardMesh(activeCard);

        this.rulesEngine.playCardFromHand('PLAYER', cardIndex);

        await this.animationQueue.animateCardPlay(playedMesh, collectedMesh, 'PLAYER', cardIndex);

        await this.checkAndAnimateKingCemetery();

        this.sceneManager.setPlayerCardMeshes(this.getPlayerCardMeshes());
        this.updateHUD();

        if (this.rulesEngine.isGameOver()) {
            this.handleGameOver();
            return;
        }

        this.triggerCpuTurn();
    }

    private async handlePlayerDraw(): Promise<void> {
        if (this.animationQueue.isBusy()) {
            return;
        }

        if (this.rulesEngine.getCurrentTurn() !== 'PLAYER') {
            return;
        }

        if (this.rulesEngine.isGameOver()) {
            return;
        }

        this.uiManager.setActionButtonsEnabled(false);
        this.sceneManager.setInteractive(false);

        const previousActive = this.rulesEngine.getActiveCard();

        if (!previousActive) {
            return;
        }

        const drawResult = this.rulesEngine.executeDraw('PLAYER');

        if (!drawResult) {
            if (this.rulesEngine.isGameOver()) {
                this.handleGameOver();
            }
            return;
        }

        const drawnMesh = this.getCardMesh(drawResult.drawnCard);
        const oldActiveMesh = this.getCardMesh(drawResult.oldActiveCard);
        const discardCount = this.rulesEngine.getDiscardPile().length;

        if (drawResult.isHigher) {
            this.uiManager.updateStatus(i18n.t().drawSuccess);
            await this.animationQueue.animateDrawSuccess(drawnMesh, oldActiveMesh, discardCount);
        }

        if (!drawResult.isHigher && drawResult.penaltyReplacedCard && drawResult.penaltyIndex !== null) {
            this.uiManager.updateStatus(i18n.t().drawPenalty);
            const replacementMesh = this.getCardMesh(drawResult.penaltyReplacedCard);
            await this.animationQueue.animateDrawPenalty(
                drawnMesh,
                oldActiveMesh,
                replacementMesh,
                'PLAYER',
                drawResult.penaltyIndex,
                discardCount
            );
        }

        await this.checkAndAnimateKingCemetery();

        this.sceneManager.setPlayerCardMeshes(this.getPlayerCardMeshes());
        this.updateHUD();

        if (this.rulesEngine.isGameOver()) {
            this.handleGameOver();
            return;
        }

        this.triggerCpuTurn();
    }

    private async handlePlayerPousar(): Promise<void> {
        if (this.animationQueue.isBusy()) {
            return;
        }

        if (this.rulesEngine.getCurrentTurn() !== 'PLAYER') {
            return;
        }

        if (this.rulesEngine.isGameOver()) {
            return;
        }

        this.uiManager.setActionButtonsEnabled(false);
        this.uiManager.setGameInProgress(false);
        this.sceneManager.setInteractive(false);

        const evaluation = this.rulesEngine.evaluatePouso('PLAYER');

        await this.animationQueue.animateRevealCpuHand(this.getCpuCardMeshes());

        this.updateHUD();
        this.uiManager.showGameOverModal(
            evaluation.outcome,
            evaluation.reason,
            evaluation.callerScore,
            evaluation.opponentScore
        );
    }

    private triggerCpuTurn(): void {
        if (this.rulesEngine.isGameOver()) {
            this.handleGameOver();
            return;
        }

        this.uiManager.setActionButtonsEnabled(false);
        this.sceneManager.setInteractive(false);
        this.uiManager.updateStatus(i18n.t().cpuThinking, true);

        this.cpuTurnTimeoutId = window.setTimeout(async () => {
            await this.executeCpuMove();
        }, 1200);
    }

    private async executeCpuMove(): Promise<void> {
        if (this.rulesEngine.isGameOver()) {
            this.handleGameOver();
            return;
        }

        const decision = this.aiController.decideNextMove(this.rulesEngine);

        if (decision.action === 'POUSAR') {
            this.uiManager.setGameInProgress(false);
            const evaluation = this.rulesEngine.evaluatePouso('CPU');
            await this.animationQueue.animateRevealCpuHand(this.getCpuCardMeshes());
            this.updateHUD();
            this.uiManager.showGameOverModal(
                evaluation.outcome,
                evaluation.reason,
                evaluation.opponentScore,
                evaluation.callerScore
            );
            return;
        }

        if (decision.action === 'PLAY_CARD' && decision.cardIndex !== undefined) {
            const cpuHand = this.rulesEngine.getCpuHand();
            const chosenCard = cpuHand[decision.cardIndex];
            const activeCard = this.rulesEngine.getActiveCard();

            if (chosenCard && activeCard) {
                const playedMesh = this.getCardMesh(chosenCard);
                const collectedMesh = this.getCardMesh(activeCard);

                this.rulesEngine.playCardFromHand('CPU', decision.cardIndex);
                await this.animationQueue.animateCardPlay(playedMesh, collectedMesh, 'CPU', decision.cardIndex);
            }
        }

        if (decision.action === 'DRAW') {
            const previousActive = this.rulesEngine.getActiveCard();

            if (previousActive) {
                const drawResult = this.rulesEngine.executeDraw('CPU');

                if (drawResult) {
                    const drawnMesh = this.getCardMesh(drawResult.drawnCard);
                    const oldActiveMesh = this.getCardMesh(drawResult.oldActiveCard);
                    const discardCount = this.rulesEngine.getDiscardPile().length;

                    if (drawResult.isHigher) {
                        await this.animationQueue.animateDrawSuccess(drawnMesh, oldActiveMesh, discardCount);
                    }

                    if (!drawResult.isHigher && drawResult.penaltyReplacedCard && drawResult.penaltyIndex !== null) {
                        const replacementMesh = this.getCardMesh(drawResult.penaltyReplacedCard);
                        await this.animationQueue.animateDrawPenalty(
                            drawnMesh,
                            oldActiveMesh,
                            replacementMesh,
                            'CPU',
                            drawResult.penaltyIndex,
                            discardCount
                        );
                    }
                }
            }
        }

        await this.checkAndAnimateKingCemetery();

        this.updateHUD();

        if (this.rulesEngine.isGameOver()) {
            this.handleGameOver();
            return;
        }

        this.sceneManager.setInteractive(true);
        this.uiManager.setActionButtonsEnabled(true);
        this.uiManager.updateStatus(i18n.t().yourTurn, false);
    }

    private async checkAndAnimateKingCemetery(): Promise<void> {
        const kingCemetery = this.rulesEngine.getKingCemetery();
        const activeCard = this.rulesEngine.getActiveCard();

        for (let index = 0; index < kingCemetery.length; index++) {
            const kingCard = kingCemetery[index];
            const kingMesh = this.getCardMesh(kingCard);

            if (Math.abs(kingMesh.position.z - SLOTS.KING_CEMETERY.z) > 0.5) {
                this.uiManager.updateStatus(i18n.t().kingDetected);

                let replacementCard: Card | null = null;
                const nextKingIndex = index + 1;

                if (nextKingIndex < kingCemetery.length) {
                    replacementCard = kingCemetery[nextKingIndex];
                }

                if (nextKingIndex >= kingCemetery.length) {
                    replacementCard = activeCard;
                }

                const replacementMesh = replacementCard ? this.getCardMesh(replacementCard) : null;

                await this.animationQueue.animateKingBanishment(kingMesh, index, replacementMesh);
            }
        }

        if (activeCard) {
            const activeMesh = this.getCardMesh(activeCard);
            activeMesh.position.set(SLOTS.ACTIVE_CENTER.x, SLOTS.ACTIVE_CENTER.y, SLOTS.ACTIVE_CENTER.z);
            activeMesh.rotation.set(SLOTS.ACTIVE_CENTER.rotX, SLOTS.ACTIVE_CENTER.rotY, SLOTS.ACTIVE_CENTER.rotZ);
        }
    }

    private async handleGameOver(): Promise<void> {
        this.uiManager.setGameInProgress(false);
        const outcome = this.rulesEngine.getRoundOutcome() || 'DRAW';
        const reason = this.rulesEngine.getEndReason() || '';
        const playerScore = this.rulesEngine.calculateHandScore(this.rulesEngine.getPlayerHand());
        const cpuScore = this.rulesEngine.calculateHandScore(this.rulesEngine.getCpuHand());

        await this.animationQueue.animateRevealCpuHand(this.getCpuCardMeshes());

        this.updateHUD();
        this.uiManager.showGameOverModal(outcome, reason, playerScore, cpuScore);
    }

    private updateHUD(): void {
        const deckCount = this.rulesEngine.getRemainingDeckCount();
        const cemeteryCount = this.rulesEngine.getKingCemetery().length;
        const discardCount = this.rulesEngine.getDiscardPile().length;
        const playerScore = this.rulesEngine.calculateHandScore(this.rulesEngine.getPlayerHand());
        const cpuScore = this.rulesEngine.calculateHandScore(this.rulesEngine.getCpuHand());
        const isGameOver = this.rulesEngine.isGameOver();

        this.uiManager.updateCounters(deckCount, cemeteryCount, discardCount);
        this.uiManager.updateScores(playerScore, isGameOver, cpuScore);
    }

    private getPlayerCardMeshes(): THREE.Mesh[] {
        return this.rulesEngine.getPlayerHand().map((card) => this.getCardMesh(card));
    }

    private getCpuCardMeshes(): THREE.Mesh[] {
        return this.rulesEngine.getCpuHand().map((card) => this.getCardMesh(card));
    }

    private getCardMesh(card: Card): THREE.Mesh {
        let mesh = this.cardMeshMap.get(card.id);

        if (mesh) {
            return mesh;
        }

        mesh = CardVisual.createCardMesh(card);
        this.cardMeshMap.set(card.id, mesh);
        this.sceneManager.getScene().add(mesh);

        return mesh;
    }

    private buildInitialMeshes(): void {
        const playerHand = this.rulesEngine.getPlayerHand();
        const cpuHand = this.rulesEngine.getCpuHand();
        const activeCard = this.rulesEngine.getActiveCard();

        for (const card of playerHand) {
            this.getCardMesh(card);
        }

        for (const card of cpuHand) {
            this.getCardMesh(card);
        }

        if (activeCard) {
            this.getCardMesh(activeCard);
        }
    }

    private clearAllCardMeshes(): void {
        const scene = this.sceneManager.getScene();

        for (const mesh of this.cardMeshMap.values()) {
            scene.remove(mesh);
            mesh.geometry.dispose();

            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((mat) => mat.dispose());
            }
        }

        this.cardMeshMap.clear();
        this.sceneManager.setPlayerCardMeshes([]);
    }

    private startRenderLoop(): void {
        const animate = () => {
            requestAnimationFrame(animate);
            this.sceneManager.render();
        };

        animate();
    }
}

// Bootstrap on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});
