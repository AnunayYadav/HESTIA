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
        emoji:'/assets/icons/health.svg', 
        img:'/assets/characters/health/neutral.png', 
        talkImg: '/assets/characters/health/talk.png', 
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
        emoji:'/assets/icons/economy.svg', 
        img:'/assets/characters/economist/neutral.png', 
        talkImg: '/assets/characters/economist/talk.png', 
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
        emoji:'/assets/icons/stability.svg', 
        img:'/assets/characters/war/neutral.png', 
        talkImg: '/assets/characters/war/talk.png', 
        desc:'The klutzy commander with a frighteningly high battle IQ. She remembers the name of every soldier she couldn\'t save.', 
        statBoost:{stability:20}, statDrain:{economy:-5}, cooldownMax:3, cooldown:0, deployed:null, condition:'conflict', 
        costs: {food: 40, budget: 40}, 
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
        emoji:'/assets/icons/energy.svg', 
        img:'/assets/characters/scientist/neutral.png', 
        talkImg: '/assets/characters/scientist/talk.png', 
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
        emoji:'/assets/icons/stability.svg', 
        img:'/assets/characters/diplomat/neutral.png', 
        talkImg: '/assets/characters/diplomat/talk.png', 
        desc:'The noble who resigned for the people. Demanding, regal, yet fiercely protective of those under her command.', 
        statBoost:{stability:10,economy:5}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, 
        costs: {food: 25, budget: 20}, 
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
        emoji:'/assets/icons/pollution.svg', 
        img:'/assets/characters/environment/neutral.png', 
        talkImg: '/assets/characters/environment/talk.png', 
        desc:'A timid soul with a vast knowledge of the natural world. She speaks for the trees and the life they harbor.', 
        statBoost:{pollution:-15,sustainability:10}, statDrain:{}, cooldownMax:2, cooldown:0, deployed:null, condition:null, 
        costs: {food: 15, budget: 40}, 
        deploymentCost: 250, maintenance: 55,
        baseStats: { int: 82, per: 65, lea: 40, res: 90 },
        pros: ['Major pollution reduction', 'Reverses habitat loss', 'High public sympathy'],
        cons: ['Lacks political weight', 'Slow to enact major shifts', 'Physically fragile'],
        specialty: 'Biodiversity Restoration'
    }
];

