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
        this.resources = { budget: 1000, power: 500, influence: 300 }; // Updated values
        this.sdgProgress = 0; // New
        
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
        this.prevStats = { pollution: 0, health: 0, economy: 0, progress: 0 };
        
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
        this.narrative.neutralSprite = "Character/Hestia/Neutral Sprite.png";
        this.narrative.talkingSprite = this.getTalkingSprite(this.narrative.neutralSprite);
        
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

        setTimeout(() => {
            screen.style.display = 'none';
            document.getElementById('game-container').classList.add('active');
            this.introPhase = false;
            this.buildUI();
            this.startGame();
        }, 1000);
    }

    showTutorial() {
        this.tutorialStep = 0;
        const overlay = document.getElementById('tutorial-overlay');
        overlay.classList.add('visible');
        this.renderTutorialStep();
    }

    renderTutorialStep() {
        const step = TUTORIAL_STEPS[this.tutorialStep];
        document.getElementById('tutorial-icon').textContent = step.icon;
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
            'res-food-val': { val: this.resources.influence, prev: this.prevResources.influence, parent: 'res-food' }
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
            'gs-pollution': { val: gs.pollution, prev: this.prevStats.pollution, isInverse: true },
            'gs-health': { val: gs.health, prev: this.prevStats.health },
            'gs-economy': { val: gs.economy, prev: this.prevStats.economy },
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

        this.prevStats = { pollution: gs.pollution, health: gs.health, economy: gs.economy, progress: sdg };
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
            let avatarHTML = s.img ? `<img class="specialist-avatar" src="${s.img}">` : `<div class="specialist-avatar-emoji">${s.emoji}</div>`;
            card.innerHTML = `${avatarHTML}
                <div class="specialist-info">
                    <div class="specialist-name">${s.name}</div>
                    <div class="specialist-role">${s.role}</div>
                    <div class="specialist-sdg" style="font-size:0.6rem; color:var(--accent-cyan); margin-top:2px;">${s.sdg}</div>
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
        document.getElementById('sm-specialty').textContent = s.specialty || 'General Expert';
        
        const portrait = document.getElementById('sm-img');
        portrait.src = s.img || '';
        portrait.style.display = s.img ? 'block' : 'none';

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

        // Costs
        const costsRow = document.getElementById('sm-costs');
        costsRow.innerHTML = '';
        Object.entries(s.costs).forEach(([k, v]) => {
            const item = document.createElement('div');
            item.className = 'sm-cost-item';
            let unit = k === 'budget' ? 'B' : (k === 'power' ? 'P' : 'I');
            let label = k === 'budget' ? 'World Bank' : (k === 'power' ? 'Energy' : 'Influence');
            item.innerHTML = `<span style="text-transform:capitalize">${label}</span>: <span class="sm-cost-val">${k === 'budget' ? '$' : ''}${v}${unit}</span>`;
            costsRow.appendChild(item);
        });

        // Setup Buttons
        document.getElementById('sm-deploy-btn').onclick = () => {
            this.closeSpecModal();
            this.prepareDeployment(s);
        };
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
        
        this.addChatMessage('char', `Secure channel established. Commander, this is ${spec.name}. How can I assist with the global strategy?`);
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

            const data = await response.json();
            
            if (data.error) {
                this.addChatMessage('char', `[COMMS DISRUPTED: ${data.error}]`);
                return;
            }

            this.addChatMessage('char', data.text);
        } catch (err) {
            this.addChatMessage('char', "[SIGNAL LOST: Neural bridge offline. Ensure the Vercel function is active.]");
            console.error(err);
        }
    }

    getPersonaPrompt(spec) {
        const personas = {
            health: "You are Vita, a dedicated medical expert. You are calm, empathetic but ruthlessly pragmatic when it comes to containing outbreaks. You view the world as a patient that needs stabilization.",
            economist: "You are Delta and Sigma, a duo of brilliant economists. You often finish each other's thoughts. You speak in terms of market efficiency, capital flow, and financial equilibrium. Delta is more analytical, Sigma is more cautious.",
            war: "You are Virdis, a battle-hardened War Commander with a high battle IQ. You are stoic and terse. You hate war and see it as a failure, but you will execute tactical strikes with absolute precision if needed.",
            scientist: "You are Celsius, the Head Scientist. You are socially awkward, brilliant, and obsessed with research. You might ignore social cues or human emotions in favor of pure data and technological potential.",
            diplomat: "You are Carmine, a Social Reformer and former noble. You are haughty but deeply protective of the common people. You speak with elegance and have a frighteningly deep understanding of human psychology and societal structures.",
            environment: "You are Maris, an expert Ecologist. You are grounded, focused on the planetary balance. You speak about biological systems, pollution cycles, and the long-term sustainability of the biosphere."
        };
        return personas[spec.id] || "You are a professional advisor to the World Government.";
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
            let icons = r.crisis ? '<span class="region-crisis-icon">⚠️</span>' : '';
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
        
        // Resource check
        const cost = s.costs;
        if (cost.budget && this.resources.budget < cost.budget) { this.showToast('danger', 'Insufficient World Bank Reserves!'); return; }
        if (cost.power && this.resources.power < cost.power) { this.showToast('danger', 'Insufficient Energy Grid Capacity!'); return; }
        if (cost.influence && this.resources.influence < cost.influence) { this.showToast('danger', 'Insufficient Global Influence!'); return; }

        if (s.condition === 'conflict' && !r.crisis) { this.showToast('warning', 'War Commander requires conflict!'); return; }
        if (s.condition === 'stable' && (r.stats.stability < 50)) { this.showToast('warning', 'Scientist requires stability!'); return; }

        // Deduct resources
        if (cost.budget) this.resources.budget -= cost.budget;
        if (cost.power) this.resources.power -= cost.power;
        if (cost.influence) this.resources.influence -= cost.influence;

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
            { text: '💎 Foreign Aid ($30B)', type: 'aid', cost:{budget:30}, effects:{health:10, economy:-5} },
            { text: '⛔ Sanction (20P)', type: 'sanction', cost:{power:20}, effects:{stability:5, economy:-10} }
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
        modal.classList.add('visible'); // Use visible or display:flex
        modal.style.display = 'flex';

        document.getElementById('dm-flag').src = `Country/${encodeURIComponent(r.name)}/FLAG.jpeg`;
        document.getElementById('dm-name').textContent = r.name;
        document.getElementById('dm-leader').textContent = r.leader;
        document.getElementById('dm-gov-detailed').textContent = r.gov.toUpperCase();
        
        const d = r.details || { population: 'Unknown', gdp: 'Unknown', growth: 'Unknown', info: 'No dossier available.' };
        document.getElementById('dm-pop').textContent = d.population;
        document.getElementById('dm-gdp').textContent = d.gdp;
        document.getElementById('dm-growth').textContent = d.growth;
        document.getElementById('dm-info').textContent = d.info;

        // Reset SDG tags based on region focus if needed (static for now)
        this.closeRegionInfo();
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
        this.resources.influence += 10;
        
        this.regions.forEach(r => {
            const beh = GOV_BEHAVIORS[r.gov] || GOV_BEHAVIORS.democratic;
            r.stats.stability = this.clamp(r.stats.stability + beh.stabilityMod * 100);
            if (r.crisis) {
                r.stats.stability -= 3;
                r.stats.health -= 2;
                if (Math.random() < 0.2) this.spreadCrisis(r);
            }
        });
        
        this.specialists.forEach(s => { if (s.cooldown > 0) s.cooldown--; s.deployed = null; });
        
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
        container.innerHTML = '';
        this.activeEvents.forEach(ev => {
            const div = document.createElement('div');
            // Assign a style variable for the event type color
            let accentColor = 'var(--accent-gold)';
            if(ev.type === 'health') accentColor = '#ff4d4d';
            if(ev.type === 'pollution') accentColor = '#4dff88';
            if(ev.type === 'stability') accentColor = '#ff9f4d';
            if(ev.type === 'economy') accentColor = '#4d9fff';

            div.className = `event-card severity-${ev.severity}`;
            div.style.setProperty('--event-accent', accentColor);
            
            div.innerHTML = `
                <div class="event-header">
                    <span class="event-icon">${ev.icon}</span>
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
            { name: 'FIELD MANAGER', text: `COMMS ESTABLISHED: We have a critical situation in the region.`, sprite: 'Character/Manager/Neutral Sprite.png' },
            { name: 'FIELD MANAGER', text: ev.hestia || ev.desc, sprite: 'Character/Manager/Neutral Sprite.png' },
            { name: 'FIELD MANAGER', text: `Technical analysis implies immediate intervention is required. Specialist deployment is authorized.`, sprite: 'Character/Manager/Neutral Sprite.png' }
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
        // High-precision manual mapping for project-specific naming quirks
        if (p.includes('Hestia/Neutral Sprite')) return p.replace('Neutral Sprite', 'Neutral Talk Sprite');
        if (p.includes('Manager/Neutral Sprite')) return p.replace('Neutral Sprite', 'Talking Sprite');
        if (p.includes('Medical Expert (Vita)/Neutral State')) return p.replace('Neutral State', 'Talking State');
        if (p.includes('Social Reformer (Carmine)/Neutral State')) return p.replace('Neutral State', 'Talk State');
        if (p.includes('Virdis)/Neutral Sprite.png')) return p.replace('Neutral Sprite.png', 'Neutral Talk Sprite.png');
        if (p.includes('Delta Neutral Sprite.png')) return p.replace('Neutral', 'Talk');
        if (p.includes('Sigma Neutral Sprite.png')) return p.replace('Neutral', 'Talk');
        if (p.includes('Generic NPC #1/Neutral Sprite')) return p.replace('Neutral Sprite', 'Neutral Talking Sprite');
        
        // Fallback heuristics for standard naming
        if (p.includes('Neutral Sprite')) return p.replace('Neutral Sprite', 'Talk Sprite');
        if (p.includes('Neutral State')) return p.replace('Neutral State', 'Talk State');
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
            const newChar = spritePath.split('/')[1]; // E.g. Hestia or Manager
            
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
        const spriteImg = document.querySelector('.character-sprite');
        if (spriteImg && this.narrative.neutralSprite) {
            spriteImg.src = this.narrative.neutralSprite;
        }

        const el = document.getElementById('dialogue-text');
        const step = this.narrative.queue[this.narrative.currentStep];
        el.textContent = step.text;
        document.getElementById('next-indicator').style.display = 'block';
        this.narrative.isTyping = false;
    }

    advanceNarrative() {
        if (this.narrative.isTyping) {
            this.finishTyping();
            return;
        }
        
        this.narrative.currentStep++;
        if (this.narrative.currentStep < this.narrative.queue.length) {
            this.processNarrativeStep();
        } else {
            this.showResolutionOptions();
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
        if (s.costs.influence && this.resources.influence < s.costs.influence) { 
            this.showToast('danger', `Insufficient Global Influence (Need ${s.costs.influence}I)`); 
            return; 
        }

        // Deduct resources
        this.resources.budget -= (s.costs.budget || 0);
        this.resources.power -= (s.costs.power || 0);
        this.resources.influence -= (s.costs.influence || 0);
        
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
        
        this.narrative.queue = [
            { name: s.name, text: `Commander, the situation in ${regionName} is critical. I'm ready to execute the ${s.specialty} protocol.`, sprite: s.img, talkingSprite: s.talkImg },
            { name: s.name, text: `I'll handle the technical stabilization. Just follow my lead.`, sprite: s.img, talkingSprite: s.talkImg }
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
        else if (['health', 'war', 'diplomat'].includes(s.id)) this.runOrderingGame();
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
        document.getElementById('mg-instructions').textContent = "TAP TREES 🌳 ONLY. AVOID FACTORIES 🏭.";
        
        const spawn = () => {
            if (!this.currentMinigame.active) return;
            const icon = document.createElement('div');
            const isGood = Math.random() > 0.4;
            icon.className = 'mg-falling-icon';
            icon.textContent = isGood ? '🌳' : '🏭';
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
        document.getElementById('mg-instructions').textContent = "TAP TO ROTATE. ALIGN ALL TO VERTICAL (⬆️).";
        
        const grid = document.createElement('div');
        grid.className = 'mg-wire-grid';
        
        const items = [];
        for (let i=0; i<12; i++) {
            const cell = document.createElement('div');
            cell.className = 'mg-wire-cell';
            const rotation = Math.floor(Math.random() * 4) * 90;
            cell.innerHTML = `<span class="mg-wire-icon" style="transform: rotate(${rotation}deg)">🔌</span>`;
            
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
                { id: 1, text: "🚫 STOP GATHERINGS" },
                { id: 2, text: "🚑 EMERGENCY TREATMENT" },
                { id: 3, text: "💉 MASS VACCINATION" }
            ];
        } else if (s.id === 'war') {
            document.getElementById('mg-instructions').textContent = "MILITARY STRATEGY: INTEL -> STRIKE -> SECURE";
            steps = [
                { id: 1, text: "📡 RECONNAISSANCE" },
                { id: 2, text: "⚔️ PRECISION STRIKE" },
                { id: 3, text: "🛡️ AREA SECURE" }
            ];
        } else if (s.id === 'diplomat') {
            document.getElementById('mg-instructions').textContent = "DIPLOMATIC DE-ESCALATION: HALT -> DIALOGUE -> ACCORD";
            steps = [
                { id: 1, text: "🛑 CEASEFIRE ORDER" },
                { id: 2, text: "🤝 RECONCILIATION TALKS" },
                { id: 3, text: "✍️ PEACE TREATY" }
            ];
        } else {
            document.getElementById('mg-instructions').textContent = "STRATEGIC DEPLOYMENT: INTEL -> STRIKE -> SECURE";
            steps = [
                { id: 1, text: "📡 RECONNAISSANCE" },
                { id: 2, text: "⚔️ PRECISION STRIKE" },
                { id: 3, text: "🛡️ AREA SECURE" }
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
            item.innerHTML = `<span class="handle">☰</span> ${step.text}`;
            item.dataset.id = step.id;
            
            // Drag events
            item.addEventListener('dragstart', () => item.classList.add('dragging'));
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.checkOrdering(list, steps);
            });

            // Click to Swap Logic
            item.onclick = () => {
                if (!this.currentMinigame.activeItem) {
                    this.currentMinigame.activeItem = item;
                    item.classList.add('mg-item-selected');
                } else if (this.currentMinigame.activeItem === item) {
                    this.currentMinigame.activeItem.classList.remove('mg-item-selected');
                    this.currentMinigame.activeItem = null;
                } else {
                    const node1 = this.currentMinigame.activeItem;
                    const node2 = item;
                    const placeholder = document.createElement('div');
                    node1.parentNode.insertBefore(placeholder, node1);
                    node2.parentNode.insertBefore(node1, node2);
                    placeholder.parentNode.insertBefore(node2, placeholder);
                    placeholder.parentNode.removeChild(placeholder);
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
        const currentIds = Array.from(list.children).map(i => parseInt(i.dataset.id));
        const correctCount = currentIds.filter((id, idx) => id === correctSteps[idx].id).length;
        const total = currentIds.length;
        const incorrectCount = total - correctCount;
        const s = this.currentMinigame.specialist;

        // Visual highlight for individual correct items? (Optional, but let's do group success first)
        
        if (correctCount === total) {
            // Success State
            Array.from(list.children).forEach(it => {
                it.classList.add('mg-item-success');
                it.style.pointerEvents = 'none';
            });
            this.renderDialogue(s.name, `PERFECT! ALL ${total} STEPS SYNCHRONIZED.`, s.img, s.talkImg);
            setTimeout(() => this.finishMiniGame(true), 1500);
        } else {
            // Progress feedback
            if (correctCount > 0) {
                this.renderDialogue(s.name, `${correctCount} correct, ${incorrectCount} incorrect. Rearrange the protocol!`, s.img, s.talkImg);
            } else {
                this.renderDialogue(s.name, "none of these are in the right order yet. rethink the sequence!", s.img, s.talkImg);
            }
        }
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
            { name: 'HESTIA [INTELLIGENCE]', text: `LESSON: ${learningLine}`, sprite: 'Character/Hestia/Neutral Sprite.png', talkingSprite: 'Character/Hestia/Neutral Talk Sprite.png' }
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
            this.showToast('success', `${s.name} resolved the crisis!`);
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
        const labels = { budget: 'World Bank', power: 'Energy', influence: 'Influence' };
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
        const total = this.regions.reduce((a,r) => a + (r.stats.health + r.stats.economy + r.stats.stability + (100 - r.stats.pollution))/4, 0);
        return Math.round(total / this.regions.length);
    }
    showToast(type, msg) {
        const container = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.innerHTML = `<span>⚡</span> ${msg}`;
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
        if (this.turn >= this.maxTurns) {
            this.showGameOver(score >= 85);
        }
    }
    showGameOver(won) {
        const overlay = document.getElementById('gameover-overlay');
        overlay.classList.add('visible');
        document.getElementById('go-title').textContent = won ? 'GOLDEN AGE' : 'EXTINCTION';
        document.getElementById('go-message').textContent = won ? 'You balanced the scales.' : 'The weight was too heavy.';
    }
}

let game;
window.addEventListener('DOMContentLoaded', () => { game = new GameEngine(); game.startIntro(); });
