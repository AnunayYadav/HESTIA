// ========== ENHANCED GAME ENGINE ==========
class GameEngine {
    constructor() {
        this.turn = 0;
        this.maxTurns = 40;
        this.paused = true;
        this.speed = 1;
        this.selectedSpecialist = null;
        this.selectedRegion = null;
        this.activeEvents = [];
        this.eventLog = [];
        this.gameOver = false;
        this.regions = JSON.parse(JSON.stringify(REGIONS));
        this.specialists = JSON.parse(JSON.stringify(SPECIALISTS));
        this.introPhase = true;
        this.introIndex = 0;
        this.tutorialStep = 0;
        this.gameInterval = null;
        this.simProgress = 0;
        this.simDate = new Date(2024, 0, 1);
        this.resources = { budget: 500, power: 100, influence: 50 };
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
        this.updateAllUI();
    }

    updateAllUI() {
        this.renderSpecialists();
        this.renderRegions();
        this.renderEvents();
        
        // Resources
        const resMap = {
            'res-money': { val: this.resources.budget, prev: this.prevResources.budget },
            'res-power': { val: this.resources.power, prev: this.prevResources.power },
            'res-food': { val: this.resources.influence, prev: this.prevResources.influence }
        };

        Object.entries(resMap).forEach(([id, data]) => {
            const el = document.getElementById(id);
            const valEl = el.querySelector('.res-val span') || el.querySelector('#'+id);
            if (valEl) valEl.textContent = data.val;
            
            if (data.val !== data.prev) {
                const diffClass = data.val > data.prev ? 'res-update-up' : 'res-update-down';
                el.classList.add(diffClass);
                setTimeout(() => el.classList.remove(diffClass), 1000);
            }
        });
        this.prevResources = { ...this.resources };
        
        // Stats
        const gs = this.getGlobalStats();
        const sdg = this.getSDGScore();
        document.getElementById('turn-counter').textContent = `Turn ${this.turn}/${this.maxTurns}`;
        
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
            if (valEl) valEl.textContent = data.val + (id === 'sdg' ? '%' : '');

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
            item.innerHTML = `<span style="text-transform:capitalize">${k}</span>: <span class="sm-cost-val">${v}</span>`;
            costsRow.appendChild(item);
        });

        // HIDE SELECT BUTTON (as requested: info only from sidebar)
        document.getElementById('sm-select-btn').style.display = 'none';

        document.getElementById('spec-modal-overlay').classList.add('visible');
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
        if (cost.budget && this.resources.budget < cost.budget) { this.showToast('danger', 'Insufficient Budget!'); return; }
        if (cost.power && this.resources.power < cost.power) { this.showToast('danger', 'Insufficient Power!'); return; }
        if (cost.influence && this.resources.influence < cost.influence) { this.showToast('danger', 'Insufficient Influence!'); return; }

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
            { text: '💎 Aid (30B)', type: 'aid', cost:{budget:30}, effects:{health:10, economy:-5} },
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
        if (action.cost.budget && this.resources.budget < action.cost.budget) { this.showToast('danger', 'No Budget!'); return; }
        if (action.cost.power && this.resources.power < action.cost.power) { this.showToast('danger', 'No Power!'); return; }
        
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
        if (p.includes('Virdis)/Neutral Sprite.png')) return p.replace('Neutral Sprite.png', 'Neutral Talk Sprite.jpg');
        if (p.includes('Delta Neutral Sprite.jpg')) return p.replace('Neutral', 'Talk');
        if (p.includes('Sigma Neutral Sprite.jpg')) return p.replace('Neutral', 'Talk');
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
        this.narrative.talkingSprite = this.getTalkingSprite(step.sprite);
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
                    this.endNarrative();
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
            this.showToast('danger', `Insufficient Budget (Need 💰${s.costs.budget})`); 
            return; 
        }
        if (s.costs.power && this.resources.power < s.costs.power) { 
            this.showToast('danger', `Insufficient Power (Need ⚡${s.costs.power})`); 
            return; 
        }
        if (s.costs.influence && this.resources.influence < s.costs.influence) { 
            this.showToast('danger', `Insufficient Influence (Need 🌟${s.costs.influence})`); 
            return; 
        }

        // Deduct resources
        this.resources.budget -= (s.costs.budget || 0);
        this.resources.power -= (s.costs.power || 0);
        this.resources.influence -= (s.costs.influence || 0);
        
        // Put on cooldown
        s.cooldown = s.cooldownMax;
        
        const region = this.regions.find(r => r.id === ev.regionId);
        const isMatch = ev.recommendedSpec === s.id;
        const regionName = region ? region.name : 'Global';

        if (isMatch) {
            this.showToast('success', `Expert Intervention! ${s.name} resolved the crisis perfectly.`);
            // Apply bonus stat boosts from specialist
            if (region && region.stats) {
                Object.entries(s.statBoost).forEach(([k, v]) => {
                    region.stats[k] = this.clamp(region.stats[k] + v * 1.5);
                });
            }
            this.addLog(`SUCCESS: ${s.name} resolved ${ev.title} in ${regionName}`);
        } else {
            this.showToast('danger', `Mismatched Roles! ${s.name} is not trained for this crisis. Downfall triggered.`);
            if (region && region.stats) {
                region.stats.economy = this.clamp(region.stats.economy - 15);
                region.stats.stability = this.clamp(region.stats.stability - 20);
                region.stats.health = this.clamp(region.stats.health - 5);
            }
            this.addLog(`FAILURE: ${s.name} failed to handle ${ev.title}. Downfall triggered.`);
        }

        // Remove event and close UI
        this.activeEvents = this.activeEvents.filter(e => String(e.id) !== String(ev.id));
        this.closeDecision();
        this.updateAllUI();
    }

    handleDecision(ev, opt) {
        if (opt.cost) {
            if (this.resources.budget < (opt.cost.budget || 0)) { this.showToast('danger', 'No Budget!'); return; }
            if (this.resources.power < (opt.cost.power || 0)) { this.showToast('danger', 'No Power!'); return; }
            this.resources.budget -= (opt.cost.budget || 0);
            this.resources.power -= (opt.cost.power || 0);
        }
        
        if (opt.minigame) {
            this.closeDecision();
            this.startMinigame(opt.minigame, ev, opt);
        } else {
            this.applyDecisionEffects(ev, opt);
            this.closeDecision();
        }
    }

    applyDecisionEffects(ev, opt, success = true) {
        const r = this.regions.find(rg => rg.id === ev.regionId);
        if (r && r.stats) {
            Object.entries(opt.effects).forEach(([k,v]) => {
                const mod = success ? v : Math.floor(v/3);
                r.stats[k] = this.clamp(r.stats[k] + mod);
            });
            if (success) r.crisis = null;
        }

        if (success) {
            this.showToast('success', 'Crisis mitigated!');
        }
        this.activeEvents = this.activeEvents.filter(e => String(e.id) !== String(ev.id));
        this.updateAllUI();
    }

    // ---- MINI-GAMES ----
    startMinigame(type, event, option) {
        const overlay = document.getElementById('minigame-overlay');
        overlay.classList.add('visible');
        const container = document.getElementById('mg-canvas');
        container.innerHTML = '';
        this.currentMinigame = { type, event, option, score: 0, timeLeft: 10 };
        
        if (type === 'epidemic') {
            document.getElementById('mg-title').textContent = 'STOP THE SPREAD';
            document.getElementById('mg-desc').textContent = 'Click all infected (RED) nodes before time runs out!';
            for (let i=0; i<8; i++) {
                const node = document.createElement('div');
                node.className = 'node-btn infected';
                node.style.left = 10 + Math.random()*80 + '%';
                node.style.top = 10 + Math.random()*80 + '%';
                node.onclick = () => { node.remove(); this.currentMinigame.score++; };
                container.appendChild(node);
            }
        } else if (type === 'economy') {
            document.getElementById('mg-title').textContent = 'ECONOMIC EQUILIBRIUM';
            document.getElementById('mg-desc').textContent = 'Balance the sliders to reach exactly 100 points.';
            const ui = document.getElementById('mg-ui');
            ui.innerHTML = `
                <div class="slider-group"><label>Tax Rate</label><input type="range" class="mg-slider" id="s1" value="30"></div>
                <div class="slider-group"><label>Welfare</label><input type="range" class="mg-slider" id="s2" value="30"></div>
            `;
        } else if (type === 'conflict') {
            document.getElementById('mg-title').textContent = 'PEACE NEGOTIATIONS';
            document.getElementById('mg-desc').textContent = 'Form the correct sequence: Click the nodes in ascending order (1 to 5)!';
            for (let i=1; i<=5; i++) {
                const btn = document.createElement('div');
                btn.className = 'node-btn';
                btn.style.left = 10 + Math.random()*80 + '%';
                btn.style.top = 10 + Math.random()*80 + '%';
                btn.textContent = i;
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';
                btn.style.justifyContent = 'center';
                btn.style.fontWeight = 'bold';
                btn.onclick = () => { 
                    if (i === this.currentMinigame.score + 1) {
                        btn.style.backgroundColor = 'var(--accent-green)';
                        this.currentMinigame.score++;
                    }
                };
                container.appendChild(btn);
            }
        } else if (type === 'sustainability') {
            document.getElementById('mg-title').textContent = 'POLLUTION CLEANUP';
            document.getElementById('mg-desc').textContent = 'Collect pollution sources (🏭), avoid trees (🌳)! Score 5 points to win.';
            for (let i=0; i<12; i++) {
                const isPollution = i < 7;
                const node = document.createElement('div');
                node.className = 'node-btn';
                node.style.left = 10 + Math.random()*80 + '%';
                node.style.top = 10 + Math.random()*80 + '%';
                node.style.backgroundColor = 'transparent';
                node.style.border = 'none';
                node.style.fontSize = '1.8rem';
                node.textContent = isPollution ? '🏭' : '🌳';
                node.onclick = () => {
                    node.style.display = 'none';
                    if (isPollution) {
                        this.currentMinigame.score++;
                    } else {
                        this.currentMinigame.score -= 2;
                    }
                };
                container.appendChild(node);
            }
        }

        const timer = setInterval(() => {
            this.currentMinigame.timeLeft--;
            document.getElementById('mg-timer').textContent = this.currentMinigame.timeLeft + 's';
            if (this.currentMinigame.timeLeft <= 0) {
                clearInterval(timer);
                this.finishMinigame();
            }
        }, 1000);

        document.getElementById('mg-submit').onclick = () => { clearInterval(timer); this.finishMinigame(); };
    }

    finishMinigame() {
        const mg = this.currentMinigame;
        let success = false;
        if (mg.type === 'epidemic') success = document.getElementById('mg-canvas').children.length === 0;
        if (mg.type === 'economy') {
            const v1 = parseInt(document.getElementById('s1').value);
            const v2 = parseInt(document.getElementById('s2').value);
            success = (v1 + v2 > 50 && v1 + v2 < 150);
        }
        if (mg.type === 'conflict') {
            success = mg.score >= 5;
        }
        if (mg.type === 'sustainability') {
            success = mg.score >= 5;
        }
        
        document.getElementById('minigame-overlay').classList.remove('visible');
        this.applyDecisionEffects(mg.event, mg.option, success);
        this.showToast(success ? 'success' : 'warning', success ? 'MISSION SUCCESS!' : 'EFFORT FAILED');
    }

    // ---- HELPERS ----
    renderEffects(eff) {
        return Object.entries(eff).map(([k,v]) => `<span class="effect-tag ${v>=0?'positive':'negative'}">${k.toUpperCase()} ${v>=0?'+'+v:v}</span>`).join('');
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
