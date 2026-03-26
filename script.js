class PomodoroTimer {
    constructor() {
        this.timerId = null;
        this.isRunning = false;
        
        // Timings
        this.defaultMinutes = 25;
        this.timeLeftSeconds = this.defaultMinutes * 60;
        
        // Sessions
        this.currentSession = 1;
        this.totalSessions = 4;
        
        // SVG Ring (radius 130)
        this.circleCircumference = 2 * Math.PI * 130;

        // Elements
        this.elements = {
            display: document.getElementById('time-display'),
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            
            // Settings
            settingsToggle: document.getElementById('settings-toggle-btn'),
            settingsOverlay: document.getElementById('settings-overlay'),
            timeInput: document.getElementById('custom-time-input'),
            saveSettingsBtn: document.getElementById('save-settings'),
            
            // UI/Session
            container: document.querySelector('.pomodoro-card'),
            progressCircle: document.getElementById('progress-circle'),
            sessionLabel: document.getElementById('current-session-label'),
            sessionDots: document.querySelectorAll('.dot')
        };

        this.init();
    }

    init() {
        this.elements.progressCircle.style.strokeDasharray = this.circleCircumference;
        this.elements.progressCircle.style.strokeDashoffset = 0;

        this.bindEvents();
        this.updateDisplay();
        this.updateSessionDots();
    }

    bindEvents() {
        this.elements.playBtn.addEventListener('click', () => this.playTimer());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.elements.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Settings Toggle
        this.elements.settingsToggle.addEventListener('click', () => {
            this.elements.settingsOverlay.classList.toggle('hidden');
        });

        // Save Custom Time
        this.elements.saveSettingsBtn.addEventListener('click', () => {
            let newMinutes = parseInt(this.elements.timeInput.value, 10);
            if (isNaN(newMinutes) || newMinutes < 1) newMinutes = 1;
            if (newMinutes > 120) newMinutes = 120;
            
            this.elements.timeInput.value = newMinutes;
            this.defaultMinutes = newMinutes;
            
            this.elements.settingsOverlay.classList.add('hidden');
            this.resetTimer();
        });
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeftSeconds / 60);
        const seconds = this.timeLeftSeconds % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.elements.display.textContent = formattedTime;
        document.title = `${formattedTime} - Focus Timer`;

        // Ring
        const totalSeconds = this.defaultMinutes * 60;
        const fraction = this.timeLeftSeconds / totalSeconds;
        const dashOffset = this.circleCircumference - (fraction * this.circleCircumference);
        
        // Adding a slight min threshold so it doesn't completely vanish at 0
        this.elements.progressCircle.style.strokeDashoffset = Math.max(0, dashOffset);
        
        this.elements.sessionLabel.textContent = this.currentSession;
    }

    updateSessionDots() {
        this.elements.sessionDots.forEach((dot, index) => {
            if (index < this.currentSession) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    playNotificationSound() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        
        const triggerBeep = (freq, nextFreq, delay) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            osc.frequency.exponentialRampToValueAtTime(nextFreq, ctx.currentTime + delay + 0.3);
            
            gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + delay + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.5);
        };
        
        triggerBeep(800, 400, 0);
        triggerBeep(600, 300, 0.25);
    }

    finishTimer() {
        clearInterval(this.timerId);
        this.isRunning = false;
        
        this.elements.playBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        this.elements.container.classList.remove('is-running', 'is-paused');
        
        this.playNotificationSound();
        
        // Progress session
        if (this.currentSession < this.totalSessions) {
            this.currentSession++;
        } else {
            this.currentSession = 1; // Reset after all blocks are complete
        }
        
        setTimeout(() => {
            this.timeLeftSeconds = this.defaultMinutes * 60;
            this.updateDisplay();
            this.updateSessionDots();
        }, 1500);
    }

    playTimer() {
        if (this.isRunning) return;
        
        this.elements.settingsOverlay.classList.add('hidden'); // Ensure settings are closed

        this.timerId = setInterval(() => {
            this.timeLeftSeconds--;
            this.updateDisplay();
            
            if (this.timeLeftSeconds <= 0) {
                this.finishTimer();
            }
        }, 1000);
        
        this.isRunning = true;
        this.elements.playBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        
        this.elements.container.classList.add('is-running');
        this.elements.container.classList.remove('is-paused');
    }

    pauseTimer() {
        if (!this.isRunning) return;

        clearInterval(this.timerId);
        this.isRunning = false;
        
        this.elements.playBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        this.elements.container.classList.remove('is-running');
        this.elements.container.classList.add('is-paused');
    }

    resetTimer() {
        clearInterval(this.timerId);
        this.isRunning = false;
        
        this.timeLeftSeconds = this.defaultMinutes * 60;
        this.updateDisplay();
        
        this.elements.playBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        this.elements.container.classList.remove('is-running', 'is-paused');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
