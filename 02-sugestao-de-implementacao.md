# Especificação Técnica e Regras: Jogo de Cartas Web 3D (Three.js)

Este documento reúne a documentação de regras do jogo e a especificação técnica para o desenvolvimento de uma aplicação web 3D interativa utilizando Three.js, estruturada para partidas entre 1 Jogador Humano e 1 Oponente Virtual (CPU).

---

## 1. Manual Completo de Regras Oficiais

### 1.1 Objetivo do Jogo

Acumular a **menor soma de pontos** possível na mão composta por 3 cartas. A partida encerra no momento em que um jogador decide "bater" (declarar vitória):

* **Declaração correta:** Se a soma de quem bateu for estritamente menor que a do adversário, o jogador vence.
* **Declaração incorreta:** Se a soma for igual ou maior que a do oponente, quem bateu perde imediatamente.
* **Esgotamento de cartas:** Caso o monte de compras se esvazie sem batida prévia, as mãos são reveladas e vence a menor soma. Se houver empate exato, a rodada é reiniciada.

### 1.2 Baralho e Pontuações

* **Composição:** 52 cartas padrão (todos os coringas são removidos antes da partida).
* **Valores para Cálculo de Pontos:**
* **Ás ($A$):** 1 ponto.
* **Cartas 2 a 10:** Valor nominal da face (2 a 10 pontos).
* **Valete ($J$), Dama ($Q$) e Rei ($K$):** 10 pontos cada.


* **Hierarquia de Força em Jogo (Comparação):**

$$A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K$$



### 1.3 Preparação da Mesa

1. O baralho de 52 cartas é embaralhado.
2. Cada jogador recebe exatamente **3 cartas** viradas para baixo.
3. **1 carta** é virada para cima no centro, tornando-se a **Carta Ativa**.
4. O restante forma o **Monte de Compras** virado para baixo.
5. Reserva-se um local para o **Descarte Geral** e outro separado para o **Cemitério dos Reis**.

### 1.4 Dinâmica do Turno

Os participantes jogam alternadamente. No início da sua vez, o jogador ativo pode optar por declarar "Bati" (ver Seção 1.1). Caso decida jogar o turno normal, deve obrigatoriamente executar uma das duas ações:

#### Ação 1: Cobrir da Mão (Se possuir carta maior)

* O jogador escolhe uma carta da própria mão com força **estritamente superior** à carta ativa da mesa.
* A carta jogada substitui a carta central, tornando-se a nova carta ativa.
* O jogador recolhe a carta anterior da mesa para a sua mão, mantendo a contagem em 3 cartas e diminuindo seu total acumulado.

#### Ação 2: Compra Obrigatória (Se não puder ou não quiser cobrir)

* O jogador retira a carta do topo do monte de compras:
* **Se a carta comprada for MAIOR que a carta ativa:** A carta ativa anterior vai para o descarte geral e a carta recém-comprada assume a posição de nova carta ativa no centro.
* **Se a carta comprada for MENOR ou IGUAL (Penalidade):**
1. A carta comprada vai direto para o descarte geral.
2. O jogador é obrigado a recolher a carta pesada da mesa para sua mão.
3. Das 3 cartas originais que já estavam em sua mão antes da penalidade, **uma é selecionada aleatoriamente/às cegas** para ser enviada à mesa, tornando-se a nova carta ativa.





### 1.5 Regra Especial: Eliminação dos Reis ($K$)

* O Rei permanece no baralho e só é acionado quando surge na mesa (seja jogado por um jogador ou aberto via compra).
* Por não existir carta de valor superior para cobri-lo, assim que atinge o centro da mesa ele é **imediatamente removido** para o **Cemitério dos Reis** (fora de jogo definitivo).
* Imediatamente após a remoção, uma nova carta é aberta do topo do monte de compras para ocupar a posição de carta ativa. Se outro Rei for revelado nessa compra de reposição, o ciclo de eliminação se repete.

---

## 2. Arquitetura da Aplicação Web 3D (Three.js)

### 2.1 Visão Geral do Sistema

O jogo roda inteiramente no cliente via WebGL com Three.js. A interface 3D renderiza uma mesa de feltro verde com pilha de compras, pilha de descarte, slot do cemitério de Reis, slot central e áreas de mão do jogador e da CPU.

