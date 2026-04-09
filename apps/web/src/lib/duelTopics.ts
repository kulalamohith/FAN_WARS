/**
 * WARZONE — Sniper Duel Topics & Simulated Data
 * Debate topics for 1v1 banter battles + simulated opponents
 */

export interface DuelTopic {
  id: string;
  text: string;
  category: 'captain' | 'player' | 'team' | 'format' | 'hot-take';
  side1Label: string; // e.g. "FOR"
  side2Label: string; // e.g. "AGAINST"
}

export const DUEL_TOPICS: DuelTopic[] = [
  // Captain debates
  { id: 't1', text: 'Dhoni is a better captain than Kohli', category: 'captain', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't2', text: 'Rohit Sharma deserved captaincy over Kohli earlier', category: 'captain', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't3', text: 'Hardik Pandya was the wrong choice for MI captain', category: 'captain', side1Label: 'FOR', side2Label: 'AGAINST' },

  // Player debates
  { id: 't4', text: 'Virat Kohli is the GOAT batsman in cricket', category: 'player', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't5', text: 'AB de Villiers was more entertaining than Kohli', category: 'player', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't6', text: 'Bumrah is the best fast bowler in cricket history', category: 'player', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't7', text: 'Sachin Tendulkar is overrated in T20 era comparison', category: 'player', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't8', text: 'Rashid Khan is the most valuable T20 bowler ever', category: 'player', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't9', text: 'MS Dhoni finishing ability will never be matched', category: 'player', side1Label: 'FOR', side2Label: 'AGAINST' },

  // Team debates
  { id: 't10', text: 'CSK is the greatest IPL franchise of all time', category: 'team', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't11', text: 'RCB will NEVER win an IPL title', category: 'team', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't12', text: 'Mumbai Indians dynasty is over for good', category: 'team', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't13', text: 'KKR has the best team culture in IPL', category: 'team', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't14', text: 'SRH is the most underrated franchise', category: 'team', side1Label: 'FOR', side2Label: 'AGAINST' },

  // Format debates
  { id: 't15', text: 'T20 cricket is killing Test cricket', category: 'format', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't16', text: 'IPL is more competitive than international cricket', category: 'format', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't17', text: 'Impact Player rule is ruining IPL', category: 'format', side1Label: 'FOR', side2Label: 'AGAINST' },

  // Hot takes
  { id: 't18', text: 'Indian fans are the most toxic in world cricket', category: 'hot-take', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't19', text: 'IPL auction system is broken and needs fixing', category: 'hot-take', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't20', text: 'Overseas players carry most IPL teams', category: 'hot-take', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't21', text: 'Night matches give unfair advantage to chasing teams', category: 'hot-take', side1Label: 'FOR', side2Label: 'AGAINST' },
  { id: 't22', text: 'Cricket needs relegation like football leagues', category: 'hot-take', side1Label: 'FOR', side2Label: 'AGAINST' },
];

// Simulated opponent messages keyed by topic category
// These fire in sequence during a simulated duel
export const SIMULATED_RESPONSES: Record<string, string[]> = {
  captain: [
    "Numbers don't lie bro. Look at the win percentage 📊",
    "Captaincy isn't just wins, it's about HOW you lead under pressure 🔥",
    "You're just biased because of your team loyalty 🤡",
    "One word: KNOCKOUTS. That's all I need to say 💀",
    "Remember that one match where he completely choked? Yeah exactly.",
    "Leading a team to multiple trophies > individual stats any day",
    "The players who played under him will tell you the real story",
    "You're living in the past. Cricket has evolved. So should your opinions.",
    "Trophy cabinet speaks louder than your arguments mate 🏆",
    "Even the opposition players respect his captaincy. Says everything.",
    "Context matters. The squad he had vs what the other had... think about it",
    "Your captain needed a better team. Mine MADE the team better.",
  ],
  player: [
    "Have you even seen the stats? Because they disagree with you 📈",
    "Consistency over a decade vs a few flashy innings... no comparison",
    "Watch the highlights again. One is class, the other is overrated hype.",
    "He literally carried the team on his back. Name another player who did that.",
    "You're comparing apples to oranges. Different eras, different roles.",
    "One performs in finals, the other ghosts when it matters 👻",
    "That knock in the final... goosebumps. Your player could NEVER.",
    "The way he reads the game is next level. Pure cricket IQ.",
    "I respect both but one is clearly a tier above. And it's not who you think.",
    "He was doing this before your player even debuted 😂",
    "Pressure situations reveal character. And we all saw who cracked.",
    "If every team in the world wants him, he's not the overrated one 🎯",
  ],
  team: [
    "TRUST THE PROCESS. The results speak for themselves.",
    "One bad season and you write them off? Casual fan detected 🤡",
    "Rebuilding is part of the game. Smart franchises invest long-term.",
    "Our fan base alone is worth more than their entire franchise 🔥",
    "Championships. Count them. I'll wait.",
    "They bought their way to success. We built a culture.",
    "The management knows what they're doing even if you don't see it.",
    "Every team has cycles. But legacy is forever.",
    "We discover talent. They buy what we develop. Facts.",
    "You support them NOW? Where were you during the bans? 😂",
    "Greatest IPL moment in history? Belongs to us. You know which one.",
    "Our worst season is still better than their best season. Think about that.",
  ],
  format: [
    "Traditional fans will always resist change. Cricket needs to evolve.",
    "Entertainment vs purity of the sport... that's the real debate here.",
    "Bro the stadiums are FULL. The viewership is INSANE. How is that bad?",
    "Players are getting paid what they deserve. What's wrong with that?",
    "The game has always evolved. From timeless tests to ODIs to T20. It's natural.",
    "Quality hasn't dropped. The athletes are MORE skilled now. Look at fielding.",
    "Competition breeds excellence. More tournaments = better players.",
    "You can have both. Nobody's banning Test cricket. Relax.",
    "Old heads always hate new things. Same happened with ODIs in the 80s.",
    "If the PLAYERS prefer it, who are we to say it's wrong?",
    "The data clearly shows it's growing the sport. More countries, more fans.",
    "Gatekeeping cricket formats is not the flex you think it is 🤡",
  ],
  'hot-take': [
    "Finally someone brave enough to say it out loud 🗣️",
    "This is controversial but you might actually have a point...",
    "Nah you're reaching now. That's a stretch even for this app 😂",
    "THANK YOU. I've been saying this for years and nobody listens.",
    "The system is broken but nobody wants to admit it because money talks.",
    "That's a surface-level take. Dig deeper and you'll change your mind.",
    "Bold claim. Now back it up with evidence.",
    "Even the experts are divided on this one. It's not black and white.",
    "This is the kind of debate that should be on national TV 🔥",
    "Agree to disagree. But you're still wrong 💀",
    "The fact that this triggers people proves it's true.",
    "Spicy take but absolutely based. No cap 🧢",
  ],
};

