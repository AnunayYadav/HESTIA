// ========== GAME DATA & CONFIG ==========
const getSpecData = (id) => window.HESTIA_PERSONALITIES && window.HESTIA_PERSONALITIES[id] ? window.HESTIA_PERSONALITIES[id] : { name: 'Unknown', visuals: { hair: 'N/A', eyes: 'N/A' }, sdg: 'N/A', personality: 'N/A' };

const SPECIALISTS = [
    { 
        id:'health', 
        name: getSpecData('health').name,
        role: 'Medical Expert', 
        sdg: getSpecData('health').sdg, 
        personality: getSpecData('health').personality,
        visuals: getSpecData('health').visuals,
        emoji:'🏥', 
        img:'Character/6 sages/Medical Expert (Vita)/Neutral State.png', 
        talkImg: 'Character/6 sages/Medical Expert (Vita)/Talking State.png', 
        desc:'A weary medical genius who values life above all. She saved the world once and would rather be in a back-alley clinic than high command.', 
        statBoost:{health:15}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, 
        costs: {power: 20, budget: 30}, 
        deploymentCost: 200, maintenance: 45,
        baseStats: { int: 95, per: 60, lea: 75, res: 88 },
        pros: ['Rapid disease containment', 'Boosts regional health recovery', 'Low energy consumption'],
        cons: ['High budget per mission', 'Low persuasion in political crises', 'Easily fatigued'],
        specialty: 'Epidemic Eradication'
    },
    { 
        id:'economist', 
        name: getSpecData('economist').name,
        role: 'Economists', 
        sdg: getSpecData('economist').sdg, 
        personality: getSpecData('economist').personality,
        visuals: getSpecData('economist').visuals,
        emoji:'📊', 
        img:'Character/6 sages/Economist (Delta & Sigma)/Delta Neutral Sprite.png', 
        talkImg: 'Character/6 sages/Economist (Delta & Sigma)/Delta Talk Sprite.png', 
        desc:'Orphaned twins turned financial masterminds. They manipulate the flow of money as if it were fortune itself.', 
        statBoost:{economy:15}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, 
        costs: {power: 15, budget: 50}, 
        deploymentCost: 350, maintenance: 80,
        baseStats: { int: 92, per: 85, lea: 70, res: 65 },
        pros: ['Vast market stabilization', 'Generates passive income', 'Exceptional data analysis'],
        cons: ['High maintenance costs', 'Poor social outreach', 'Risky fiscal maneuvers'],
        specialty: 'Market Stabilization'
    },
    { 
        id:'war', 
        name: getSpecData('war').name,
        role: 'War Commander', 
        sdg: getSpecData('war').sdg, 
        personality: getSpecData('war').personality,
        visuals: getSpecData('war').visuals,
        emoji:'⚔️', 
        img:'Character/6 sages/War Commander (Virdis)/Neutral Sprite.png', 
        talkImg: 'Character/6 sages/War Commander (Virdis)/Neutral Talk Sprite.png', 
        desc:'The klutzy commander with a frighteningly high battle IQ. She remembers the name of every soldier she couldn\'t save.', 
        statBoost:{stability:20}, statDrain:{economy:-5}, cooldownMax:3, cooldown:0, deployed:null, condition:'conflict', 
        costs: {influence: 40, budget: 40}, 
        deploymentCost: 500, maintenance: 120,
        baseStats: { int: 88, per: 40, lea: 98, res: 95 },
        pros: ['Absolute martial authority', 'Instant conflict resolution', 'Unrivaled tactical insight'],
        cons: ['Drains economic resources', 'Tactless in diplomacy', 'Long mission cooldowns'],
        specialty: 'Strategic Pacification'
    },
    { 
        id:'scientist', 
        name: getSpecData('scientist').name,
        role: 'Head Scientist', 
        sdg: getSpecData('scientist').sdg, 
        personality: getSpecData('scientist').personality,
        visuals: getSpecData('scientist').visuals,
        emoji:'🔬', 
        img:'Character/6 sages/Scientist (Celsius)/Neutral Sprite.png', 
        talkImg: 'Character/6 sages/Scientist (Celsius)/Talk Sprite.png', 
        desc:'A socially oblivious genius who would sacrifice his house—and yours—for the sake of a single breakthrough.', 
        statBoost:{sustainability:15,economy:5}, statDrain:{}, cooldownMax:3, cooldown:0, deployed:null, condition:'stable', 
        costs: {power: 30, budget: 100}, 
        deploymentCost: 600, maintenance: 150,
        baseStats: { int: 99, per: 30, lea: 55, res: 70 },
        pros: ['Long-term tech advantages', 'Boosts sustainability stats', 'High innovation yield'],
        cons: ['Extremely expensive', 'Disregards public safety', 'Slow research cycles'],
        specialty: 'Breakthrough Innovation'
    },
    { 
        id:'diplomat', 
        name: getSpecData('diplomat').name,
        role: 'Social Reformer', 
        sdg: getSpecData('diplomat').sdg, 
        personality: getSpecData('diplomat').personality,
        visuals: getSpecData('diplomat').visuals,
        emoji:'🕊️', 
        img:'Character/6 sages/Social Reformer (Carmine)/Neutral State.png', 
        talkImg: 'Character/6 sages/Social Reformer (Carmine)/Talk State.png', 
        desc:'The noble who resigned for the people. Demanding, regal, yet fiercely protective of those under her command.', 
        statBoost:{stability:10,economy:5}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, 
        costs: {influence: 25, budget: 20}, 
        deploymentCost: 150, maintenance: 30,
        baseStats: { int: 75, per: 97, lea: 90, res: 82 },
        pros: ['Prevents civil unrest', 'High diplomatic influence', 'Lowers regional corruption'],
        cons: ['Requires high prestige', 'Ineffective in direct combat', 'Elitist approach'],
        specialty: 'Societal Harmonization'
    },
    { 
        id:'environment', 
        name: getSpecData('environment').name,
        role: 'Ecologist', 
        sdg: getSpecData('environment').sdg, 
        personality: getSpecData('environment').personality,
        visuals: getSpecData('environment').visuals,
        emoji:'🌿', 
        img:'Character/6 sages/Ecologist (Maris)/Neutral Sprite.png', 
        talkImg: 'Character/6 sages/Ecologist (Maris)/Talk Sprite.png', 
        desc:'A timid soul with a vast knowledge of the natural world. She speaks for the trees and the life they harbor.', 
        statBoost:{pollution:-15,sustainability:10}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, 
        costs: {influence: 15, budget: 40}, 
        deploymentCost: 250, maintenance: 55,
        baseStats: { int: 82, per: 65, lea: 40, res: 90 },
        pros: ['Major pollution reduction', 'Reverses habitat loss', 'High public sympathy'],
        cons: ['Lacks political weight', 'Slow to enact major shifts', 'Physically fragile'],
        specialty: 'Biodiversity Restoration'
    }
];

