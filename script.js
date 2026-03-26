/**
 * @fileoverview
 * Modern Focus Timer Implementation.
 * Uses ES6 Class syntax for encapsulation, JSDoc for documentation, 
 * and Web Audio API for synthetic, dependency-free audio notification.
 */

class PomodoroTimer {
    /**
     * Initializes a new instance of the Focus Timer, binds DOM elements, 
     * and sets up event listeners and graphics.
     */
    constructor() {
        // Core state
        this.timerId = null;
        this.isRunning = false;
        
        // Default settings
        this.defaultMinutes = 25;
        this.timeLeftSeconds = this.defaultMinutes * 60;
        
        // Visual Progress ring mathematics (Radius = 180 as defined in SVG viewBox)
        this.circleCircumference = 2 * Math.PI * 180;

        // DOM Element References
        this.elements = {
            display: document.getElementById('time-display'),
            startBtn: document.getElementById('start-btn'),
            resetBtn: document.getElementById('reset-btn'),
            timeInput: document.getElementById('custom-time-input'),
            container: document.querySelector('.pomodoro-container'),
            progressCircle: document.getElementById('progress-circle')
        };

        this.init();
    }

    /**
     * Bootstraps the application event listeners and initial UI states.
     */
    init() {
        // Setup initial dash array for the SVG outline
        this.elements.progressCircle.style.strokeDasharray = this.circleCircumference;
        this.elements.progressCircle.style.strokeDashoffset = 0;

        this.bindEvents();
        this.updateDisplay();
    }

    /**
     * Binds internal methods to DOM events.
     */
    bindEvents() {
        this.elements.startBtn.addEventListener('click', () => this.toggleTimer());
        this.elements.resetBtn.addEventListener('click', () => this.resetTimer());
        
        // Listen for user input on the custom time field
        this.elements.timeInput.addEventListener('change', (e) => this.handleTimeInput(e));
    }

    /**
     * Handles changes to the custom time input field.
     * Updates the default duration and resets the timer elegantly.
     * @param {Event} e - The change event from the input field
     */
    handleTimeInput(e) {
        let newMinutes = parseInt(e.target.value, 10);
        
        // Validation: ensures the time is within bounds (1 to 120 minutes)
        if (isNaN(newMinutes) || newMinutes < 1) newMinutes = 1;
        if (newMinutes > 120) newMinutes = 120;
        
        // Update input field safely to reflect possibly clamped values
        e.target.value = newMinutes;
        
        this.defaultMinutes = newMinutes;
        this.resetTimer(); // Apply new time by completely resetting tracking
    }

    /**
     * Renders the current time left onto the HTML DOM, browser tab title,
     * and recalculates/draws the SVG offset logic.
     */
    updateDisplay() {
        // Calculate integers
        const minutes = Math.floor(this.timeLeftSeconds / 60);
        const seconds = this.timeLeftSeconds % 60;
        
        // Format to "MM:SS"
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.elements.display.textContent = formattedTime;
        document.title = `${formattedTime} - Focus Timer`;

        // Mathematical offset calculated for the Circular Ring Progress Bar
        const totalSeconds = this.defaultMinutes * 60;
        const fraction = this.timeLeftSeconds / totalSeconds;
        
        // As time disappears, offset approaches the circumference size, simulating an emptying ring
        const dashOffset = this.circleCircumference - (fraction * this.circleCircumference);
        this.elements.progressCircle.style.strokeDashoffset = dashOffset;
    }

    /**
     * Generates a modern double-beep notification sound natively in the browser.
     * Web Audio API is used to ensure no external MP3 dependencies are required.
     */
    playNotificationSound() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return; // Silent fallback for unsupported legacy browsers
        
        const ctx = new AudioContext();
        
        const triggerBeep = (freq, nextFreq, delay) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // Configuration for a pleasant, non-jarring sine beep
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
            osc.frequency.exponentialRampToValueAtTime(nextFreq, ctx.currentTime + delay + 0.3);
            
            // Amplitude Envelope creation (fade in/out)
            gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
            gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + delay + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.5);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.5);
        };
        
        // Play two beeps sequentially
        triggerBeep(800, 400, 0);       // Immediate Beep
        triggerBeep(600, 300, 0.25);    // Follow up beep 250ms later
    }

    /**
     * Logic executed when the timer hits zero.
     * Triggers sound effect and soft resets the interface.
     */
    finishTimer() {
        clearInterval(this.timerId);
        this.isRunning = false;
        
        // Update UI states explicitly indicating the session completed
        this.elements.startBtn.textContent = 'Start';
        this.elements.startBtn.classList.replace('btn-secondary', 'btn-primary');
        this.elements.container.classList.remove('is-running');
        
        // Trigger notification
        this.playNotificationSound();
        
        // Automatically queue the reset of the UI cleanly
        this.timeLeftSeconds = this.defaultMinutes * 60;
        setTimeout(() => this.updateDisplay(), 1500); // 1.5s delay to visually hold zeroes on-screen
    }

    /**
     * Toggles the timer running state (Start vs Pause).
     */
    toggleTimer() {
        if (this.isRunning) {
            // Initiate Pause Mode
            clearInterval(this.timerId);
            this.elements.startBtn.textContent = 'Resume';
            this.elements.startBtn.classList.replace('btn-secondary', 'btn-primary');
            
            this.elements.container.classList.remove('is-running');
            this.elements.container.classList.add('is-paused');
        } else {
            // Initiate Active Running Mode
            this.timerId = setInterval(() => {
                this.timeLeftSeconds--;
                this.updateDisplay();
                
                if (this.timeLeftSeconds <= 0) {
                    this.finishTimer();
                }
            }, 1000);
            
            this.elements.startBtn.textContent = 'Pause';
            this.elements.startBtn.classList.replace('btn-primary', 'btn-secondary');
            
            this.elements.container.classList.add('is-running');
            this.elements.container.classList.remove('is-paused');
        }
        
        this.isRunning = !this.isRunning;
    }

    /**
     * Hard resets the timer back to its configured default state.
     */
    resetTimer() {
        clearInterval(this.timerId);
        this.isRunning = false;
        
        this.timeLeftSeconds = this.defaultMinutes * 60;
        this.updateDisplay();
        
        // Return button UI states
        this.elements.startBtn.textContent = 'Start';
        this.elements.startBtn.classList.remove('btn-secondary');
        this.elements.startBtn.classList.add('btn-primary');
        
        // Remove conditional modifiers from parent layout
        this.elements.container.classList.remove('is-running', 'is-paused');
    }
}

// Bootstrap application once HTML has fully parsed
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});
