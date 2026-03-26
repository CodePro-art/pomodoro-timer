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
        // Fallback robust MP3s from SoundJay to ensure 0 CORS errors natively
        const fallbackSounds = [
          { "id": "0", "name": "Classic Bell", "url": "https://www.soundjay.com/misc/bells-1.mp3" },
          { "id": "1", "name": "Digital Beep", "url": "https://www.soundjay.com/button/beep-01a.mp3" },
          { "id": "2", "name": "Double Beep", "url": "https://www.soundjay.com/button/beep-04.mp3" },
          { "id": "3", "name": "Soft Tone", "url": "https://www.soundjay.com/button/beep-06.mp3" },
          { "id": "4", "name": "Sharp Tone", "url": "https://www.soundjay.com/button/beep-07.mp3" },
          { "id": "5", "name": "High Beep", "url": "https://www.soundjay.com/button/beep-09.mp3" },
          { "id": "6", "name": "Low Pulse", "url": "https://www.soundjay.com/button/beep-10.mp3" },
          { "id": "7", "name": "Ping", "url": "https://www.soundjay.com/button/button-1.mp3" },
          { "id": "8", "name": "Tap", "url": "https://www.soundjay.com/button/button-3.mp3" },
          { "id": "9", "name": "Click", "url": "https://www.soundjay.com/button/button-4.mp3" },
          { "id": "10", "name": "Switch", "url": "https://www.soundjay.com/button/button-5.mp3" },
          { "id": "11", "name": "Telephone Ring", "url": "https://www.soundjay.com/phone/telephone-ring-01a.mp3" },
          { "id": "12", "name": "Cymbal", "url": "https://www.soundjay.com/misc/cymbal-1.mp3" },
          { "id": "13", "name": "Wood Block", "url": "https://www.soundjay.com/misc/wood-block-1.mp3" },
          { "id": "14", "name": "Triangle", "url": "https://www.soundjay.com/misc/triangle-1.mp3" },
          { "id": "15", "name": "Tambourine", "url": "https://www.soundjay.com/misc/tambourine-1.mp3" },
          { "id": "16", "name": "Snare Drum", "url": "https://www.soundjay.com/misc/snare-1.mp3" },
          { "id": "17", "name": "Magic Wand", "url": "https://www.soundjay.com/misc/magic-chime-01.mp3" },
          { "id": "18", "name": "Success Chime", "url": "https://www.soundjay.com/misc/success-1.mp3" },
          { "id": "19", "name": "Fail Tone", "url": "https://www.soundjay.com/misc/fail-1.mp3" }
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

        this.el.taskIdxLabel.textContent = this.tasks.length;
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
        const soundObj = this.soundData.find(s => s.id === String(soundId));
        if (soundObj) {
            const audio = new Audio(soundObj.url);
            audio.play().catch(e => console.log("Audio play blocked natively by browser policies. Wait for user interaction.", e));
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new PomodoroApp();
});
