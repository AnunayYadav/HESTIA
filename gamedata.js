// ========== GAME DATA & CONFIG ==========
const SPECIALISTS = [
    { id:'health', name:'Vita', role:'Medical Expert', sdg: 'SDG 3: Good Health & Well-being', emoji:'🏥', img:'Character/6 sages/Medical Expert (Vita)/Neutral State.png', desc:'A dedicated expert in global health, Vita focuses on eradicating diseases and strengthening medical infrastructure.', statBoost:{health:15}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, costs: {power: 20, budget: 30}, specialty: 'Epidemic Eradication', pros: ['High Health Boost', 'Cheap Power Cost'], cons: ['Limited Economy Impact'] },
    { id:'economist', name:'Delta & Sigma', role:'Economists', sdg: 'SDG 8: Economic Growth', emoji:'📊', img:'Character/6 sages/Economist (Delta & Sigma)/Delta Neutral Sprite.jpg', desc:'Delta (Black Haired) and Sigma (White Haired) are a brilliant duo who manage global financial stability through expert market analysis.', statBoost:{economy:15}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, costs: {power: 15, budget: 50}, specialty: 'Market Stabilization', pros: ['Massive Economy Boost', 'Low Power Cost'], cons: ['High Budget Cost'] },
    { id:'war', name:'Virdis', role:'War Commander', sdg: 'SDG 16: Peace & Justice', emoji:'⚔️', img:'Character/6 sages/War Commander (Virdis)/Neutral Sprite.png', desc:'Steadfast for action with a high battle IQ. She remembers every fallen soldier, viewing all wars as a loss for humanity.', statBoost:{stability:20}, statDrain:{economy:-5}, cooldownMax:3, cooldown:0, deployed:null, condition:'conflict', costs: {influence: 40, budget: 40}, specialty: 'Strategic Pacification', pros: ['Best Stability Boost', 'Resilient in War'], cons: ['Negative Economy Drain', 'High Cooldown'] },
    { id:'scientist', name:'Celsius', role:'Head Scientist', sdg: 'SDG 9: Industry & Innovation', emoji:'🔬', img:'Character/6 sages/Scientist (Celsius)/Neutral Sprite.png', desc:'A brilliant mind with zero awareness of anything but research. He operates alone and will go to any lengths for his goals.', statBoost:{sustainability:15,economy:5}, statDrain:{}, cooldownMax:3, cooldown:0, deployed:null, condition:'stable', costs: {power: 30, budget: 100}, specialty: 'Breakthrough Innovation', pros: ['Dual Stat Boost', 'Unlocks Future Tech'], cons: ['Highest Budget Cost', 'Unpredictable Focus'] },
    { id:'diplomat', name:'Carmine', role:'Social Reformer', sdg: 'SDG 17: Partnerships', emoji:'🕊️', img:'Character/6 sages/Social Reformer (Carmine)/Neutral State.png', desc:'A noble who resigned status for the people. Haughty but rewards effort, she possesses frightening knowledge of human society.', statBoost:{stability:10,economy:5}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, costs: {influence: 25, budget: 20}, specialty: 'Societal Harmonization', pros: ['Balanced Multi-Stat Boost', 'High Influence Efficiency'], cons: ['Lower Singular Impact'] },
    { id:'environment', name:'Maris', role:'Ecologist', sdg: 'SDG 13: Climate Action', emoji:'🌿', img:'Character/6 sages/Ecologist (Maris)/Neutral Sprite.png', desc:'An expert ecologist committed to environmental protection, reducing pollution, and restoring the natural balance.', statBoost:{pollution:-15,sustainability:10}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, costs: {influence: 15, budget: 40}, specialty: 'Biodiversity Restoration', pros: ['Best Pollution Reduction', 'Eco-Synergy Boost'], cons: ['Low Stability Focus'] }
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
    "Manage your Budget, Political Power, and Influence carefully. The weight of 40 turns will decide everything.",
    "My specialists await your command. Virdis for the front lines, Carmine for the halls of power, Celsius for the future...",
    "Observe. Predict. Act. Or watch the silence of the void swallow this world."
];

const TUTORIAL_STEPS = [
    { icon:'📊', title:'Resource Management', text:'Budget (💰), Power (⚡), and Influence (🌟) are your lifeblood. Every action—deploying specialists or making decisions—costs resources. If you run out, you cannot intervene.' },
    { icon:'🔮', title:'Predictions', text:'Watch the Right Panel. It contains warnings of impending crises. An epidemic in one region WILL spread to neighbors unless halted. Use this foresight to pre-emptively deploy specialists.' },
    { icon:'🎮', title:'Mini-Games', text:'Responding to major crises now triggers intervention mini-games. Your performance in these determines how effective the resolution is. High skill saves resources and lives.' },
    { icon:'⏳', title:'The 40-Turn Count', text:'You have exactly 40 turns to bring the world into balance. Each turn represents significant global shift. The SDG progress meter must reach 85% by the final turn.' }
];