const REGIONS = [
    { id:'northern', name:'Northern Highlands', gov:'democratic', leader:'Chancellor Aldric', leaderPersonality: 'A pragmatic diplomat who prioritizes stable growth over rapid, unchecked expansion.', x:'9%', y:'12%', w:'30%', h:'30%',
      stats:{pollution:30,health:65,economy:60,stability:70,sustainability:55}, 
      details: { population: '840M', gdp: '$4.2T', growth: '+2.1%', info: 'The industrial heartland of the world, specializing in heavy manufacturing and tech exports.' },
      crisis:null, connections:['eastern','central'] },
    { id:'eastern', name:'Eastern Shores', gov:'unstable', leader:'Warlord Kael', leaderPersonality: 'Aggressive and unpredictable. Relies on force and fear to maintain whatever little control he has.', x:'56%', y:'10%', w:'36%', h:'36%',
      stats:{pollution:45,health:50,economy:45,stability:35,sustainability:30}, 
      details: { population: '1.2B', gdp: '$2.8T', growth: '-1.5%', info: 'A maritime hub struggling with coastal erosion and persistent internal conflicts.' },
      crisis:'unrest', connections:['northern','central','southern'] },
    { id:'central', name:'Central Expanse', gov:'democratic', leader:'Premier Lysa', leaderPersonality: 'Charismatic and reform-minded. Struggles with balancing the old guard against progressive ideals.', x:'16%', y:'45%', w:'38%', h:'35%',
      stats:{pollution:35,health:60,economy:55,stability:60,sustainability:50}, 
      details: { population: '2.1B', gdp: '$6.5T', growth: '+4.8%', info: 'The breadbasket of the globe, managing vast agricultural plains and emerging tech cities.' },
      crisis:null, connections:['northern','eastern','southern'] },
    { id:'southern', name:'Southern Dominion', gov:'authoritarian', leader:'Overseer Dren', leaderPersonality: 'Calculated and iron-fisted. Rules with absolute authority, ensuring maximum efficiency at a high human cost.', x:'55%', y:'52%', w:'36%', h:'42%',
      stats:{pollution:60,health:45,economy:70,stability:50,sustainability:20}, 
      details: { population: '950M', gdp: '$5.1T', growth: '+1.2%', info: 'A resource-rich territory with high levels of industrial output but severe social inequality.' },
      crisis:null, connections:['eastern','central'] }
];

