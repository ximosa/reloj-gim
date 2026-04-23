// --- Constantes y Estado ---
const STATES = { SETUP: 'SETUP', PREP: 'PREP', WORK: 'WORK', REST: 'REST', FINISHED: 'FINISHED', HISTORY: 'HISTORY' };
let currentState = STATES.SETUP;
let timer = null;
let timeLeft = 0;
let totalTimeInState = 0;
let currentRound = 1;
let totalRounds = 0;
let workTime = 0;
let restTime = 0;
let userWeight = 70;
let muscleGroup = 'General';
let caloriesBurned = 0;
let isPaused = false;
let wakeLock = null;

// --- Elementos del DOM ---
const displays = {
    countdown: document.getElementById('countdown-display'),
    status: document.getElementById('status-label'),
    round: document.getElementById('current-round'),
    totalRounds: document.getElementById('total-rounds'),
    calories: document.getElementById('calories-display'),
    muscleTag: document.getElementById('muscle-tag'),
    finalMuscle: document.getElementById('final-muscle'),
    finalCalories: document.getElementById('final-calories'),
    finalTime: document.getElementById('final-time'),
    progressBar: document.getElementById('progress-bar'),
    historyList: document.getElementById('history-list')
};

const screens = {
    setup: document.getElementById('setup-screen'),
    timer: document.getElementById('timer-screen'),
    finish: document.getElementById('finish-screen'),
    history: document.getElementById('history-screen'),
    nav: document.getElementById('main-nav')
};

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initEventListeners();
    updateHistoryUI();
});

function initEventListeners() {
    document.getElementById('start-btn').addEventListener('click', startWorkout);
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('stop-btn').addEventListener('click', stopWorkout);
    document.getElementById('reset-btn').addEventListener('click', resetToSetup);
    
    document.getElementById('nav-setup').addEventListener('click', () => showScreen(STATES.SETUP));
    document.getElementById('nav-history').addEventListener('click', () => showScreen(STATES.HISTORY));
    document.getElementById('clear-history').addEventListener('click', clearHistory);
}

// --- Lógica del Temporizador ---
function startWorkout() {
    workTime = parseInt(document.getElementById('work-time').value) || 40;
    restTime = parseInt(document.getElementById('rest-time').value) || 20;
    totalRounds = parseInt(document.getElementById('rounds').value) || 8;
    userWeight = parseInt(document.getElementById('user-weight').value) || 70;
    muscleGroup = document.getElementById('muscle-group').value;

    saveSettings();
    initSensory(); 
    requestWakeLock();

    currentRound = 1;
    caloriesBurned = 0;
    displays.muscleTag.innerText = muscleGroup;
    showScreen(STATES.TIMER);
    startState(STATES.PREP, 10);
}

function startState(state, seconds) {
    currentState = state;
    timeLeft = seconds;
    totalTimeInState = seconds;
    updateUIState();
    updateDisplay(); // Llamada inmediata
    announceState(state);
    
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
}

function tick() {
    if (isPaused) return;
    timeLeft--;
    
    if (timeLeft <= 3 && timeLeft > 0) {
        playBeep(440, 0.1); 
        vibrate(50);
        if (timeLeft === 3) speak("Tres");
    }

    if (timeLeft < 0) {
        nextState();
    } else {
        updateDisplay();
        calculateCalories();
    }
}

function nextState() {
    playBeep(880, 0.4); 
    vibrate([200, 100, 200]);

    if (currentState === STATES.PREP) {
        startState(STATES.WORK, workTime);
    } else if (currentState === STATES.WORK) {
        if (currentRound >= totalRounds) {
            finishWorkout();
        } else {
            startState(STATES.REST, restTime);
        }
    } else if (currentState === STATES.REST) {
        currentRound++;
        startState(STATES.WORK, workTime);
    }
}

function finishWorkout() {
    clearInterval(timer);
    currentState = STATES.FINISHED;
    releaseWakeLock();
    speak("Completado");
    
    const finalData = {
        date: new Date().toLocaleDateString(),
        muscle: muscleGroup,
        calories: Math.round(caloriesBurned),
        time: formatTime(totalRounds * (workTime + restTime))
    };
    saveToHistory(finalData);
    
    displays.finalMuscle.innerText = finalData.muscle;
    displays.finalCalories.innerText = finalData.calories;
    displays.finalTime.innerText = finalData.time;
    showScreen(STATES.FINISHED);
}

