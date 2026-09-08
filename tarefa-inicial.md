Aqui está o blueprint de engenharia completo e o prompt pronto para você copiar, colar e rodar a criação do projeto via IA ou configurar direto no terminal.

A estrutura adota separação estrita de responsabilidades:

* **Engine Agnóstica:** Toda a máquina de estados e regras roda sem depender de DOM ou Three.js (facilitando testes e ports).
* **Camada de Apresentação:** Gerencia WebGL, malhas 3D e animações via GSAP com travas explícitas contra race conditions de clique.

---

### Estrutura de Diretórios Proposta (Vite + TypeScript)

```text
rasante-game/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.ts
    ├── core/
    │   ├── types.ts           # Interfaces, enums e contratos de estado
    │   ├── CardDeck.ts        # Geração, embaralhamento e valores
    │   ├── RulesEngine.ts     # Validações, trocas, descarte e penalidades
    │   └── AIController.ts    # Lógica heurística da CPU
    ├── graphics/
    │   ├── SceneManager.ts    # Câmera, iluminação, resize e render loop
    │   ├── CardVisual.ts      # Geometria 3D e geração procedural de textura
    │   └── AnimationQueue.ts  # Gerenciador GSAP com flags de bloqueio
    └── ui/
        └── UIManager.ts       # HUD, pontuações, botões "Comprar" e "Pousar!"

```

---

### Prompt Completo para Gerar o Projeto

Copie e cole o bloco abaixo para alimentar o assistente ou o agente de código:

```markdown
Act as a Senior Software Engineer specializing in modern WebGL and Clean Architecture.

Build a complete, production-ready 3D card game named "Rasante" using Vite, TypeScript, Three.js, and GSAP.

Follow strict architectural guidelines:
1. Language: All code, types, interfaces, and comments must be strictly in English.
2. Architecture: Separate core game rules entirely from Three.js rendering. Use final classes, strict types, early returns, and avoid nested conditionals (max 1 level).
3. Concurrency Safety: All user inputs must be locked (`isBusy = true`) during card deal, replacement, or draw animations.

---

### Game Identity & Terminology:
- Game Title: "Rasante"
- Declare Victory Action: "Pousar!" (Landing)
- Failed Declaration State: "Caiu!" (Crash / Penalized)

---

### Rules Specification:
1. Deck: Standard 52-card deck (all Jokers removed).
2. Point Values for Scoring:
   - Ace = 1 point
   - 2 to 10 = Face value (2-10 points)
   - Jack (J), Queen (Q), King (K) = 10 points
3. Hierarchy of Power (Comparisons):
   - A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K
4. Setup:
   - Both Player and CPU receive 3 cards facing down (Player sees their own hand).
   - 1 active card is flipped face-up in the center.
   - Remaining cards form the face-down Draw Deck.
   - Separate areas: Discard Pile and King Cemetery.
5. Turn Actions:
   - "Pousar!" (Landing): Available at the start of the turn. Evaluates hand sums. If player hand sum is strictly lower, they win. Otherwise, they lose immediately.
   - Action A (Play higher from hand): If the selected card is strictly greater than the active card, place it in the center and collect the lower active card to the hand.
   - Action B (Draw from deck): Draw top card.
     - If drawn card is GREATER: old active card goes to Discard Pile; drawn card becomes new active card.
     - If drawn card is LOWER or EQUAL: drawn card is discarded; active card is forced into player's hand; 1 random card from the player's original 3 cards is moved to the center.
6. King Elimination Rule:
   - Whenever a King (K) enters the active table slot (by hand or draw), it is immediately removed to the King Cemetery.
   - Automatically draw a replacement card from the deck to become the new active card. Handle recursive King removals gracefully.

---

### Technical Implementation Steps:

1. `src/core/types.ts`:
   - Enums: `Suit`, `TurnState` ('IDLE' | 'BUSY' | 'GAME_OVER'), `Actor` ('PLAYER' | 'CPU').
   - Interfaces: `Card`, `GameState`, `RoundResult`.

2. `src/core/RulesEngine.ts`:
   - Pure state manipulation without DOM or WebGL dependencies.
   - Methods: `dealInitial()`, `canCover(handCard, activeCard)`, `playCard()`, `executeDraw()`, `evaluatePouso()`.

3. `src/graphics/CardVisual.ts`:
   - Create 3D card meshes (`BoxGeometry`) with procedural Canvas textures for faces (+Y) and distinct backs (-Y).

4. `src/graphics/SceneManager.ts`:
   - Green felt table background, balanced lighting (`AmbientLight` + `DirectionalLight` with soft shadows), raycasting for player hand selection.

5. `src/core/AIController.ts`:
   - Decision logic: "Pousar!" if sum <= 7. Otherwise, play best higher card. If no higher card, execute draw.

6. Provide complete implementation files (`package.json`, `index.html`, and full TypeScript modules) so the project runs immediately with `npm run dev`.

```

Com essa estrutura desacoplada, o código fica fácil de debugar, testar e expandir para multiplayer online caso queira no futuro.

----
As regras do jogo estão definidas no arquivo '01-regras-do-jogo.md' e algumas sugestões de implementação estão em '02-sugestao-de-implementacao.md'
----
Opte por um frontend agnostico à framework ou use Vue 3 com vue-router. Evite React.js.
Se possível, use tailwindcss v4 mas só se fizer sentido.

---
Crie os arquivos AGENTS.md e GEMINI.md e nestes adicione regras informando que devem sempre seguir as diretrizes de code style definidas em 'UNIVERSAL-CODE-STYLE-RULES.md'