// Simulated users that can be "challenged"
export interface SimUser {
  id: string;
  username: string;
  army: string;
  armyColor: string;
  rank: string;
  wins: number;
  losses: number;
}

export const SIMULATED_USERS: SimUser[] = [
  { id: 'sim1', username: 'RCB_Fanboy', army: 'RCB', armyColor: '#EC1C24', rank: 'Sergeant', wins: 12, losses: 8 },
  { id: 'sim2', username: 'Dhoni_Supremacy', army: 'CSK', armyColor: '#FFFF3C', rank: 'Captain', wins: 18, losses: 5 },
  { id: 'sim3', username: 'MI_Paltan_King', army: 'MI', armyColor: '#004BA0', rank: 'Lieutenant', wins: 9, losses: 11 },
  { id: 'sim4', username: 'KKR_Knight77', army: 'KKR', armyColor: '#2E0854', rank: 'Corporal', wins: 7, losses: 9 },
  { id: 'sim5', username: 'OrangeArmy_SRH', army: 'SRH', armyColor: '#F26522', rank: 'Sergeant', wins: 14, losses: 6 },
  { id: 'sim6', username: 'DC_Capital_Fan', army: 'DC', armyColor: '#00008B', rank: 'Private', wins: 3, losses: 12 },
  { id: 'sim7', username: 'GT_Titan_Rishabh', army: 'GT', armyColor: '#1B2133', rank: 'Captain', wins: 16, losses: 4 },
  { id: 'sim8', username: 'Punjab_Shera', army: 'PBKS', armyColor: '#ED1B24', rank: 'Corporal', wins: 5, losses: 10 },
];

// Reaction types for duels
export interface DuelReactions {
  fire: number;     // 🔥 FIRE — great argument
  brutal: number;   // 💀 BRUTAL — destroyed opponent
  facts: number;    // ✅ FACTS — he's right
  toxic: number;    // 🤡 TOXIC — bad take
  ltake: number;    // 😤 L TAKE — wrong opinion
}

export const REACTION_CONFIG = [
  { key: 'facts' as const, emoji: '✅', label: 'FACTS', positive: true, color: '#00FF88' },
  { key: 'fire' as const, emoji: '🔥', label: 'FIRE', positive: true, color: '#FF6B2C' },
  { key: 'brutal' as const, emoji: '💀', label: 'BRUTAL', positive: true, color: '#BF5AF2' },
  { key: 'toxic' as const, emoji: '🤡', label: 'TOXIC', positive: false, color: '#FFD60A' },
  { key: 'ltake' as const, emoji: '😤', label: 'L TAKE', positive: false, color: '#FF2D55' },
];

export const EMPTY_REACTIONS: DuelReactions = { fire: 0, brutal: 0, facts: 0, toxic: 0, ltake: 0 };

export function getReactionScore(reactions: DuelReactions): number {
  return (reactions.facts + reactions.fire + reactions.brutal) - (reactions.toxic + reactions.ltake);
}

export function getTotalReactions(reactions: DuelReactions): number {
  return reactions.facts + reactions.fire + reactions.brutal + reactions.toxic + reactions.ltake;
}
