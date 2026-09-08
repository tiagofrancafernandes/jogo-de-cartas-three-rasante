import { ScoreHistory } from '../core/ScoreHistory';
import { MatchRecord, RoundOutcome } from '../core/types';
import { i18n } from '../i18n';
import { translations, Translations } from '../i18n/translations';

export interface UIActionHandlers {
    onDrawCard: () => void;
    onPousar: () => void;
    onNewGame: () => void;
    onToggleViewMode?: () => void;
    onCycleDistance?: () => void;
}

export class UIManager {
    private scoreHistory: ScoreHistory;
    private handlers: UIActionHandlers;
    private activeHistoryTab: 'recent' | 'best' = 'recent';
    private currentViewMode: '3D' | '2D' = '3D';
    private currentDistance: 'far' | 'normal' | 'near' = 'normal';
    private isGameInProgress: boolean = false;
    private lastStatusMessage: string = '';
    private lastMatchData: {
        outcome: RoundOutcome;
        reason: string;
        playerScore: number;
        cpuScore: number;
    } | null = null;

    public constructor(scoreHistory: ScoreHistory, handlers: UIActionHandlers) {
        this.scoreHistory = scoreHistory;
        this.handlers = handlers;

        this.mountDOM();
        this.bindEvents();

        i18n.subscribe(() => {
            this.refreshTexts();
            this.renderHistoryTable();
        });
    }

    public updateStatus(message: string, isCpuThinking: boolean = false): void {
        this.lastStatusMessage = message;
        const statusTextElement = document.getElementById('ui-status-text');

        if (!statusTextElement) {
            return;
        }

        statusTextElement.textContent = message;

        const spinnerElement = document.getElementById('ui-status-spinner');

        if (!spinnerElement) {
            return;
        }

        if (isCpuThinking) {
            spinnerElement.classList.remove('hidden');
            return;
        }

        spinnerElement.classList.add('hidden');
    }

    public updateCounters(deckCount: number, cemeteryCount: number, discardCount: number): void {
        const deckElement = document.getElementById('count-deck');
        const cemeteryElement = document.getElementById('count-cemetery');
        const discardElement = document.getElementById('count-discard');

        if (deckElement) {
            deckElement.textContent = deckCount.toString();
        }

        if (cemeteryElement) {
            cemeteryElement.textContent = cemeteryCount.toString();
        }

        if (discardElement) {
            discardElement.textContent = discardCount.toString();
        }
    }

    public updateScores(playerScore: number, isCpuVisible: boolean, cpuScore: number = 0): void {
        const playerScoreElement = document.getElementById('player-score-badge');
        const cpuScoreElement = document.getElementById('cpu-score-badge');

        if (playerScoreElement) {
            playerScoreElement.textContent = `${playerScore} PTS`;
        }

        if (!cpuScoreElement) {
            return;
        }

        if (isCpuVisible) {
            cpuScoreElement.textContent = `${cpuScore} PTS`;
            return;
        }

        cpuScoreElement.textContent = '???';
    }

    public setActionButtonsEnabled(enabled: boolean): void {
        const drawButton = document.getElementById('btn-draw') as HTMLButtonElement | null;
        const pousarButton = document.getElementById('btn-pousar') as HTMLButtonElement | null;

        if (drawButton) {
            drawButton.disabled = !enabled;
            drawButton.classList.toggle('opacity-50', !enabled);
            drawButton.classList.toggle('cursor-not-allowed', !enabled);
        }

        if (pousarButton) {
            pousarButton.disabled = !enabled;
            pousarButton.classList.toggle('opacity-50', !enabled);
            pousarButton.classList.toggle('cursor-not-allowed', !enabled);
        }
    }

    public updateViewModeButton(mode: '3D' | '2D'): void {
        this.currentViewMode = mode;
        const labelElement = document.getElementById('label-view-mode');
        const iconElement = document.getElementById('icon-view-mode');
        const buttonElement = document.getElementById('btn-toggle-view');

        if (labelElement) {
            labelElement.textContent = mode;
        }

        if (iconElement) {
            iconElement.setAttribute('icon', mode === '3D' ? 'fa7-solid:cube' : 'fa7-solid:clone');
        }

        if (buttonElement) {
            buttonElement.setAttribute('title', i18n.t().viewMode);
        }
    }

    public updateDistanceButton(distance: 'far' | 'normal' | 'near'): void {
        this.currentDistance = distance;
        const labelElement = document.getElementById('label-dist');
        const iconElement = document.getElementById('icon-dist');
        const buttonElement = document.getElementById('btn-toggle-dist');
        const t = i18n.t();

        if (labelElement) {
            if (distance === 'far') {
                labelElement.textContent = t.distFar;
            }
            if (distance === 'normal') {
                labelElement.textContent = t.distNormal;
            }
            if (distance === 'near') {
                labelElement.textContent = t.distNear;
            }
        }

        if (iconElement) {
            if (distance === 'far') {
                iconElement.setAttribute('icon', 'fa7-solid:magnifying-glass-minus');
            }
            if (distance === 'normal') {
                iconElement.setAttribute('icon', 'fa7-solid:magnifying-glass');
            }
            if (distance === 'near') {
                iconElement.setAttribute('icon', 'fa7-solid:magnifying-glass-plus');
            }
        }

        if (buttonElement) {
            buttonElement.setAttribute('title', t.distance);
        }
    }

