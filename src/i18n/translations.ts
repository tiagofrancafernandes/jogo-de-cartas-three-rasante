export type SupportedLocale = 'pt-BR' | 'en-US';

export interface Translations {
    gameTitle: string;
    gameSubtitle: string;
    yourTurn: string;
    cpuThinking: string;
    cpuTurn: string;
    drawCard: string;
    pousar: string;
    history: string;
    rules: string;
    newGame: string;
    sound: string;
    deckCount: string;
    cemeteryCount: string;
    discardCount: string;
    yourScore: string;
    cpuScore: string;
    invalidMoveTitle: string;
    invalidMoveDesc: string;
    kingDetected: string;
    drawSuccess: string;
    drawPenalty: string;
    gameOverTitleWon: string;
    gameOverTitleLost: string;
    gameOverTitleDraw: string;
    landingSuccess: string;
    landingFailed: string;
    deckExhausted: string;
    playerNamePrompt: string;
    playerNamePlaceholder: string;
    saveScore: string;
    playAgain: string;
    historyModalTitle: string;
    tabRecent: string;
    tabBest: string;
    colRank: string;
    colPlayer: string;
    colScore: string;
    colCpu: string;
    colOutcome: string;
    colDate: string;
    noHistory: string;
    clearHistory: string;
    statusWon: string;
    statusLost: string;
    statusDraw: string;
    close: string;
    rulesModalTitle: string;
    rulesObjectiveTitle: string;
    rulesObjectiveText: string;
    rulesValuesTitle: string;
    rulesValuesText: string;
    rulesTurnTitle: string;
    rulesTurnText: string;
    rulesKingTitle: string;
    rulesKingText: string;
    rulesLandingTitle: string;
    rulesLandingText: string;
    viewMode: string;
    view3D: string;
    view2D: string;
    distance: string;
    distFar: string;
    distNormal: string;
    distNear: string;
}