const REGIONS = [
    { 
        id:'northern', name:'Northern Highlands', gov:'democratic', leader:'Chancellor Aldric', 
        leaderPersonality: 'A pragmatic diplomat who prioritizes stable growth over rapid, unchecked expansion.', 
        x:'9%', y:'12%', w:'30%', h:'30%',
        stats:{pollution:30,health:65,economy:60,stability:70,sustainability:55}, 
        details: { 
            population: '840M', gdp: '$4.2T', growth: '+2.1%', 
            info: 'The industrial heartland of the world, specializing in heavy manufacturing, advanced semiconductors, and tech exports. Their northern mountain ranges are rich in rare earth minerals, fueling a cutting-edge weapons and electronics industry. A robust universal healthcare system and public education network make this the most developed region by HDI.',
            history: 'Once a collection of warring mountain clans, the Highlands unified three centuries ago under the Great Accord — a landmark treaty brokered after the devastating Ironblood Wars. Their history is defined by the Industrial Ascent, a 150-year period of explosive growth that transformed isolated mining communities into world-leading manufacturing hubs. This prosperity came at a heavy environmental cost: three major rivers are now classified as dead zones, and the Ironsmog Crisis of 2018 saw air quality plummet to hazardous levels across 40% of the territory. Today, they chair the Global Council but face rising pressures to green their heavy industries while maintaining employment for the 200 million workers in legacy manufacturing.',
            sdg_goals: ['SDG 7: Affordable and Clean Energy', 'SDG 12: Responsible Consumption and Production', 'SDG 13: Climate Action'],
            sdg_achieved: ['SDG 4: Quality Education', 'SDG 9: Industry, Innovation and Infrastructure'],
            sdg_notes: 'The Highlands lead globally in SDG 4 and SDG 9 due to their universal education mandate and massive infrastructure investment. However, their heavy industrial base makes SDG 13 (Climate Action) their greatest challenge. Current policy aims to transition 30% of energy grid to renewables by the next decade, but political resistance from the mining unions slows progress.',
            philosophy: 'Technocratic Democracy. They believe that through scientific advancement and democratic oversight, the world can achieve a "Post-Scarcity" equilibrium. Policy is driven by data analysis and expert councils rather than populist sentiment.',
            govSystem: 'Parliamentary Technocracy',
            econModel: 'Mixed Market with State-Led R&D',
            policies: [
                { name: 'Green Transition Act', type: 'energy', desc: 'Mandates 30% renewable energy by next decade. Subsidizes solar and wind while phasing out coal.', status: 'active' },
                { name: 'Universal Education Mandate', type: 'social', desc: 'Free education through university. STEM focus with mandatory sustainability curriculum.', status: 'achieved' },
                { name: 'Northern Shield Doctrine', type: 'defense', desc: 'Maintains a defensive military posture. No first-strike policy. Allied with Central Expanse.', status: 'active' },
                { name: 'Fair Trade Protocol', type: 'trade', desc: 'Tariff-free trade with democratic nations. 15% tariff on authoritarian imports.', status: 'active' }
            ],
            relations: [
                { region: 'Eastern Shores', status: 'tense', desc: 'Strained due to border disputes and Eastern piracy. Humanitarian aid channels remain open.' },
                { region: 'Central Expanse', status: 'allied', desc: 'Strong economic and military alliance. Joint research programs in clean energy.' },
                { region: 'Southern Dominion', status: 'neutral', desc: 'Trade partner but ideological rivals. Highlands condemn Dominion labor practices.' }
            ],
            econProfile: {
                tradeBalance: '+$180B',
                exports: 'Semiconductors, Military Tech, Pharmaceuticals',
                industries: 'Manufacturing, Mining, Biotech, Aerospace',
                debt: '42% of GDP',
                unemployment: '4.2%',
                giniIndex: '0.31 (Low Inequality)'
            }
        },
        crisis:null, connections:['eastern','central'] 
    },
    { 
        id:'eastern', name:'Eastern Shores', gov:'unstable', leader:'Warlord Kael', 
        leaderPersonality: 'Aggressive and unpredictable. Relies on force and fear to maintain whatever little control he has.', 
        x:'56%', y:'10%', w:'36%', h:'36%',
        stats:{pollution:45,health:50,economy:45,stability:35,sustainability:30}, 
        details: { 
            population: '1.2B', gdp: '$2.8T', growth: '-1.5%', 
            info: 'A maritime hub struggling with severe coastal erosion, overfishing crises, and persistent internal conflicts between rival warlords. Once the jewel of global trade, its port cities now lie in varying states of disrepair. Despite this, the Shores possess the richest marine biodiversity on the planet, and their deep-water fishing fleets supply 35% of global seafood.',
            history: 'The Shores were the birthplace of the Age of Sail, thriving as the world\'s primary trade route for five centuries. Their merchant fleets once numbered over 10,000 vessels, and the "Golden Harbors" era saw unprecedented cultural exchange and wealth creation. However, the centralization of global trade through digital corridors and overland hyperloop networks left their ports idle. This economic vacuum birthed the Warlord Era, where various factions — the Tide Lords, the Reef Coalition, and Kael\'s Iron Fleet — fight for control of the remaining naval scrap yards and fishing territories. The humanitarian crisis is acute: 40% of the population lacks clean drinking water, and child mortality rates are the highest globally.',
            sdg_goals: ['SDG 14: Life Below Water', 'SDG 16: Peace, Justice and Strong Institutions', 'SDG 2: Zero Hunger'],
            sdg_achieved: ['SDG 1: No Poverty (Historical — now reversed)'],
            sdg_notes: 'The Shores\' once-laudable achievement of eradicating extreme poverty has collapsed under warlord rule. SDG 14 is critical here — their marine ecosystems are being destroyed by unregulated trawling. SDG 16 is the prerequisite for all other progress: without institutional stability, aid programs are seized by factions. Any intervention must prioritize governance before economic aid.',
            philosophy: 'Factional Mercantilism. The region is governed by trade-lords, where peace is often a commodity bought with resources or blood. There is no unified governing philosophy — each faction operates by its own code.',
            govSystem: 'Warlord Confederation (De Facto)',
            econModel: 'Black Market Dominated / Subsistence',
            policies: [
                { name: 'Martial Law Decree', type: 'defense', desc: 'Kael enforces control through military checkpoints. Civilian movement restricted after dark.', status: 'active' },
                { name: 'Fishing Rights Auction', type: 'trade', desc: 'Fishing territories sold to highest bidder. Leads to overfishing and ecological collapse.', status: 'active' },
                { name: 'Child Soldier Ban (Unenforced)', type: 'social', desc: 'Technically prohibited but widely ignored by splinter factions.', status: 'failed' },
                { name: 'Port Reconstruction Initiative', type: 'trade', desc: 'Funded by Northern Highlands aid. Rebuilding three major harbors.', status: 'stalled' }
            ],
            relations: [
                { region: 'Northern Highlands', status: 'tense', desc: 'Accepts humanitarian aid but resents political conditions attached. Border skirmishes ongoing.' },
                { region: 'Central Expanse', status: 'trade', desc: 'Major food importer from the Expanse. Trade is the only stable connection.' },
                { region: 'Southern Dominion', status: 'hostile', desc: 'Active proxy conflicts. Dominion arms rival factions to destabilize Kael\'s control.' }
            ],
            econProfile: {
                tradeBalance: '-$90B',
                exports: 'Seafood, Salvage Materials, Rare Corals',
                industries: 'Fishing, Ship Breaking, Black Market Trade',
                debt: '110% of GDP (Foreign Held)',
                unemployment: '38%',
                giniIndex: '0.62 (Extreme Inequality)'
            }
        },
        crisis:'unrest', connections:['northern','central','southern'] 
    },
    { 
        id:'central', name:'Central Expanse', gov:'democratic', leader:'Premier Lysa', 
        leaderPersonality: 'Charismatic and reform-minded. Struggles with balancing the old guard against progressive ideals.', 
        x:'16%', y:'45%', w:'38%', h:'35%',
        stats:{pollution:35,health:60,economy:55,stability:60,sustainability:50}, 
        details: { 
            population: '2.1B', gdp: '$6.5T', growth: '+4.8%', 
            info: 'The breadbasket of the globe, managing vast agricultural plains that produce 60% of the world\'s food supply. The recent "Silicon Plains" initiative has transformed dusty farm towns into neon-drenched megahubs, creating a cultural friction between traditionalist farmers and progressive tech workers. The Expanse also hosts the world\'s largest fresh water reserves, making it a critical ally for any water-scarce nation.',
            history: 'Formed from the remains of the Old Empire, a hegemonic civilization that collapsed under the weight of its own bureaucracy and a series of devastating droughts. The Expanse is now a melting pot of dozens of cultures, languages, and traditions. Premier Lysa rose to power through the Agrarian Revolution, a peaceful movement that demanded land reform and data-driven farming. Her government introduced the "Every Field Connected" program, bringing satellite irrigation and AI crop management to even the most remote villages. However, the rapid urbanization of the Silicon Plains has created a growing wealth divide between the "Planters" (rural traditionalists) and "Coders" (urban progressives). This tension defines current politics.',
            sdg_goals: ['SDG 10: Reduced Inequalities', 'SDG 11: Sustainable Cities and Communities', 'SDG 5: Gender Equality'],
            sdg_achieved: ['SDG 2: Zero Hunger', 'SDG 6: Clean Water and Sanitation'],
            sdg_notes: 'The Expanse is the global leader in food security (SDG 2) and water management (SDG 6). Their challenge lies in SDG 10 — the explosive growth of tech hubs has created a two-speed economy where rural communities feel abandoned. SDG 5 is also a target, as traditional farming communities maintain patriarchal structures. Premier Lysa\'s reforms face fierce opposition from the Old Guard.',
            philosophy: 'Social Progressivism. They strive for a world where labor is honored and the benefits of automation are shared equally among all citizens. The Expanse believes in collective ownership of natural resources.',
            govSystem: 'Federal Democracy with Regional Councils',
            econModel: 'Agrarian-Tech Hybrid / Social Market',
            policies: [
                { name: 'Every Field Connected', type: 'trade', desc: 'AI-driven satellite irrigation for all farms. Boosted crop yield by 40%.', status: 'achieved' },
                { name: 'Silicon Plains Act', type: 'social', desc: 'Tax incentives for tech companies in rural zones. Created 5M jobs but widened wealth gap.', status: 'active' },
                { name: 'Gender Parity Mandate', type: 'social', desc: 'Requires 40% female representation in all government bodies. Partially implemented.', status: 'active' },
                { name: 'Water Commons Treaty', type: 'energy', desc: 'Freshwater reserves are public commons. Export regulated to prevent hoarding.', status: 'active' }
            ],
            relations: [
                { region: 'Northern Highlands', status: 'allied', desc: 'Technology-for-food exchange program. Joint military exercises annually.' },
                { region: 'Eastern Shores', status: 'trade', desc: 'Primary food supplier to the Shores. Aid convoys protected by Expanse navy.' },
                { region: 'Southern Dominion', status: 'tense', desc: 'Ideological rivals. Dominion\'s labor practices conflict with Expanse values. Trade continues pragmatically.' }
            ],
            econProfile: {
                tradeBalance: '+$320B',
                exports: 'Grain, Freshwater, AgriTech Software, Livestock',
                industries: 'Agriculture, Water Management, Tech Startups, Renewable Energy',
                debt: '28% of GDP',
                unemployment: '6.1%',
                giniIndex: '0.39 (Rising Inequality)'
            }
        },
        crisis:null, connections:['northern','eastern','southern'] 
    },
    { 
        id:'southern', name:'Southern Dominion', gov:'authoritarian', leader:'Overseer Dren', 
        leaderPersonality: 'Calculated and iron-fisted. Rules with absolute authority, ensuring maximum efficiency at a high human cost.', 
        x:'55%', y:'52%', w:'36%', h:'42%',
        stats:{pollution:60,health:45,economy:70,stability:50,sustainability:20}, 
        details: { 
            population: '950M', gdp: '$5.1T', growth: '+1.2%', 
            info: 'A resource-rich territory with the highest industrial output in the world but severe social inequality and crushing environmental degradation. The Dominion\'s mantle mining operations extract minerals from deeper than any other nation, but the ecological cost is staggering: 70% of surface waterways are contaminated, and respiratory disease is the leading cause of death. Despite this, Dominion-made goods — from steel to electronics — are the cheapest globally, undercutting all competitors.',
            history: 'The Dominion was once a scattered archipelago of independent city-states, each specializing in a different craft. Overseer Dren\'s grandfather, the "Iron Patriarch," unified them through the Titan Project — an unprecedented deep-mantle mining operation that required the forced relocation of 50 million people. This created immense mineral wealth but chained the population to a life of industrial servitude. The current Overseer maintains control through the "Efficiency Doctrine": every citizen is assigned a productivity score, and social benefits are tied to output. Dissent is suppressed through the Bureau of Harmony, a state surveillance apparatus. Underground resistance movements, particularly the "Green Vein" eco-activists, have been growing in strength.',
            sdg_goals: ['SDG 3: Good Health and Well-being', 'SDG 15: Life on Land', 'SDG 13: Climate Action'],
            sdg_achieved: ['SDG 8: Decent Work and Economic Growth (Metrics Only — achieved by raw output, not quality)'],
            sdg_notes: 'The Dominion\'s SDG 8 "achievement" is controversial — while GDP per capita and employment numbers are high, working conditions are brutal and wages suppressed. SDG 3 is critical: life expectancy is a full 15 years below the Highland average due to pollution. SDG 15 is aspirational at best — deforestation and mining have destroyed 60% of original ecosystems. Any real progress requires systemic reform that Overseer Dren has no incentive to pursue.',
            philosophy: 'Industrial Efficiency. Every citizen is a cog in the national machine. Order is maintained through meticulous surveillance and resource quotas. The state believes that individual sacrifice for collective industrial output is the highest form of patriotism.',
            govSystem: 'Authoritarian Techno-State',
            econModel: 'State Capitalism / Command Economy',
            policies: [
                { name: 'Efficiency Doctrine', type: 'social', desc: 'Citizens receive social benefits based on productivity scores. Low scores result in reduced rations.', status: 'active' },
                { name: 'Titan Expansion Program', type: 'trade', desc: 'Expanding deep-mantle mining to new territories. Expected to double rare mineral output.', status: 'active' },
                { name: 'Bureau of Harmony', type: 'defense', desc: 'State surveillance network monitoring all communications. Dissent classified as "inefficiency."', status: 'active' },
                { name: 'Export Dominance Strategy', type: 'trade', desc: 'Subsidize exports to undercut global competitors. Maintain trade surplus at all costs.', status: 'active' }
            ],
            relations: [
                { region: 'Northern Highlands', status: 'neutral', desc: 'Trade partner despite ideological differences. Highlands buy rare minerals; Dominion buys tech.' },
                { region: 'Eastern Shores', status: 'hostile', desc: 'Actively destabilizing through proxy factions. Seeks control of Shores\' shipping lanes.' },
                { region: 'Central Expanse', status: 'tense', desc: 'Competes for agricultural dominance. Dominion accuses Expanse of "weaponizing food exports."' }
            ],
            econProfile: {
                tradeBalance: '+$450B',
                exports: 'Rare Earth Minerals, Steel, Electronics, Industrial Chemicals',
                industries: 'Deep Mining, Heavy Manufacturing, State Construction, Surveillance Tech',
                debt: '15% of GDP (State Controlled)',
                unemployment: '1.8% (Forced Employment)',
                giniIndex: '0.58 (Severe Inequality)'
            }
        },
        crisis:null, connections:['eastern','central'] 
    }
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
        id:'epidemic', type:'health', recommendedSpec:'health', icon:'/assets/icons/health.svg', 
        title:'Pathogen Surge in {region}', 
        desc:'Rapid viral transmission detected. Fragile health systems are nearing collapse.', 
        learningFact:'SDG 3 focuses on "Good Health and Well-being." Strengthening immunization and healthcare infrastructure prevents global contagion.',
        sdgTarget:'SDG 3 (Global Health)', severity:'high',
        options:[
            { text:'Emergency Quarantine', effects:{health:10,economy:-15,stability:-10}, cost:{budget:50, power:30}, tags:[{t:'Health +10',c:'positive'},{t:'Economy -15',c:'negative'}] }
        ], hestia:'Pathogens respect no borders. Will you act before the first wave becomes a flood?', spreads:'health' 
    },
    { 
        id:'economic_crash', type:'economy', recommendedSpec:'economist', icon:'/assets/icons/economy.svg', 
        title:'Market Instability in {region}', 
        desc:'Currency devaluation and inflation are eroding the middle class.', 
        learningFact:'SDG 8 promotes "Decent Work and Economic Growth." Balanced fiscal policy prevents systemic poverty and keeps societies stable.',
        sdgTarget:'SDG 8 (Decent Work)', severity:'high',
        options:[
            { text:'Market Intervention', effects:{economy:10,stability:-15,health:-5}, cost:{food:50}, tags:[{t:'Economy +10',c:'positive'},{t:'Stability -15',c:'negative'}] }
        ], hestia:'Wealth is ephemeral, but poverty is persistent. Command the markets or they will command you.', spreads:'economy' 
    },
    { 
        id:'war', type:'stability', recommendedSpec:'war', icon:'/assets/icons/stability.svg', 
        title:'Geopolitical Tension in {region}', 
        desc:'Border disputes have escalated into tactical skirmishes.', 
        learningFact:'SDG 16 is "Peace, Justice and Strong Institutions." Lasting progress is impossible without de-escalation and rule of law.',
        sdgTarget:'SDG 16 (Peace & Justice)', severity:'high',
        options:[
            { text:'Peacekeeping Force', effects:{stability:5,economy:-20}, cost:{power:40}, tags:[{t:'Stability +5',c:'positive'},{t:'Economy -20',c:'negative'}] }
        ], hestia:'The drums of war drown out the songs of progress. Virdis is ready to silence them.', spreads:'stability' 
    },
    { 
        id:'pollution', type:'pollution', recommendedSpec:'environment', icon:'/assets/icons/pollution.svg', 
        title:'Ecological Crisis in {region}', 
        desc:'Toxic runoff from heavy industry is contaminating the water table.', 
        learningFact:'SDG 13 covers "Climate Action." Carbon neutral industry and waste management are vital for a breathable future.',
        sdgTarget:'SDG 13 (Climate Action)', severity:'medium',
        options:[
            { text:'Green Infrastructure', effects:{pollution:-10,sustainability:15}, cost:{budget:100}, tags:[{t:'Pollution -10',c:'positive'},{t:'Sustainability +15',c:'positive'}] }
        ], hestia:'The earth is a closed system. What we pour into it eventually returns to us.' 
    },
    { 
        id:'civil_unrest', type:'stability', recommendedSpec:'diplomat', icon:'/assets/icons/stability.svg', 
        title:'Social Fragility in {region}', 
        desc:'Widespread distrust of local governance has led to massive civil strikes.', 
        learningFact:'SDG 17 emphasizes "Partnerships for the Goals." Inclusive dialogue prevents radicalization and builds social capital.',
        sdgTarget:'SDG 17 (Partnerships)', severity:'medium',
        options:[
            { text:'Diplomatic Summit', effects:{stability:5,health:-10}, cost:{power:30}, tags:[{t:'Stability +5',c:'positive'},{t:'Health -10',c:'negative'}] }
        ], hestia:'A kingdom divided cannot serve its people. Carmine will find the common thread.' 
    },
    { 
        id:'tech_gap', type:'economy', recommendedSpec:'scientist', icon:'/assets/icons/energy.svg', 
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
    "Manage your World Bank, Energy Grid, and Global Food Supply carefully. The weight of 40 turns will decide everything.",
    "My specialists await your command. Virdis for the front lines, Carmine for the halls of power, Celsius for the future...",
    "Observe. Predict. Act. Or watch the silence of the void swallow this world."
];

const TUTORIAL_STEPS = [
    { icon:'fas fa-chart-line', title:'Resource Management', text:'World Bank, Energy, and Food are your lifeblood. Every action—deploying specialists or making decisions—costs resources. If you run out, you cannot intervene.' },
    { icon:'fas fa-crystal-ball', title:'Predictions', text:'Watch the Right Panel. It contains warnings of impending crises. An epidemic in one region WILL spread to neighbors unless halted. Use this foresight to pre-emptively deploy specialists.' },
    { icon:'fas fa-gamepad', title:'Mini-Games', text:'Responding to major crises now triggers intervention mini-games. Your performance in these determines how effective the resolution is. High skill saves resources and lives.' },
    { icon:'fas fa-calendar-alt', title:'The 40-Turn Count', text:'You have exactly 40 turns to bring the world into balance. Each turn represents significant global shift. The SDG progress meter must reach 100% by the final turn to trigger the Golden Age.' }
];
