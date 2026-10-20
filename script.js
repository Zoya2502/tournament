let state = {
    participants: [],
    rounds: [],
    semiFinalLosers: [],
    place1: null,
    place2: null,
    place3: null
};

const screens = {
    input: document.getElementById('screen-input'),
    bracket: document.getElementById('screen-bracket'),
    bronze: document.getElementById('screen-bronze'),
    podium: document.getElementById('screen-podium')
};

const textarea = document.getElementById('participants-input');
const wingLeft = document.getElementById('wing-left');
const wingRight = document.getElementById('wing-right');
const bracketCenter = document.getElementById('bracket-center');
const svgLines = document.getElementById('bracket-lines');

function showScreen(name) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[name].classList.add('active');
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// СТАРТ
document.getElementById('btn-start').addEventListener('click', () => {
    let names = textarea.value.trim().split('\n').map(n => n.trim()).filter(n => n.length > 0);

    if (names.length < 4) {
        alert('Для турнира нужно минимум 4 участника!');
        return;
    }

    names = shuffle(names);
    initTournament(names);
    showScreen('bracket');

    setTimeout(drawConnectors, 50);
});

// ИНИЦИАЛИЗАЦИЯ
function initTournament(players) {
    state.rounds = [];
    state.semiFinalLosers = [];
    state.place1 = null;
    state.place2 = null;
    state.place3 = null;

    let power = 1;
    while (power < players.length) power *= 2;

    const totalRounds = Math.log2(power);
    const totalMatchesR1 = power / 2;
    const byesCount = power - players.length;

    let matchCount = totalMatchesR1;
    for (let r = 0; r < totalRounds; r++) {
        let round = [];
        for (let m = 0; m < matchCount; m++) {
            round.push({ p1: null, p2: null, winner: null, isBye: false });
        }
        state.rounds.push(round);
        matchCount /= 2;
    }

    // Равномерное рассеивание BYE между крыльями
    const byeMatches = new Set();
    const half = totalMatchesR1 / 2;
    
    let leftByes = [];
    let rightByes = [];
    for (let i = 0; i < half; i += 2) {
        leftByes.push(i);
        rightByes.push(half + i);
    }

    let byeCandidates = [];
    for (let i = 0; i < leftByes.length; i++) {
        if (leftByes[i] !== undefined) byeCandidates.push(leftByes[i]);
        if (rightByes[i] !== undefined) byeCandidates.push(rightByes[i]);
    }

    for (let b = 0; b < byesCount; b++) {
        byeMatches.add(byeCandidates[b % byeCandidates.length]);
    }

    let pIdx = 0;
    for (let m = 0; m < totalMatchesR1; m++) {
        if (byeMatches.has(m)) {
            const luckyPlayer = players[pIdx++];
            state.rounds[0][m].p1 = luckyPlayer;
            state.rounds[0][m].p2 = null;
            state.rounds[0][m].winner = luckyPlayer;
            state.rounds[0][m].isBye = true;
            advanceWinner(0, m, luckyPlayer);
        } else {
            state.rounds[0][m].p1 = players[pIdx++];
            state.rounds[0][m].p2 = players[pIdx++];
        }
    }

    renderBilateralBracket();
}

