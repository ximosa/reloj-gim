// --- Constantes y Estado ---
const STATES = { SETUP: 'SETUP', PREP: 'PREP', WORK: 'WORK', REST: 'REST', FINISHED: 'FINISHED' };
let currentState = STATES.SETUP;
let timer = null;
let timeLeft = 0;
let currentRound = 1;
let totalRounds = 0;
let workTime = 0;
let restTime = 0;
let userWeight = 70;
let caloriesBurned = 0;
let isPaused = false;
let wakeLock = null;

// MET values
const MET_WORK = 8.0;
const MET_REST = 2.0;

// --- Elementos del DOM ---
const screens = {
    setup: document.getElementById('setup-screen'),
    timer: document.getElementById('timer-screen'),
    finish: document.getElementById('finish-screen')
};

const displays = {
    countdown: document.getElementById('countdown-display'),
    status: document.getElementById('status-label'),
    round: document.getElementById('current-round'),
    totalRounds: document.getElementById('total-rounds'),
    calories: document.getElementById('calories-display'),
    finalCalories: document.getElementById('final-calories'),
    finalTime: document.getElementById('final-time')
};

// --- Inicialización ---
window.onload = () => {
    loadSettings();
    initEventListeners();
};

function initEventListeners() {
    document.getElementById('start-btn').onclick = startWorkout;
    document.getElementById('pause-btn').onclick = togglePause;
    document.getElementById('stop-btn').onclick = stopWorkout;
    document.getElementById('reset-btn').onclick = resetToSetup;
}

// --- Lógica del Temporizador ---
function startWorkout() {
    // Capturar valores
    workTime = parseInt(document.getElementById('work-time').value);
    restTime = parseInt(document.getElementById('rest-time').value);
    totalRounds = parseInt(document.getElementById('rounds').value);
    userWeight = parseInt(document.getElementById('user-weight').value);

    saveSettings();
    initSensory(); // Inicializar audio en la primera interacción
    requestWakeLock();

    currentRound = 1;
    caloriesBurned = 0;
    switchScreen('timer');
    startState(STATES.PREP, 10);
}

function startState(state, seconds) {
    currentState = state;
    timeLeft = seconds;
    updateUIState();
    
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
}

function tick() {
    if (isPaused) return;

    timeLeft--;
    
    // Feedback sensorial
    if (timeLeft <= 3 && timeLeft > 0) {
        playBeep(440, 0.1); // Pitido corto
        vibrate(50);
    }

    if (timeLeft <= 0) {
        nextState();
    }

    updateDisplay();
    calculateCalories();
}

function nextState() {
    playBeep(880, 0.5); // Pitido largo/cambio
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
    
    displays.finalCalories.innerText = Math.round(caloriesBurned);
    displays.finalTime.innerText = formatTime(totalRounds * (workTime + restTime));
    switchScreen('finish');
}

// --- UI y Feedback ---
function updateDisplay() {
    displays.countdown.innerText = timeLeft;
    displays.round.innerText = currentRound;
    displays.totalRounds.innerText = totalRounds;
    displays.calories.innerText = Math.round(caloriesBurned);
    
    // Efecto de pulso en los últimos segundos
    if (timeLeft <= 3) {
        displays.countdown.style.transform = 'scale(1.1)';
        setTimeout(() => displays.countdown.style.transform = 'scale(1)', 100);
    }
}

function updateUIState() {
    const body = document.body;
    body.className = ''; // Limpiar clases
    displays.status.className = '';

    if (currentState === STATES.PREP) {
        displays.status.innerText = "PREPARACIÓN";
        displays.status.classList.add('state-prep');
        body.classList.add('bg-prep');
    } else if (currentState === STATES.WORK) {
        displays.status.innerText = "TRABAJO";
        displays.status.classList.add('state-work');
        body.classList.add('bg-work');
    } else if (currentState === STATES.REST) {
        displays.status.innerText = "DESCANSO";
        displays.status.classList.add('state-rest');
        body.classList.add('bg-rest');
    }
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').innerText = isPaused ? 'REANUDAR' : 'PAUSA';
}

function stopWorkout() {
    if (confirm('¿Deseas detener el entrenamiento?')) {
        clearInterval(timer);
        releaseWakeLock();
        resetToSetup();
    }
}

function resetToSetup() {
    switchScreen('setup');
    document.body.className = '';
}

function switchScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
}

// --- Utilidades Sensoriales ---
let audioCtx = null;
function initSensory() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playBeep(frequency, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function vibrate(pattern) {
    if (navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
    }
}

// --- Datos ---
function calculateCalories() {
    const met = currentState === STATES.WORK ? MET_WORK : (currentState === STATES.REST ? MET_REST : 1.0);
    // Fórmula: (MET * 3.5 * peso / 200) por minuto. Aquí dividimos por 60 para obtener por segundo.
    const calPerSecond = (met * 3.5 * userWeight) / (200 * 60);
    caloriesBurned += calPerSecond;
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function saveSettings() {
    const settings = {
        work: workTime,
        rest: restTime,
        rounds: totalRounds,
        weight: userWeight
    };
    localStorage.setItem('gymTimerSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('gymTimerSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        document.getElementById('work-time').value = settings.work;
        document.getElementById('rest-time').value = settings.rest;
        document.getElementById('rounds').value = settings.rounds;
        document.getElementById('user-weight').value = settings.weight;
    }
}