export const translations: Record<SupportedLocale, Translations> = {
    'pt-BR': {
        gameTitle: 'Rasante',
        gameSubtitle: 'Jogo de Cartas Tático 3D',
        yourTurn: 'Sua vez: Jogue uma carta maior ou compre do monte.',
        cpuThinking: 'CPU calculando jogada...',
        cpuTurn: 'Turno da CPU...',
        drawCard: 'Comprar Carta',
        pousar: 'Pousar!',
        history: 'Histórico',
        rules: 'Instruções e Regras',
        newGame: 'Novo Jogo',
        sound: 'Efeitos',
        deckCount: 'Monte',
        cemeteryCount: 'Cemitério de Reis',
        discardCount: 'Descarte',
        yourScore: 'Sua soma',
        cpuScore: 'Soma CPU',
        invalidMoveTitle: 'Jogada Inválida',
        invalidMoveDesc: 'A carta jogada precisa ser estritamente MAIOR que a carta ativa da mesa.',
        kingDetected: 'Rei detectado! Banido para o Cemitério dos Reis.',
        drawSuccess: 'Compra com sucesso! Carta assumiu o centro.',
        drawPenalty: 'Penalidade! Compra menor ou igual. Carta pesada para sua mão e carta da mão para a mesa.',
        gameOverTitleWon: 'Vitória!',
        gameOverTitleLost: 'Derrota!',
        gameOverTitleDraw: 'Empate!',
        landingSuccess: 'Pouso realizado com sucesso! Menor soma de pontos.',
        landingFailed: 'Caiu! Sua soma não foi estritamente menor que a da CPU.',
        deckExhausted: 'Fim do monte de compras! Avaliando mãos finais.',
        playerNamePrompt: 'Identifique-se para o histórico:',
        playerNamePlaceholder: 'Nome do Jogador',
        saveScore: 'Salvar no Histórico',
        playAgain: 'Jogar Novamente',
        historyModalTitle: 'Histórico de Partidas',
        tabRecent: 'Últimas Partidas',
        tabBest: 'Melhores Pontuações',
        colRank: '#',
        colPlayer: 'Piloto / Jogador',
        colScore: 'Pontos',
        colCpu: 'CPU',
        colOutcome: 'Resultado',
        colDate: 'Data',
        noHistory: 'Nenhuma partida registrada ainda.',
        clearHistory: 'Limpar Histórico',
        statusWon: 'Venceu',
        statusLost: 'Perdeu',
        statusDraw: 'Empate',
        close: 'Fechar',
        rulesModalTitle: 'Manual de Instruções e Regras - Rasante',
        rulesObjectiveTitle: '1. Objetivo do Jogo',
        rulesObjectiveText:
            'Acumular a MENOR soma de pontos na mão (3 cartas). No início da sua vez, se acreditar ter menos pontos que o adversário, anuncie "Pousar!". Se sua soma for estritamente menor, você vence. Caso contrário, você Caiu e perde imediatamente.',
        rulesValuesTitle: '2. Valores e Hierarquia',
        rulesValuesText:
            'Ás (A) = 1 ponto. Cartas 2 a 10 = valor nominal. Valete (J), Dama (Q) e Rei (K) = 10 pontos cada.\nHierarquia de Força para cobrir: A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K.',
        rulesTurnTitle: '3. Dinâmica do Turno (Instruções)',
        rulesTurnText:
            'No seu turno, antes de jogar você pode "Pousar!". Senão, faça uma das ações:\n• Ação 1 (Cobrir): Jogue uma carta da mão estritamente MAIOR que a da mesa e recolha a carta menor da mesa para sua mão.\n• Ação 2 (Comprar): Compre uma carta do monte. Se for MAIOR, substitui a mesa e a antiga vai pro descarte. Se for MENOR ou IGUAL, compra vai pro descarte, você recebe a carta da mesa e uma carta aleatória da sua mão vai para a mesa.',
        rulesKingTitle: '4. Eliminação do Rei (K)',
        rulesKingText:
            'O Rei é o teto da hierarquia. Sempre que um Rei surge na mesa (por jogada ou compra), ele é IMEDIATAMENTE enviado para o Cemitério dos Reis e uma nova carta é aberta do monte para ocupar o centro.',
        rulesLandingTitle: '5. Pontuação e Histórico',
        rulesLandingText:
            'Quanto MENOR o número acumulado, melhor é a sua pontuação. O histórico guarda as 10 melhores pontuações e as 10 últimas partidas disputadas.',
        viewMode: 'Visão',
        view3D: '3D',
        view2D: '2D',
        distance: 'Distância',
        distFar: 'Menor',
        distNormal: 'Normal',
        distNear: 'Perto',
    },
    'en-US': {
        gameTitle: 'Rasante',
        gameSubtitle: 'Tactical 3D Card Game',
        yourTurn: 'Your turn: Play a higher card or draw from the deck.',
        cpuThinking: 'CPU calculating next move...',
        cpuTurn: 'CPU Turn...',
        drawCard: 'Draw Card',
        pousar: 'Land!',
        history: 'History',
        rules: 'Instructions & Rules',
        newGame: 'New Game',
        sound: 'Effects',
        deckCount: 'Draw Deck',
        cemeteryCount: 'King Cemetery',
        discardCount: 'Discard',
        yourScore: 'Your sum',
        cpuScore: 'CPU sum',
        invalidMoveTitle: 'Invalid Move',
        invalidMoveDesc: 'The played card must be strictly GREATER than the active table card.',
        kingDetected: 'King detected! Banished to the King Cemetery.',
        drawSuccess: 'Successful draw! New card claimed the center.',
        drawPenalty: 'Penalty! Drawn card was lower or equal. Active card forced into hand and hand card swapped.',
        gameOverTitleWon: 'Victory!',
        gameOverTitleLost: 'Defeat!',
        gameOverTitleDraw: 'Draw!',
        landingSuccess: 'Landing successful! Strictly lower hand sum.',
        landingFailed: 'Crash! Your sum was not strictly lower than the CPU.',
        deckExhausted: 'Draw deck exhausted! Comparing final hand scores.',
        playerNamePrompt: 'Identify yourself for the records:',
        playerNamePlaceholder: 'Player Name',
        saveScore: 'Save to History',
        playAgain: 'Play Again',
        historyModalTitle: 'Match History',
        tabRecent: 'Recent Matches',
        tabBest: 'Best Scores',
        colRank: '#',
        colPlayer: 'Pilot / Player',
        colScore: 'Points',
        colCpu: 'CPU',
        colOutcome: 'Outcome',
        colDate: 'Date',
        noHistory: 'No match records saved yet.',
        clearHistory: 'Clear History',
        statusWon: 'Won',
        statusLost: 'Lost',
        statusDraw: 'Draw',
        close: 'Close',
        rulesModalTitle: 'Official Instructions & Rules - Rasante',
        rulesObjectiveTitle: '1. Game Objective',
        rulesObjectiveText:
            'Accumulate the LOWEST sum of points in your 3-card hand. At the start of your turn, if you believe your sum is lower than the opponent, declare "Land!". If your sum is strictly lower, you win. Otherwise, you Crash and lose immediately.',
        rulesValuesTitle: '2. Values and Hierarchy',
        rulesValuesText:
            'Ace (A) = 1 point. Cards 2 to 10 = face value. Jack (J), Queen (Q), and King (K) = 10 points each.\nHierarchy for covering: A < 2 < 3 < 4 < 5 < 6 < 7 < 8 < 9 < 10 < J < Q < K.',
        rulesTurnTitle: '3. Turn Dynamics (Instructions)',
        rulesTurnText:
            'On your turn, declare "Land!" before taking action, or choose one of:\n• Action 1 (Cover): Play a card from hand strictly GREATER than the center card and take the lower card into your hand.\n• Action 2 (Draw): Draw the top card. If GREATER, it replaces the center card and old goes to discard. If LOWER or EQUAL, drawn card is discarded, you receive the center card, and a random card from your hand goes to the center.',
        rulesKingTitle: '4. King (K) Elimination',
        rulesKingText:
            'King is the ceiling of the hierarchy. Whenever a King enters the center slot (from hand or draw), it is IMMEDIATELY removed to the King Cemetery and a replacement card is drawn from the deck.',
        rulesLandingTitle: '5. Scoring and History',
        rulesLandingText:
            'The LOWER your accumulated points, the better your score. History tracks the 10 best scores and 10 most recent matches.',
        viewMode: 'View',
        view3D: '3D',
        view2D: '2D',
        distance: 'Distance',
        distFar: 'Far',
        distNormal: 'Normal',
        distNear: 'Near',
    },
};