// ОТРИСОВКА
function renderBilateralBracket() {
    wingLeft.innerHTML = '';
    wingRight.innerHTML = '';
    bracketCenter.innerHTML = '';

    const totalRounds = state.rounds.length;

    for (let rIndex = 0; rIndex < totalRounds - 1; rIndex++) {
        const round = state.rounds[rIndex];
        const half = round.length / 2;

        const leftRoundEl = createRoundEl(round.slice(0, half), rIndex, 0, getRoundName(rIndex, totalRounds));
        const rightRoundEl = createRoundEl(round.slice(half), rIndex, half, getRoundName(rIndex, totalRounds));

        wingLeft.appendChild(leftRoundEl);
        wingRight.appendChild(rightRoundEl);
    }

    // Центр: Гранд Финал
    const finalRound = state.rounds[totalRounds - 1];
    const finalRoundEl = document.createElement('div');
    finalRoundEl.className = 'round center-final-round';
    finalRoundEl.dataset.roundIndex = totalRounds - 1;

    const finalTitle = document.createElement('div');
    finalTitle.className = 'round-title';
    finalTitle.innerText = '★ ФИНАЛ ★';
    finalRoundEl.appendChild(finalTitle);

    const matchesList = document.createElement('div');
    matchesList.className = 'matches-list';

    const finalMatch = finalRound[0];
    const matchEl = document.createElement('div');
    matchEl.className = 'match';
    matchEl.dataset.roundIndex = totalRounds - 1;
    matchEl.dataset.matchIndex = 0;

    if (finalMatch.p1 && finalMatch.p2 && !finalMatch.winner) matchEl.classList.add('ready');

    matchEl.appendChild(createPlayerEl(finalMatch.p1, finalMatch, totalRounds - 1, 0, finalMatch.p2));
    matchEl.appendChild(createPlayerEl(finalMatch.p2, finalMatch, totalRounds - 1, 0, finalMatch.p1));
    matchesList.appendChild(matchEl);

    finalRoundEl.appendChild(matchesList);
    bracketCenter.appendChild(finalRoundEl);

    setTimeout(drawConnectors, 20);
}

function getRoundName(rIndex, totalRounds) {
    if (rIndex === totalRounds - 2) return '1/2 ФИНАЛА';
    if (rIndex === totalRounds - 3) return '1/4 ФИНАЛА';
    if (rIndex === totalRounds - 4) return '1/8 ФИНАЛА';
    return `РАУНД ${rIndex + 1}`;
}

function createRoundEl(matches, rIndex, offsetIdx, titleText) {
    const roundEl = document.createElement('div');
    roundEl.className = 'round';
    roundEl.dataset.roundIndex = rIndex;

    const title = document.createElement('div');
    title.className = 'round-title';
    title.innerText = titleText;
    roundEl.appendChild(title);

    const matchesList = document.createElement('div');
    matchesList.className = 'matches-list';

    matches.forEach((match, idx) => {
        const realMatchIdx = offsetIdx + idx;
        const matchEl = document.createElement('div');
        matchEl.className = 'match';
        matchEl.dataset.roundIndex = rIndex;
        matchEl.dataset.matchIndex = realMatchIdx;

        if (match.p1 && match.p2 && !match.winner) matchEl.classList.add('ready');

        matchEl.appendChild(createPlayerEl(match.p1, match, rIndex, realMatchIdx, match.p2));
        matchEl.appendChild(createPlayerEl(match.p2, match, rIndex, realMatchIdx, match.p1));

        matchesList.appendChild(matchEl);
    });

    roundEl.appendChild(matchesList);
    return roundEl;
}

function createPlayerEl(playerName, match, rIndex, mIndex, opponentName) {
    const pEl = document.createElement('div');
    pEl.className = 'player';

    if (!playerName) {
        pEl.innerText = '—';
        pEl.classList.add('empty');
        return pEl;
    }

    pEl.innerText = playerName;

    if (match.winner && match.winner === playerName) {
        pEl.classList.add('winner');
    } else if (match.winner && match.winner !== playerName) {
        pEl.classList.add('eliminated');
    }

    pEl.addEventListener('click', () => {
        if (match.winner || !opponentName) return;

        match.winner = playerName;
        handleMatchCompletion(rIndex, mIndex, playerName, opponentName);
        renderBilateralBracket();
    });

    return pEl;
}

function handleMatchCompletion(rIndex, mIndex, winner, loser) {
    const totalRounds = state.rounds.length;

    if (rIndex === totalRounds - 2) {
        state.semiFinalLosers.push(loser);
    }

    if (rIndex + 1 < totalRounds) {
        advanceWinner(rIndex, mIndex, winner);
    } else {
        state.place1 = winner;
        state.place2 = loser;

        setTimeout(() => {
            startBronzeMatch();
        }, 700);
    }
}

