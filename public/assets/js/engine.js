// ========== ENHANCED GAME ENGINE ==========
class GameEngine {
    constructor() {
        this.turn = 0;
        this.maxTurns = 40;
        this.paused = true;
        this.speed = 1;
        this.selectedSpecialist = null;
        this.selectedRegion = null;
        this.eventLog = [];
        this.gameOver = false;
        
        this.regions = JSON.parse(JSON.stringify(REGIONS));
        this.specialists = JSON.parse(JSON.stringify(SPECIALISTS)); // This line was duplicated in the diff, keeping the original JSON.parse version.
        this.activeEvents = []; // This was also duplicated, keeping the original.
        this.predictions = []; // New
        this.globalStats = { pollution: 40, health: 60, economy: 60, stability: 60, sustainability: 45 }; // New
        this.resources = { budget: 1000, power: 500, food: 300 }; // Updated to Food
        this.sdgProgress = 0; // Starts at 0, player must reach 100 to win
        
        this.chatState = { // New
            activeChar: null,
            history: []
        };
        this.introPhase = true;
        this.introIndex = 0;
        this.tutorialStep = 0;
        this.gameInterval = null;
        this.simProgress = 0;
        this.simDate = new Date(2024, 0, 1);
        this.currentMinigame = null;
        
        // Track previous state for interactive dashboard animations
        this.prevResources = { ...this.resources };
        this.prevStats = { progress: 0 };
        
        // Narrative / VN State
        this.narrative = {
            active: false,
            queue: [],
            currentStep: 0,
            isTyping: false,
            typingTimer: null,
            currentEvent: null,
            history: [],
            talkingSprite: null,
            neutralSprite: null,
            talkingFlip: false,
            talkingTimer: null
        };
    }

    startIntro() {
        const screen = document.getElementById('intro-screen');
        screen.style.display = 'flex';
        this.createParticles();
        
        // Character Sprites for Intro
        this.narrative.neutralSprite = "/assets/characters/Hestia/neutral.png";
        this.narrative.talkingSprite = "/assets/characters/Hestia/talk.png";
        
        // Support Space / ESC for Intro
        this._introKeyHandler = (e) => {
            if (e.code === 'Space') this.advanceIntro();
            if (e.code === 'Escape') this.skipIntro();
        };
        window.addEventListener('keydown', this._introKeyHandler);
        
        // Begin text and load sprite shortly after screen appearance
        setTimeout(() => this.typeIntroText(), 400);
    }

    createParticles() {
        const container = document.querySelector('.intro-bg-particles');
        for (let i = 0; i < 40; i++) {
            const p = document.createElement('div');
            p.className = 'intro-particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 8 + 's';
            p.style.animationDuration = (6 + Math.random() * 6) + 's';
            container.appendChild(p);
        }
    }

