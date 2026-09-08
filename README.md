# 🛩️ Rasante - Tactical 3D Card Game

> **Language / Idioma:** English | [Versão em Português (pt-BR)](./README.pt-BR.md)

A modern, production-ready 3D web application for the tactical card game **"Rasante"**, built with **TypeScript**, **Three.js**, **GSAP**, **Vite**, and **Tailwind CSS**.

The game features an engine completely decoupled from rendering and 100% testable, interactive WebGL 3D graphics on a casino felt table, smart AI heuristics (CPU), persistent match history with top 10 best scores and 10 recent games, and native multi-language support (**en-US** and **pt-BR**).

---

## 📖 1. Game Overview & Concept

**"Rasante"** is a fast-paced, high-stakes tactical card game where risk assessment and hand management are paramount. Unlike traditional card games where players strive for high-scoring combinations, in *Rasante* the ultimate objective is to **accumulate the lowest possible sum of points** across your 3-card hand, executing a successful "landing" before your opponent.

Every turn, players face strategic dilemmas: cover the active table card with a higher card from hand (collecting the lower card to reduce hand sum), risk a blind draw from the deck, or make a bold victory call (**"Pousar!"** / "Land!"). However, timing is vital: if you call a landing and your sum is equal to or higher than your opponent's, you **Crash ("Caiu!")** and lose the match immediately.

---

## 📜 2. Official Game Rules

### 2.1 Deck Composition & Card Values
* **Deck:** Standard 52-card international deck (all Jokers removed).
* **Point Values for Final Hand Sum:**
  * **Ace ($A$):** 1 point
  * **Cards 2 to 10:** Face value (2 to 10 points)
  * **Jack ($J$), Queen ($Q$), and King ($K$):** 10 points each
* **Victory Condition:** The **LOWER** your hand's total points sum, the better your score.

### 2.2 Hierarchy of Power (Card Covering & Comparisons)
Card strength for comparisons and covering follows strict hierarchy:
$$A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K$$

### 2.3 Table Setup
1. The 52-card deck is thoroughly shuffled.
2. Each participant (Player and CPU) is dealt **3 cards** face down (the Player can view their own cards).
3. **1 card** is flipped face up in the center of the table (the **Active Card**).
4. The remaining cards form the face-down **Draw Deck**.
5. Two additional dedicated zones are reserved: the **Discard Pile** and the **King Cemetery**.

---

### 2.4 Turn Dynamics
Players alternate turns. At the beginning of their turn, before taking any card action, the active player may declare **"Pousar!"** (Landing / Claim Victory).

If the player chooses not to land, they must execute one of two mandatory actions:

#### Action 1: Play Higher Card from Hand (Covering)
* The player selects a card from their 3-card hand that is **strictly greater** in rank/weight than the center active card.
* The selected card is placed in the center, becoming the new active card.
* The player collects the previous lower card into their hand in that slot, keeping their hand at 3 cards and reducing their hand's point sum.

#### Action 2: Draw from the Deck (Risk / Mandatory when unable to cover)
* The player draws the top card from the deck and compares it with the center active card:
  * **If drawn card is GREATER:** The old active card is sent to the Discard Pile, and the drawn card takes the center slot as the new active card.
  * **If drawn card is LOWER or EQUAL (Penalty):**
    1. The drawn card goes straight to the Discard Pile.
    2. The player is penalized for failing to cover: they are forced to take the heavy active card into their hand.
    3. One card from their original hand is randomly/blindly selected and moved to the center, becoming the new active card.

---

### 2.5 Special Rule: King ($K$) Elimination & Cemetery
* The King ($K$) is the absolute apex of the hierarchy; no card can cover it on the table.
* Whenever a King enters the center slot (whether played from a player's hand or revealed from the draw deck), it is **immediately banished to the King Cemetery** (permanently removed from the game).
* A replacement card is automatically drawn from the deck to occupy the center. If another King is revealed during this replacement, the elimination cycle repeats recursively until a non-King card is placed.

---

### 2.6 Game Conclusion: "Pousar!" (Landing) vs "Caiu!" (Crash)
* **Successful Landing:** If the caller's hand sum is **strictly lower** than the opponent's sum, the caller wins!
* **Crash ("Caiu!"):** If the caller's sum is **equal to or greater** than the opponent's sum, the caller loses immediately!
* **Deck Exhaustion:** If the draw deck runs out of cards, hands are automatically revealed and the lowest sum wins. In case of an exact tie, the match ends in a draw.

---

## 🏆 3. Match History & Player Persistence

The application maintains match records locally via `localStorage`:
* **Player Identification:** Upon match conclusion, the game requests the player's name. The last entered name is remembered across matches and sessions to eliminate repetitive typing.
* **Dual History Tabs:**
  1. **Recent Matches ("Últimas"):** Displays up to the last **10 matches**, ordered chronologically (most recent first, with lowest score as tiebreaker).
  2. **Best Scores ("Melhores"):** Displays the top **10 best scores** of all time (ranked by lowest accumulated hand points, with most recent date as tiebreaker).

---

## 🌐 4. Multi-Language Support (i18n)

* Full bilingual support for **English (en-US)** and **Portuguese (pt-BR)**.
* Active locale preference is automatically stored in `localStorage`.
* Instant language switching via the globe icon on the top HUD bar.

---

## 🛠️ 5. Technical Architecture & Clean Code

The codebase strictly adheres to **Clean Architecture** and the guidelines in [`UNIVERSAL-CODE-STYLE-RULES.md`](./UNIVERSAL-CODE-STYLE-RULES.md):
* `src/core/`: Pure, agnostic domain engine (`CardDeck`, `RulesEngine`, `AIController`, `ScoreHistory`). Zero dependencies on DOM or WebGL.
* `src/graphics/`: 3D rendering in Three.js (`SceneManager`, `CardVisual`, `AnimationQueue` with GSAP).
* `src/ui/`: Reactive HUD, modals, score tracking, and tab navigation (`UIManager`).
* `src/i18n/`: Bilingual localization engine with subscription listeners.
* `tests/`: Comprehensive unit test suites executed with Vitest.

---

## 🚀 6. Quick Start & Development

### Prerequisites
* Node.js v18+ (tested on v20 and v22)
* npm v9+

### Commands
```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Run automated unit tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📄 License
Released under the MIT License. Built for immersive, smooth, and tactical card gameplay.