const GOV_BEHAVIORS = {
    democratic: { stabilityMod:0.02, economyMod:0.01, corruptionChance:0.05 },
    corrupt: { stabilityMod:-0.02, economyMod:-0.01, corruptionChance:0.2 },
    fascist: { stabilityMod:0.01, economyMod:-0.02, corruptionChance:0.15 },
    unstable: { stabilityMod:-0.03, economyMod:-0.02, corruptionChance:0.1 },
    authoritarian: { stabilityMod:0.01, economyMod:0.01, corruptionChance:0.12 }
};

const EVENT_TEMPLATES = [
    { 
        id:'epidemic', type:'health', recommendedSpec:'health', icon:'🦠', 
        title:'Pathogen Surge in {region}', 
        desc:'Rapid viral transmission detected. Fragile health systems are nearing collapse.', 
        learningFact:'SDG 3 focuses on "Good Health and Well-being." Strengthening immunization and healthcare infrastructure prevents global contagion.',
        sdgTarget:'SDG 3 (Global Health)', severity:'high',
        options:[
            { text:'Emergency Quarantine', effects:{health:10,economy:-15,stability:-10}, cost:{budget:50, power:30}, tags:[{t:'Health +10',c:'positive'},{t:'Economy -15',c:'negative'}] }
        ], hestia:'Pathogens respect no borders. Will you act before the first wave becomes a flood?', spreads:'health' 
    },
    { 
        id:'economic_crash', type:'economy', recommendedSpec:'economist', icon:'📉', 
        title:'Market Instability in {region}', 
        desc:'Currency devaluation and inflation are eroding the middle class.', 
        learningFact:'SDG 8 promotes "Decent Work and Economic Growth." Balanced fiscal policy prevents systemic poverty and keeps societies stable.',
        sdgTarget:'SDG 8 (Decent Work)', severity:'high',
        options:[
            { text:'Market Intervention', effects:{economy:10,stability:-15,health:-5}, cost:{influence:50}, tags:[{t:'Economy +10',c:'positive'},{t:'Stability -15',c:'negative'}] }
        ], hestia:'Wealth is ephemeral, but poverty is persistent. Command the markets or they will command you.', spreads:'economy' 
    },
    { 
        id:'war', type:'stability', recommendedSpec:'war', icon:'⚔️', 
        title:'Geopolitical Tension in {region}', 
        desc:'Border disputes have escalated into tactical skirmishes.', 
        learningFact:'SDG 16 is "Peace, Justice and Strong Institutions." Lasting progress is impossible without de-escalation and rule of law.',
        sdgTarget:'SDG 16 (Peace & Justice)', severity:'high',
        options:[
            { text:'Peacekeeping Force', effects:{stability:5,economy:-20}, cost:{power:40}, tags:[{t:'Stability +5',c:'positive'},{t:'Economy -20',c:'negative'}] }
        ], hestia:'The drums of war drown out the songs of progress. Virdis is ready to silence them.', spreads:'stability' 
    },
    { 
        id:'pollution', type:'pollution', recommendedSpec:'environment', icon:'🏭', 
        title:'Ecological Crisis in {region}', 
        desc:'Toxic runoff from heavy industry is contaminating the water table.', 
        learningFact:'SDG 13 covers "Climate Action." Carbon neutral industry and waste management are vital for a breathable future.',
        sdgTarget:'SDG 13 (Climate Action)', severity:'medium',
        options:[
            { text:'Green Infrastructure', effects:{pollution:-10,sustainability:15}, cost:{budget:100}, tags:[{t:'Pollution -10',c:'positive'},{t:'Sustainability +15',c:'positive'}] }
        ], hestia:'The earth is a closed system. What we pour into it eventually returns to us.' 
    },
    { 
        id:'civil_unrest', type:'stability', recommendedSpec:'diplomat', icon:'📢', 
        title:'Social Fragility in {region}', 
        desc:'Widespread distrust of local governance has led to massive civil strikes.', 
        learningFact:'SDG 17 emphasizes "Partnerships for the Goals." Inclusive dialogue prevents radicalization and builds social capital.',
        sdgTarget:'SDG 17 (Partnerships)', severity:'medium',
        options:[
            { text:'Diplomatic Summit', effects:{stability:5,health:-10}, cost:{power:30}, tags:[{t:'Stability +5',c:'positive'},{t:'Health -10',c:'negative'}] }
        ], hestia:'A kingdom divided cannot serve its people. Carmine will find the common thread.' 
    },
    { 
        id:'tech_gap', type:'economy', recommendedSpec:'scientist', icon:'🔬', 
        title:'Innovation Deficit in {region}', 
        desc:'A lack of digital infrastructure is creating a knowledge-based inequality gap.', 
        learningFact:'SDG 9 covers "Industry, Innovation and Infrastructure." Equal tech access is the fastest path to global equilibrium.',
        sdgTarget:'SDG 9 (Innovation)', severity:'medium',
        options:[
            { text:'Digital Grants', effects:{economy:5,sustainability:5}, cost:{budget:80}, tags:[{t:'Economy +5',c:'positive'},{t:'Sustainability +5',c:'positive'}] }
        ], hestia:'Ignorance is the only true darkness. Celsius will shed light on the unseen.' 
    }
];