```
+-------------------------------------------------------------+
|                        CPU HAND                             |
|                   [Card]  [Card]  [Card]                    |
|                                                             |
|   [DRAW DECK]            [ACTIVE CARD]        [DISCARD]     |
|   (Face-down)             (Face-up)           (Face-up)     |
|                                                             |
|                       [K CEMETERY]                          |
|                                                             |
|                  [Card]  [Card]  [Card]                     |
|                      PLAYER HAND (Visible)                  |
|                                                             |
|      [PLAY BUTTON]     [DRAW BUTTON]      [CALL WIN (BAT)]  |
+-------------------------------------------------------------+

```

---

## 3. Implementação Técnica

### 3.1 Stack Tecnológico

* **Renderizador:** Three.js (r160+)
* **Animação / Interpolação:** GSAP (GreenSock) ou Tween.js
* **Lógica e Estado:** TypeScript / Vanilla JavaScript ES6+
* **Interação:** Raycaster para seleção de cartas via clique/touch

### 3.2 Estrutura de Dados do Core

```typescript
export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades'
}

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 (Ace) to 13 (King)
  weight: number; // 1 to 13 (for hierarchy comparisons)
  points: number; // 1 to 10 (for end-game sum)
  mesh?: THREE.Mesh;
}

export interface GameState {
  deck: Card[];
  discardPile: Card[];
  kingCemetery: Card[];
  activeCard: Card | null;
  playerHand: Card[];
  cpuHand: Card[];
  currentTurn: 'PLAYER' | 'CPU';
  isGameOver: boolean;
  winner: 'PLAYER' | 'CPU' | 'DRAW' | null;
}

```

### 3.3 Mapeamento de Pontos e Pesos

| Carta | Face | Peso de Comparação (`weight`) | Pontos na Soma (`points`) |
| --- | --- | --- | --- |
| Ás | $A$ | 1 | 1 |
| 2 a 10 | $2 \dots 10$ | 2 a 10 | 2 a 10 |
| Valete | $J$ | 11 | 10 |
| Dama | $Q$ | 12 | 10 |
| Rei | $K$ | 13 | 10 (Removido ao entrar na mesa) |

---

## 4. Arquitetura dos Módulos Three.js

### 4.1 Coordenadas e Câmera

* **Câmera:** `PerspectiveCamera(45, aspect, 0.1, 1000)` posicionada em `(0, 14, 12)` apontando para `(0, 0, 0)`.
* **Posições fixas no plano 3D ($X, Y, Z$):**
* Monte de Compra: `(-4, 0, 0)`
* Carta Ativa (Centro): `(0, 0, 0)`
* Descarte Geral: `(4, 0, 0)`
* Cemitério dos Reis: `(0, 0, -3.5)`
* Mão do Jogador: `X = [-2, 0, 2]`, `Y = 0.5`, `Z = 4.2` (com rotação suave para visualização)
* Mão da CPU: `X = [-2, 0, 2]`, `Y = 0.5`, `Z = -4.2` (cartas com face voltada para baixo)



### 4.2 Lógica do Loop de Jogo e Estados

```
[INÍCIO DA RODADA]
       |
[VERIFICAÇÃO DE "BATER"]
       |-- Sim --> [REVELA MÃOS E SOMA] --> [FIM DE JOGO]
       |-- Não
       v
[SELEÇÃO DA AÇÃO]
       |
       +---> [JOGAR DA MÃO] (Se carta escolhida > carta ativa)
       |           |
       |           +-> Substitui carta ativa
       |           +-> Jogador recolhe a menor para a mão
       |
       +---> [COMPRAR DO MONTE]
                   |
                   +-> Carta comprada > Carta ativa?
                   |         |
                   |         +-- SIM --> Substitui mesa; mesa antiga vai pro descarte
                   |         +-- NÃO --> Descarte da comprada; jogador recebe a ativa;
                   |                     carta aleatória da mão original vai pra mesa
                   |
[VERIFICAÇÃO DO REI (K)]
       |
       +-> Carta ativa é Rei?
                 |-- SIM --> Move para Cemitério dos Reis -> Compra nova carta para a mesa
                 |-- NÃO --> Continua
       v
[PASSA O TURNO]

```

### 4.3 Inteligência Artificial (CPU)

A máquina opera com base em cálculo determinístico de probabilidade e pontuação:

1. **Decisão de Bater:**
* A CPU avalia a soma de sua mão atual.
* Se $\sum \text{pontos} \le 8$ (ou threshold configurável de dificuldade), a CPU declara **"Bati"**.


2. **Decisão de Ação (Turno normal):**
* Avalia as cartas da mão com `weight > activeCard.weight`.
* **Cenário A (Possui carta viável):** Joga a carta com o maior ganho líquido $(\text{peso da carta jogada} - \text{peso da carta recebida})$, priorizando descartar cartas pesadas (10, J, Q) para recolher a carta baixa da mesa.
* **Cenário B (Não possui carta viável):** Executa a **Ação de Compra** automaticamente.


