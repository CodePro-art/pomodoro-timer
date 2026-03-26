class PomodoroApp {
    constructor() {
        this.tasks = [];
        this.currentTaskIndex = 0;
        this.maxTasks = 10;
        this.globalTimerId = null;
        
        // Colors for interpolation: Cyan [0, 224, 255] to Red [255, 51, 102]
        this.colorStart = [0, 224, 255];
        this.colorEnd = [255, 51, 102];
        this.circleCircumference = 2 * Math.PI * 280; // r=280 now
        
        this.selectedSoundIndex = "0";
        this.soundData = [];
        this.isGridView = false;
        
        // Avatar Cropping State
        this.cropConfig = {
            imageSrc: null,
            scale: 1,
            offsetX: 0,
            offsetY: 0,
            isDragging: false,
            startX: 0,
            startY: 0
        };

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
            // UI Sections
            sidebarDashboardBtn: document.getElementById('sidebar-dashboard-btn'),
            sidebarFocusBtn: document.getElementById('sidebar-focus-btn'),
            sidebarProfileBtn: document.getElementById('sidebar-profile-btn'),
            gridView: document.getElementById('grid-view'),
            focusView: document.getElementById('focus-view'),
            timersGrid: document.getElementById('timers-grid'),
            mainCard: document.getElementById('main-focus-card'),
            topTitle: document.getElementById('top-title'),
            
            // Focus View Update Elements
            taskNameInput: document.getElementById('current-task-name'),
            frontTimeInput: document.getElementById('front-time-input'),
            display: document.getElementById('time-display'),
            progressCircle: document.getElementById('progress-circle'),
            sessionDots: document.getElementById('session-dots'),
            taskIdxLabel: document.getElementById('task-idx-label'),
            
            // Focus View Buttons
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            prevBtn: document.getElementById('prev-task-btn'),
            nextBtn: document.getElementById('next-task-btn'),
            calendarBtn: document.getElementById('calendar-toggle-btn'),
            
            // Settings Modal
            settingsToggle: document.getElementById('settings-toggle-btn'),
            settingsOverlay: document.getElementById('settings-overlay'),
            themeSelector: document.getElementById('theme-selector'),
            soundSelector: document.getElementById('sound-selector'),
            previewSoundBtn: document.getElementById('preview-sound-btn'),
            closeSettingsBtn: document.getElementById('close-settings'),
            
            // Login Modal & Cropper
            loginOverlay: document.getElementById('login-overlay'),
            loginNameInput: document.getElementById('login-name-input'),
            uploadAvatarBtn: document.getElementById('upload-avatar-btn'),
            saveLoginBtn: document.getElementById('save-login-btn'),
            avatarUpload: document.getElementById('avatar-upload'),
            topUserName: document.getElementById('top-user-name'),
            topAvatarImg: document.getElementById('top-avatar-img'),
            topAvatarGeneric: document.getElementById('top-avatar-generic'),
            topProfileWidget: document.getElementById('user-profile-widget'),

            // Cropper UI
            cropperContainer: document.getElementById('avatar-cropper-container'),
            cropCircle: document.getElementById('crop-circle'),
            cropImagePreview: document.getElementById('crop-image-preview'),
            cropZoom: document.getElementById('crop-zoom'),

            // Calendar Modal
            calendarOverlay: document.getElementById('calendar-overlay'),
            dayBtns: document.querySelectorAll('.day-btn'),
            scheduleTime: document.getElementById('schedule-time'),
            saveCalendar: document.getElementById('save-calendar'),
            cancelCalendar: document.getElementById('cancel-calendar'),

            // Close Buttons everywhere
            closeOverlayBtns: document.querySelectorAll('.close-overlay-btn')
        };
    }

    async init() {
        this.loadState();
        if (this.tasks.length === 0) {
            this.addNewTask("Pomodoro Focus");
        }
        
        await this.fetchSoundAPI();
        
        this.applyProfile();
        this.attachEventListeners();
        
        this.el.progressCircle.style.strokeDasharray = this.circleCircumference;
        
        // Global engine starts measuring
        this.globalTimerId = setInterval(() => this.engineTick(), 1000);
        
        this.switchTask(0, true); // Immediate render Initial
    }

    async fetchSoundAPI() {
        // Full 20 configurations fallback if JSON JSON fetch is blocked by CORS
        const fallbackSounds = [
          { "id": "0", "name": "1. Classic Double Beep" },
          { "id": "1", "name": "2. Soft Marimba" },
          { "id": "2", "name": "3. Bright Chime" },
          { "id": "3", "name": "4. Digital Watch" },
          { "id": "4", "name": "5. Analog Bell" },
          { "id": "5", "name": "6. Synth Pad Swell" },
          { "id": "6", "name": "7. Deep Bass Pluck" },
          { "id": "7", "name": "8. Ethereal Glass" },
          { "id": "8", "name": "9. Gentle Tap" },
          { "id": "9", "name": "10. Triangle Ding" },
          { "id": "10", "name": "11. Echoing Chime" },
          { "id": "11", "name": "12. 8-Bit Jump" },
          { "id": "12", "name": "13. Wooden Block" },
          { "id": "13", "name": "14. Space Radar" },
          { "id": "14", "name": "15. Mellow Piano" },
          { "id": "15", "name": "16. Sci-Fi Pulse" },
          { "id": "16", "name": "17. Crystal Resonate" },
          { "id": "17", "name": "18. Sunrise Chord" },
          { "id": "18", "name": "19. Arcade Coin" },
          { "id": "19", "name": "20. Calming Om" }
        ];

        try {
            // Absolute raw github URL prevents ALL cors issues strictly!
            let soundsUrl = 'https://raw.githubusercontent.com/CodePro-art/pomodoro-timer/main/data/sounds.json';
            const soundsRes = await fetch(soundsUrl);
            this.soundData = await soundsRes.json();
        } catch (e) {
            console.log("Remote API Core Fetch blocked remotely, falling back to local fallback array explicitly.", e);
            this.soundData = fallbackSounds;
        }

        // Apply Sounds Dropdown
        this.el.soundSelector.innerHTML = '';
        this.soundData.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.name;
            this.el.soundSelector.appendChild(opt);
        });
        
        const savedSound = localStorage.getItem('pomodoro_sound') || "0";
        this.el.soundSelector.value = savedSound;
        this.selectedSoundIndex = savedSound;

        // Theming is hardcoded mechanically by user request so we read directly
        const savedTheme = localStorage.getItem('pomodoro_theme') || 'dark';
        this.el.themeSelector.value = savedTheme;
        this.el.html.setAttribute('data-theme', savedTheme);
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
            isRunning: false,
            schedule: { days: [], time: '' }
        };
        this.tasks.push(task);
        this.saveState();
    }

    saveState() {
        localStorage.setItem('pomodoro_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('pomodoro_profile', JSON.stringify(this.userProfile));
        localStorage.setItem('pomodoro_theme', this.el.themeSelector.value || 'dark');
        localStorage.setItem('pomodoro_sound', this.el.soundSelector.value || "0");
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
            if (this.isGridView) {
                this.renderGrid(); // update tiny clocks
            } else {
                this.renderUI(); // update large focus clock
            }
        }
    }

    handleTaskFinish(task) {
        task.isRunning = false;
        
        // Advance Session logic
        if (task.currentSession < task.totalSessions) {
            task.currentSession++;
        } else {
            task.currentSession = 1; // loop or reset
        }
        
        // Play notification reliably with real mp3 API Data!
        this.playSound(this.selectedSoundIndex);
        
        // Auto reset task time softly
        setTimeout(() => {
            task.timeLeftSeconds = task.defaultMinutes * 60;
            this.saveState();
            if(this.isGridView) this.renderGrid();
            else this.renderUI();
        }, 2000);
    }

    // Elegant Transition Switcher
    switchTask(index, immediate = false) {
        if (index < 0) index = this.tasks.length - 1;
        if (index >= this.tasks.length) index = 0;
        
        if (immediate) {
            this.currentTaskIndex = index;
            this.applyFocusData();
            this.renderUI();
            return;
        }

        // Smooth transition effect for element card
        this.el.mainCard.classList.add('fade-out');
        setTimeout(() => {
            this.currentTaskIndex = index;
            this.applyFocusData();
            this.renderUI();
            this.el.mainCard.classList.remove('fade-out');
        }, 300);
    }

    applyFocusData() {
        const activeTask = this.tasks[this.currentTaskIndex];
        this.el.taskNameInput.value = activeTask.name;
        this.el.frontTimeInput.value = activeTask.defaultMinutes;
    }

    renderUI() {
        const t = this.tasks[this.currentTaskIndex];
        if (!t) return;
        
        // Text calculation
        const m = Math.floor(t.timeLeftSeconds / 60).toString().padStart(2, '0');
        const s = (t.timeLeftSeconds % 60).toString().padStart(2, '0');
        this.el.display.textContent = `${m}:${s}`;
        
        if (t.isRunning) {
            document.title = `${m}:${s} - ${t.name}`;
            this.el.playBtn.disabled = true;
            this.el.pauseBtn.disabled = false;
        } else {
            document.title = `Pomodoro Focus`;
            this.el.playBtn.disabled = false;
            this.el.pauseBtn.disabled = true;
        }

        // Ring Setup
        const total = t.defaultMinutes * 60;
        const fraction = total > 0 ? t.timeLeftSeconds / total : 0;
        const offset = this.circleCircumference * (1 - fraction);
        this.el.progressCircle.style.strokeDashoffset = Math.max(0, offset);

        // Color Interpolation dynamically
        const factor = 1 - fraction;
        const r = Math.round(this.colorStart[0] + factor * (this.colorEnd[0] - this.colorStart[0]));
        const g = Math.round(this.colorStart[1] + factor * (this.colorEnd[1] - this.colorStart[1]));
        const b = Math.round(this.colorStart[2] + factor * (this.colorEnd[2] - this.colorStart[2]));
        const dynamicColor = `rgb(${r}, ${g}, ${b})`;
        
        this.el.progressCircle.style.stroke = dynamicColor;
        this.el.progressCircle.style.filter = `drop-shadow(0 0 15px rgba(${r}, ${g}, ${b}, 0.6))`;

        // Tracker visual dots representing 10 tasks specifically per explicit request
        this.el.sessionDots.innerHTML = '';
        for (let i = 0; i < this.maxTasks; i++) {
            const dot = document.createElement('div');
            // If the dot represents an existing task, style it cleanly.
            if (i < this.tasks.length) {
                if (i === this.currentTaskIndex) {
                    dot.className = 'dot active';
                    dot.style.background = dynamicColor;
                    dot.style.boxShadow = `0 0 8px ${dynamicColor}`;
                } else {
                    dot.className = 'dot';
                    dot.style.background = 'rgba(255,255,255,0.4)';
                }
            } else {
                // Dim representation of empty empty tasks remaining up to 10
                dot.className = 'dot';
                dot.style.background = 'rgba(255,255,255,0.1)';
            }
            this.el.sessionDots.appendChild(dot);
        }

        this.el.taskIdxLabel.textContent = this.currentTaskIndex + 1;
    }

    renderGrid() {
        this.el.timersGrid.innerHTML = '';
        this.tasks.forEach((t, idx) => {
            const card = document.createElement('div');
            card.className = 'grid-card';
            
            const m = Math.floor(t.timeLeftSeconds / 60).toString().padStart(2, '0');
            const s = (t.timeLeftSeconds % 60).toString().padStart(2, '0');
            
            card.innerHTML = `
                <h4>${t.name}</h4>
                <div class="grid-time" style="color: ${t.isRunning ? 'var(--primary-cyan)' : 'var(--text-primary)'}">${m}:${s}</div>
                <div class="controls">
                    <button class="btn btn-outline start-btn" data-idx="${idx}" ${t.isRunning ? 'disabled' : ''}>Play</button>
                    <button class="btn btn-outline pause-btn" data-idx="${idx}" ${!t.isRunning ? 'disabled' : ''}>Pause</button>
                    <button class="btn btn-outline reset-btn" data-idx="${idx}">Reset</button>
                </div>
            `;
            
            // Allow clicking card (except buttons) to dive into FOCUS VIEW Mode!
            card.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    this.switchTask(idx, true);
                    this.toggleViews(false); // goto Focus
                    this.el.sidebarFocusBtn.classList.add('active');
                    this.el.sidebarDashboardBtn.classList.remove('active');
                }
            });

            // Grid buttons logic
            const btnStart = card.querySelector('.start-btn');
            const btnPause = card.querySelector('.pause-btn');
            const btnReset = card.querySelector('.reset-btn');
            
            btnStart.addEventListener('click', () => { t.isRunning = true; this.renderGrid(); this.saveState(); });
            btnPause.addEventListener('click', () => { t.isRunning = false; this.renderGrid(); this.saveState(); });
            btnReset.addEventListener('click', () => { 
                t.isRunning = false; 
                t.timeLeftSeconds = t.defaultMinutes * 60; 
                this.renderGrid(); 
                this.saveState(); 
            });

            this.el.timersGrid.appendChild(card);
        });
    }

    toggleViews(forceGrid) {
        this.isGridView = forceGrid;
        if (forceGrid) {
            this.el.topTitle.textContent = "Dashboard Grid";
            this.el.gridView.classList.remove('hidden');
            this.el.focusView.classList.add('hidden');
            this.renderGrid();
        } else {
            this.el.topTitle.textContent = "Focus View";
            this.el.gridView.classList.add('hidden');
            this.el.focusView.classList.remove('hidden');
            this.renderUI();
        }
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

    closeAllOverlays() {
        this.el.settingsOverlay.classList.add('hidden');
        this.el.loginOverlay.classList.add('hidden');
        this.el.calendarOverlay.classList.add('hidden');
    }

    // --- Event Listeners Integration ---
    attachEventListeners() {
        // Core buttons
        this.el.playBtn.addEventListener('click', () => this.playCurrent());
        this.el.pauseBtn.addEventListener('click', () => this.pauseCurrent());
        this.el.resetBtn.addEventListener('click', () => this.resetCurrent());
        
        // Sidebar Overlays
        this.el.sidebarDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.el.sidebarDashboardBtn.classList.add('active');
            this.el.sidebarFocusBtn.classList.remove('active');
            this.toggleViews(true);
        });
        
        this.el.sidebarFocusBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.el.sidebarFocusBtn.classList.add('active');
            this.el.sidebarDashboardBtn.classList.remove('active');
            this.toggleViews(false);
        });
        
        this.el.sidebarProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openLoginModal();
        });
        
        this.el.topProfileWidget.addEventListener('click', () => {
            this.openLoginModal();
        });

        // Overlay Close X buttons
        this.el.closeOverlayBtns.forEach(btn => {
            btn.addEventListener('click', () => this.closeAllOverlays());
        });

        // Limit Updates
        this.el.taskNameInput.addEventListener('change', (e) => {
            this.tasks[this.currentTaskIndex].name = e.target.value;
            this.saveState();
            this.renderUI();
        });
        
        this.el.frontTimeInput.addEventListener('change', (e) => {
            let limit = parseInt(e.target.value, 10);
            if(isNaN(limit) || limit < 1) limit = 1;
            e.target.value = limit;
            const t = this.tasks[this.currentTaskIndex];
            t.defaultMinutes = limit;
            this.resetCurrent(); 
        });

        // Carousel Arrow events
        this.el.prevBtn.addEventListener('click', () => {
            if (this.tasks.length > 0) this.switchTask(this.currentTaskIndex - 1);
        });
        
        this.el.nextBtn.addEventListener('click', () => {
            if (this.currentTaskIndex === this.tasks.length - 1 && this.tasks.length < this.maxTasks) {
                // Ensure default name is proper per explicit instruction
                this.addNewTask("Pomodoro Focus");
            }
            this.switchTask(this.currentTaskIndex + 1);
        });
        
        // Settings Layer
        this.el.settingsToggle.addEventListener('click', () => {
            this.el.settingsOverlay.classList.remove('hidden');
            this.el.loginOverlay.classList.add('hidden');
            this.el.calendarOverlay.classList.add('hidden');
        });
        
        this.el.closeSettingsBtn.addEventListener('click', () => {
            const selectedTheme = this.el.themeSelector.value;
            this.el.html.setAttribute('data-theme', selectedTheme);
            this.selectedSoundIndex = this.el.soundSelector.value;
            this.saveState();
            this.closeAllOverlays();
        });
        
        this.el.previewSoundBtn.addEventListener('click', () => {
            this.playSound(this.el.soundSelector.value);
        });

        // Login Avatar Crop Layer Events
        this.el.uploadAvatarBtn.addEventListener('click', () => {
            this.el.avatarUpload.click();
        });
        
        this.el.avatarUpload.addEventListener('change', (e) => this.handleImageSelect(e));

        this.el.saveLoginBtn.addEventListener('click', () => {
            if (this.el.loginNameInput.value.trim().length > 0) {
                this.userProfile.name = this.el.loginNameInput.value.trim();
            }
            
            // If performing crop... compile the data URL
            if (this.cropConfig.imageSrc) {
                this.compileCroppedAvatar();
            }

            this.saveState();
            this.applyProfile();
            this.closeAllOverlays();
        });

        this.initCropperInteractions();

        // Calendar Layer Events
        this.el.calendarBtn.addEventListener('click', () => {
            this.el.calendarOverlay.classList.remove('hidden');
            this.el.settingsOverlay.classList.add('hidden');
            this.el.loginOverlay.classList.add('hidden');
            
            const schedule = this.tasks[this.currentTaskIndex].schedule || { days: [], time: '' };
            this.el.scheduleTime.value = schedule.time || '';
            this.el.dayBtns.forEach(btn => {
                const day = parseInt(btn.getAttribute('data-day'), 10);
                if (schedule.days.includes(day)) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        });
        
        this.el.dayBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
            });
        });

        this.el.saveCalendar.addEventListener('click', () => {
            const activeDays = [];
            this.el.dayBtns.forEach(btn => {
                if (btn.classList.contains('active')) {
                    activeDays.push(parseInt(btn.getAttribute('data-day'), 10));
                }
            });
            const t = this.tasks[this.currentTaskIndex];
            if (!t.schedule) t.schedule = { days: [], time: '' };
            t.schedule.days = activeDays;
            t.schedule.time = this.el.scheduleTime.value;
            this.saveState();
            this.closeAllOverlays();
            alert(`Schedule saved: Active on ${activeDays.length} days at ${t.schedule.time || 'Not Set'}`);
        });

        this.el.cancelCalendar.addEventListener('click', () => {
            this.closeAllOverlays();
        });
    }

    openLoginModal() {
        this.el.loginOverlay.classList.remove('hidden');
        this.el.settingsOverlay.classList.add('hidden');
        this.el.calendarOverlay.classList.add('hidden');
        this.el.loginNameInput.value = this.userProfile.name !== 'Guest User' ? this.userProfile.name : '';
    }

    applyProfile() {
        this.el.topUserName.textContent = this.userProfile.name;
        if (this.userProfile.avatarUrl) {
            this.el.topAvatarImg.src = this.userProfile.avatarUrl;
            this.el.topAvatarImg.style.display = 'block';
            this.el.topAvatarGeneric.style.display = 'none';
        } else {
            this.el.topAvatarImg.style.display = 'none';
            this.el.topAvatarGeneric.style.display = 'flex'; 
        }
    }

    // --- Deep Image Cropping Logic Utilizing Transform Matrix ---
    handleImageSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.cropConfig.imageSrc = e.target.result;
            this.cropConfig.scale = 1;
            this.cropConfig.offsetX = 0;
            this.cropConfig.offsetY = 0;
            
            this.el.cropperContainer.classList.remove('hidden');
            this.el.cropImagePreview.src = this.cropConfig.imageSrc;
            this.updateCropperTransform();
            this.el.uploadAvatarBtn.textContent = "Change Image";
        };
        reader.readAsDataURL(file);
    }

    initCropperInteractions() {
        const preview = this.el.cropImagePreview;
        
        // Zoom functionality
        this.el.cropZoom.addEventListener('input', (e) => {
            this.cropConfig.scale = parseFloat(e.target.value);
            this.updateCropperTransform();
        });

        // Mouse Drag Panning Matrix
        preview.addEventListener('pointerdown', (e) => {
            this.cropConfig.isDragging = true;
            this.cropConfig.startX = e.clientX - this.cropConfig.offsetX;
            this.cropConfig.startY = e.clientY - this.cropConfig.offsetY;
            document.body.style.cursor = 'grabbing';
            preview.style.cursor = 'grabbing';
        });

        document.addEventListener('pointermove', (e) => {
            if (!this.cropConfig.isDragging) return;
            this.cropConfig.offsetX = e.clientX - this.cropConfig.startX;
            this.cropConfig.offsetY = e.clientY - this.cropConfig.startY;
            this.updateCropperTransform();
        });

        document.addEventListener('pointerup', () => {
            this.cropConfig.isDragging = false;
            document.body.style.cursor = 'default';
            preview.style.cursor = 'grab';
        });
    }

    updateCropperTransform() {
        this.el.cropImagePreview.style.transform = `
            translate(${this.cropConfig.offsetX}px, ${this.cropConfig.offsetY}px) 
            scale(${this.cropConfig.scale})
        `;
    }

    compileCroppedAvatar() {
        // Advanced HTML5 Canvas compilation mapping visual translations perfectly
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const SIZE = 120; // 120px circular profile target
        
        canvas.width = SIZE;
        canvas.height = SIZE;

        // Force a circle clip map
        ctx.beginPath();
        ctx.arc(SIZE/2, SIZE/2, SIZE/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Calculate Image Source Scalings
        const img = this.el.cropImagePreview;
        
        // Ensure image has explicit dimensions by natural parameters
        const naturalScaleX = SIZE / img.naturalWidth;
        const naturalScaleY = SIZE / img.naturalHeight;
        const uniformScale = Math.max(naturalScaleX, naturalScaleY) * this.cropConfig.scale;

        const drawWidth = img.naturalWidth * uniformScale;
        const drawHeight = img.naturalHeight * uniformScale;

        // Determine positional translation offsetting bounds
        const cx = (SIZE - drawWidth) / 2 + (this.cropConfig.offsetX * this.cropConfig.scale);
        const cy = (SIZE - drawHeight) / 2 + (this.cropConfig.offsetY * this.cropConfig.scale);

        ctx.drawImage(img, cx, cy, drawWidth, drawHeight);

        // Convert and assign Data URL
        this.userProfile.avatarUrl = canvas.toDataURL('image/png');
        
        // Tear down crop ui explicitly
        this.el.cropperContainer.classList.add('hidden');
        this.cropConfig.imageSrc = null;
        this.el.uploadAvatarBtn.textContent = "Upload Image";
    }

    playSound(soundId) {
        if (!this.soundData || this.soundData.length === 0) return;
        
        let index = parseInt(soundId, 10);
        if (isNaN(index)) index = 0;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!this.audioContext) this.audioContext = new AudioContext(); // persist context
        const ctx = this.audioContext;
        
        // If context is suspended (browser policy), attempt to resume
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.log("Audio Context blocked by browser.", e));
        }

        const playOsc = (type, freq, timeOffset, duration, vol, decayMultiplier) => {
            try {
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
            } catch (err) {
                console.log("Synthesizer error ignored.", err);
            }
        };

        switch(index) {
            case 0: // Classic Double Beep
                playOsc('sine', 800, 0, 0.5, 0.5, 1);
                playOsc('sine', 800, 0.25, 0.5, 0.5, 1);
                break;
            case 1: // Marimba
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
                playOsc('sawtooth', 300, 0, 2.0, 0.2, 1.0);
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
                playOsc('sine', 349.23, 0, 1.5, 0.6, 1.0);
                playOsc('sine', 440, 0, 1.5, 0.4, 1.0);
                playOsc('sine', 523.25, 0, 1.5, 0.4, 1.0);
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
                playOsc('sine', 261.63, 0, 2.0, 0.4, 1.5);
                playOsc('sine', 329.63, 0.1, 2.0, 0.3, 1.5);
                playOsc('sine', 392.00, 0.2, 2.0, 0.3, 1.5); 
                break;
            case 18: // Arcade Coin
                playOsc('square', 987.77, 0, 0.1, 0.1, 0.5);
                playOsc('square', 1318.51, 0.1, 0.3, 0.1, 1.0);
                break;
            case 19: // Calming Om
                playOsc('sine', 130.81, 0, 3.0, 0.8, 3.0);
                playOsc('sine', 131.5, 0, 3.0, 0.3, 3.0); // detune
                break;
            default:
                playOsc('sine', 800, 0, 0.5, 0.5, 1);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroApp();
});