    public showGameOverModal(outcome: RoundOutcome, reason: string, playerScore: number, cpuScore: number): void {
        this.lastMatchData = {
            outcome,
            reason,
            playerScore,
            cpuScore,
        };

        const modal = document.getElementById('modal-game-over');

        if (!modal) {
            return;
        }

        const t = i18n.t();
        const titleElement = document.getElementById('modal-game-over-title');
        const reasonElement = document.getElementById('modal-game-over-reason');
        const scoreSummaryElement = document.getElementById('modal-game-over-scores');
        const nameInput = document.getElementById('input-player-name') as HTMLInputElement | null;
        const saveButton = document.getElementById('btn-save-score') as HTMLButtonElement | null;

        if (titleElement) {
            if (outcome === 'PLAYER_WON') {
                titleElement.textContent = t.gameOverTitleWon;
                titleElement.className = 'text-3xl font-black text-emerald-400 text-center tracking-wide';
            }

            if (outcome === 'CPU_WON') {
                titleElement.textContent = t.gameOverTitleLost;
                titleElement.className = 'text-3xl font-black text-rose-500 text-center tracking-wide';
            }

            if (outcome === 'DRAW') {
                titleElement.textContent = t.gameOverTitleDraw;
                titleElement.className = 'text-3xl font-black text-amber-400 text-center tracking-wide';
            }
        }

        if (reasonElement) {
            reasonElement.textContent = reason;
        }

        if (scoreSummaryElement) {
            scoreSummaryElement.innerHTML = `
        <div class="flex items-center justify-around bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 my-3">
          <div class="text-center">
            <span class="text-xs uppercase tracking-wider text-emerald-400 block">${t.yourScore}</span>
            <span class="text-3xl font-extrabold text-white">${playerScore}</span>
          </div>
          <div class="text-slate-500 text-lg font-bold">VS</div>
          <div class="text-center">
            <span class="text-xs uppercase tracking-wider text-rose-400 block">${t.cpuScore}</span>
            <span class="text-3xl font-extrabold text-white">${cpuScore}</span>
          </div>
        </div>
      `;
        }

        const isPlayerWinner = outcome === 'PLAYER_WON';
        const nameContainer = document.getElementById('container-player-name');
        const playAgainButton = document.getElementById('btn-play-again') as HTMLButtonElement | null;

        if (nameContainer) {
            if (isPlayerWinner) {
                nameContainer.classList.remove('hidden');
            }
            if (!isPlayerWinner) {
                nameContainer.classList.add('hidden');
            }
        }

        if (nameInput && isPlayerWinner) {
            nameInput.value = this.scoreHistory.getLastPlayerName();
        }

        if (saveButton) {
            if (isPlayerWinner) {
                saveButton.classList.remove('hidden');
                saveButton.disabled = false;
                saveButton.innerHTML = `
        <iconify-icon icon="fa7-solid:floppy-disk" class="w-5 h-5 text-xl"></iconify-icon>
        <span>${t.saveScore}</span>
      `;
            }
            if (!isPlayerWinner) {
                saveButton.classList.add('hidden');
            }
        }

        if (playAgainButton) {
            if (!isPlayerWinner) {
                playAgainButton.className =
                    'w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/50';
            }
            if (isPlayerWinner) {
                playAgainButton.className =
                    'flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border border-slate-600';
            }
        }

        this.setGameInProgress(false);

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    public hideGameOverModal(): void {
        const modal = document.getElementById('modal-game-over');

        if (!modal) {
            return;
        }

        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    public setGameInProgress(inProgress: boolean): void {
        this.isGameInProgress = inProgress;
        this.updateRestartButtonState();
    }

    public isGameActive(): boolean {
        return this.isGameInProgress;
    }

    public updateRestartButtonState(): void {
        const restartBtn = document.getElementById('btn-restart');
        const iconElement = document.getElementById('icon-restart');
        const labelElement = document.getElementById('label-restart');
        const t = i18n.t();

        if (!restartBtn || !iconElement || !labelElement) {
            return;
        }

        if (this.isGameInProgress) {
            restartBtn.setAttribute('title', t.restartGame);
            labelElement.textContent = t.restartGame;
            iconElement.setAttribute('icon', 'fa7-solid:rotate-right');
            restartBtn.className =
                'px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm';
            return;
        }

        restartBtn.setAttribute('title', t.startGame);
        labelElement.textContent = t.startGame;
        iconElement.setAttribute('icon', 'fa7-solid:play');
        restartBtn.className =
            'px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm';
    }

    public showConfirmRestartModal(): void {
        const modal = document.getElementById('modal-confirm-restart');

        if (!modal) {
            return;
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    public hideConfirmRestartModal(): void {
        const modal = document.getElementById('modal-confirm-restart');

        if (!modal) {
            return;
        }

        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    public showStartModal(): void {
        const modal = document.getElementById('modal-start');

        if (!modal) {
            return;
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    public hideStartModal(): void {
        const modal = document.getElementById('modal-start');

        if (!modal) {
            return;
        }

        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    public showHistoryModal(): void {
        const modal = document.getElementById('modal-history');

        if (!modal) {
            return;
        }

        this.renderHistoryTable();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    public hideHistoryModal(): void {
        const modal = document.getElementById('modal-history');

        if (!modal) {
            return;
        }

        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    public showRulesModal(): void {
        const modal = document.getElementById('modal-rules');

        if (!modal) {
            return;
        }

        this.renderRulesContent();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    public hideRulesModal(): void {
        const modal = document.getElementById('modal-rules');

        if (!modal) {
            return;
        }

        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    private mountDOM(): void {
        const appContainer = document.getElementById('app');

        if (!appContainer) {
            return;
        }

        const t = i18n.t();
        const currentLocale = i18n.getLocale();

        appContainer.innerHTML = `
      <!-- 3D Canvas Viewport -->
      <div id="canvas-container" class="absolute inset-0 w-full h-full"></div>

      <!-- Top Header & HUD Overlay -->
      <header class="absolute top-0 left-0 right-0 p-4 pointer-events-none flex justify-between items-start z-10">
        <!-- Brand & Title -->
        <div class="pointer-events-auto bg-slate-950/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/50 shadow-2xl flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <iconify-icon icon="fa7-solid:plane-departure" class="w-5 h-5 text-xl"></iconify-icon>
          </div>
          <div>
            <h1 class="text-lg font-black tracking-wider text-amber-400 uppercase leading-none">${t.gameTitle}</h1>
            <span id="game-subtitle" class="text-xs text-slate-400 font-medium">${t.gameSubtitle}</span>
          </div>
        </div>

        <!-- Center Status Message -->
        <div class="pointer-events-auto bg-slate-950/85 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-emerald-500/40 shadow-2xl flex items-center gap-3 max-w-lg mx-2 text-center">
          <iconify-icon id="ui-status-spinner" icon="fa7-solid:spinner" class="w-5 h-5 text-xl text-amber-400 animate-spin hidden"></iconify-icon>
          <span id="ui-status-text" class="text-sm font-semibold text-slate-100">${t.yourTurn}</span>
        </div>

        <!-- Quick Utilities (View Mode, Distance, Language, Rules, History, Reset) -->
        <div class="pointer-events-auto flex items-center gap-2 bg-slate-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/50 shadow-2xl">
          <!-- View Mode Toggle (3D / 2D) -->
          <button id="btn-toggle-view" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer" title="${t.viewMode}">
            <iconify-icon id="icon-view-mode" icon="fa7-solid:cube" class="w-3.5 h-3.5 text-sky-400"></iconify-icon>
            <span id="label-view-mode">3D</span>
          </button>

          <!-- Camera Distance Toggle (Far / Normal / Near) -->
          <button id="btn-toggle-dist" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer" title="${t.distance}">
            <iconify-icon id="icon-dist" icon="fa7-solid:magnifying-glass" class="w-3.5 h-3.5 text-amber-400"></iconify-icon>
            <span id="label-dist">${t.distNormal}</span>
          </button>

          <!-- Language Toggle -->
          <button id="btn-toggle-lang" class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
            <iconify-icon icon="fa7-solid:globe" class="w-3.5 h-3.5 text-slate-400"></iconify-icon>
            <span id="label-lang">${currentLocale === 'pt-BR' ? 'PT' : 'EN'}</span>
          </button>

          <!-- Rules Button -->
          <button id="btn-open-rules" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition cursor-pointer" title="${t.rules}">
            <iconify-icon icon="fa7-solid:book-open" class="w-4 h-4 text-emerald-400"></iconify-icon>
          </button>

          <!-- History Button -->
          <button id="btn-open-history" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition cursor-pointer" title="${t.history}">
            <iconify-icon icon="fa7-solid:trophy" class="w-4 h-4 text-amber-400"></iconify-icon>
          </button>

          <!-- Start / Restart Button -->
          <button id="btn-restart" class="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm" title="${t.startGame}">
            <iconify-icon id="icon-restart" icon="fa7-solid:play" class="w-3.5 h-3.5"></iconify-icon>
            <span id="label-restart">${t.startGame}</span>
          </button>
        </div>
      </header>

      <!-- Table Piles Counters (Floating HUD) -->
      <aside class="absolute top-20 left-4 pointer-events-none flex flex-col gap-2 z-10">
        <!-- Deck Counter -->
        <div class="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-lg flex items-center gap-2.5 text-xs text-slate-300">
          <iconify-icon icon="mdi:cards-playing-outline" class="w-4 h-4 text-sky-400"></iconify-icon>
          <span class="label-deck-count">${t.deckCount}:</span>
          <span id="count-deck" class="font-extrabold text-white text-sm">45</span>
        </div>

        <!-- Discard Counter -->
        <div class="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-lg flex items-center gap-2.5 text-xs text-slate-300">
          <iconify-icon icon="fa7-solid:trash-can" class="w-4 h-4 text-slate-400"></iconify-icon>
          <span class="label-discard-count">${t.discardCount}:</span>
          <span id="count-discard" class="font-extrabold text-white text-sm">0</span>
        </div>

        <!-- King Cemetery Counter -->
        <div class="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-900/50 shadow-lg flex items-center gap-2.5 text-xs text-amber-300">
          <iconify-icon icon="fa7-solid:crown" class="w-4 h-4 text-amber-400"></iconify-icon>
          <span class="label-cemetery-count">${t.cemeteryCount}:</span>
          <span id="count-cemetery" class="font-extrabold text-white text-sm">0</span>
        </div>
      </aside>

      <!-- Hand Score Pill (Bottom Left) -->
      <div class="absolute bottom-6 left-6 pointer-events-none z-10 flex flex-col gap-2">
        <div class="bg-slate-950/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-emerald-500/40 shadow-xl flex items-center gap-3">
          <iconify-icon icon="fa7-solid:hand" class="w-5 h-5 text-emerald-400"></iconify-icon>
          <div>
            <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block label-your-score">${t.yourScore}</span>
            <span id="player-score-badge" class="text-xl font-black text-emerald-400">0 PTS</span>
          </div>
        </div>
      </div>

      <!-- CPU Hand Score Pill (Top Right) -->
      <div class="absolute top-20 right-4 pointer-events-none z-10">
        <div class="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-lg flex items-center gap-2.5 text-xs text-slate-300">
          <iconify-icon icon="fa7-solid:robot" class="w-4 h-4 text-rose-400"></iconify-icon>
          <span class="label-cpu-score">${t.cpuScore}:</span>
          <span id="cpu-score-badge" class="font-extrabold text-white text-sm">???</span>
        </div>
      </div>

      <!-- Action Controls Bar (Bottom Center) -->
      <nav class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <!-- Draw Button -->
        <button id="btn-draw" class="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-sky-950/50 hover:shadow-sky-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 cursor-pointer border border-sky-400/40">
          <iconify-icon icon="fa7-solid:layer-group" class="w-5 h-5 text-lg"></iconify-icon>
          <span id="btn-draw-label">${t.drawCard}</span>
        </button>

        <!-- Pousar! Button -->
        <button id="btn-pousar" class="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base uppercase tracking-widest shadow-2xl glow-pousar transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 cursor-pointer border border-yellow-300/80">
          <iconify-icon icon="fa7-solid:plane-arrival" class="w-6 h-6 text-xl"></iconify-icon>
          <span id="btn-pousar-label">${t.pousar}</span>
        </button>
      </nav>

      <!-- Game Over Modal -->
      <div id="modal-game-over" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md hidden items-center justify-center z-50 p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 transform transition">
          <h2 id="modal-game-over-title" class="text-3xl font-black text-center tracking-wide text-emerald-400">${t.gameOverTitleWon}</h2>
          <p id="modal-game-over-reason" class="text-sm text-slate-300 text-center font-medium"></p>

          <div id="modal-game-over-scores"></div>

          <!-- Name Entry for History (Only shown on Player Victory) -->
          <div id="container-player-name" class="flex flex-col gap-2 my-2">
            <label for="input-player-name" class="text-xs font-bold text-slate-400 uppercase tracking-wider label-player-prompt">${t.playerNamePrompt}</label>
            <div class="relative">
              <input id="input-player-name" type="text" maxlength="24" class="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 text-white px-4 py-2.5 rounded-xl font-bold outline-none transition" placeholder="Nome do Jogador" />
            </div>
          </div>

          <div class="flex items-center gap-3 mt-2">
            <button id="btn-save-score" class="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-950/50">
              <iconify-icon icon="fa7-solid:floppy-disk" class="w-5 h-5 text-xl"></iconify-icon>
              <span id="btn-save-label">${t.saveScore}</span>
            </button>
            <button id="btn-play-again" class="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border border-slate-600">
              <iconify-icon icon="fa7-solid:rotate-right" class="w-5 h-5 text-xl"></iconify-icon>
              <span id="btn-play-again-label">${t.playAgain}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Match History Modal (Dual Tabs: Últimas e Melhores) -->
      <div id="modal-history" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md hidden items-center justify-center z-50 p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-4 max-h-[90vh]">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <iconify-icon icon="fa7-solid:trophy" class="w-6 h-6 text-amber-400 text-2xl"></iconify-icon>
              <h2 class="text-xl font-black text-white tracking-wide uppercase label-history-title">${t.historyModalTitle}</h2>
            </div>
            <button id="btn-close-history" class="p-2 text-slate-400 hover:text-white transition cursor-pointer">
              <iconify-icon icon="fa7-solid:xmark" class="w-6 h-6 text-2xl"></iconify-icon>
            </button>
          </div>

          <!-- Dual Tabs Navigation -->
          <div class="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button id="tab-btn-recent" class="flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer bg-amber-500 text-slate-950 flex items-center justify-center gap-2">
              <iconify-icon icon="fa7-solid:clock-rotate-left" class="w-4 h-4"></iconify-icon>
              <span id="tab-label-recent">${t.tabRecent}</span>
            </button>
            <button id="tab-btn-best" class="flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer text-slate-400 hover:text-white flex items-center justify-center gap-2">
              <iconify-icon icon="fa7-solid:ranking-star" class="w-4 h-4"></iconify-icon>
              <span id="tab-label-best">${t.tabBest}</span>
            </button>
          </div>

          <!-- History Table Content -->
          <div class="overflow-y-auto flex-1 border border-slate-800 rounded-xl bg-slate-950/50">
            <table class="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead class="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] sticky top-0">
                <tr>
                  <th id="th-rank" class="p-3 text-center">${t.colRank}</th>
                  <th id="th-player" class="p-3">${t.colPlayer}</th>
                  <th id="th-score" class="p-3 text-center">${t.colScore}</th>
                  <th id="th-cpu" class="p-3 text-center">${t.colCpu}</th>
                  <th id="th-outcome" class="p-3 text-center">${t.colOutcome}</th>
                  <th id="th-date" class="p-3 text-right">${t.colDate}</th>
                </tr>
              </thead>
              <tbody id="history-table-body" class="divide-y divide-slate-800/60 font-medium">
                <!-- Dynamically generated rows -->
              </tbody>
            </table>
          </div>

          <!-- History Footer -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-800">
            <button id="btn-clear-history" class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5 transition cursor-pointer">
              <iconify-icon icon="fa7-solid:trash-can" class="w-3.5 h-3.5"></iconify-icon>
              <span id="btn-clear-history-label">${t.clearHistory}</span>
            </button>
            <button id="btn-close-history-bottom" class="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer">
              ${t.close}
            </button>
          </div>
        </div>
      </div>

      <!-- Rules Guide Modal -->
      <div id="modal-rules" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md hidden items-center justify-center z-50 p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-4 max-h-[90vh]">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <iconify-icon icon="fa7-solid:book-open" class="w-6 h-6 text-emerald-400 text-2xl"></iconify-icon>
              <h2 id="label-rules-title" class="text-xl font-black text-white tracking-wide uppercase label-rules-title">${t.rulesModalTitle}</h2>
            </div>
            <button id="btn-close-rules" class="p-2 text-slate-400 hover:text-white transition cursor-pointer" title="${t.close}">
              <iconify-icon icon="fa7-solid:xmark" class="w-6 h-6 text-2xl"></iconify-icon>
            </button>
          </div>

          <div id="rules-content-container" class="overflow-y-auto flex-1 pr-2 flex flex-col gap-4 text-slate-300 text-sm leading-relaxed">
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-800">
            <button id="btn-close-rules-bottom" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold rounded-xl transition cursor-pointer">
              ${t.close}
            </button>
          </div>
        </div>
      </div>

      <!-- Confirm Restart Modal -->
      <div id="modal-confirm-restart" class="fixed inset-0 bg-slate-950/85 backdrop-blur-md hidden items-center justify-center z-50 p-4">
        <div class="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
          <div class="flex items-center justify-between border-b border-slate-800 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <iconify-icon icon="fa7-solid:triangle-exclamation" class="w-5 h-5 text-xl"></iconify-icon>
              </div>
              <h2 id="confirm-restart-title" class="text-lg font-black text-white uppercase tracking-wider">${t.confirmRestartTitle}</h2>
            </div>
            <button id="btn-close-confirm-restart" class="p-2 text-slate-400 hover:text-white transition cursor-pointer" title="${t.close}">
              <iconify-icon icon="fa7-solid:xmark" class="w-6 h-6 text-2xl"></iconify-icon>
            </button>
          </div>

          <p id="confirm-restart-message" class="text-xs sm:text-sm text-slate-300 leading-relaxed">${t.confirmRestartMessage}</p>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button id="btn-cancel-restart" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer">
              <span id="btn-cancel-restart-label">${t.confirmRestartCancel}</span>
            </button>
            <button id="btn-confirm-restart" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-950/50">
              <iconify-icon icon="fa7-solid:rotate-right" class="w-3.5 h-3.5"></iconify-icon>
              <span id="btn-confirm-restart-label">${t.confirmRestartYes}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Welcome / Start Game Modal -->
      <div id="modal-start" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md hidden items-center justify-center z-40 p-4">
        <div class="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center gap-5">
          <div class="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <iconify-icon icon="fa7-solid:plane-departure" class="w-8 h-8 text-4xl"></iconify-icon>
          </div>

          <div>
            <h2 id="start-modal-title" class="text-2xl font-black text-white tracking-wide uppercase">${t.startModalTitle}</h2>
            <p id="start-modal-subtitle" class="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed max-w-xs mx-auto">${t.startModalSubtitle}</p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <button id="btn-rules-hero" class="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border border-slate-600">
              <iconify-icon icon="fa7-solid:book-open" class="w-4 h-4 text-emerald-400"></iconify-icon>
              <span id="label-rules-hero">${t.rules}</span>
            </button>
            <button id="btn-start-hero" class="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/50">
              <iconify-icon icon="fa7-solid:play" class="w-4 h-4"></iconify-icon>
              <span id="label-start-hero">${t.startModalButton}</span>
            </button>
          </div>
        </div>
      </div>
    `;

        this.renderRulesContent();
    }

    private bindEvents(): void {
        const drawButton = document.getElementById('btn-draw');
        const pousarButton = document.getElementById('btn-pousar');
        const restartButton = document.getElementById('btn-restart');
        const playAgainButton = document.getElementById('btn-play-again');
        const toggleLangButton = document.getElementById('btn-toggle-lang');
        const toggleViewButton = document.getElementById('btn-toggle-view');
        const toggleDistButton = document.getElementById('btn-toggle-dist');
        const openHistoryButton = document.getElementById('btn-open-history');
        const closeHistoryButton = document.getElementById('btn-close-history');
        const closeHistoryBottomButton = document.getElementById('btn-close-history-bottom');
        const clearHistoryButton = document.getElementById('btn-clear-history');
        const openRulesButton = document.getElementById('btn-open-rules');
        const closeRulesButton = document.getElementById('btn-close-rules');
        const closeRulesBottomButton = document.getElementById('btn-close-rules-bottom');
        const tabRecentButton = document.getElementById('tab-btn-recent');
        const tabBestButton = document.getElementById('tab-btn-best');
        const saveScoreButton = document.getElementById('btn-save-score');

        if (drawButton) {
            drawButton.addEventListener('click', () => {
                this.handlers.onDrawCard();
            });
        }

        if (pousarButton) {
            pousarButton.addEventListener('click', () => {
                this.handlers.onPousar();
            });
        }

        if (restartButton) {
            restartButton.addEventListener('click', () => {
                if (this.isGameInProgress) {
                    this.showConfirmRestartModal();
                    return;
                }

                this.hideStartModal();
                this.handlers.onNewGame();
            });
        }

        if (playAgainButton) {
            playAgainButton.addEventListener('click', () => {
                this.hideGameOverModal();
                this.handlers.onNewGame();
            });
        }

        if (toggleViewButton) {
            toggleViewButton.addEventListener('click', () => {
                if (this.handlers.onToggleViewMode) {
                    this.handlers.onToggleViewMode();
                }
            });
        }

        if (toggleDistButton) {
            toggleDistButton.addEventListener('click', () => {
                if (this.handlers.onCycleDistance) {
                    this.handlers.onCycleDistance();
                }
            });
        }

        if (toggleLangButton) {
            toggleLangButton.addEventListener('click', () => {
                const nextLocale = i18n.toggleLocale();
                const langLabel = document.getElementById('label-lang');

                if (langLabel) {
                    langLabel.textContent = nextLocale === 'pt-BR' ? 'PT' : 'EN';
                }
            });
        }

        if (openHistoryButton) {
            openHistoryButton.addEventListener('click', () => {
                this.showHistoryModal();
            });
        }

        if (closeHistoryButton) {
            closeHistoryButton.addEventListener('click', () => {
                this.hideHistoryModal();
            });
        }

        if (closeHistoryBottomButton) {
            closeHistoryBottomButton.addEventListener('click', () => {
                this.hideHistoryModal();
            });
        }

        if (clearHistoryButton) {
            clearHistoryButton.addEventListener('click', () => {
                this.scoreHistory.clear();
                this.renderHistoryTable();
            });
        }

        if (openRulesButton) {
            openRulesButton.addEventListener('click', () => {
                this.showRulesModal();
            });
        }

        if (closeRulesButton) {
            closeRulesButton.addEventListener('click', () => {
                this.hideRulesModal();
            });
        }

        if (closeRulesBottomButton) {
            closeRulesBottomButton.addEventListener('click', () => {
                this.hideRulesModal();
            });
        }

        if (tabRecentButton) {
            tabRecentButton.addEventListener('click', () => {
                this.switchHistoryTab('recent');
            });
        }

        if (tabBestButton) {
            tabBestButton.addEventListener('click', () => {
                this.switchHistoryTab('best');
            });
        }

        if (saveScoreButton) {
            saveScoreButton.addEventListener('click', () => {
                this.handleSaveScore();
            });
        }

        const confirmRestartButton = document.getElementById('btn-confirm-restart');
        const cancelRestartButton = document.getElementById('btn-cancel-restart');
        const closeConfirmRestartButton = document.getElementById('btn-close-confirm-restart');
        const confirmRestartModal = document.getElementById('modal-confirm-restart');
        const startHeroButton = document.getElementById('btn-start-hero');
        const rulesHeroButton = document.getElementById('btn-rules-hero');

        if (confirmRestartButton) {
            confirmRestartButton.addEventListener('click', () => {
                this.hideConfirmRestartModal();
                this.hideStartModal();
                this.handlers.onNewGame();
            });
        }

        if (cancelRestartButton) {
            cancelRestartButton.addEventListener('click', () => {
                this.hideConfirmRestartModal();
            });
        }

        if (closeConfirmRestartButton) {
            closeConfirmRestartButton.addEventListener('click', () => {
                this.hideConfirmRestartModal();
            });
        }

        if (confirmRestartModal) {
            confirmRestartModal.addEventListener('click', (event) => {
                if (event.target === confirmRestartModal) {
                    this.hideConfirmRestartModal();
                }
            });
        }

        if (startHeroButton) {
            startHeroButton.addEventListener('click', () => {
                this.hideStartModal();
                this.handlers.onNewGame();
            });
        }

        if (rulesHeroButton) {
            rulesHeroButton.addEventListener('click', () => {
                this.showRulesModal();
            });
        }

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideConfirmRestartModal();
                this.hideRulesModal();
                this.hideHistoryModal();
            }
        });
    }

    private handleSaveScore(): void {
        if (!this.lastMatchData) {
            return;
        }

        if (this.lastMatchData.outcome !== 'PLAYER_WON') {
            return;
        }

        const nameInput = document.getElementById('input-player-name') as HTMLInputElement | null;
        const rawName = nameInput ? nameInput.value : '';
        const playerName = rawName.trim().length > 0 ? rawName.trim() : this.scoreHistory.getLastPlayerName();

        const record: MatchRecord = {
            id: `match_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            playerName,
            playerScore: this.lastMatchData.playerScore,
            cpuScore: this.lastMatchData.cpuScore,
            outcome: this.lastMatchData.outcome,
            reason: this.lastMatchData.reason,
            timestamp: Date.now(),
        };

        this.scoreHistory.recordMatch(record);

        const saveButton = document.getElementById('btn-save-score') as HTMLButtonElement | null;

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.innerHTML = `
        <iconify-icon icon="fa7-solid:check" class="w-5 h-5 text-xl text-emerald-950"></iconify-icon>
        <span>Salvo!</span>
      `;
        }

        // Auto open history after 400ms to showcase saved score
        setTimeout(() => {
            this.hideGameOverModal();
            this.showHistoryModal();
        }, 450);
    }

    private switchHistoryTab(tab: 'recent' | 'best'): void {
        this.activeHistoryTab = tab;

        const recentTabBtn = document.getElementById('tab-btn-recent');
        const bestTabBtn = document.getElementById('tab-btn-best');

        if (!recentTabBtn || !bestTabBtn) {
            return;
        }

        if (tab === 'recent') {
            recentTabBtn.className =
                'flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer bg-amber-500 text-slate-950 flex items-center justify-center gap-2';
            bestTabBtn.className =
                'flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer text-slate-400 hover:text-white flex items-center justify-center gap-2';
        }

        if (tab === 'best') {
            bestTabBtn.className =
                'flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer bg-amber-500 text-slate-950 flex items-center justify-center gap-2';
            recentTabBtn.className =
                'flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer text-slate-400 hover:text-white flex items-center justify-center gap-2';
        }

        this.renderHistoryTable();
    }

    private renderHistoryTable(): void {
        const tableBody = document.getElementById('history-table-body');

        if (!tableBody) {
            return;
        }

        const t = i18n.t();
        const records =
            this.activeHistoryTab === 'recent'
                ? this.scoreHistory.getRecentMatches()
                : this.scoreHistory.getBestScores();

        if (records.length === 0) {
            tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-500 italic">
            <iconify-icon icon="fa7-regular:circle-question" class="w-8 h-8 mx-auto mb-2 opacity-50 block text-2xl"></iconify-icon>
            ${t.noHistory}
          </td>
        </tr>
      `;
            return;
        }

        let rowsHtml = '';

        for (let index = 0; index < records.length; index++) {
            const record = records[index];
            const dateFormatted = new Date(record.timestamp).toLocaleDateString(undefined, {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });

            let outcomeBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400">${t.statusDraw}</span>`;

            if (record.outcome === 'PLAYER_WON') {
                outcomeBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400">${t.statusWon}</span>`;
            }

            if (record.outcome === 'CPU_WON') {
                outcomeBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400">${t.statusLost}</span>`;
            }

            const rankBadge =
                index === 0
                    ? '<iconify-icon icon="fa7-solid:crown" class="w-4 h-4 text-amber-400 inline"></iconify-icon>'
                    : `#${index + 1}`;

            rowsHtml += `
        <tr class="hover:bg-slate-900/60 transition">
          <td class="p-3 text-center font-bold text-slate-400">${rankBadge}</td>
          <td class="p-3 font-semibold text-white flex items-center gap-2">
            <iconify-icon icon="fa7-solid:user" class="w-3.5 h-3.5 text-slate-400"></iconify-icon>
            <span>${record.playerName}</span>
          </td>
          <td class="p-3 text-center font-black text-amber-400">${record.playerScore}</td>
          <td class="p-3 text-center font-bold text-slate-400">${record.cpuScore}</td>
          <td class="p-3 text-center">${outcomeBadge}</td>
          <td class="p-3 text-right text-xs text-slate-400">${dateFormatted}</td>
        </tr>
      `;
        }

        tableBody.innerHTML = rowsHtml;
    }

    private renderRulesContent(): void {
        const container = document.getElementById('rules-content-container');
        const titleElement = document.getElementById('label-rules-title');
        const closeBottomBtn = document.getElementById('btn-close-rules-bottom');
        const closeTopBtn = document.getElementById('btn-close-rules');
        const t = i18n.t();

        if (titleElement) {
            titleElement.textContent = t.rulesModalTitle;
        }

        if (closeBottomBtn) {
            closeBottomBtn.textContent = t.close;
        }

        if (closeTopBtn) {
            closeTopBtn.setAttribute('title', t.close);
        }

        if (!container) {
            return;
        }

        container.innerHTML = `
            <section class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 class="font-bold text-emerald-400 mb-1 flex items-center gap-2">
                <iconify-icon icon="fa7-solid:bullseye" class="w-4 h-4"></iconify-icon>
                <span>${t.rulesObjectiveTitle}</span>
              </h3>
              <p class="text-xs text-slate-300">${t.rulesObjectiveText}</p>
            </section>

            <section class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 class="font-bold text-amber-400 mb-1 flex items-center gap-2">
                <iconify-icon icon="fa7-solid:scale-balanced" class="w-4 h-4"></iconify-icon>
                <span>${t.rulesValuesTitle}</span>
              </h3>
              <p class="text-xs text-slate-300 whitespace-pre-line">${t.rulesValuesText}</p>
            </section>

            <section class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 class="font-bold text-sky-400 mb-1 flex items-center gap-2">
                <iconify-icon icon="fa7-solid:play" class="w-4 h-4"></iconify-icon>
                <span>${t.rulesTurnTitle}</span>
              </h3>
              <p class="text-xs text-slate-300 whitespace-pre-line">${t.rulesTurnText}</p>
            </section>

            <section class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 class="font-bold text-rose-400 mb-1 flex items-center gap-2">
                <iconify-icon icon="fa7-solid:crown" class="w-4 h-4"></iconify-icon>
                <span>${t.rulesKingTitle}</span>
              </h3>
              <p class="text-xs text-slate-300">${t.rulesKingText}</p>
            </section>

            <section class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <h3 class="font-bold text-yellow-400 mb-1 flex items-center gap-2">
                <iconify-icon icon="fa7-solid:trophy" class="w-4 h-4"></iconify-icon>
                <span>${t.rulesLandingTitle}</span>
              </h3>
              <p class="text-xs text-slate-300">${t.rulesLandingText}</p>
            </section>
        `;
    }

    private translateCurrentStatus(): void {
        const statusTextElement = document.getElementById('ui-status-text');

        if (!statusTextElement || !this.lastStatusMessage) {
            return;
        }

        const pt = translations['pt-BR'];
        const en = translations['en-US'];
        const t = i18n.t();
        const statusKeys: Array<keyof Translations> = [
            'startMatchPrompt',
            'yourTurn',
            'cpuThinking',
            'cpuTurn',
            'invalidMoveTitle',
            'invalidMoveDesc',
            'kingDetected',
            'drawSuccess',
            'drawPenalty',
            'gameOverTitleWon',
            'gameOverTitleLost',
            'gameOverTitleDraw',
            'landingSuccess',
            'landingFailed',
            'deckExhausted',
        ];

        for (const key of statusKeys) {
            if (this.lastStatusMessage === pt[key] || this.lastStatusMessage === en[key]) {
                statusTextElement.textContent = t[key];
                this.lastStatusMessage = t[key];
                return;
            }
        }
    }

    private refreshTexts(): void {
        const t = i18n.t();

        const subtitleElement = document.getElementById('game-subtitle');
        if (subtitleElement) {
            subtitleElement.textContent = t.gameSubtitle;
        }

        const openRulesBtn = document.getElementById('btn-open-rules');
        if (openRulesBtn) {
            openRulesBtn.setAttribute('title', t.rules);
        }

        const openHistoryBtn = document.getElementById('btn-open-history');
        if (openHistoryBtn) {
            openHistoryBtn.setAttribute('title', t.history);
        }

        this.updateRestartButtonState();

        const confirmRestartTitle = document.getElementById('confirm-restart-title');
        const confirmRestartMessage = document.getElementById('confirm-restart-message');
        const cancelRestartLabel = document.getElementById('btn-cancel-restart-label');
        const confirmRestartLabel = document.getElementById('btn-confirm-restart-label');
        const closeConfirmRestartBtn = document.getElementById('btn-close-confirm-restart');

        if (confirmRestartTitle) {
            confirmRestartTitle.textContent = t.confirmRestartTitle;
        }

        if (confirmRestartMessage) {
            confirmRestartMessage.textContent = t.confirmRestartMessage;
        }

        if (cancelRestartLabel) {
            cancelRestartLabel.textContent = t.confirmRestartCancel;
        }

        if (confirmRestartLabel) {
            confirmRestartLabel.textContent = t.confirmRestartYes;
        }

        if (closeConfirmRestartBtn) {
            closeConfirmRestartBtn.setAttribute('title', t.close);
        }

        const startModalTitle = document.getElementById('start-modal-title');
        const startModalSubtitle = document.getElementById('start-modal-subtitle');
        const labelRulesHero = document.getElementById('label-rules-hero');
        const labelStartHero = document.getElementById('label-start-hero');

        if (startModalTitle) {
            startModalTitle.textContent = t.startModalTitle;
        }

        if (startModalSubtitle) {
            startModalSubtitle.textContent = t.startModalSubtitle;
        }

        if (labelRulesHero) {
            labelRulesHero.textContent = t.rules;
        }

        if (labelStartHero) {
            labelStartHero.textContent = t.startModalButton;
        }

        const drawLabel = document.getElementById('btn-draw-label');
        const pousarLabel = document.getElementById('btn-pousar-label');
        const tabRecentLabel = document.getElementById('tab-label-recent');
        const tabBestLabel = document.getElementById('tab-label-best');
        const saveLabel = document.getElementById('btn-save-label');
        const playAgainLabel = document.getElementById('btn-play-again-label');

        if (drawLabel) {
            drawLabel.textContent = t.drawCard;
        }

        if (pousarLabel) {
            pousarLabel.textContent = t.pousar;
        }

        if (tabRecentLabel) {
            tabRecentLabel.textContent = t.tabRecent;
        }

        if (tabBestLabel) {
            tabBestLabel.textContent = t.tabBest;
        }

        if (saveLabel) {
            saveLabel.textContent = t.saveScore;
        }

        if (playAgainLabel) {
            playAgainLabel.textContent = t.playAgain;
        }

        const inputPlayerName = document.getElementById('input-player-name') as HTMLInputElement | null;
        if (inputPlayerName) {
            inputPlayerName.placeholder = t.playerNamePlaceholder;
        }

        const playerPromptLabel = document.querySelector('.label-player-prompt');
        if (playerPromptLabel) {
            playerPromptLabel.textContent = t.playerNamePrompt;
        }

        const historyTitle = document.querySelector('.label-history-title');
        if (historyTitle) {
            historyTitle.textContent = t.historyModalTitle;
        }

        const thRank = document.getElementById('th-rank');
        const thPlayer = document.getElementById('th-player');
        const thScore = document.getElementById('th-score');
        const thCpu = document.getElementById('th-cpu');
        const thOutcome = document.getElementById('th-outcome');
        const thDate = document.getElementById('th-date');

        if (thRank) {
            thRank.textContent = t.colRank;
        }
        if (thPlayer) {
            thPlayer.textContent = t.colPlayer;
        }
        if (thScore) {
            thScore.textContent = t.colScore;
        }
        if (thCpu) {
            thCpu.textContent = t.colCpu;
        }
        if (thOutcome) {
            thOutcome.textContent = t.colOutcome;
        }
        if (thDate) {
            thDate.textContent = t.colDate;
        }

        const clearHistoryLabel = document.getElementById('btn-clear-history-label');
        if (clearHistoryLabel) {
            clearHistoryLabel.textContent = t.clearHistory;
        }

        const closeHistoryBottom = document.getElementById('btn-close-history-bottom');
        if (closeHistoryBottom) {
            closeHistoryBottom.textContent = t.close;
        }

        const deckLabels = document.querySelectorAll('.label-deck-count');
        deckLabels.forEach((label) => {
            label.textContent = `${t.deckCount}:`;
        });

        const cemeteryLabels = document.querySelectorAll('.label-cemetery-count');
        cemeteryLabels.forEach((label) => {
            label.textContent = `${t.cemeteryCount}:`;
        });

        const discardLabels = document.querySelectorAll('.label-discard-count');
        discardLabels.forEach((label) => {
            label.textContent = `${t.discardCount}:`;
        });

        const scoreLabels = document.querySelectorAll('.label-your-score');
        scoreLabels.forEach((label) => {
            label.textContent = t.yourScore;
        });

        const cpuScoreLabels = document.querySelectorAll('.label-cpu-score');
        cpuScoreLabels.forEach((label) => {
            label.textContent = `${t.cpuScore}:`;
        });

        this.translateCurrentStatus();
        this.updateViewModeButton(this.currentViewMode);
        this.updateDistanceButton(this.currentDistance);
        this.renderRulesContent();
    }
}
