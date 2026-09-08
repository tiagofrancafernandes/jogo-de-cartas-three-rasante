# 🛩️ Rasante - Jogo de Cartas Tático 3D

> **Idioma / Language:** Português (Brasil) | [English Version (en-US)](./README.md)

Uma aplicação web moderna para o jogo de cartas tático **"Rasante"**, desenvolvida com **TypeScript**, **Three.js**, **GSAP**, **Vite** e **Tailwind CSS**.

O jogo conta com um motor desacoplado e 100% testável, apresentação 3D interativa em mesa de feltro, inteligência artificial (CPU), histórico persistente com ranking das 10 melhores pontuações e 10 últimas partidas, além de suporte nativo a múltiplos idiomas (**pt-BR** e **en-US**).

---

## 📖 1. Descrição do Jogo

**"Rasante"** é um jogo de cartas onde estratégia, leitura de risco e controle de mão são cruciais. Ao contrário de jogos tradicionais onde o objetivo é acumular pontos altos, em *Rasante* o objetivo primordial é **acumular a menor soma possível de pontos** na sua mão de 3 cartas, realizando um "pouso" seguro antes do adversário.

A cada turno, o jogador precisa decidir entre cobrir a carta da mesa com uma carta maior da sua mão (diminuindo sua soma), arriscar uma compra no monte ou anunciar vitória (**"Pousar!"**). Mas cuidado: se você tentar pousar e sua soma for igual ou maior que a do oponente, você **Caiu!** e perde a partida imediatamente.

---

## 📜 2. Regras Oficiais do Jogo

### 2.1 Composição do Baralho e Pontuações
* **Baralho:** 52 cartas padrão internacionais (todos os coringas são removidos).
* **Valores para Cálculo da Pontuação Final:**
  * **Ás ($A$):** 1 ponto
  * **Cartas 2 a 10:** Valor nominal da face (2 a 10 pontos)
  * **Valete ($J$), Dama ($Q$) e Rei ($K$):** 10 pontos cada
* **Critério de Vitória:** Quanto **MENOR** a soma total dos pontos da mão, melhor é o seu resultado.

### 2.2 Hierarquia de Força em Jogo (Para Cobrir Cartas)
A hierarquia estrita para cobrir ou comparar cartas na mesa é:
$$A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K$$

### 2.3 Preparação da Mesa
1. O baralho de 52 cartas é embaralhado.
2. Cada participante (Jogador e CPU) recebe **3 cartas**.
3. **1 carta** é virada para cima no centro da mesa (a **Carta Ativa**).
4. O restante do baralho forma o **Monte de Compras** virado para baixo.
5. Há duas áreas reservadas adicionais: a **Pilha de Descarte** e o **Cemitério dos Reis**.

---

### 2.4 Dinâmica do Turno
Os participantes jogam alternadamente em turnos. No início da sua vez, antes de jogar ou comprar, o jogador pode optar por **"Pousar!"** (Declarar Vitória).

Caso não pouse, deve obrigatoriamente executar uma das duas ações:

#### Ação 1: Cobrir da Mão (Se possuir carta maior)
* O jogador escolhe uma carta da sua mão que seja **estritamente maior** que a carta ativa da mesa.
* Ele joga sua carta maior para o centro, tornando-a a nova carta ativa.
* Em seguida, recolhe a carta menor anterior da mesa para a sua mão, mantendo sua mão sempre com 3 cartas e reduzindo sua soma acumulada.

#### Ação 2: Compra do Monte (Se não puder ou não quiser cobrir)
* O jogador compra a carta do topo do monte e compara com a carta ativa:
  * **Se a carta comprada for MAIOR:** A carta ativa antiga vai para o descarte comum e a carta recém-comprada assume o centro como nova carta ativa.
  * **Se a carta comprada for MENOR ou IGUAL (Penalidade):**
    1. A carta comprada é descartada imediatamente.
    2. O jogador é penalizado e obrigado a recolher a carta pesada da mesa para sua mão.
    3. Das cartas que já estavam em sua mão antes da penalidade, **uma é selecionada aleatoriamente** para ser enviada à mesa, tornando-se a nova carta ativa.

---

### 2.5 Regra Especial: Eliminação dos Reis ($K$)
* O Rei ($K$) é o teto máximo da hierarquia e nenhuma carta pode superá-lo na mesa.
* Sempre que um Rei surge no centro da mesa (seja jogado por um participante ou revelado via compra), ele é **imediatamente banido para o Cemitério dos Reis** (fora da partida).
* Automaticamente, uma nova carta é aberta do monte para ocupar o centro. Caso outro Rei seja revelado nesta reposição, o ciclo de eliminação se repete recursivamente.

---

### 2.6 Declaração de Fim de Jogo: "Pousar!" vs "Caiu!"
* **Pouso Bem-Sucedido:** Se a soma da mão de quem pousou for **estritamente menor** que a do oponente, o declarante é o grande vencedor!
* **Caiu (Queda / Penalidade Máxima):** Se a soma de quem tentou pousar for **igual ou maior** que a do oponente, quem pousou perde a partida imediatamente!
* **Esgotamento do Monte:** Se o monte de compras se esvaziar, as mãos são reveladas e vence quem tiver a menor soma. Havendo empate exato, a rodada termina empatada.

---

## 🏆 3. Sistema de Histórico e Pontuação

O jogo armazena localmente (`localStorage`) os registros das partidas:
* **Identificação do Jogador:** Ao término de cada partida, o jogo solicita o nome do jogador. Para comodidade, o último nome utilizado é sempre preservado, não sendo necessário digitá-lo novamente a cada partida.
* **Duas Abas no Histórico:**
  1. **Últimas:** Armazena as **10 partidas mais recentes**, ordenadas por data (com desempate pela melhor pontuação).
  2. **Melhores:** Armazena as **10 melhores pontuações históricas**, onde a menor soma de pontos é priorizada no ranking.

---

## 🌐 4. Internacionalização (Multi-Language)

* Suporte completo para **Português (pt-BR)** e **Inglês (en-US)**.
* A preferência do jogador é persistida automaticamente em `localStorage`.
* Alternância instantânea de idioma direto na barra superior da interface.

---

## 🛠️ 5. Arquitetura do Software

A estrutura adota o padrão de **Clean Architecture** com separação estrita de responsabilidades:
* `src/core/`: Motor agnóstico a DOM e WebGL (`CardDeck`, `RulesEngine`, `AIController`, `ScoreHistory`).
* `src/graphics/`: Renderização 3D em Three.js (`SceneManager`, `CardVisual`, `AnimationQueue` com GSAP).
* `src/ui/`: Gerenciamento de HUD, modais e eventos de interface (`UIManager`).
* `src/i18n/`: Módulo de tradução reativo com persistência.
* `tests/`: Bateria de testes automatizados com Vitest.

---

## 🚀 6. Como Executar o Projeto

### Pré-requisitos
* Node.js v18+ (recomendado v20 ou v22)
* npm v9+

### Instalação e Execução
```bash
# Instalar as dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev

# Executar a suíte de testes unitários automatizados
npm test

# Gerar build de produção
npm run build
```

---

## 📄 Licença
Distribuído sob a licença MIT. Desenvolvido para proporcionar uma experiência 3D tática, fluida e imersiva.