// --- UI y Feedback ---
function updateDisplay() {
    displays.countdown.innerText = timeLeft < 0 ? 0 : timeLeft;
    displays.round.innerText = currentRound;
    displays.totalRounds.innerText = totalRounds;
    displays.calories.innerText = Math.round(caloriesBurned);
    
    // SVG Circle Logic
    const circumference = 283;
    const progress = timeLeft / totalTimeInState;
    const offset = circumference - (progress * circumference);
    displays.progressBar.style.strokeDashoffset = isNaN(offset) ? 0 : offset;
}

function updateUIState() {
    document.body.className = `bg-${currentState.toLowerCase()}`;
    screens.timer.className = `screen state-${currentState.toLowerCase()}`;
    
    const labels = { PREP: 'PREPARACIÓN', WORK: 'TRABAJO', REST: 'DESCANSO' };
    displays.status.innerText = labels[currentState] || '';
}

function announceState(state) {
    const texts = { PREP: 'Prepárate', WORK: '¡A trabajar!', REST: 'Descanso' };
    if (texts[state]) speak(texts[state]);
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'es-ES';
        u.rate = 1.2;
        speechSynthesis.speak(u);
    }
}

function showScreen(state) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));

    if (state === STATES.SETUP) {
        screens.setup.classList.remove('hidden');
        screens.nav.classList.remove('hidden');
        document.getElementById('nav-setup').classList.add('active');
    } else if (state === STATES.HISTORY) {
        screens.history.classList.remove('hidden');
        screens.nav.classList.remove('hidden');
        document.getElementById('nav-history').classList.add('active');
        updateHistoryUI();
    } else if (state === STATES.TIMER) {
        screens.timer.classList.remove('hidden');
    } else if (state === STATES.FINISHED) {
        screens.finish.classList.remove('hidden');
    }
}

// --- Utilidades ---
let audioCtx = null;
function initSensory() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playBeep(freq, dur) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
    }
}

function releaseWakeLock() { if (wakeLock) { wakeLock.release(); wakeLock = null; } }

function calculateCalories() {
    const METS = { WORK: 8.0, REST: 2.0, PREP: 1.0 };
    const met = METS[currentState] || 1.0;
    caloriesBurned += (met * 3.5 * userWeight) / (200 * 60);
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function saveToHistory(data) {
    const h = JSON.parse(localStorage.getItem('gymFlowHistory') || '[]');
    h.unshift(data);
    localStorage.setItem('gymFlowHistory', JSON.stringify(h.slice(0, 30)));
}

function updateHistoryUI() {
    const h = JSON.parse(localStorage.getItem('gymFlowHistory') || '[]');
    displays.historyList.innerHTML = h.map(i => `
        <div class="history-item">
            <div><div class="history-date">${i.date}</div><div class="history-muscle">${i.muscle}</div></div>
            <div class="history-cal">${i.calories} kcal</div>
        </div>
    `).join('') || '<p style="text-align:center; padding:40px; color:#555;">No hay sesiones aún</p>';
}

function clearHistory() {
    if (confirm('¿Borrar historial?')) { localStorage.removeItem('gymFlowHistory'); updateHistoryUI(); }
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerText = isPaused ? 'REANUDAR' : 'PAUSA';
}

function stopWorkout() {
    if (confirm('¿Detener?')) { clearInterval(timer); releaseWakeLock(); showScreen(STATES.SETUP); }
}

function resetToSetup() { showScreen(STATES.SETUP); }

function saveSettings() {
    localStorage.setItem('gymTimerSettings', JSON.stringify({
        work: workTime, rest: restTime, rounds: totalRounds, weight: userWeight, muscle: muscleGroup
    }));
}

function loadSettings() {
    const s = JSON.parse(localStorage.getItem('gymTimerSettings'));
    if (s) {
        document.getElementById('work-time').value = s.work;
        document.getElementById('rest-time').value = s.rest;
        document.getElementById('rounds').value = s.rounds;
        document.getElementById('user-weight').value = s.weight;
        document.getElementById('muscle-group').value = s.muscle;
    }
}