3. **Penalidade da CPU:**
* Caso a compra falhe, uma carta aleatória entre as três originais é selecionada via `Math.floor(Math.random() * 3)` e enviada para a mesa, enquanto a carta pesada vai para a mão da CPU.



---

## 5. Exemplo de Código Funcional (Protótipo Core)

Abaixo está o arquivo único contendo o setup Three.js, a lógica dos turnos e a renderização interativa.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Jogo de Cartas 3D - Three.js</title>
  <style>
    body { margin: 0; overflow: hidden; font-family: sans-serif; background: #111; }
    #ui {
      position: absolute; bottom: 20px; left: 50%;
      transform: translateX(-50%); display: flex; gap: 10px; z-index: 10;
    }
    button {
      padding: 10px 20px; font-size: 16px; font-weight: bold;
      cursor: pointer; border: none; border-radius: 4px; background: #27ae60; color: white;
    }
    button:disabled { background: #555; cursor: not-allowed; }
    #status {
      position: absolute; top: 20px; width: 100%; text-align: center;
      color: white; font-size: 20px; z-index: 10; font-weight: bold;
    }
  </style>
</head>
<body>
  <div id="status">Seu turno. Jogue uma carta maior ou compre do monte.</div>
  <div id="ui">
    <button id="btn-draw">Comprar Carta</button>
    <button id="btn-knock">Bater (Declarar Vitória)</button>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "gsap": "https://unpkg.com/gsap@3.12.5/index.js"
      }
    }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { gsap } from 'gsap';

    // 1. Setup Three.js
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a472a); // Feltro verde de mesa

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 13, 10);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 15, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 2. Criação do Baralho e Lógica de Cartas
    const suits = ['♠', '♥', '♦', '♣'];
    let deck = [];
    let playerHand = [];
    let cpuHand = [];
    let activeCard = null;
    let kingCemetery = [];
    let discardPile = [];
    let currentTurn = 'PLAYER';

    function createCardTexture(rankStr, suit) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 356;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#2c3e50';
      ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

      const isRed = suit === '♥' || suit === '♦';
      ctx.fillStyle = isRed ? '#c0392b' : '#2c3e50';
      ctx.font = 'bold 44px Arial';
      ctx.fillText(rankStr, 24, 54);
      ctx.fillText(suit, 24, 104);

      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(suit, canvas.width / 2, canvas.height / 2 + 30);

      return new THREE.CanvasTexture(canvas);
    }

    function buildMesh(card) {
      const geometry = new THREE.BoxGeometry(1.6, 0.04, 2.3);
      const matFace = new THREE.MeshStandardMaterial({ map: createCardTexture(getRankLabel(card.rank), card.suit) });
      const matBack = new THREE.MeshStandardMaterial({ color: 0x1f3c88 });
      const matEdge = new THREE.MeshStandardMaterial({ color: 0xdddddd });

      // Ordem das faces: +X, -X, +Y (face), -Y (costas), +Z, -Z
      const mesh = new THREE.Mesh(geometry, [matEdge, matEdge, matFace, matBack, matEdge, matEdge]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { card };
      return mesh;
    }

    function getRankLabel(rank) {
      if (rank === 1) return 'A';
      if (rank === 11) return 'J';
      if (rank === 12) return 'Q';
      if (rank === 13) return 'K';
      return rank.toString();
    }

    function initDeck() {
      deck = [];
      for (const suit of suits) {
        for (let r = 1; r <= 13; r++) {
          const points = r >= 10 ? 10 : r;
          const card = { id: `${r}_${suit}`, suit, rank: r, weight: r, points };
          card.mesh = buildMesh(card);
          scene.add(card.mesh);
          deck.push(card);
        }
      }
      // Embaralhamento (Fisher-Yates)
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }

    // 3. Distribuição Inicial
    function dealInitialCards() {
      for (let i = 0; i < 3; i++) {
        const pCard = deck.pop();
        playerHand.push(pCard);
        gsap.to(pCard.mesh.position, { x: (i - 1) * 2.2, y: 0.1, z: 3.8, duration: 0.6 });
        gsap.to(pCard.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.6 });

        const cCard = deck.pop();
        cpuHand.push(cCard);
        gsap.to(cCard.mesh.position, { x: (i - 1) * 2.2, y: 0.1, z: -3.8, duration: 0.6 });
        gsap.to(cCard.mesh.rotation, { x: Math.PI, y: 0, z: 0, duration: 0.6 }); // Face voltada para baixo
      }

      // Pilha restante de compra
      deck.forEach((c, idx) => {
        c.mesh.position.set(-4, 0.05 + idx * 0.02, 0);
        c.mesh.rotation.set(Math.PI, 0, 0);
      });

      // Abre a primeira carta ativa
      revealActiveCard();
    }

    function revealActiveCard() {
      if (deck.length === 0) {
        resolveGame();
        return;
      }
      activeCard = deck.pop();
      gsap.to(activeCard.mesh.position, { x: 0, y: 0.05, z: 0, duration: 0.5 });
      gsap.to(activeCard.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.5, onComplete: checkKingRemoval });
    }

    function checkKingRemoval() {
      if (activeCard && activeCard.rank === 13) {
        document.getElementById('status').innerText = 'Rei detectado! Enviado ao Cemitério dos Reis.';
        kingCemetery.push(activeCard);
        const targetZ = -3.8;
        const targetX = 4;
        gsap.to(activeCard.mesh.position, {
          x: targetX, y: 0.05 + kingCemetery.length * 0.02, z: targetZ, duration: 0.6,
          onComplete: () => {
            activeCard = null;
            revealActiveCard();
          }
        });
      }
    }

    // 4. Execução de Turnos
    function playCardFromHand(playerType, cardIndex) {
      const hand = playerType === 'PLAYER' ? playerHand : cpuHand;
      const chosenCard = hand[cardIndex];

      if (chosenCard.weight <= activeCard.weight) {
        document.getElementById('status').innerText = 'Jogada inválida! Escolha uma carta maior que a da mesa.';
        return;
      }

      // Substituição: a carta jogada vai para a mesa e a antiga vai para a mão
      const previousActive = activeCard;
      activeCard = chosenCard;
      hand[cardIndex] = previousActive;

      // Animação da carta jogada para a mesa
      gsap.to(chosenCard.mesh.position, { x: 0, y: 0.08, z: 0, duration: 0.5 });
      gsap.to(chosenCard.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.5, onComplete: checkKingRemoval });

      // Animação da carta recolhida para a mão
      const targetZ = playerType === 'PLAYER' ? 3.8 : -3.8;
      const targetRotX = playerType === 'PLAYER' ? 0 : Math.PI;
      gsap.to(previousActive.mesh.position, { x: (cardIndex - 1) * 2.2, y: 0.1, z: targetZ, duration: 0.5 });
      gsap.to(previousActive.mesh.rotation, { x: targetRotX, y: 0, z: 0, duration: 0.5 });

      endTurn();
    }

    function drawFromDeck(playerType) {
      if (deck.length === 0) {
        resolveGame();
        return;
      }

      const drawnCard = deck.pop();
      const hand = playerType === 'PLAYER' ? playerHand : cpuHand;

      // Mostra a carta temporariamente no centro
      gsap.to(drawnCard.mesh.position, { x: -1.5, y: 1.0, z: 0, duration: 0.4 });
      gsap.to(drawnCard.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.4, onComplete: () => {
        if (drawnCard.weight > activeCard.weight) {
          // Compra com sucesso: carta comprada assume a mesa
          discardPile.push(activeCard);
          gsap.to(activeCard.mesh.position, { x: 4, y: 0.05 + discardPile.length * 0.02, z: 0, duration: 0.4 });

          activeCard = drawnCard;
          gsap.to(drawnCard.mesh.position, { x: 0, y: 0.05, z: 0, duration: 0.4, onComplete: checkKingRemoval });
          endTurn();
        } else {
          // Penalidade: compra menor
          discardPile.push(drawnCard);
          gsap.to(drawnCard.mesh.position, { x: 4, y: 0.05 + discardPile.length * 0.02, z: 0, duration: 0.4 });

          // Carta aleatória da mão vai para o centro
          const randomIndex = Math.floor(Math.random() * 3);
          const penaltyReplacement = hand[randomIndex];
          const incomingHighCard = activeCard;

          hand[randomIndex] = incomingHighCard;
          activeCard = penaltyReplacement;

          // Animações de troca
          const targetZ = playerType === 'PLAYER' ? 3.8 : -3.8;
          const targetRotX = playerType === 'PLAYER' ? 0 : Math.PI;

          gsap.to(incomingHighCard.mesh.position, { x: (randomIndex - 1) * 2.2, y: 0.1, z: targetZ, duration: 0.5 });
          gsap.to(incomingHighCard.mesh.rotation, { x: targetRotX, y: 0, z: 0, duration: 0.5 });

          gsap.to(penaltyReplacement.mesh.position, { x: 0, y: 0.05, z: 0, duration: 0.5 });
          gsap.to(penaltyReplacement.mesh.rotation, { x: 0, y: 0, z: 0, duration: 0.5, onComplete: checkKingRemoval });

          endTurn();
        }
      }});
    }

    function endTurn() {
      currentTurn = currentTurn === 'PLAYER' ? 'CPU' : 'PLAYER';
      const status = document.getElementById('status');

      if (currentTurn === 'CPU') {
        status.innerText = 'Turno da CPU pensando...';
        toggleUI(false);
        setTimeout(executeCPUTurn, 1200);
      } else {
        status.innerText = 'Seu turno. Jogue uma carta maior ou compre do monte.';
        toggleUI(true);
      }
    }

    function executeCPUTurn() {
      // 1. Decisão de Bater
      const cpuScore = cpuHand.reduce((acc, c) => acc + c.points, 0);
      if (cpuScore <= 7) {
        knockGame('CPU');
        return;
      }

      // 2. Busca carta viável na mão
      let bestIndex = -1;
      let maxDiff = -999;

      for (let i = 0; i < cpuHand.length; i++) {
        if (cpuHand[i].weight > activeCard.weight) {
          const diff = cpuHand[i].weight - activeCard.weight;
          if (diff > maxDiff) {
            maxDiff = diff;
            bestIndex = i;
          }
        }
      }

      if (bestIndex !== -1) {
        playCardFromHand('CPU', bestIndex);
      } else {
        drawFromDeck('CPU');
      }
    }

    function knockGame(caller) {
      const playerScore = playerHand.reduce((acc, c) => acc + c.points, 0);
      const cpuScore = cpuHand.reduce((acc, c) => acc + c.points, 0);

      // Revela a mão da CPU
      cpuHand.forEach(c => gsap.to(c.mesh.rotation, { x: 0, duration: 0.4 }));

      let resultMsg = '';
      if (caller === 'PLAYER') {
        if (playerScore < cpuScore) {
          resultMsg = `Você bateu e VENCEU! Pontuação: Você ${playerScore} x ${cpuScore} CPU`;
        } else {
          resultMsg = `Você bateu e PERDEU! Pontuação: Você ${playerScore} x ${cpuScore} CPU`;
        }
      } else {
        if (cpuScore < playerScore) {
          resultMsg = `CPU bateu e VENCEU! Pontuação: CPU ${cpuScore} x ${playerScore} Você`;
        } else {
          resultMsg = `CPU bateu e PERDEU! Você venceu! Pontuação: CPU ${cpuScore} x ${playerScore} Você`;
        }
      }

      document.getElementById('status').innerText = resultMsg;
      toggleUI(false);
    }

    function resolveGame() {
      const playerScore = playerHand.reduce((acc, c) => acc + c.points, 0);
      const cpuScore = cpuHand.reduce((acc, c) => acc + c.points, 0);
      cpuHand.forEach(c => gsap.to(c.mesh.rotation, { x: 0, duration: 0.4 }));

      if (playerScore < cpuScore) {
        document.getElementById('status').innerText = `Fim do baralho: Você venceu! (${playerScore} x ${cpuScore})`;
      } else if (cpuScore < playerScore) {
        document.getElementById('status').innerText = `Fim do baralho: CPU venceu! (${cpuScore} x ${playerScore})`;
      } else {
        document.getElementById('status').innerText = `Empate na soma (${playerScore} pts). Reiniciando...`;
      }
      toggleUI(false);
    }

    function toggleUI(enabled) {
      document.getElementById('btn-draw').disabled = !enabled;
      document.getElementById('btn-knock').disabled = !enabled;
    }

    // 5. Interação com Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('click', (event) => {
      if (currentTurn !== 'PLAYER') return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(playerHand.map(c => c.mesh));
      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object;
        const cardIndex = playerHand.findIndex(c => c.mesh === clickedMesh);
        if (cardIndex !== -1) {
          playCardFromHand('PLAYER', cardIndex);
        }
      }
    });

    document.getElementById('btn-draw').addEventListener('click', () => {
      if (currentTurn === 'PLAYER') drawFromDeck('PLAYER');
    });

    document.getElementById('btn-knock').addEventListener('click', () => {
      if (currentTurn === 'PLAYER') knockGame('PLAYER');
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 6. Loop de Renderização
    initDeck();
    dealInitialCards();

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>

```