function advanceWinner(currentRound, currentMatchIdx, winnerName) {
    const nextRound = currentRound + 1;
    const nextMatchIdx = Math.floor(currentMatchIdx / 2);
    const isP1 = currentMatchIdx % 2 === 0;

    if (isP1) {
        state.rounds[nextRound][nextMatchIdx].p1 = winnerName;
    } else {
        state.rounds[nextRound][nextMatchIdx].p2 = winnerName;
    }
}

// ЭКРАН 3: ДУЭЛЬ ЗА 3 МЕСТО
function startBronzeMatch() {
    const p1 = state.semiFinalLosers[0] || 'Полуфиналист 1';
    const p2 = state.semiFinalLosers[1] || 'Полуфиналист 2';

    document.getElementById('bronze-p1-name').innerText = p1;
    document.getElementById('bronze-p2-name').innerText = p2;

    const b1Btn = document.getElementById('bronze-p1');
    const b2Btn = document.getElementById('bronze-p2');

    const newB1 = b1Btn.cloneNode(true);
    const newB2 = b2Btn.cloneNode(true);
    b1Btn.parentNode.replaceChild(newB1, b1Btn);
    b2Btn.parentNode.replaceChild(newB2, b2Btn);

    newB1.addEventListener('click', () => finishTournament(p1));
    newB2.addEventListener('click', () => finishTournament(p2));

    showScreen('bronze');
}

function finishTournament(bronzeWinner) {
    state.place3 = bronzeWinner;

    document.getElementById('place-1-name').innerText = state.place1;
    document.getElementById('place-2-name').innerText = state.place2;
    document.getElementById('place-3-name').innerText = state.place3;

    showScreen('podium');
}

// СОЕДИНИТЕЛЬНЫЕ ЛИНИИ
function drawConnectors() {
    svgLines.innerHTML = '';
    const wrapper = document.querySelector('.bracket-wrapper');
    if (!wrapper) return;
    const wrapperRect = wrapper.getBoundingClientRect();

    svgLines.setAttribute('width', wrapper.scrollWidth);
    svgLines.setAttribute('height', wrapper.scrollHeight);

    const totalRounds = state.rounds.length;

    for (let r = 0; r < totalRounds - 1; r++) {
        const roundData = state.rounds[r];

        roundData.forEach((match, mIdx) => {
            const currentEl = document.querySelector(`.match[data-round-index="${r}"][data-match-index="${mIdx}"]`);
            const targetMIdx = Math.floor(mIdx / 2);
            const targetEl = document.querySelector(`.match[data-round-index="${r + 1}"][data-match-index="${targetMIdx}"]`);

            if (!currentEl || !targetEl) return;

            const r1 = currentEl.getBoundingClientRect();
            const r2 = targetEl.getBoundingClientRect();

            let startX, endX, midX;
            const startY = r1.top + (r1.height / 2) - wrapperRect.top + wrapper.scrollTop;
            const endY = r2.top + (r2.height / 2) - wrapperRect.top + wrapper.scrollTop;

            if (r1.left < r2.left) {
                startX = r1.right - wrapperRect.left + wrapper.scrollLeft;
                endX = r2.left - wrapperRect.left + wrapper.scrollLeft;
                midX = startX + (endX - startX) / 2;
            } else {
                startX = r1.left - wrapperRect.left + wrapper.scrollLeft;
                endX = r2.right - wrapperRect.left + wrapper.scrollLeft;
                midX = startX - (startX - endX) / 2;
            }

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            let d;
            if (Math.abs(startY - endY) <= 3) {
                d = `M ${startX} ${startY} H ${endX}`;
            } else {
                d = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
            }

            path.setAttribute('d', d);
            path.setAttribute('class', 'bracket-line');

            if (match.winner) {
                path.classList.add('active-line');
            }

            svgLines.appendChild(path);
        });
    }
}

const resizeObserver = new ResizeObserver(() => {
    drawConnectors();
});
const wrapperEl = document.querySelector('.bracket-wrapper');
if (wrapperEl) resizeObserver.observe(wrapperEl);

window.addEventListener('resize', drawConnectors);

document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Сбросить текущий турнир?')) showScreen('input');
});

document.getElementById('btn-restart').addEventListener('click', () => {
    showScreen('input');
});