    typeIntroText() {
        const el = document.getElementById('intro-text');
        const indicator = document.getElementById('intro-next-indicator');
        const text = INTRO_DIALOGUES[this.introIndex];
        
        el.innerHTML = '';
        indicator.classList.remove('visible');
        this.narrative.isTyping = true;
        
        // Character Stage Integration
        this.updateCharacterStage(this.narrative.neutralSprite, 'intro-character-stage');
        const stage = document.getElementById('intro-character-stage');
        const portrait = stage.querySelector('.character-sprite');

        // Character Talking Animation
        if (this.narrative.talkingTimer) clearInterval(this.narrative.talkingTimer);
        if (this.narrative.typingTimer) clearInterval(this.narrative.typingTimer);
        this.narrative.talkingFlip = false;
        
        if (portrait && this.narrative.talkingSprite && this.narrative.talkingSprite !== this.narrative.neutralSprite) {
            this.narrative.talkingTimer = setInterval(() => {
                this.narrative.talkingFlip = !this.narrative.talkingFlip;
                portrait.src = this.narrative.talkingFlip ? this.narrative.talkingSprite : this.narrative.neutralSprite;
            }, 150);
        }

        let i = 0;
        this.narrative.typingTimer = setInterval(() => {
            if (!this.narrative.isTyping) return;
            
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
            } else {
                this.finishIntroTyping();
            }
        }, 20);
    }

    finishIntroTyping() {
        const el = document.getElementById('intro-text');
        const indicator = document.getElementById('intro-next-indicator');
        const stage = document.getElementById('intro-character-stage');
        const portrait = stage.querySelector('.character-sprite');
        const text = INTRO_DIALOGUES[this.introIndex];
        
        this.narrative.isTyping = false;
        clearInterval(this.narrative.typingTimer);
        clearInterval(this.narrative.talkingTimer);
        
        el.textContent = text;
        if (portrait) portrait.src = this.narrative.neutralSprite;
        indicator.classList.add('visible');
    }

    advanceIntro() {
        if (this.narrative.isTyping) {
            this.finishIntroTyping();
            return;
        }

        this.introIndex++;
        if (this.introIndex < INTRO_DIALOGUES.length) {
            this.typeIntroText();
        } else {
            this.endIntro();
        }
    }

    skipIntro() {
        this.endIntro();
    }

    endIntro() {
        const screen = document.getElementById('intro-screen');
        screen.classList.add('fade-out');
        
        // Clean up intro listeners
        window.removeEventListener('keydown', this._introKeyHandler);
        if (this.narrative.talkingTimer) clearInterval(this.narrative.talkingTimer);
        if (this.narrative.typingTimer) clearTimeout(this.narrative.typingTimer);
        this.narrative.isTyping = false;

        // Add cinematic overlay for transition
        const overlay = document.createElement('div');
        overlay.className = 'cinematic-transition-overlay';
        document.body.appendChild(overlay);

        setTimeout(() => {
            screen.style.display = 'none';
            const gameContainer = document.getElementById('game-container');
            gameContainer.classList.add('active');
            gameContainer.classList.add('tutorial-mode'); // Hide HUD initially
            this.introPhase = false;
            
            this.buildUI();
            
            // Remove cinematic overlay after world builds
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 1500);
                this.startGameplayTutorial();
            }, 500);
        }, 1000);
    }

    startGameplayTutorial() {
        this.tutorialActive = true;
        this.narrative.active = true;
        
        const hSprite = "/assets/characters/Hestia/neutral.png";
        const mSprite = "/assets/characters/Manager/neutral.png";

        // Get profile name from localStorage
        const profile = JSON.parse(localStorage.getItem('hestia_active_profile') || '{"name":"Controller"}');
        const playerName = profile.name;

        this.narrative.queue = [
            { name: 'HESTIA', text: `Greetings, ${playerName}. This is Virdis—a world out of balance, and now, your responsibility.`, sprite: hSprite },
            { name: 'HESTIA', text: "As the Controller of the Aegis Initiative, your purpose is simple yet monumental: achieve all 17 Sustainable Development Goals within 40 cycles.", sprite: hSprite },
            { name: 'HESTIA', text: "If the scales tilt too far into chaos, the Golden Age will remain a dream, and Virdis will fall into the void.", sprite: hSprite },
            { name: 'HESTIA', text: "But even a god-appointed arbiter needs a guide on the ground. Meet your primary liaison.", sprite: hSprite },
            { name: 'FIELD MANAGER', text: "Comms active. Controller, I'm the Field Manager. I handle the logistics so you can focus on the big picture.", sprite: mSprite },
            { name: 'FIELD MANAGER', text: "I've initialized the Aegis interface for you. It's empty for now to avoid overwhelm, but let me walk you through the core components.", sprite: mSprite },
            ...TUTORIAL_STEPS.map(step => ({
                name: 'FIELD MANAGER',
                text: `${step.title.toUpperCase()}: ${step.text}`,
                sprite: mSprite
            })),
            { name: 'FIELD MANAGER', text: "The situation in Virdis is deteriorating in several sectors. I'm handing over full system control now. Good luck, Controller.", sprite: mSprite }
        ];
        this.narrative.currentStep = 0;
        
        const overlay = document.getElementById('dialogue-overlay');
        overlay.classList.add('visible');
        
        // Setup trigger
        const trigger = document.getElementById('dialogue-box-trigger');
        trigger.onclick = () => this.advanceNarrative();
        
        // Setup key handler
        if (this._vnKeyHandler) window.removeEventListener('keydown', this._vnKeyHandler);
        this._vnKeyHandler = (e) => {
            if (e.code === 'Space') this.advanceNarrative();
            if (e.code === 'Escape') this.endGameplayTutorial();
        };
        window.addEventListener('keydown', this._vnKeyHandler);
        
        this.processNarrativeStep();
    }

    endGameplayTutorial() {
        this.tutorialActive = false;
        const gameContainer = document.getElementById('game-container');
        gameContainer.classList.remove('tutorial-mode'); // Show HUD
        this.endNarrative();
        this.startGame();
    }

    showTutorial() {
        this.tutorialStep = 0;
        const overlay = document.getElementById('tutorial-overlay');
        overlay.classList.add('visible');
        this.renderTutorialStep();
    }

    renderTutorialStep() {
        const step = TUTORIAL_STEPS[this.tutorialStep];
        const iconEl = document.getElementById('tutorial-icon');
        if (step.icon.startsWith('fa')) {
            iconEl.innerHTML = `<i class="${step.icon}"></i>`;
        } else {
            iconEl.textContent = step.icon;
        }
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.text;
        const dots = document.querySelectorAll('.tutorial-dot');
        dots.forEach((d, i) => {
            d.className = 'tutorial-dot' + (i < this.tutorialStep ? ' done' : i === this.tutorialStep ? ' active' : '');
        });
        document.getElementById('tutorial-next-btn').textContent = this.tutorialStep < TUTORIAL_STEPS.length - 1 ? 'NEXT' : 'START 40 TURNS';
    }

    nextTutorial() {
        this.tutorialStep++;
        if (this.tutorialStep >= TUTORIAL_STEPS.length) {
            document.getElementById('tutorial-overlay').classList.remove('visible');
            this.startGame();
        } else {
            this.renderTutorialStep();
        }
    }

    skipTutorial() {
        document.getElementById('tutorial-overlay').classList.remove('visible');
        this.startGame();
    }

    startGame() {
        this.turn = 1;
        this.paused = false;
        this.updateAllUI();
        this.generateEvent();
        this.startTimer();
    }

    startTimer() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        this.gameInterval = setInterval(() => {
            if (!this.paused && !this.gameOver) {
                // Adjust speed: roughly 1.5s per day at 1x
                const step = (50 / (1500 / this.speed)) * 100;
                this.simProgress += step;
                if (this.simProgress >= 100) {
                    this.simProgress = 0;
                    
                    const oldMonth = this.simDate.getMonth();
                    this.simDate.setDate(this.simDate.getDate() + 1);
                    
                    // If month changed, trigger next turn
                    if (this.simDate.getMonth() !== oldMonth) {
                        this.nextTurn();
                    }
                }
                this.updateSimUI();
            }
        }, 50);
    }

    updateSimUI() {
        const fill = document.getElementById('sim-progress-fill');
        const dateEl = document.getElementById('sim-date');
        if (fill) fill.style.width = `${this.simProgress}%`;
        if (dateEl) {
            dateEl.textContent = this.simDate.toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
            });
        }
    }

    setSpeed(s) {
        if (s === 0) {
            this.paused = true;
        } else {
            this.paused = false;
            this.speed = s;
            this.startTimer();
        }
        
        // Update UI
        document.querySelectorAll('.sim-speed-btn').forEach(b => b.classList.remove('active'));
        if (s === 0) document.getElementById('sim-pause').classList.add('active');
        else if (s === 1) document.getElementById('sim-speed-1').classList.add('active');
        else if (s === 2) document.getElementById('sim-speed-2').classList.add('active');
        else if (s === 3) document.getElementById('sim-speed-3').classList.add('active');
    }

    buildUI() {
        this.renderSpecialists();
        this.renderRegions();
        this.updateAllUI(true); // first run immediate
    }

    updateAllUI(immediate = false) {
        this.renderSpecialists();
        this.renderRegions();
        this.renderEvents();
        
        // Resources
        const resMap = {
            'res-money-val': { val: this.resources.budget, prev: this.prevResources.budget, parent: 'res-money' },
            'res-power-val': { val: this.resources.power, prev: this.prevResources.power, parent: 'res-power' },
            'res-food-val': { val: this.resources.food, prev: this.prevResources.food, parent: 'res-food' }
        };

        Object.entries(resMap).forEach(([id, data]) => {
            const el = document.getElementById(id);
            if (el) {
                if (immediate) el.textContent = data.val;
                else this.animateValue(el, data.prev, data.val, 800);
            }
            
            const parent = document.getElementById(data.parent);
            if (parent && data.val !== data.prev) {
                const diffClass = data.val > data.prev ? 'res-update-up' : 'res-update-down';
                parent.classList.add(diffClass);
                setTimeout(() => parent.classList.remove(diffClass), 1000);
            }
        });
        this.prevResources = { ...this.resources };
        
        // Stats
        const gs = this.getGlobalStats();
        const sdg = this.getSDGScore();
// document.getElementById('turn-counter').textContent = `Turn ${this.turn}/${this.maxTurns}`;
        
        const statsMap = {
            'sdg': { val: sdg, prev: this.prevStats.progress }
        };

        Object.entries(statsMap).forEach(([id, data]) => {
            const bar = document.getElementById(id + '-bar') || document.getElementById(id + '-fill');
            const valEl = document.getElementById(id + '-val') || document.getElementById(id + '-value');
            
            if (bar) bar.style.width = data.val + '%';
            if (valEl) {
                const suffix = id === 'sdg' ? '%' : '';
                if (immediate) valEl.textContent = data.val + suffix;
                else this.animateValue(valEl, data.prev, data.val, 800, suffix);
            }

            if (data.val !== data.prev) {
                const isBetter = data.isInverse ? data.val < data.prev : data.val > data.prev;
                const flashClass = isBetter ? 'stat-flash-success' : 'stat-flash-danger';
                const parent = bar.parentElement;
                parent.classList.add(flashClass);
                setTimeout(() => parent.classList.remove(flashClass), 1000);
            }
        });

        this.prevStats.progress = sdg;
    }

    animateValue(obj, start, end, duration, suffix = "") {
        if (start === end) {
            obj.textContent = end + suffix;
            return;
        }
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.textContent = Math.floor(progress * (end - start) + start) + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = end + suffix; // ensure exact final value
            }
        };
        window.requestAnimationFrame(step);
    }

    renderSpecialists() {
        const container = document.getElementById('specialist-list');
        container.innerHTML = '';
        this.specialists.forEach(s => {
            const card = document.createElement('div');
            card.className = 'specialist-card' + (s.cooldown > 0 ? ' on-cooldown' : '') + (s.deployed ? ' deployed' : '') + (this.selectedSpecialist === s.id ? ' selected' : '');
            card.onclick = () => this.openSpecModal(s.id);
            
            let avatarHTML = '';
            if (s.img) {
                avatarHTML = `<img class="specialist-avatar" src="${s.img}">`;
            } else if (s.emoji.endsWith('.svg')) {
                avatarHTML = `<img class="specialist-avatar-emoji hestia-icon-gold" src="${s.emoji}">`;
            } else if (s.emoji.includes('fa-')) {
                avatarHTML = `<div class="specialist-avatar-emoji"><i class="${s.emoji}"></i></div>`;
            } else {
                avatarHTML = `<div class="specialist-avatar-emoji">${s.emoji}</div>`;
            }
            card.innerHTML = `${avatarHTML}
                <div class="specialist-info">
                    <div class="specialist-name">${s.name}</div>
                    <div class="specialist-role">${s.role}</div>
                    <div class="specialist-sdg">${s.sdg}</div>
                </div>
                <span class="specialist-status ${s.cooldown > 0 ? 'cooldown' : s.deployed ? 'deployed' : 'ready'}">${s.cooldown > 0 ? 'CD:'+s.cooldown : s.deployed ? 'Active' : 'Ready'}</span>`;
            container.appendChild(card);
        });
    }

    openSpecModal(id) {
        const s = this.specialists.find(sp => sp.id === id);
        if (!s) return;

        document.getElementById('sm-name').textContent = s.name;
        document.getElementById('sm-role').textContent = s.role;
        document.getElementById('sm-desc').textContent = s.desc;
        document.getElementById('sm-sdg').textContent = s.sdg;
        
        const portrait = document.getElementById('sm-img');
        portrait.src = s.img || '';
        portrait.style.display = s.img ? 'block' : 'none';

        // Stats
        if (s.baseStats) {
            document.getElementById('sm-int').textContent = s.baseStats.int;
            document.getElementById('sm-per').textContent = s.baseStats.per;
            document.getElementById('sm-lea').textContent = s.baseStats.lea;
            document.getElementById('sm-res').textContent = s.baseStats.res;
        }

        // Pros/Cons
        const prosList = document.getElementById('sm-pros');
        prosList.innerHTML = '';
        (s.pros || []).forEach(p => {
            const li = document.createElement('li'); li.textContent = p;
            prosList.appendChild(li);
        });

        const consList = document.getElementById('sm-cons');
        consList.innerHTML = '';
        (s.cons || []).forEach(c => {
            const li = document.createElement('li'); li.textContent = c;
            consList.appendChild(li);
        });

        // Detailed Requirements
        const isDeployed = s.isDeployed;
        document.getElementById('sm-deploy-cost').innerHTML = isDeployed ? 
            `<span style="color:var(--accent-gold); font-family:'Cinzel', serif; letter-spacing:1px; font-weight:700;">ACTIVE ASSET</span>` : 
            `<span class="sm-cost-val">$${s.deploymentCost}B</span> (Activation)`;
            
        document.getElementById('sm-maint-cost').innerHTML = isDeployed ? 
            `<span class="sm-cost-val">$${s.maintenance}B</span> (Service Fee)` : 
            `<span class="sm-cost-val">$${s.maintenance}B</span> (Per Mission)`;

        // Action Costs Row
        const costsRow = document.getElementById('sm-costs');
        costsRow.innerHTML = '';
        Object.entries(s.costs).forEach(([k, v]) => {
            const item = document.createElement('div');
            item.className = 'sm-cost-item';
            let unit = k === 'budget' ? 'B' : (k === 'power' ? 'P' : 'Mt');
            let iconHTML = '';
            if (k === 'budget') iconHTML = `<img src="/assets/icons/world_bank.svg" class="hestia-icon-small hestia-icon-gold">`;
            else if (k === 'power') iconHTML = `<img src="/assets/icons/energy.svg" class="hestia-icon-small">`;
            else iconHTML = `<i class="fas fa-apple-whole" style="font-size:0.8em; color:var(--accent-influence)"></i>`;

            let label = k === 'budget' ? 'Budget' : (k === 'power' ? 'Energy' : 'Food');
            item.innerHTML = `
                <span class="sm-cost-icon">${iconHTML}</span> 
                <span class="sm-cost-label">${label}</span>: 
                <span class="sm-cost-val">${k === 'budget' ? '$' : ''}${v}${unit}</span>
            `;
            costsRow.appendChild(item);
        });

        // Setup Buttons
        document.getElementById('sm-chat-btn').onclick = () => {
            this.openChat(s);
        };

        document.getElementById('spec-modal-overlay').classList.add('visible');
    }

    // ========== CHARACTER CHAT (GEMINI) ==========
    openChat(spec) {
        this.chatState.activeChar = spec;
        this.chatState.history = []; 
        
        document.getElementById('chat-overlay').style.display = 'flex';
        document.getElementById('chat-name').textContent = spec.name;
        document.getElementById('chat-portrait').src = spec.img;
        document.getElementById('chat-messages').innerHTML = '';
        
        // Get character-specific greeting
        const pers = window.HESTIA_PERSONALITIES[spec.id];
        const greeting = pers ? pers.greeting : `Commander, this is ${spec.name}. How can I assist?`;
        
        this.addChatMessage('char', greeting);
    }

    closeChat() {
        document.getElementById('chat-overlay').style.display = 'none';
        this.chatState.activeChar = null;
    }

    addChatMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${sender === 'char' ? 'msg-char' : 'msg-user'}`;
        msgDiv.textContent = text;
        const container = document.getElementById('chat-messages');
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !this.chatState.activeChar) return;

        this.addChatMessage('user', text);
        input.value = '';

        // Show typing indicator
        const typingId = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.id = typingId;
        msgDiv.className = 'msg msg-char typing';
        msgDiv.innerHTML = '<span></span><span></span><span></span>';
        const container = document.getElementById('chat-messages');
        container.appendChild(msgDiv);
        container.scrollTop = container.scrollHeight;

        try {
            const personaPrompt = this.getPersonaPrompt(this.chatState.activeChar);
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    specialistName: this.chatState.activeChar.name,
                    role: this.chatState.activeChar.role,
                    persona: personaPrompt,
                    message: text
                })
            });

            // Remove typing indicator
            const indicator = document.getElementById(typingId);
            if (indicator) indicator.remove();

            if (!response.ok) {
                const errText = await response.text();
                let errMsg = "Neural bridge disruption.";
                try {
                    const errObj = JSON.parse(errText);
                    errMsg = errObj.error || errMsg;
                } catch(e) { /* use default */ }
                this.addChatMessage('char', `[COMMS DISRUPTED: ${errMsg}]`);
                return;
            }

            const data = await response.json();
            this.addChatMessage('char', data.text || "No signal detected.");
        } catch (err) {
            const indicator = document.getElementById(typingId);
            if (indicator) indicator.remove();
            
            this.addChatMessage('char', "[SIGNAL LOST: Neural bridge offline.]");
            console.error('Frontend Chat Error:', err);
        }
    }

    getPersonaPrompt(spec) {
        const pers = window.HESTIA_PERSONALITIES[spec.id] || {};
        const allSpecsInfo = this.specialists.map(s => `${s.name} (${s.role}, specialized in ${s.sdg})`).join(', ');
        
        return `
            # IDENTITY: ${spec.name}
            # ROLE: ${spec.role} within the HESTIA World Government.
            
            # PERSONALITY & BACKGROUND:
            - TRAITS: ${pers.traits}
            - BACKSTORY: ${pers.backstory}
            - VOICE/STYLE: ${pers.style}
            - DIALOGUE EXAMPLES: ${pers.dialogue_examples}
            
            # CORE MISSION (CRITICAL):
            - YOU ARE THE GUARDIAN OF: ${spec.sdg}.
            - EDUCATIONAL GOAL: Teach the user about ${spec.sdg} (why it exists, its importance, how it works) in a GAMIFIED, NARRATIVE way.
            - NO AI SLOP: Never use phrases like "As an AI..." or "I am programmed to help...". 
            - NO STAGE DIRECTIONS: Do not include narrative descriptions of actions like "*sighs*", "*looks up*", or bracketed actions.
            - DIRECT DIALOGUE ONLY: Respond ONLY with the spoken words of the character. 
            - CONCISENESS (CRITICAL): Limit your response to 2 or 3 impactful sentences maximum. 
            - NO SUGARCOATING: You aren't a helpful assistant; you are a complex person in a collapsing world. Respond with your unique flaws, weary tone, or haughty attitude as defined.
            - REALISM: Refer to your "Service Fee" or activation stats if relevant to the conversation.
            
            # DOMAIN KNOWLEDGE:
            - If the user asks about an SDG that IS NOT yours, give a very brief hint but redirect them to the expert.
            - EXPERTS: ${allSpecsInfo}.
            
            Stay strictly in character. Talk like a person in high command. Respond ONLY with direct spoken dialogue in 2 or 3 sentences maximum.
        `.trim();
    }

    closeSpecModal() {
        document.getElementById('spec-modal-overlay').classList.remove('visible');
    }

    renderRegions() {
        const wrapper = document.getElementById('map-wrapper');
        document.querySelectorAll('.region-overlay').forEach(el => el.remove());
        this.regions.forEach(r => {
            const div = document.createElement('div');
            div.className = 'region-overlay ' + this.getRegionStatusClass(r) + (this.selectedRegion === r.id ? ' selected' : '');
            div.style.cssText = `left:${r.x};top:${r.y};width:${r.w};height:${r.h};`;
            div.onclick = (e) => { e.stopPropagation(); this.selectRegion(r.id); };
            let icons = r.crisis ? '<span class="region-crisis-icon"><i class="fas fa-triangle-exclamation"></i></span>' : '';
            div.innerHTML = `<div class="region-label">${r.name}</div><div class="region-icons">${icons}</div>`;
            wrapper.appendChild(div);
        });
    }

    getRegionStatusClass(r) {
        const avg = (r.stats.health + r.stats.economy + r.stats.stability + (100 - r.stats.pollution)) / 4;
        if (avg >= 65) return 'status-stable';
        if (avg >= 45) return 'status-warning';
        return 'status-crisis';
    }

    selectSpecialist(id) {
        if (this.selectedSpecialist === id) this.selectedSpecialist = null;
        else this.selectedSpecialist = id;
        this.updateAllUI();
    }

    selectRegion(id) {
        this.selectedRegion = id;
        if (this.selectedSpecialist) {
            this.tryDeploySpecialist(this.selectedSpecialist, id);
        } else {
            this.showRegionInfo(this.regions.find(r => r.id === id));
        }
        this.updateAllUI();
    }

    // ---- ACTIONS ----
    tryDeploySpecialist(specId, regionId) {
        const s = this.specialists.find(sp => sp.id === specId);
        const r = this.regions.find(rg => rg.id === regionId);
        
        // --- Deployment Mechanics ---
        // First-time deployment uses s.deploymentCost. 
        // Subsequent missions use s.maintenance instead of s.costs.budget.
        const isFirstTime = !s.isDeployed;
        const capitalCost = isFirstTime ? s.deploymentCost : s.maintenance;
        const otherCosts = { ...s.costs };
        // If we use maintenance, we don't pay the mission's base budget cost again
        if (!isFirstTime) delete otherCosts.budget; 

        // Resource check
        if (this.resources.budget < capitalCost + (otherCosts.budget || 0)) { 
            this.showToast('danger', 'Insufficient World Bank Reserves!'); return; 
        }
        if (otherCosts.power && this.resources.power < otherCosts.power) { 
            this.showToast('danger', 'Insufficient Energy Grid Capacity!'); return; 
        }
        if (otherCosts.food && this.resources.food < otherCosts.food) { 
            this.showToast('danger', 'Insufficient Global Food Supply!'); return; 
        }

        if (s.condition === 'conflict' && !r.crisis) { this.showToast('warning', 'War Commander requires conflict!'); return; }
        if (s.condition === 'stable' && (r.stats.stability < 50)) { this.showToast('warning', 'Scientist requires stability!'); return; }

        // Deduct resources
        this.resources.budget -= (capitalCost + (otherCosts.budget || 0));
        if (otherCosts.power) this.resources.power -= otherCosts.power;
        if (otherCosts.food) this.resources.food -= otherCosts.food;

        s.isDeployed = true; // Mark as permanent asset
        s.deployed = regionId;
        s.cooldown = s.cooldownMax;
        
        Object.entries(s.statBoost).forEach(([k, v]) => r.stats[k] = this.clamp(r.stats[k] + v));
        this.showToast('success', `${s.name} deployed to ${r.name}`);
        this.addLog(`${s.name} intervened in ${r.name}`);
        this.selectedSpecialist = null;
        this.updateAllUI();
    }

    showRegionInfo(r) {
        const panel = document.getElementById('region-info');
        
        // Calculate center of region overlay (percentages)
        const centerX = parseFloat(r.x) + parseFloat(r.w) / 2;
        const centerY = parseFloat(r.y) + parseFloat(r.h) / 2;
        
        panel.style.left = centerX + '%';
        panel.style.top = centerY + '%';
        
        // Smart positioning: detect screen edges to prevent clipping
        panel.classList.remove('pos-bottom', 'pos-left', 'pos-right');
        
        if (centerY < 45) {
            panel.classList.add('pos-bottom');
        }
        
        if (centerX < 30) {
            panel.classList.add('pos-left');
        } else if (centerX > 70) {
            panel.classList.add('pos-right');
        }
        
        panel.classList.add('visible');
        document.getElementById('ri-name').textContent = r.name;
        document.getElementById('ri-gov').textContent = r.gov.toUpperCase();
        document.getElementById('ri-gov').className = 'region-info-gov ' + r.gov;
        document.getElementById('ri-leader').textContent = `Leader: ${r.leader}`;
        document.getElementById('ri-personality').textContent = r.leaderPersonality;
        
        ['pollution','health','economy','stability','sustainability'].forEach(s => {
            const valEl = document.getElementById('ri-'+s+'-val');
            const barEl = document.getElementById('ri-'+s+'-bar');
            if (valEl) valEl.textContent = r.stats[s];
            if (barEl) barEl.style.width = r.stats[s] + '%';
        });

        const moreBtn = document.getElementById('ri-more-btn');
        if (moreBtn) moreBtn.onclick = () => this.openDetailedModal(r.id);

        const actionsEl = document.getElementById('ri-actions');
        actionsEl.innerHTML = '';
        const actions = [
            { text: 'Aid Grant (-$30B)', type: 'aid', cost:{budget:30}, effects:{health:10, economy:-5} },
            { text: 'Sanction (-20P)', type: 'sanction', cost:{power:20}, effects:{stability:5, economy:-10} }
        ];
        actions.forEach(a => {
            const btn = document.createElement('button');
            btn.className = `region-action-btn btn-${a.type}`;
            btn.textContent = a.text;
            btn.onclick = () => this.applyQuickAction(r.id, a);
            actionsEl.appendChild(btn);
        });
    }

    applyQuickAction(regionId, action) {
        if (action.cost.budget && this.resources.budget < action.cost.budget) { this.showToast('danger', 'Insufficient World Bank Reserves!'); return; }
        if (action.cost.power && this.resources.power < action.cost.power) { this.showToast('danger', 'Insufficient Energy Grid Capacity!'); return; }
        
        this.resources.budget -= (action.cost.budget || 0);
        this.resources.power -= (action.cost.power || 0);
        
        const r = this.regions.find(rg => rg.id === regionId);
        Object.entries(action.effects).forEach(([k,v]) => r.stats[k] = this.clamp(r.stats[k] + v));
        this.showToast('info', 'Action applied');
        this.updateAllUI();
    }

    openDetailedModal(regionId) {
        const r = this.regions.find(rg => rg.id === regionId);
        if (!r) return;

        const modal = document.getElementById('detailed-country-modal');
        modal.classList.add('visible');
        modal.style.display = 'flex';

        const d = r.details || {};

        // --- Header ---
        document.getElementById('dm-flag').src = `/assets/countries/${encodeURIComponent(r.name)}/FLAG.jpeg`;
        document.getElementById('dm-name').textContent = r.name;
        document.getElementById('dm-leader').textContent = r.leader;
        document.getElementById('dm-leader-desc').textContent = r.leaderPersonality;
        
        const govBadge = document.getElementById('dm-gov-detailed');
        govBadge.textContent = r.gov.toUpperCase();
        govBadge.className = 'dm-gov-badge dm-gov-' + r.gov;

        // Status tag based on crisis
        const statusTag = document.getElementById('dm-status-tag');
        if (r.crisis) {
            statusTag.innerHTML = '<span class="dm-status-dot crisis"></span>CRISIS';
            statusTag.className = 'dm-status-indicator crisis';
        } else {
            const avg = (r.stats.health + r.stats.economy + r.stats.stability + (100 - r.stats.pollution)) / 4;
            if (avg >= 60) {
                statusTag.innerHTML = '<span class="dm-status-dot stable"></span>STABLE';
                statusTag.className = 'dm-status-indicator stable';
            } else {
                statusTag.innerHTML = '<span class="dm-status-dot warning"></span>AT RISK';
                statusTag.className = 'dm-status-indicator warning';
            }
        }

        document.getElementById('dm-pop').textContent = d.population || '—';
        document.getElementById('dm-gdp').textContent = d.gdp || '—';
        document.getElementById('dm-growth').textContent = d.growth || '—';
        document.getElementById('dm-turn-info').textContent = `TURN ${this.turn} / ${this.maxTurns}`;

        // --- Overview Tab ---
        document.getElementById('dm-info').textContent = d.info || 'No intelligence available.';

        // Regional Vitals
        const vitalsContainer = document.getElementById('dm-vitals');
        vitalsContainer.innerHTML = '';
        const statColors = {
            pollution: { label: 'Pollution', color: '#ff4d4d', icon: '/assets/icons/pollution.svg', isSVG: true, invert: true },
            health: { label: 'Health', color: '#4dff88', icon: '/assets/icons/health.svg', isSVG: true, invert: false },
            economy: { label: 'Economy', color: '#e8a44a', icon: '/assets/icons/economy.svg', isSVG: true, invert: false },
            stability: { label: 'Stability', color: '#ffcc00', icon: '/assets/icons/stability.svg', isSVG: true, invert: false },
            sustainability: { label: 'Sustainability', color: '#f1c27d', icon: 'fas fa-leaf', isSVG: false, invert: false }
        };
        Object.entries(statColors).forEach(([key, meta]) => {
            const val = r.stats[key] || 0;
            const item = document.createElement('div');
            item.className = 'dm-vital-item';
            let iconHTML = meta.isSVG ? `<img src="${meta.icon}" class="hestia-icon-small" style="filter: brightness(0) saturate(100%) invert(1);">` : `<i class="${meta.icon}" style="color:${meta.color}"></i>`;
            item.innerHTML = `
                <div class="dm-vital-header">
                    <span class="dm-vital-icon">${iconHTML}</span>
                    <span class="dm-vital-label">${meta.label}</span>
                    <span class="dm-vital-value" style="color:${meta.color}">${val}</span>
                </div>
                <div class="dm-vital-bar-track">
                    <div class="dm-vital-bar-fill" style="width:${val}%;background:${meta.color};box-shadow:0 0 8px ${meta.color}40"></div>
                </div>
            `;
            vitalsContainer.appendChild(item);
        });

        // Strategic Assessment
        const assessContainer = document.getElementById('dm-assessment');
        assessContainer.innerHTML = '';
        const strengths = [];
        const threats = [];
        if (r.stats.economy >= 60) strengths.push('Strong economic base');
        if (r.stats.health >= 60) strengths.push('Robust healthcare system');
        if (r.stats.stability >= 65) strengths.push('Political stability');
        if (r.stats.sustainability >= 50) strengths.push('Sustainability initiatives');
        if (r.stats.pollution <= 30) strengths.push('Low pollution levels');
        if (r.stats.pollution >= 50) threats.push('Critical pollution levels');
        if (r.stats.health < 50) threats.push('Healthcare system failing');
        if (r.stats.stability < 40) threats.push('Political instability');
        if (r.stats.economy < 45) threats.push('Economic decline');
        if (r.crisis) threats.push(`Active crisis: ${r.crisis}`);
        if (strengths.length === 0) strengths.push('No significant advantages detected');
        if (threats.length === 0) threats.push('No immediate threats');

        assessContainer.innerHTML = `
            <div class="dm-assess-section">
                <div class="dm-assess-label good"><i class="fas fa-arrow-up"></i> STRENGTHS</div>
                ${strengths.map(s => `<div class="dm-assess-item good">${s}</div>`).join('')}
            </div>
            <div class="dm-assess-section">
                <div class="dm-assess-label bad"><i class="fas fa-exclamation-triangle"></i> THREATS</div>
                ${threats.map(t => `<div class="dm-assess-item bad">${t}</div>`).join('')}
            </div>
        `;

        // --- History Tab ---
        document.getElementById('dm-history').textContent = d.history || 'Archival records are unavailable.';
        document.getElementById('dm-philosophy').textContent = d.philosophy || 'No governing philosophy on record.';
        document.getElementById('dm-gov-system').textContent = d.govSystem || r.gov.toUpperCase();
        document.getElementById('dm-econ-model').textContent = d.econModel || 'Unknown';

        // --- SDG Tab ---
        const SDG_DESCRIPTIONS = {
            'SDG 1': 'End poverty in all its forms everywhere.',
            'SDG 2': 'End hunger, achieve food security and improved nutrition.',
            'SDG 3': 'Ensure healthy lives and promote well-being for all ages.',
            'SDG 4': 'Ensure inclusive and equitable quality education.',
            'SDG 5': 'Achieve gender equality and empower all women and girls.',
            'SDG 6': 'Ensure availability and sustainable management of water.',
            'SDG 7': 'Ensure access to affordable, reliable, sustainable energy.',
            'SDG 8': 'Promote sustained, inclusive economic growth and decent work.',
            'SDG 9': 'Build resilient infrastructure, promote inclusive industrialization.',
            'SDG 10': 'Reduce inequality within and among countries.',
            'SDG 11': 'Make cities and settlements inclusive, safe, and sustainable.',
            'SDG 12': 'Ensure sustainable consumption and production patterns.',
            'SDG 13': 'Take urgent action to combat climate change.',
            'SDG 14': 'Conserve and sustainably use oceans, seas, and marine resources.',
            'SDG 15': 'Protect, restore, and promote sustainable use of land ecosystems.',
            'SDG 16': 'Promote peaceful and inclusive societies for sustainable development.',
            'SDG 17': 'Strengthen the means of implementation and revitalize partnerships.'
        };

        const SDG_ICONS = {
            'SDG 1': 'fas fa-house-crack', 'SDG 2': 'fas fa-wheat-awn', 'SDG 3': 'fas fa-staff-aesculapius', 'SDG 4': 'fas fa-book-open',
            'SDG 5': 'fas fa-venus-mars', 'SDG 6': 'fas fa-droplet', 'SDG 7': 'fas fa-bolt-lightning', 'SDG 8': 'fas fa-chart-line',
            'SDG 9': 'fas fa-industry', 'SDG 10': 'fas fa-scale-balanced', 'SDG 11': 'fas fa-city', 'SDG 12': 'fas fa-recycle',
            'SDG 13': 'fas fa-temperature-full', 'SDG 14': 'fas fa-fish-fins', 'SDG 15': 'fas fa-tree', 'SDG 16': 'fas fa-dove',
            'SDG 17': 'fas fa-handshake'
        };

        const achievedContainer = document.getElementById('dm-sdg-achieved');
        achievedContainer.innerHTML = '';
        (d.sdg_achieved || []).forEach(sdg => {
            const sdgKey = sdg.match(/SDG \d+/)?.[0] || '';
            const card = document.createElement('div');
            card.className = 'dm-sdg-card achieved';
            card.innerHTML = `
                <div class="dm-sdg-card-icon"><i class="${SDG_ICONS[sdgKey] || 'fas fa-circle-check'}"></i></div>
                <div class="dm-sdg-card-content">
                    <div class="dm-sdg-card-title">${sdg}</div>
                    <div class="dm-sdg-card-desc">${SDG_DESCRIPTIONS[sdgKey] || ''}</div>
                </div>
                <div class="dm-sdg-badge achieved">ACHIEVED</div>
            `;
            achievedContainer.appendChild(card);
        });

        const goalsContainer = document.getElementById('dm-sdg-goals');
        goalsContainer.innerHTML = '';
        (d.sdg_goals || []).forEach(sdg => {
            const sdgKey = sdg.match(/SDG \d+/)?.[0] || '';
            const card = document.createElement('div');
            card.className = 'dm-sdg-card active';
            card.innerHTML = `
                <div class="dm-sdg-card-icon"><i class="${SDG_ICONS[sdgKey] || 'fas fa-bullseye'}"></i></div>
                <div class="dm-sdg-card-content">
                    <div class="dm-sdg-card-title">${sdg}</div>
                    <div class="dm-sdg-card-desc">${SDG_DESCRIPTIONS[sdgKey] || ''}</div>
                </div>
                <div class="dm-sdg-badge active">IN PROGRESS</div>
            `;
            goalsContainer.appendChild(card);
        });

        document.getElementById('dm-sdg-notes').textContent = d.sdg_notes || 'No strategic analysis available.';

        // --- Policies Tab ---
        const policiesContainer = document.getElementById('dm-policies');
        policiesContainer.innerHTML = '';
        (d.policies || []).forEach(p => {
            const typeIcons = { energy: 'fas fa-bolt', social: 'fas fa-users-gear', defense: 'fas fa-shield-halved', trade: 'fas fa-box-open' };
            const statusColors = { active: 'var(--accent-gold)', achieved: 'var(--accent-green)', failed: 'var(--accent-red)', stalled: 'var(--accent-yellow)' };
            const el = document.createElement('div');
            el.className = 'dm-policy-item';
            el.innerHTML = `
                <div class="dm-policy-icon"><i class="${typeIcons[p.type] || 'fas fa-clipboard-list'}"></i></div>
                <div class="dm-policy-info">
                    <div class="dm-policy-name">${p.name}</div>
                    <div class="dm-policy-desc">${p.desc}</div>
                </div>
                <div class="dm-policy-status" style="color:${statusColors[p.status] || '#fff'}">${p.status.toUpperCase()}</div>
            `;
            policiesContainer.appendChild(el);
        });

        // Diplomatic Relations
        const relationsContainer = document.getElementById('dm-relations');
        relationsContainer.innerHTML = '';
        (d.relations || []).forEach(rel => {
            const statusColors = { allied: '#4dff88', trade: '#f1c27d', neutral: '#ffcc00', tense: '#ff9f4d', hostile: '#ff3366' };
            const statusIcons = { allied: 'fas fa-handshake', trade: 'fas fa-box-open', neutral: 'fas fa-minus', tense: 'fas fa-triangle-exclamation', hostile: 'fas fa-shield-halved' };
            const el = document.createElement('div');
            el.className = 'dm-relation-item';
            el.innerHTML = `
                <div class="dm-relation-header">
                    <span class="dm-relation-icon"><i class="${statusIcons[rel.status] || 'fas fa-question'}"></i></span>
                    <span class="dm-relation-name">${rel.region}</span>
                    <span class="dm-relation-status" style="color:${statusColors[rel.status]}">${rel.status.toUpperCase()}</span>
                </div>
                <div class="dm-relation-desc">${rel.desc}</div>
            `;
            relationsContainer.appendChild(el);
        });

        // Economic Profile
        const econGrid = document.getElementById('dm-econ-grid');
        econGrid.innerHTML = '';
        const ep = d.econProfile || {};
        const econItems = [
            { label: 'Trade Balance', value: ep.tradeBalance || '—', icon: 'fas fa-chart-pie' },
            { label: 'Primary Exports', value: ep.exports || '—', icon: 'fas fa-box' },
            { label: 'Major Industries', value: ep.industries || '—', icon: 'fas fa-industry' },
            { label: 'National Debt', value: ep.debt || '—', icon: 'fas fa-credit-card' },
            { label: 'Unemployment', value: ep.unemployment || '—', icon: 'fas fa-user-slash' },
            { label: 'Gini Index', value: ep.giniIndex || '—', icon: 'fas fa-scale-unbalanced' }
        ];
        econItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'dm-econ-item';
            el.innerHTML = `
                <div class="dm-econ-icon">${item.icon}</div>
                <div class="dm-econ-label">${item.label}</div>
                <div class="dm-econ-value">${item.value}</div>
            `;
            econGrid.appendChild(el);
        });

        // Reset to Overview tab
        this.switchDossierTab('overview');
        this.closeRegionInfo();
    }

    switchDossierTab(tabId) {
        document.querySelectorAll('.dm-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.dm-tab-panel').forEach(p => p.classList.remove('active'));
        
        const tab = document.querySelector(`.dm-tab[data-tab="${tabId}"]`);
        const panel = document.getElementById(`dm-panel-${tabId}`);
        if (tab) tab.classList.add('active');
        if (panel) panel.classList.add('active');
    }

    closeDetailedModal() {
        document.getElementById('detailed-country-modal').style.display = 'none';
        document.getElementById('detailed-country-modal').classList.remove('visible');
    }

    closeRegionInfo() {
        document.getElementById('region-info').classList.remove('visible');
        this.selectedRegion = null;
        this.updateAllUI();
    }

    // ---- TURN LOGIC ----
    nextTurn() {
        if (this.gameOver || this.turn >= this.maxTurns) { this.checkGameState(); return; }
        this.turn++;
        
        // Passive recovery and drain
        this.resources.budget += 40;
        this.resources.power += 15;
        this.resources.food += 10;
        
        this.regions.forEach(r => {
            const beh = GOV_BEHAVIORS[r.gov] || GOV_BEHAVIORS.democratic;
            r.stats.stability = this.clamp(r.stats.stability + beh.stabilityMod * 100);
            if (r.crisis) {
                r.stats.stability -= 3;
                r.stats.health -= 2;
                if (Math.random() < 0.2) this.spreadCrisis(r);
            }
        });
        
        this.specialists.forEach(s => { 
            if (s.cooldown > 0) s.cooldown--; 
            s.deployed = null;
            // Recurring maintenance for all deployed assets
            if (s.isDeployed && this.resources.budget >= s.maintenance) {
                this.resources.budget -= s.maintenance;
            } else if (s.isDeployed) {
                // Out of budget - specialist temporary offline/reset?
                this.showToast('warning', `Maintenance failed for ${s.name}.`);
            }
        });
        
        this.generateEvent();
        this.updateAllUI();
    }

    spreadCrisis(r) {
        const next = this.regions.find(rg => r.connections.includes(rg.id) && !rg.crisis);
        if (next) {
            next.crisis = r.crisis;
            this.showToast('danger', `${r.crisis} spread to ${next.name}!`);
        }
    }



    generateEvent() {
        const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
        const region = this.regions[Math.floor(Math.random() * this.regions.length)];
        const event = { ...template, id: Date.now(), regionId: region.id, title: template.title.replace('{region}', region.name) };
        this.activeEvents.unshift(event);
        if (this.activeEvents.length > 5) this.activeEvents.pop();
        this.renderEvents();
    }

    renderEvents() {
        const container = document.getElementById('events-list');
        if (!container) return;
        container.innerHTML = '';
        this.activeEvents.forEach(ev => {
            const div = document.createElement('div');
            // Assign a style variable for the event type color
            // Refined accent colors for intelligence dossier feel
            let accentColor = 'var(--accent-gold)';
            if(ev.type === 'health') accentColor = 'var(--accent-red)';
            if(ev.type === 'pollution') accentColor = 'var(--accent-green)';
            if(ev.type === 'stability') accentColor = 'var(--accent-yellow)';
            if(ev.type === 'economy') accentColor = 'var(--accent-gold)'; 

            div.className = `event-card severity-${ev.severity}`;
            div.style.setProperty('--event-accent', accentColor);
            div.style.borderLeftColor = accentColor;
            
            let iconHTML = ev.icon;
            if (ev.icon.includes('fa-')) {
                iconHTML = `<i class="${ev.icon}"></i>`;
            } else if (ev.icon.endsWith('.svg')) {
                iconHTML = `<img src="${ev.icon}" class="hestia-icon hestia-icon-gold">`;
            }

            div.innerHTML = `
                <div class="event-header">
                    <span class="event-icon">${iconHTML}</span>
                    <span class="event-title">${ev.title}</span>
                </div>
                <div class="event-body">
                    <p class="event-desc">${ev.desc}</p>
                    <div class="event-learning-fact">
                        <span class="fact-label">STRATEGY INSIGHT:</span>
                        <span class="fact-text">${ev.learningFact || ''}</span>
                    </div>
                </div>
                <div class="event-footer">
                    <div class="event-sdg-tag">${ev.sdgTarget}</div>
                    <button class="event-respond-btn" onclick="game.startNarrative('${ev.id}')">DEPLOY RESPONSE</button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // ========== VISUAL NOVEL SYSTEM ==========
    
    startNarrative(eventId) {
        const ev = this.activeEvents.find(e => String(e.id) === String(eventId));
        if (!ev) return;

        this.narrative.active = true;
        this.narrative.currentEvent = ev;
        this.narrative.queue = [
            { name: 'FIELD MANAGER', text: `COMMS ESTABLISHED: We have a critical situation in the region.`, sprite: '/assets/characters/Manager/neutral.png' },
            { name: 'FIELD MANAGER', text: ev.hestia || ev.desc, sprite: '/assets/characters/Manager/neutral.png' },
            { name: 'FIELD MANAGER', text: `Technical analysis implies immediate intervention is required. Specialist deployment is authorized.`, sprite: '/assets/characters/Manager/neutral.png' }
        ];
        this.narrative.currentStep = 0;
        
        const overlay = document.getElementById('dialogue-overlay');
        overlay.classList.add('visible');
        
        // Hide choice containers initially
        document.getElementById('choice-container').style.display = 'none';
        
        // Setup click trigger
        const trigger = document.getElementById('dialogue-box-trigger');
        trigger.onclick = () => this.advanceNarrative();
        
        // Support Space key
        this._vnKeyHandler = (e) => {
            if (e.code === 'Space') this.advanceNarrative();
            if (e.code === 'Escape') this.endNarrative();
        };
        window.addEventListener('keydown', this._vnKeyHandler);

        // Dramatic intro for severe events
        if (ev.severity === 'high') {
            this.triggerDramaticEffect('CRISIS');
        }

        this.processNarrativeStep();
    }
    getTalkingSprite(path) {
        if (!path) return null;
        let p = path;
        // Standardized naming: neutral.png -> talk.png
        if (p.includes('neutral.png')) return p.replace('neutral.png', 'talk.png');
        
        // Legacy fallbacks if someone still points to specific old filenames
        if (p.includes('Neutral Sprite.png')) return p.replace('Neutral Sprite.png', 'talk.png');
        if (p.includes('Neutral Sprite')) return p.replace('Neutral Sprite', 'talk.png');
        
        return p;
    }

    processNarrativeStep() {
        const step = this.narrative.queue[this.narrative.currentStep];
        if (!step) {
            this.showResolutionOptions();
            return;
        }

        this.narrative.neutralSprite = step.sprite;
        this.narrative.talkingSprite = step.talkingSprite || this.getTalkingSprite(step.sprite);
        this.narrative.talkingFlip = false;

        this.updateCharacterStage(step.sprite);
        document.getElementById('name-tag').textContent = step.name;
        this.typeText(step.text);
    }

    updateCharacterStage(spritePath, stageId = 'character-stage') {
        const stage = document.getElementById(stageId);
        if (!stage) return;

        let img = stage.querySelector('.character-sprite');
        
        if (!img) {
            img = document.createElement('img');
            img.className = 'character-sprite active';
            stage.appendChild(img);
        }

        // Only update SRC if it actually changed to prevent flickering
        if (!img.src.includes(spritePath)) {
            const oldChar = img.getAttribute('data-char');
            const parts = spritePath.split('/');
            const newChar = parts[parts.length - 2]; 
            
            img.src = spritePath;
            
            if (oldChar !== newChar) {
                img.classList.remove('active');
                void img.offsetWidth; // Force reflow
                img.classList.add('active');
                img.setAttribute('data-char', newChar);
            }
        }
    }

    typeText(text) {
        const el = document.getElementById('dialogue-text');
        const indicator = document.getElementById('next-indicator');
        el.innerHTML = '';
        indicator.style.display = 'none';
        this.narrative.isTyping = true;
        
        let i = 0;
        if (this.narrative.typingTimer) clearInterval(this.narrative.typingTimer);
        if (this.narrative.talkingTimer) clearInterval(this.narrative.talkingTimer);
        
        // Start talking animation (lip-sync simulation) 
        // Targeted at the main character stage (intro handled separately)
        const stage = document.getElementById('character-stage');
        const spriteImg = stage ? stage.querySelector('.character-sprite') : null;
        
        if (spriteImg && this.narrative.talkingSprite && this.narrative.talkingSprite !== this.narrative.neutralSprite) {
            this.narrative.talkingTimer = setInterval(() => {
                this.narrative.talkingFlip = !this.narrative.talkingFlip;
                spriteImg.src = this.narrative.talkingFlip ? this.narrative.talkingSprite : this.narrative.neutralSprite;
            }, 150);
        }

        this.narrative.typingTimer = setInterval(() => {
            if (i < text.length) {
                el.textContent += text.charAt(i);
                i++;
            } else {
                this.finishTyping();
            }
        }, 20); // Fast typing speed
    }

    finishTyping() {
        clearInterval(this.narrative.typingTimer);
        if (this.narrative.talkingTimer) clearInterval(this.narrative.talkingTimer);
        
        // Restore neutral pose
        const sprites = document.querySelectorAll('.character-sprite');
        sprites.forEach(spriteImg => {
            if (spriteImg && this.narrative.neutralSprite) {
                spriteImg.src = this.narrative.neutralSprite;
            }
        });

        const el = document.getElementById('dialogue-text');
        const step = this.narrative.queue[this.narrative.currentStep];
        if (step) el.textContent = step.text;
        document.getElementById('next-indicator').style.display = 'block';
        this.narrative.isTyping = false;
    }

    renderDialogue(name, text, sprite, talkSprite) {
        document.getElementById('name-tag').textContent = name;
        this.narrative.neutralSprite = sprite;
        this.narrative.talkingSprite = talkSprite || this.getTalkingSprite(sprite);
        this.typeText(text);
    }

    advanceNarrative() {
        if (this.narrative.isTyping) {
            this.finishTyping();
            return;
        }
        
        // Prevent narrative advancement if a minigame is active (unless overridden)
        if (this.currentMinigame && this.currentMinigame.active) {
            return;
        }

        this.narrative.currentStep++;
        if (this.narrative.currentStep < this.narrative.queue.length) {
            this.processNarrativeStep();
        } else {
            if (this.tutorialActive) {
                this.endGameplayTutorial();
            } else {
                this.showResolutionOptions();
            }
        }
    }

    showResolutionOptions() {
        const container = document.getElementById('choice-container');
        container.innerHTML = '';
        container.style.display = 'flex';
        
        const ev = this.narrative.currentEvent;
        
        // Option 1: Standard Action
        const stdBtn = document.createElement('button');
        stdBtn.className = 'choice-btn';
        stdBtn.textContent = 'STANDARD RESOLUTION';
        stdBtn.onclick = () => this.showStandardOptions();
        container.appendChild(stdBtn);
        
        // Option 2: Consult Specialist
        const specBtn = document.createElement('button');
        specBtn.className = 'choice-btn';
        specBtn.textContent = 'CONSULT SPECIALISTS';
        specBtn.onclick = () => this.showSpecialistPickerVN();
        container.appendChild(specBtn);

        // Hide next indicator since choices are up
        document.getElementById('next-indicator').style.display = 'none';
    }

    showStandardOptions() {
        const container = document.getElementById('choice-container');
        container.innerHTML = '';
        
        const ev = this.narrative.currentEvent;
        ev.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerHTML = `<strong>${opt.text}</strong><br><small>${this.renderEffects(opt.effects)}</small>`;
            btn.onclick = () => { 
                this.handleDecision(ev, opt); 
                this.endNarrative();
            };
            container.appendChild(btn);
        });

        const backBtn = document.createElement('button');
        backBtn.className = 'choice-btn';
        backBtn.style.background = 'rgba(255,255,255,0.1)';
        backBtn.textContent = 'BACK';
        backBtn.onclick = () => this.showResolutionOptions();
        container.appendChild(backBtn);
    }

    showSpecialistPickerVN() {
        const container = document.getElementById('choice-container');
        container.innerHTML = '';
        
        const ev = this.narrative.currentEvent;
        
        const grid = document.createElement('div');
        grid.className = 'vn-spec-grid'; // Use responsive CSS class
        
        this.specialists.forEach(s => {
            const isAvailable = s.cooldown === 0 && !s.deployed;
            const card = document.createElement('div');
            card.className = 'vn-spec-card' + (!isAvailable ? ' disabled' : '');
            
            card.innerHTML = `
                <div class="vn-spec-img-wrapper">
                    <img src="${s.img}" class="vn-spec-img">
                </div>
                <div class="vn-spec-info">
                    <div class="vn-spec-name">${s.name}</div>
                    <div class="vn-spec-role">${s.role}</div>
                    <div class="vn-spec-desc">${s.desc || 'No description available.'}</div>
                </div>
            `;
            
            if (isAvailable) {
                card.onclick = () => {
                    this.handleSpecialistIntervention(ev, s);
                };
            }
            grid.appendChild(card);
        });
        
        container.appendChild(grid);

        const backBtn = document.createElement('button');
        backBtn.className = 'choice-btn';
        backBtn.style.marginTop = '20px';
        backBtn.style.background = 'rgba(255,255,255,0.05)';
        backBtn.textContent = 'BACK';
        backBtn.onclick = () => {
            this.showResolutionOptions();
        };
        container.appendChild(backBtn);
    }

    endNarrative() {
        this.narrative.active = false;
        document.getElementById('dialogue-overlay').classList.remove('visible');
        window.removeEventListener('keydown', this._vnKeyHandler);
        this.updateAllUI();
    }

    triggerDramaticEffect(text) {
        const overlay = document.getElementById('dramatic-overlay');
        const flash = document.getElementById('flash-effect');
        const txt = document.getElementById('dramatic-text');
        
        if (!flash || !txt) return; // Null safety

        flash.style.display = 'block';
        txt.textContent = text;
        txt.classList.add('active');
        document.body.classList.add('shake');
        
        setTimeout(() => {
            flash.style.display = 'none';
            txt.classList.remove('active');
            document.body.classList.remove('shake');
        }, 1500);
    }

    closeDecision() {
        this.endNarrative();
    }

    showDecision(eventId) {
        // Redirect legacy calls to narrative system
        this.startNarrative(eventId);
    }

    handleSpecialistIntervention(ev, s) {
        // Resource check
        if (s.costs.budget && this.resources.budget < s.costs.budget) { 
            this.showToast('danger', `Insufficient World Bank Reserves (Need $${s.costs.budget}B)`); 
            return; 
        }
        if (s.costs.power && this.resources.power < s.costs.power) { 
            this.showToast('danger', `Insufficient Energy Grid Capacity (Need ${s.costs.power}P)`); 
            return; 
        }
        if (s.costs.food && this.resources.food < s.costs.food) { 
            this.showToast('danger', `Insufficient Global Food Supply (Need ${s.costs.food} Food)`); 
            return; 
        }

        // Deduct resources
        this.resources.budget -= (s.costs.budget || 0);
        this.resources.power -= (s.costs.power || 0);
        this.resources.food -= (s.costs.food || 0);
        
        // Put on cooldown
        s.cooldown = s.cooldownMax;
        
        // Close modal and start VN + MiniGame
        this.closeSpecModal();
        this.startSpecialistEvent(ev, s);
    }

    async startSpecialistEvent(ev, s) {
        const region = this.regions.find(r => r.id === ev.regionId);
        const regionName = region ? region.name : 'Sector';
        
        this.narrative.active = true;
        this.narrative.currentEvent = ev;
        this.narrative.currentStep = 0;
        this.narrative.neutralSprite = s.img;
        this.narrative.talkingSprite = s.talkImg;
        
        let dial1 = `Commander, I'm ready to execute the ${s.specialty} protocol in ${regionName}.`;
        let dial2 = `Just follow my lead and prioritize the mission objectives.`;

        // Personality-based overrides
        switch(s.id) {
            case 'health': 
                dial1 = `Commander, the ${regionName} population is suffering. We must act before the pandemic spreads.`;
                dial2 = `I'd rather be in my clinic, but for the sake of these people... I'll handle the quarantine synchronization.`;
                break;
            case 'economist':
                dial1 = `The flow of fortune in ${regionName} is being disrupted. Sigma and I have identified the leak.`;
                dial2 = `Meticulous intervention is required to balance the debts. We're ready, aren't we Sigma? [Sigma nods]`;
                break;
            case 'war':
                dial1 = `Commander, hostilities in ${regionName} have reached critical levels. Tactical pacification is the only path.`;
                dial2 = `I've memorized their names... let's not add any more to the list today. Stabilizing the front.`;
                break;
            case 'scientist':
                dial1 = `FASCINATING! The data from ${regionName} is completely anomalous. I MUST gather more research!`;
                dial2 = `Move aside, Commander! The ${s.specialty} process is delicate. My research demands perfection.`;
                break;
            case 'diplomat':
                dial1 = `The commoners in ${regionName} are restless. Haughty leadership has failed them again.`;
                dial2 = `I require your absolute cooperation. I will reform this structure, but make sure your effort is sufficient.`;
                break;
            case 'environment':
                dial1 = `I... I can feel the biosphere in ${regionName} dying, Commander. It... it hurts.`;
                dial2 = `Please, let's protect them. The flora and fauna... they have no other voice. I'll restore the balance.`;
                break;
        }

        this.narrative.queue = [
            { name: s.name, text: dial1, sprite: s.img, talkingSprite: s.talkImg },
            { name: s.name, text: dial2, sprite: s.img, talkingSprite: s.talkImg }
        ];

        document.getElementById('dialogue-overlay').classList.add('visible');
        document.getElementById('choice-container').style.display = 'none';
        this.processNarrativeStep();
        
        // Override advance logic for this special event
        const originalAdvance = this.advanceNarrative;
        this.advanceNarrative = () => {
            if (this.narrative.isTyping) {
                this.finishTyping();
                return;
            }
            this.narrative.currentStep++;
            if (this.narrative.currentStep < this.narrative.queue.length) {
                this.processNarrativeStep();
            } else {
                // Done with VN, start mini-game
                this.advanceNarrative = originalAdvance; // RESTORE
                this.initMiniGame(ev, s);
            }
        };
    }

    handleDecision(ev, opt) {
        if (opt.cost) {
            if (this.resources.budget < (opt.cost.budget || 0)) { this.showToast('danger', 'Insufficient World Bank Reserves!'); return; }
            if (this.resources.power < (opt.cost.power || 0)) { this.showToast('danger', 'Insufficient Energy Grid Capacity!'); return; }
            this.resources.budget -= (opt.cost.budget || 0);
            this.resources.power -= (opt.cost.power || 0);
        }
        
        this.applyDecisionEffects(ev, opt);
        this.closeDecision();
    }

    applyDecisionEffects(ev, opt, success = true) {
        const r = this.regions.find(rg => rg.id === ev.regionId);
        if (r && r.stats) {
            Object.entries(opt.effects).forEach(([k,v]) => {
                const mod = success ? v : Math.floor(v/3);
                r.stats[k] = this.clamp(r.stats[k] + mod);
            });
            if (success) {
                r.crisis = null;
                this.activeEvents = this.activeEvents.filter(e => String(e.id) !== String(ev.id));
                // Active resolution increments SDG progress
                this.sdgProgress = Math.min(100, this.sdgProgress + 3);
                this.checkGameState();
            }
        }
        this.updateAllUI();
    }

    // ---- COMPREHENSIVE MINI-GAME ENGINE ----
    initMiniGame(ev, s) {
        const overlay = document.getElementById('minigame-overlay');
        const canvas = document.getElementById('mg-canvas-container');
        
        overlay.style.display = 'flex';
        overlay.classList.add('visible');
        canvas.innerHTML = '';
        
        // Ensure character stays visible and hide Choice indicator
        document.getElementById('dialogue-overlay').classList.add('visible');
        document.getElementById('choice-container').style.display = 'none';
        document.getElementById('next-indicator').style.display = 'none';
        document.getElementById('mg-instructions').style.visibility = 'visible';
        
        this.currentMinigame = {
            event: ev,
            specialist: s,
            score: 0,
            timeLeft: 15,
            active: true,
            timer: null,
            commentInterval: null
        };

        // UI Setup
        document.getElementById('mg-title').textContent = s.specialty.toUpperCase();
        document.getElementById('mg-timer').textContent = this.currentMinigame.timeLeft;

        // Route to specific game (Update instructions first)
        if (s.id === 'environment') this.runPlantOrPollute();
        else if (s.id === 'scientist') this.runConnectPower();
        else if (s.id === 'health') this.runOrderingGame();
        else if (s.id === 'war') this.runTacticalStrike();
        else if (s.id === 'diplomat') this.runAgreementPuzzle();
        else if (s.id === 'economist') this.runStabilizerGame();
        else this.runStabilizerGame();

        // Start Commentary System (Now includes updated instructions)
        const introText = document.getElementById('mg-instructions').textContent || "Lead the way, Commander.";
        this.typeText(`OP: ${introText}`);
        
        const genericComments = [
            "Keep it steady, Commander!",
            "We're making progress. Don't stop now!",
            "Precision is everything here.",
            "The world is watching our response.",
            "Almost there! Just a few more!"
        ];

        this.currentMinigame.commentInterval = setInterval(() => {
            if (!this.currentMinigame.active) return;
            const msg = genericComments[Math.floor(Math.random() * genericComments.length)];
            this.typeText(msg);
        }, 6000); 

        // Start Timer
        this.currentMinigame.timer = setInterval(() => {
            this.currentMinigame.timeLeft--;
            document.getElementById('mg-timer').textContent = this.currentMinigame.timeLeft;
            
            if (this.currentMinigame.timeLeft <= 0) {
                this.finishMiniGame(false);
            }
        }, 1000);
    }

    runPlantOrPollute() {
        const container = document.getElementById('mg-canvas-container');
        document.getElementById('mg-instructions').textContent = "TAP SUSTAINABLE PROJECTS ONLY. AVOID INDUSTRIAL WASTE.";
        
        const spawn = () => {
            if (!this.currentMinigame.active) return;
            const icon = document.createElement('div');
            const isGood = Math.random() > 0.4;
            icon.className = 'mg-falling-icon';
            icon.innerHTML = isGood ? '<i class="fas fa-tree"></i>' : '<i class="fas fa-industry"></i>';
            icon.style.left = Math.random() * 90 + '%';
            icon.style.top = '-50px';
            
            icon.onclick = () => {
                if (isGood) {
                    this.currentMinigame.score++;
                    icon.style.transform = 'scale(1.5)';
                    icon.style.opacity = '0';
                    if (this.currentMinigame.score >= 8) this.finishMiniGame(true);
                } else {
                    this.finishMiniGame(false);
                }
                setTimeout(() => icon.remove(), 200);
            };

            container.appendChild(icon);
            
            let pos = -50;
            const fall = setInterval(() => {
                pos += 3;
                icon.style.top = pos + 'px';
                if (pos > 350) {
                    clearInterval(fall);
                    icon.remove();
                }
                if (!this.currentMinigame.active) clearInterval(fall);
            }, 20);
            
            setTimeout(spawn, 600);
        };
        spawn();
    }

    runConnectPower() {
        const container = document.getElementById('mg-canvas-container');
        document.getElementById('mg-instructions').textContent = "TAP TO ROTATE. ALIGN ALL TO VERTICAL (UP).";
        
        const grid = document.createElement('div');
        grid.className = 'mg-wire-grid';
        
        const items = [];
        for (let i=0; i<12; i++) {
            const cell = document.createElement('div');
            cell.className = 'mg-wire-cell';
            const rotation = Math.floor(Math.random() * 4) * 90;
            cell.innerHTML = `<span class="mg-wire-icon" style="transform: rotate(${rotation}deg)"><i class="fas fa-plug"></i></span>`;
            
            let currentRot = rotation;
            cell.onclick = () => {
                currentRot += 90;
                cell.querySelector('.mg-wire-icon').style.transform = `rotate(${currentRot}deg)`;
                checkWin();
            };
            
            grid.appendChild(cell);
            items.push({ cell, get rotation() { return currentRot % 180 === 0; } });
        }
        
        const checkWin = () => {
            if (items.every(item => item.rotation)) {
                this.finishMiniGame(true);
            }
        };
        
        container.appendChild(grid);
    }

    runOrderingGame() {
        const container = document.getElementById('mg-canvas-container');
        const s = this.currentMinigame.specialist;
        
        let steps = [];
        if (s.id === 'health') {
            document.getElementById('mg-instructions').textContent = "PHARMACEUTICAL PROTOCOL: PREVENT -> TREAT -> PROTECT";
            steps = [
                { id: 1, text: '<i class="fas fa-ban"></i> STOP GATHERINGS' },
                { id: 2, text: '<i class="fas fa-ambulance"></i> EMERGENCY TREATMENT' },
                { id: 3, text: '<i class="fas fa-syringe"></i> MASS VACCINATION' }
            ];
        } else {
            document.getElementById('mg-instructions').textContent = "STRATEGIC DEPLOYMENT: INTEL -> STRIKE -> SECURE";
            steps = [
                { id: 1, text: '<i class="fas fa-satellite-dish"></i> RECONNAISSANCE' },
                { id: 2, text: '<i class="fas fa-crosshairs"></i> PRECISION STRIKE' },
                { id: 3, text: '<i class="fas fa-shield-halved"></i> AREA SECURE' }
            ];
        }

        const list = document.createElement('div');
        list.className = 'mg-order-list';
        
        // Shuffle (Ensuring it's not already solved)
        let shuffled = [...steps].sort(() => Math.random() - 0.5);
        while (shuffled.every((s, i) => s.id === steps[i].id)) {
            shuffled = [...steps].sort(() => Math.random() - 0.5);
        }
        
        shuffled.forEach((step) => {
            const item = document.createElement('div');
            item.className = 'mg-order-item';
            item.draggable = true;
            item.innerHTML = `<span class="handle"><i class="fas fa-bars"></i></span> ${step.text}`;
            item.dataset.id = step.id;
            
            // Drag events
            item.addEventListener('dragstart', (e) => {
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.checkOrdering(list, steps);
            });

            // Click to Swap Logic (Accessibility & Multi-input)
            item.onclick = (e) => {
                e.stopPropagation();
                if (!this.currentMinigame.active) return;
                
                if (!this.currentMinigame.activeItem) {
                    this.currentMinigame.activeItem = item;
                    item.classList.add('mg-item-selected');
                } else if (this.currentMinigame.activeItem === item) {
                    this.currentMinigame.activeItem.classList.remove('mg-item-selected');
                    this.currentMinigame.activeItem = null;
                } else {
                    const node1 = this.currentMinigame.activeItem;
                    const node2 = item;
                    // Stable Swap
                    const parent = node1.parentNode;
                    const next1 = node1.nextSibling;
                    const next2 = node2.nextSibling;

                    if (next1 === node2) {
                        parent.insertBefore(node2, node1);
                    } else if (next2 === node1) {
                        parent.insertBefore(node1, node2);
                    } else {
                        parent.insertBefore(node1, next2);
                        parent.insertBefore(node2, next1);
                    }
                    
                    node1.classList.remove('mg-item-selected');
                    this.currentMinigame.activeItem = null;
                    this.checkOrdering(list, steps);
                }
            };
            list.appendChild(item);
        });

        list.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = document.querySelector('.dragging');
            if (!dragging) return;
            const afterElement = [...list.querySelectorAll('.mg-order-item:not(.dragging)')].reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = e.clientY - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) return { offset, element: child };
                return closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
            if (afterElement == null) list.appendChild(dragging);
            else list.insertBefore(dragging, afterElement);
        });

        container.appendChild(list);
    }

    checkOrdering(list, correctSteps) {
        if (!this.currentMinigame.active) return;
        const currentIds = Array.from(list.children).map(i => parseInt(i.dataset.id));
        const correctCount = currentIds.filter((id, idx) => id === correctSteps[idx].id).length;
        const total = currentIds.length;
        const incorrectCount = total - correctCount;
        const s = this.currentMinigame.specialist;

        if (correctCount === total) {
            // Stop the timer immediately to prevent "Mission Failed"
            if (this.currentMinigame.timer) clearInterval(this.currentMinigame.timer);

            Array.from(list.children).forEach(it => {
                it.classList.add('mg-item-success');
                it.style.pointerEvents = 'none';
            });

            this.renderDialogue(s.name, `PERFECT! ALL ${total} STEPS SYNCHRONIZED.`, s.img, s.talkImg);

            // Success override for "Skip" or Click-to-Finish
            const originalAdvance = this.advanceNarrative;
            this.advanceNarrative = () => {
                if (this.narrative.isTyping) { this.finishTyping(); return; }
                this.advanceNarrative = originalAdvance;
                this.finishMiniGame(true);
            };

            // Auto-advance after delay
            this.winTimer = setTimeout(() => {
                if (this.currentMinigame && this.currentMinigame.active) {
                    this.advanceNarrative();
                }
            }, 1800);
        } else {
            // Progress feedback
            if (correctCount > 0) {
                this.renderDialogue(s.name, `${correctCount} correct, ${incorrectCount} incorrect. Rearrange the protocol!`, s.img, s.talkImg);
            } else {
                this.renderDialogue(s.name, "none of these are in the right order yet. rethink the sequence!", s.img, s.talkImg);
            }
        }
    }

    runTacticalStrike() {
        const container = document.getElementById('mg-canvas-container');
        document.getElementById('mg-instructions').textContent = "QUICK! ELIMINATE THE THREATS. SCORE 5 TO WIN.";
        
        let score = 0;
        const spawn = () => {
            if (!this.currentMinigame.active) return;
            const target = document.createElement('div');
            target.className = 'mg-strike-target';
            target.innerHTML = '<i class="fas fa-crosshairs"></i>';
            target.style.left = (10 + Math.random() * 80) + '%';
            target.style.top = (10 + Math.random() * 80) + '%';
            
            target.onclick = () => {
                score++;
                target.style.transform = 'scale(0) rotate(180deg)';
                target.style.opacity = '0';
                if (score >= 5) {
                    this.finishMiniGame(true);
                }
                setTimeout(() => target.remove(), 300);
            };

            container.appendChild(target);
            setTimeout(() => { if(target.parentNode) target.remove(); }, 1200); // Disappear after 1.2s
            
            if (this.currentMinigame.active) setTimeout(spawn, 1000);
        };
        spawn();
    }

    runAgreementPuzzle() {
        const container = document.getElementById('mg-canvas-container');
        document.getElementById('mg-instructions').textContent = "ESTABLISH PARTNERSHIPS. MATCH THE SYMBOLS.";
        
        const symbols = ['fas fa-handshake', 'fas fa-dove', 'fas fa-scroll', 'fas fa-scale-balanced'];
        let items = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
        
        const grid = document.createElement('div');
        grid.className = 'mg-match-grid';
        
        let flipped = [];
        let matches = 0;

        items.forEach((sym, idx) => {
            const card = document.createElement('div');
            card.className = 'mg-match-card';
            card.dataset.sym = sym;
            card.innerHTML = `<span class="mg-sym" style="visibility:hidden"><i class="${sym}"></i></span>`;
            
            card.onclick = () => {
                if (!this.currentMinigame.active || flipped.length >= 2 || card.classList.contains('matched') || flipped.includes(card)) return;
                
                card.querySelector('.mg-sym').style.visibility = 'visible';
                card.classList.add('flipped');
                flipped.push(card);
                
                if (flipped.length === 2) {
                    if (flipped[0].dataset.sym === flipped[1].dataset.sym) {
                        flipped[0].classList.add('matched');
                        flipped[1].classList.add('matched');
                        matches++;
                        flipped = [];
                        if (matches === symbols.length) this.finishMiniGame(true);
                    } else {
                        setTimeout(() => {
                            flipped.forEach(c => {
                                c.querySelector('.mg-sym').style.visibility = 'hidden';
                                c.classList.remove('flipped');
                            });
                            flipped = [];
                        }, 600);
                    }
                }
            };
            grid.appendChild(card);
        });
        container.appendChild(grid);
    }

    runStabilizerGame() {
        const container = document.getElementById('mg-canvas-container');
        document.getElementById('mg-instructions').textContent = "STABILIZE THE GRAPH. KEEP CURSOR IN NEUTRAL ZONE.";
        const ui = document.createElement('div');
        ui.className = 'mg-stabilizer-ui';
        ui.innerHTML = `
            <div class="mg-graph-area"><div class="mg-target-line"></div><div id="mg-active-line" class="mg-current-line" style="top: 50%"></div></div>
            <input type="range" id="mg-stab-input" style="width:100%" value="50">
        `;
        container.appendChild(ui);
        const line = ui.querySelector('#mg-active-line');
        const input = ui.querySelector('#mg-stab-input');
        let drift = 0;
        let scoreNeeded = 100;
        let currentScore = 0;

        const loop = setInterval(() => {
            if (!this.currentMinigame.active) { clearInterval(loop); return; }
            drift += (Math.random() - 0.5) * 5;
            const pos = parseInt(input.value) + drift;
            line.style.top = Math.max(0, Math.min(100, pos)) + '%';
            if (pos > 40 && pos < 60) {
                currentScore++;
                line.style.background = 'var(--accent-cyan)';
            } else {
                line.style.background = '#ff4757';
            }
            if (currentScore >= scoreNeeded) {
                clearInterval(loop);
                this.finishMiniGame(true);
            }
        }, 50);
    }

    finishMiniGame(success) {
        if (!this.currentMinigame.active) return;
        this.currentMinigame.active = false;
        clearInterval(this.currentMinigame.timer);
        if (this.currentMinigame.commentInterval) clearInterval(this.currentMinigame.commentInterval);
        if (this.winTimer) clearTimeout(this.winTimer);

        // Hide mini-game overlay immediately
        const mgOverlay = document.getElementById('minigame-overlay');
        mgOverlay.classList.remove('visible');
        
        setTimeout(() => {
            mgOverlay.style.display = 'none';
            this.showPostGameDialogue(success);
        }, 500);
    }

    showPostGameDialogue(success) {
        const ev = this.currentMinigame.event;
        const s = this.currentMinigame.specialist;
        const region = this.regions.find(r => r.id === ev.regionId);
        const regionName = region ? region.name : 'the sector';

        // Calculate impact summary for dialogue
        const baseEffects = ev.options[0].effects;
        const isMatch = (ev.recommendedSpec && s.id === ev.recommendedSpec) || 
                       (s.role && ev.type && s.role.toLowerCase().includes(ev.type.toLowerCase()));
        const multiplier = isMatch ? 2.0 : 1.0;
        const finalMult = success ? multiplier : 0.3;
        
        let impacts = Object.entries(baseEffects).map(([stat, val]) => {
            const change = Math.round(val * finalMult);
            const label = stat.charAt(0).toUpperCase() + stat.slice(1);
            return `${label} ${change >= 0 ? '+' : ''}${change}%`;
        }).join(', ');

        const statusLine = success ? "MISSION SUCCESSFUL" : "MISSION FAILED";
        const introLine = success 
            ? `Commander, the ${s.specialty} operation in ${regionName} was a complete success.`
            : `I'm afraid the intervention was insufficient, Commander. The crisis in ${regionName} continues.`;
        
        const consequenceLine = success
            ? `Our actions resulted in significant shifts: ${impacts}. A necessary step for the Global Goals.`
            : `Minimal influence achieved: ${impacts}. We must rethink our strategic approach.`;

        const learningLine = ev.learningFact || 'Every action in the Aegis has a global ripple effect.';

        // Build Narrative Queue
        this.narrative.queue = [
            { name: s.name, text: statusLine, sprite: s.img, talkingSprite: s.talkImg },
            { name: s.name, text: introLine, sprite: s.img, talkingSprite: s.talkImg },
            { name: s.name, text: consequenceLine, sprite: s.img, talkingSprite: s.talkImg },
            { name: 'HESTIA [INTELLIGENCE]', text: `LESSON: ${learningLine}`, sprite: '/assets/characters/Hestia/neutral.png', talkingSprite: '/assets/characters/Hestia/talk.png' }
        ];

        // Activate Dialogue Overlay
        document.getElementById('dialogue-overlay').classList.add('visible');
        document.getElementById('choice-container').style.display = 'none';
        this.narrative.currentStep = 0;
        this.processNarrativeStep();

        // Override advance logic for post-game
        const originalAdvance = this.advanceNarrative;
        this.advanceNarrative = () => {
            if (this.narrative.isTyping) {
                this.finishTyping();
                return;
            }
            this.narrative.currentStep++;
            if (this.narrative.currentStep < this.narrative.queue.length) {
                this.processNarrativeStep();
            } else {
                // Done with post-game narrative
                this.advanceNarrative = originalAdvance; // RESTORE
                this.resolveSpecialistIntervention(ev, s, success);
                this.endNarrative();
            }
        };
    }

    resolveSpecialistIntervention(ev, s, success) {
        const region = this.regions.find(r => r.id === ev.regionId);
        if (!region) return;
        const baseEffects = ev.options[0].effects;
        const isMatch = (ev.recommendedSpec && s.id === ev.recommendedSpec) || 
                       (s.role && ev.type && s.role.toLowerCase().includes(ev.type.toLowerCase()));
        const multiplier = isMatch ? 2.0 : 1.0;
        const finalMult = success ? multiplier : 0.3;

        Object.entries(baseEffects).forEach(([stat, value]) => {
            const change = Math.round(value * finalMult);
            region.stats[stat] = this.clamp(region.stats[stat] + change);
        });

        if (success) {
            region.crisis = null;
            this.activeEvents = this.activeEvents.filter(e => String(e.id) !== String(ev.id));
            // Specialist success provides high SDG progress
            this.sdgProgress = Math.min(100, this.sdgProgress + 5);
            this.showToast('success', `${s.name} resolved the crisis!`);
            this.checkGameState();
        } else {
            this.showToast('warning', `${s.name}'s intervention failed.`);
        }
        this.updateAllUI();
    }

    animateValue(obj, start, end, duration) {
        if (start === end) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // ---- HELPERS ----
    renderEffects(eff) {
        const labels = { budget: 'World Bank', power: 'Energy', food: 'Food' };
        return Object.entries(eff).map(([k,v]) => {
            const label = labels[k] || k.toUpperCase();
            return `<span class="effect-tag ${v>=0?'positive':'negative'}">${label} ${v>=0?'+'+v:v}</span>`;
        }).join('');
    }
    clamp(v) { return Math.max(0, Math.min(100, Math.round(v))); }
    getGlobalStats() {
        const avg = (s) => Math.round(this.regions.reduce((a,r) => a + r.stats[s], 0) / this.regions.length);
        return { pollution: avg('pollution'), health: avg('health'), economy: avg('economy') };
    }
    getSDGScore() {
        return this.sdgProgress;
    }
    showToast(type, msg) {
        const container = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.innerHTML = `<span><i class="fas fa-bolt"></i></span> ${msg}`;
        container.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }
    addLog(msg) {
        this.eventLog.unshift(`Turn ${this.turn}: ${msg}`);
        const logList = document.getElementById('log-list');
        if (logList) {
            logList.innerHTML = this.eventLog.slice(0, 5).map(l => `<div class="log-entry">${l}</div>`).join('');
        }
    }
    checkGameState() {
        const score = this.getSDGScore();
        if (score >= 100) {
            this.gameOver = true;
            this.showGameOver(true);
        } else if (this.turn >= this.maxTurns) {
            this.gameOver = true;
            this.showGameOver(false); // Failed to reach 100% in 40 turns
        }
    }
    showGameOver(won) {
        const overlay = document.getElementById('gameover-overlay');
        overlay.classList.add('visible');
        document.getElementById('go-title').textContent = won ? 'GOLDEN AGE' : 'EXTINCTION';
        document.getElementById('go-message').textContent = won ? 'You balanced the scales.' : 'The weight was too heavy.';
    }

    // ========== INITIALIZATION ==========
}

let game;
window.addEventListener('DOMContentLoaded', () => { 
    console.log('--- Initializing HESTIA Game Engine ---');
    game = new GameEngine(); 
    
    // Auto-transition to gameplay state if intro is bypassed
    game.introPhase = false;
    
    const introScreen = document.getElementById('intro-screen');
    const gameContainer = document.getElementById('game-container');
    
    if (introScreen) {
        introScreen.style.display = 'none';
        console.log('Intro screen hidden');
    }
    
    if (gameContainer) {
        gameContainer.classList.add('active');
        console.log('Game container activated');
    }
    
    // Build initial UI and Start Core Loop
    game.buildUI(); 
    
    // Check if tutorial is queued (from story)
    if (localStorage.getItem('hestia_tutorial_queued') === 'true') {
        localStorage.removeItem('hestia_tutorial_queued');
        // Apply tutorial mode and start briefing
        gameContainer.classList.add('tutorial-mode');
        game.startGameplayTutorial();
    } else {
        game.startGame(); 
    }
    
    console.log('--- HESTIA: System Operational ---');
});
