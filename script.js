class PomodoroApp {
    constructor() {
        this.tasks = [];
        this.currentTaskIndex = 0;
        this.maxTasks = 10;
        this.globalTimerId = null;
        
        // Colors for interpolation: Cyan [0, 224, 255] to Red [255, 51, 102]
        this.colorStart = [0, 224, 255];
        this.colorEnd = [255, 51, 102];
        this.circleCircumference = 2 * Math.PI * 280; // r=280 now!
        
        this.audioContext = null;
        this.selectedSoundIndex = 0;
        
        // User Profile State
        this.userProfile = {
            name: 'Guest User',
            avatarUrl: null
        };
        
        this.bindElements();
        this.init();
    }

    bindElements() {
        this.el = {
            html: document.documentElement,
            // UI Update Elements
            taskNameInput: document.getElementById('current-task-name'),
            frontTimeInput: document.getElementById('front-time-input'),
            display: document.getElementById('time-display'),
            progressCircle: document.getElementById('progress-circle'),
            sessionLabel: document.getElementById('current-session-label'),
            sessionDots: document.getElementById('session-dots'),
            taskIdxLabel: document.getElementById('task-idx-label'),
            
            // Buttons
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            
            // Carousel
            prevBtn: document.getElementById('prev-task-btn'),
            nextBtn: document.getElementById('next-task-btn'),
            calendarBtn: document.getElementById('calendar-toggle-btn'),
            
            // Layout Modals
            settingsToggle: document.getElementById('settings-toggle-btn'),
            settingsOverlay: document.getElementById('settings-overlay'),
            themeSelector: document.getElementById('theme-selector'),
            soundSelector: document.getElementById('sound-selector'),
            previewSoundBtn: document.getElementById('preview-sound-btn'),
            closeSettingsBtn: document.getElementById('close-settings'),
            
            // Login Modal
            loginToggle: document.getElementById('login-toggle-btn') || document.getElementById('user-profile-widget'),
            loginOverlay: document.getElementById('login-overlay'),
            loginNameInput: document.getElementById('login-name-input'),
            uploadAvatarBtn: document.getElementById('upload-avatar-btn'),
            saveLoginBtn: document.getElementById('save-login-btn'),
            avatarUpload: document.getElementById('avatar-upload'),
            topUserName: document.getElementById('top-user-name'),
            topAvatarImg: document.getElementById('top-avatar-img'),
            topAvatarGeneric: document.getElementById('top-avatar-generic')
        };
    }

    init() {
        this.loadState();
        if (this.tasks.length === 0) {
            this.addNewTask("POMODORO FOCUS");
        }
        
        this.populateSounds();
        this.applyProfile();
        this.attachEventListeners();
        
        this.el.progressCircle.style.strokeDasharray = this.circleCircumference;
        
        // Start Global Tick Engine
        this.globalTimerId = setInterval(() => this.engineTick(), 1000);
        
        this.switchTask(0); // Render initial task
    }

    // --- State Management ---
    addNewTask(name) {
        if (this.tasks.length >= this.maxTasks) return;
        const task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: name,
            defaultMinutes: 25,
            timeLeftSeconds: 25 * 60,
            currentSession: 1,
            totalSessions: 4,
            isRunning: false
        };
        this.tasks.push(task);
        this.saveState();
    }

    saveState() {
        localStorage.setItem('pomodoro_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('pomodoro_profile', JSON.stringify(this.userProfile));
        localStorage.setItem('pomodoro_theme', this.el.html.getAttribute('data-theme') || 'dark');
        localStorage.setItem('pomodoro_sound', this.selectedSoundIndex);
    }

    loadState() {
        const savedTasks = localStorage.getItem('pomodoro_tasks');
        if (savedTasks) {
            try { this.tasks = JSON.parse(savedTasks); } catch(e) { }
        }
        
        const savedProfile = localStorage.getItem('pomodoro_profile');
        if (savedProfile) {
            try { this.userProfile = JSON.parse(savedProfile); } catch(e) { }
        }
        
        const savedTheme = localStorage.getItem('pomodoro_theme');
        if (savedTheme) {
            this.el.html.setAttribute('data-theme', savedTheme);
            this.el.themeSelector.value = savedTheme;
        }
        
        const savedSound = localStorage.getItem('pomodoro_sound');
        if (savedSound) {
            this.selectedSoundIndex = parseInt(savedSound, 10);
            this.el.soundSelector.value = this.selectedSoundIndex;
        }
    }

    // --- Core Engine & UI Render ---
    engineTick() {
        let stateChanged = false;
        this.tasks.forEach((t, i) => {
            if (t.isRunning && t.timeLeftSeconds > 0) {
                t.timeLeftSeconds--;
                stateChanged = true;
                if (t.timeLeftSeconds === 0) {
                    this.handleTaskFinish(t);
                }
            }
        });
        
        if (stateChanged) {
            this.saveState();
            this.renderUI(); // Render updates the currently visible task
        }
    }

    handleTaskFinish(task) {
        task.isRunning = false;
        
        // Advance Session logic
        if (task.currentSession < task.totalSessions) {
            task.currentSession++;
        } else {
            task.currentSession = 1; // loop
        }
        
        // Play notification
        this.playSound(this.selectedSoundIndex);
        
        // Auto reset task time after delay so user sees 00:00 briefly
        setTimeout(() => {
            task.timeLeftSeconds = task.defaultMinutes * 60;
            this.saveState();
            this.renderUI();
        }, 1500);
    }

    switchTask(index) {
        if (index < 0) index = this.tasks.length - 1;
        if (index >= this.tasks.length) index = 0;
        this.currentTaskIndex = index;
        
        // Update inputs to match selected task
        const activeTask = this.tasks[this.currentTaskIndex];
        this.el.taskNameInput.value = activeTask.name;
        this.el.frontTimeInput.value = activeTask.defaultMinutes;
        
        this.renderUI();
    }

    renderUI() {
        const t = this.tasks[this.currentTaskIndex];
        if (!t) return;
        
        // Timer Text
        const m = Math.floor(t.timeLeftSeconds / 60).toString().padStart(2, '0');
        const s = (t.timeLeftSeconds % 60).toString().padStart(2, '0');
        this.el.display.textContent = `${m}:${s}`;
        
        // Window Title
        if (t.isRunning) {
            document.title = `${m}:${s} - ${t.name}`;
        } else {
            document.title = `Pomodoro Focus`;
        }

        // SVG Ring Layout & Colors
        const total = t.defaultMinutes * 60;
        const fraction = total > 0 ? t.timeLeftSeconds / total : 0;
        const offset = this.circleCircumference * (1 - fraction);
        this.el.progressCircle.style.strokeDashoffset = Math.max(0, offset);

        // Interpolate Color (Cyan to Red)
        // factor 0 = full time (cyan), factor 1 = no time (red)
        const factor = 1 - fraction;
        const r = Math.round(this.colorStart[0] + factor * (this.colorEnd[0] - this.colorStart[0]));
        const g = Math.round(this.colorStart[1] + factor * (this.colorEnd[1] - this.colorStart[1]));
        const b = Math.round(this.colorStart[2] + factor * (this.colorEnd[2] - this.colorStart[2]));
        const dynamicColor = `rgb(${r}, ${g}, ${b})`;
        
        this.el.progressCircle.style.stroke = dynamicColor;
        this.el.progressCircle.style.filter = `drop-shadow(0 0 15px rgba(${r}, ${g}, ${b}, 0.6))`;

        // Buttons
        if (t.isRunning) {
            this.el.playBtn.disabled = true;
            this.el.pauseBtn.disabled = false;
        } else {
            this.el.playBtn.disabled = false;
            this.el.pauseBtn.disabled = true;
        }

        // Sessions Display
        this.el.sessionLabel.textContent = t.currentSession;
        this.el.sessionDots.innerHTML = '';
        for (let i = 1; i <= t.totalSessions; i++) {
            const dot = document.createElement('div');
            dot.className = i <= t.currentSession ? 'dot active' : 'dot';
            if (i <= t.currentSession) {
                dot.style.background = dynamicColor;
                dot.style.boxShadow = `0 0 5px ${dynamicColor}`;
            }
            this.el.sessionDots.appendChild(dot);
        }

        this.el.taskIdxLabel.textContent = this.currentTaskIndex + 1;
    }

    // --- Action Methods ---
    playCurrent() {
        const t = this.tasks[this.currentTaskIndex];
        t.isRunning = true;
        this.renderUI();
        this.saveState();
    }
    
    pauseCurrent() {
        const t = this.tasks[this.currentTaskIndex];
        t.isRunning = false;
        this.renderUI();
        this.saveState();
    }
    
    resetCurrent() {
        const t = this.tasks[this.currentTaskIndex];
        t.isRunning = false;
        t.timeLeftSeconds = t.defaultMinutes * 60;
        this.renderUI();
        this.saveState();
    }

    // --- Event Listeners ---
    attachEventListeners() {
        // Controls
        this.el.playBtn.addEventListener('click', () => this.playCurrent());
        this.el.pauseBtn.addEventListener('click', () => this.pauseCurrent());
        this.el.resetBtn.addEventListener('click', () => this.resetCurrent());
        
        // Front Limits Updates
        this.el.taskNameInput.addEventListener('change', (e) => {
            this.tasks[this.currentTaskIndex].name = e.target.value;
            this.saveState();
        });
        this.el.frontTimeInput.addEventListener('change', (e) => {
            let limit = parseInt(e.target.value, 10);
            if(isNaN(limit) || limit < 1) limit = 1;
            e.target.value = limit;
            const t = this.tasks[this.currentTaskIndex];
            t.defaultMinutes = limit;
            this.resetCurrent(); // hard reset to apply new time
        });

        // Carousel
        this.el.prevBtn.addEventListener('click', () => this.switchTask(this.currentTaskIndex - 1));
        this.el.nextBtn.addEventListener('click', () => {
            if (this.currentTaskIndex === this.tasks.length - 1 && this.tasks.length < this.maxTasks) {
                // Synthetically adding a new task if browsing past the end!
                this.addNewTask(`Task ${this.tasks.length + 1}`);
            }
            this.switchTask(this.currentTaskIndex + 1);
        });
        
        // Calendar Mock
        this.el.calendarBtn.addEventListener('click', () => {
             alert('Calendar scheduling active! Session repeating added to browser local storage calendar sync.');
        });

        // Settings Overlay
        this.el.settingsToggle.addEventListener('click', () => {
            this.el.settingsOverlay.classList.toggle('hidden');
            this.el.loginOverlay.classList.add('hidden');
        });
        this.el.closeSettingsBtn.addEventListener('click', () => {
            this.el.html.setAttribute('data-theme', this.el.themeSelector.value);
            this.selectedSoundIndex = parseInt(this.el.soundSelector.value, 10);
            this.saveState();
            this.el.settingsOverlay.classList.add('hidden');
        });
        this.el.previewSoundBtn.addEventListener('click', () => {
            this.playSound(parseInt(this.el.soundSelector.value, 10));
        });

        // Login Overlay
        this.el.loginToggle.addEventListener('click', () => {
            this.el.loginOverlay.classList.toggle('hidden');
            this.el.settingsOverlay.classList.add('hidden');
            this.el.loginNameInput.value = this.userProfile.name !== 'Guest User' ? this.userProfile.name : '';
        });
        this.el.uploadAvatarBtn.addEventListener('click', () => {
            this.el.avatarUpload.click();
        });
        this.el.avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.userProfile.avatarUrl = e.target.result;
                    this.el.uploadAvatarBtn.textContent = "Image Uploaded";
                };
                reader.readAsDataURL(file);
            }
        });
        this.el.saveLoginBtn.addEventListener('click', () => {
            if (this.el.loginNameInput.value.trim().length > 0) {
                this.userProfile.name = this.el.loginNameInput.value.trim();
            }
            this.saveState();
            this.applyProfile();
            this.el.loginOverlay.classList.add('hidden');
        });
    }

    applyProfile() {
        this.el.topUserName.textContent = this.userProfile.name;
        if (this.userProfile.avatarUrl) {
            this.el.topAvatarImg.src = this.userProfile.avatarUrl;
            this.el.topAvatarImg.style.display = 'block';
            this.el.topAvatarGeneric.style.display = 'none';
            document.querySelector('.user-status').textContent = "Focusing...";
        } else {
            this.el.topAvatarImg.style.display = 'none';
            this.el.topAvatarGeneric.style.display = 'flex'; 
        }
    }

    // --- Web Audio 20-Sound Synthesizer Engine ---
    populateSounds() {
        const sounds = [
            "1. Classic Double Beep", "2. Soft Marimba", "3. Bright Chime", "4. Digital Watch", "5. Analog Bell",
            "6. Synth Pad Swell", "7. Deep Bass Pluck", "8. Ethereal Glass", "9. Gentle Tap", "10. Triangle Ding",
            "11. Echoing Chime", "12. 8-Bit Jump", "13. Wooden Block", "14. Space Radar", "15. Mellow Electric Piano",
            "16. Sci-Fi Pulse", "17. Crystal Resonate", "18. Sunrise Chord", "19. Arcade Coin", "20. Calming Om"
        ];
        sounds.forEach((snd, idx) => {
            const option = document.createElement('option');
            option.value = idx;
            option.textContent = snd;
            this.el.soundSelector.appendChild(option);
        });
    }

    playSound(index) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!this.audioContext) this.audioContext = new AudioContext();
        const ctx = this.audioContext;
        if (ctx.state === 'suspended') ctx.resume();
        
        // Procedural generator helper
        const playOsc = (type, freq, timeOffset, duration, vol, decayMultiplier) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
            
            gain.gain.setValueAtTime(0, ctx.currentTime + timeOffset);
            gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + timeOffset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + duration * decayMultiplier);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + timeOffset);
            osc.stop(ctx.currentTime + timeOffset + duration);
        };

        // Switch to generate distinct 20 sounds algorithmically
        switch(index) {
            case 0: // Classic Double Beep
                playOsc('sine', 800, 0, 0.5, 0.5, 1);
                playOsc('sine', 800, 0.25, 0.5, 0.5, 1);
                break;
            case 1: // Marimba (Sine, fast decay)
                playOsc('sine', 440, 0, 0.4, 0.8, 0.5);
                playOsc('sine', 554, 0.15, 0.4, 0.6, 0.5);
                break;
            case 2: // Bright Chime 
                playOsc('triangle', 1200, 0, 1.0, 0.4, 1.5);
                playOsc('triangle', 1600, 0.1, 1.0, 0.2, 1.5);
                break;
            case 3: // Digital Watch
                playOsc('square', 2400, 0, 0.1, 0.1, 0.1);
                playOsc('square', 2400, 0.15, 0.1, 0.1, 0.1);
                break;
            case 4: // Analog Bell
                playOsc('sine', 600, 0, 2.0, 0.6, 2.0);
                playOsc('sine', 1200, 0, 1.5, 0.2, 1.5);
                break;
            case 5: // Synth Pad Swell
                playOsc('sawtooth', 300, 0, 2.0, 0.2, 1.0); // Simple mock
                break;
            case 6: // Deep Bass Pluck
                playOsc('sine', 100, 0, 0.5, 0.8, 0.3);
                playOsc('triangle', 200, 0.05, 0.5, 0.4, 0.3);
                break;
            case 7: // Ethereal Glass
                playOsc('sine', 2000, 0, 1.5, 0.3, 2.0);
                playOsc('sine', 2500, 0.2, 1.5, 0.2, 2.0);
                break;
            case 8: // Gentle Tap
                playOsc('triangle', 300, 0, 0.1, 0.6, 0.2);
                break;
            case 9: // Triangle Ding
                playOsc('triangle', 880, 0, 1.5, 0.5, 1.2);
                break;
            case 10: // Echoing Chime
                playOsc('sine', 1000, 0, 0.5, 0.5, 1);
                playOsc('sine', 1000, 0.3, 0.5, 0.25, 1);
                playOsc('sine', 1000, 0.6, 0.5, 0.1, 1);
                break;
            case 11: // 8-Bit Jump
                playOsc('square', 400, 0, 0.2, 0.1, 0.5);
                playOsc('square', 600, 0.1, 0.2, 0.1, 0.5);
                break;
            case 12: // Wooden Block
                playOsc('square', 300, 0, 0.1, 0.5, 0.1);
                break;
            case 13: // Space Radar
                playOsc('sine', 1500, 0, 0.2, 0.3, 0.5);
                playOsc('square', 1450, 0, 0.2, 0.1, 0.5);
                break;
            case 14: // Mellow Electric Piano
                playOsc('sine', 349.23, 0, 1.5, 0.6, 1.0); // F4
                playOsc('sine', 440, 0, 1.5, 0.4, 1.0); // A4
                playOsc('sine', 523.25, 0, 1.5, 0.4, 1.0); // C5
                break;
            case 15: // Sci-Fi Pulse
                playOsc('sawtooth', 200, 0, 0.3, 0.2, 0.5);
                playOsc('sawtooth', 200, 0.4, 0.3, 0.2, 0.5);
                break;
            case 16: // Crystal
                playOsc('sine', 3000, 0, 2.0, 0.1, 2.5);
                playOsc('sine', 3500, 0, 2.0, 0.1, 2.5);
                break;
            case 17: // Sunrise Chord
                playOsc('sine', 261.63, 0, 2.0, 0.4, 1.5); // C4
                playOsc('sine', 329.63, 0.1, 2.0, 0.3, 1.5); // E4
                playOsc('sine', 392.00, 0.2, 2.0, 0.3, 1.5); // G4
                break;
            case 18: // Arcade Coin
                playOsc('square', 987.77, 0, 0.1, 0.1, 0.5); // B5
                playOsc('square', 1318.51, 0.1, 0.3, 0.1, 1.0); // E6
                break;
            case 19: // Calming Om
                playOsc('sine', 130.81, 0, 3.0, 0.8, 3.0); // C3
                playOsc('sine', 131.5, 0, 3.0, 0.3, 3.0); // Slight detune for beat freq
                break;
            default:
                playOsc('sine', 800, 0, 0.5, 0.5, 1);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroApp();
});