const INTRO_DIALOGUES = [
    "Mortal... I am Hestia, Goddess of Balance. Welcome to the Aegis.",
    "The world is fractured, its scales broken. I have summoned you to be the arbiter of its fate.",
    "As Controller of the World Government, you possess tools no nation can match—but your resources are finite.",
    "Manage your World Bank, Energy Grid, and Global Influence carefully. The weight of 40 turns will decide everything.",
    "My specialists await your command. Virdis for the front lines, Carmine for the halls of power, Celsius for the future...",
    "Observe. Predict. Act. Or watch the silence of the void swallow this world."
];

const TUTORIAL_STEPS = [
    { icon:'📊', title:'Resource Management', text:'World Bank (💰), Energy (⚡), and Influence (🥖) are your lifeblood. Every action—deploying specialists or making decisions—costs resources. If you run out, you cannot intervene.' },
    { icon:'🔮', title:'Predictions', text:'Watch the Right Panel. It contains warnings of impending crises. An epidemic in one region WILL spread to neighbors unless halted. Use this foresight to pre-emptively deploy specialists.' },
    { icon:'🎮', title:'Mini-Games', text:'Responding to major crises now triggers intervention mini-games. Your performance in these determines how effective the resolution is. High skill saves resources and lives.' },
    { icon:'⏳', title:'The 40-Turn Count', text:'You have exactly 40 turns to bring the world into balance. Each turn represents significant global shift. The SDG progress meter must reach 85% by the final turn.' }
];
