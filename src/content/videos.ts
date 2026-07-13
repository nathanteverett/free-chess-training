import type { Lesson } from '../types'

/**
 * Curated lesson videos.
 *
 * Every id in LIBRARY was checked against YouTube's oembed endpoint
 * (https://www.youtube.com/oembed?url=…) and resolved to a live video, so no
 * lesson renders a dead player. Titles and channels are the ones oembed
 * returned — if you swap an id, re-verify it the same way.
 *
 * Not every topic has a curated video yet. Those lessons fall back to a
 * prepared YouTube search (see videoSearchUrl) instead of an empty embed.
 */
export interface CuratedVideo {
  /** YouTube video id (the part after `v=`). */
  id: string
  /** Video title, as reported by oembed. */
  title: string
  /** Uploading channel, as reported by oembed. */
  channel: string
}

const LIBRARY = {
  // — Rules and basics —
  rulesKid: { id: 'YdnvlntAQH8', title: 'How to Play Chess: Chess Rules for Beginners', channel: 'ChessKid' },
  rules8min: { id: 'IU6k-4rKf-g', title: 'Learn How to Play Chess for Beginners in Less Than 8 Minutes', channel: 'Mr.Animate' },
  rulesAll: { id: 'ej_fnsdsksA', title: 'How To Play Chess: Learn All The Rules Of The Royal Game', channel: 'Chess.com' },
  enPassant: { id: 'c_KRIH0wnhE', title: 'En Passant | How to Play Chess', channel: 'Chess.com' },
  specialMoves: { id: '0EqJeujhrpM', title: 'Special moves: promotion, castling, and en passant', channel: 'NM Robert Ramirez' },
  specialMoves8: { id: 'lvKbpmF7tYI', title: 'Every Special Move in Chess Explained in 8 minutes!', channel: 'Know Chess' },
  hiddenRules: { id: 'w1-vtOlm4qI', title: 'The "Hidden" Rules Of Chess: Castling, En Passant & Draws', channel: 'Gouda Chess' },
  stalemate: { id: 'Km6UKZJjPnI', title: 'What is a Stalemate in Chess?', channel: 'You Me And Chess' },
  drawStalemate: { id: 'rjHCE3UQY8w', title: 'Draw and Stalemate in Chess Explained', channel: 'Mr.Animate' },

  // — Tactics —
  matePatterns: { id: 'AdLPGGT7rhA', title: 'CHECKMATE Like a PRO! (Checkmate patterns ep 1)', channel: 'Shaky Chess' },
  rookMate: { id: 'R0gzvT0IO0M', title: 'How to Checkmate with King and Rook', channel: 'ChessNetwork' },
  tacticsMustKnow: { id: 'kcxBucFaosc', title: 'Chess Tactics You MUST Know (Pin, Fork, Skewer, & More!)', channel: 'Chess Strategy' },
  forksPinsSkewers: { id: 'MbMslp2WcI0', title: 'The Chess Tactics Guide For Beginners: forks, pins, skewers', channel: 'Chess Vibes' },
  forksPinsSkewers2: { id: 'k3b7kId3tmE', title: 'Forks, Pins and Skewers in chess explained', channel: 'Chess Gaja' },
  pinsForksSkewers3: { id: '6DNc2I3RrKI', title: 'Pins, Forks, and Skewers in Chess', channel: 'Lila Teaches' },
  everyTactic: { id: 'Pl4dZ5bvGg4', title: 'Every Chess Tactic Explained — Fork, Pin, Skewer and More', channel: 'About Chess' },
  discovered: { id: 'XTNplr3nwck', title: 'Discovered Attack — Concepts, Principles and Examples', channel: 'Chess Vibes' },
  discovered2: { id: 'nMADfn1scbI', title: 'Creating Multiple Threats with the Discovered Attack', channel: 'Chessfactor' },
  discovered3: { id: 'eOsf0RqYDuY', title: 'Chess Tactics Explained: DESTROY Them Using Discovered Attacks!', channel: 'LionChess' },
  geometry: { id: 'SqJluVo3-Uw', title: 'Geometry of Chess Tactics: Overloading, Deflection, Remove the Defender', channel: 'Engineer’s Gambit' },
  decoyDeflection: { id: '9cwNsRA3txY', title: 'Decoy vs Deflection | Chess tactics', channel: 'NM Robert Ramirez' },
  decoy: { id: 'fRKLAJ0YF-s', title: 'Trapping your Opponent with a Decoy', channel: 'Chessfactor' },
  backRank: { id: 'kT0b-TnyVL4', title: 'Checkmate Pattern #2 — Back Rank Mate', channel: 'Chess Vibes' },
  backRank2: { id: 'B4jwRq2aCog', title: 'Back Rank Checkmate — Fundamental Mating Patterns', channel: 'ChessGeek' },
  smothered: { id: 'SDkZiwb07uA', title: 'How To Win With The Smothered Mate', channel: 'Chess Explained' },

  // — Calculation and attack —
  calculateLikeGM: { id: 'eM4LPqqDgoU', title: 'How to Calculate in Chess Like a Grandmaster', channel: 'Remote Chess Academy' },
  candidateMoves: { id: 'gz6RwS-HVgA', title: 'Calculation Training: Finding Candidate Moves', channel: 'ChessDojo' },
  visualization: { id: 'WChrD2tXiWQ', title: 'How to Improve your Chess Visualization?', channel: 'Chessfactor' },
  visualizationDrills: { id: 'dSXYUFPuPnc', title: 'Chess Visualization Training [Simple Exercises]', channel: 'Remote Chess Academy' },
  calcVisEval: { id: 'VhhBqgyUIvY', title: 'How to Practice Calculation, Visualisation and Evaluation', channel: 'ChessCoach Andras' },
  timeTrouble: { id: 'e0uleosgHXA', title: 'How to Fix Your Time Management in Chess (Full Guide)', channel: 'Chess Master School' },
  attackCastled: { id: 'jZWoaYJP6kk', title: 'Attacking the Castled King: Sacrifice on h6', channel: 'michechess' },
  oppositeCastling: { id: '5M6dbucLHf8', title: 'Opposite Side Castling and PAWN STORM!', channel: 'Adventures of a Chess Noob' },
  pawnStorms: { id: 'BSzyCzoWFIQ', title: 'Mastering Pawn Storms: Strategies for Attacking the Enemy King', channel: 'Dr. Can’s Chess Clinic' },
  greekGift: { id: 'mNp0nNCsXYs', title: 'The Greek Gift: The Sacrifice That Leads Straight To Checkmate', channel: 'Chess Octopus Knight' },
  sacrifice: { id: '9VWbkNPESKY', title: 'Watch This Before You Sacrifice a Piece for Two Pawns', channel: 'Dr. Can’s Chess Clinic' },

  // — Positional —
  weakPawns: { id: 'cOtBBLBq_nk', title: 'Chess Strategy: Weak Squares, Weak Pawns & Strong Knights', channel: 'Amit Panchal' },
  weakSquares: { id: 'jEehFvnO3ZA', title: 'Weak Squares and Outposts | Chess Middlegames', channel: 'Hanging Pawns' },
  outposts: { id: '_mpljjbIgfs', title: 'ALL You Need to Know About Weak Squares (OUTPOSTS)!', channel: 'LionChess' },
  goodBadBishop: { id: 'aEFLHE5E-F8', title: 'What are Good and Bad Bishops?', channel: 'ChessNetwork' },
  bishopVsKnight: { id: 'wgVDmt2F1w0', title: 'Good Knight vs. Bad Bishop', channel: 'Dr. Can’s Chess Clinic' },
  openFiles: { id: '_dRO07JMHoU', title: 'Use Open Files Like a Pro (Chess Strategy Guide)', channel: 'PavelChess' },
  seventhRank: { id: '1uLu5QQxQvk', title: 'Rooks on the 7th Rank: Why This Wins Games Instantly', channel: 'Checkmate with Blake' },
  rookCoordination: { id: 'eN33tStEP-A', title: 'Dominating Open Files with Your Rooks', channel: 'Chess Strategy' },
  prophylaxis: { id: 'caYjV4vJFhY', title: 'Chess Strategy: Prophylaxis', channel: 'thechesswebsite' },

  // — Openings and structures —
  centralControl: { id: 'gpsZAim-mYc', title: 'Must-Know Opening Principles — Central Control', channel: 'Chessfactor' },
  development: { id: '6mDzYUE_zqo', title: 'Must-Know Opening Principles — Piece Development', channel: 'Chessfactor' },
  kingSafety: { id: 'FyvJMCDeeT4', title: 'King Safety in Chess — No.1 Priority for every Beginner', channel: 'Chessfactor' },
  openingPrinciples: { id: 'jfcVjIa1EGM', title: 'Every Chess Opening Principle Explained In 18 Minutes', channel: 'Remote Chess Academy' },
  openingPrinciples9: { id: 'nROIk2oUBX4', title: '9 Most Important Chess Opening Principles', channel: 'Hanging Pawns' },
  iqpAttack: { id: 'EfQflTtTDmA', title: 'How to Play with the Isolated Queen’s Pawn | GM Yasser Seirawan', channel: 'chessbrah' },
  iqpBlockade: { id: '2zs6Y8XOiDE', title: 'How to play against the isolated queen pawn', channel: 'ElzChess' },
  iqpStructures: { id: 'K66S5y9Uxcs', title: 'Understanding Chess Structures: The Isolated Queen Pawn', channel: 'ChessDawg' },
  carlsbad: { id: 'dMDAmC78sJY', title: 'Carlsbad Pawn Structure And Minority Attack', channel: 'Chess Mode' },
  minorityAttack: { id: 'IAQife0dSqc', title: 'The Minority Attack | Chess Middlegames', channel: 'Hanging Pawns' },

  // — Endgames —
  opposition: { id: 'SoZPZdnYYk8', title: 'Opposition | Chess Endgames', channel: 'Hanging Pawns' },
  opposition2: { id: 'x6LM8QXCLLg', title: 'The Opposition | King & Pawn Endgames', channel: 'Chessfactor' },
  keySquares: { id: 'fkFXB2V3SY8', title: 'Key Squares in King and Pawn Endgames', channel: 'Chessfactor' },
  lucena: { id: 'wZODSIpFtJg', title: 'To Win Rook Endgames, You Need To Know The Lucena Position', channel: 'GM Huschenbeth' },
  philidor: { id: 'gkP44VKT9Rw', title: 'Chess Endgame Fundamentals: Philidor Position', channel: 'John Bartholomew' },
  rookEndgames: { id: '_lvTNSQ_eL0', title: 'Stop Losing Rook Endgames | Lucena and Philidor Guide', channel: 'Critical Chess' },
  rookEndgames2: { id: 'jYI27mLIFKM', title: 'Mastering Basic Rook Endgames: Philidor & Lucena', channel: 'ChessDojo' },
  rookEndgames3: { id: 'rDist9x7szE', title: 'Rook Endgames: The Lucena and Philidor Positions Explained', channel: 'GM Talks' },
  rookPractical: { id: 'pD-FzMo7hYc', title: 'Chess Endgame: Lucena and Philidor Rook and Pawn Endings', channel: 'NM Dan Heisman' },
  oppositeBishops: { id: 'raHFFdThosU', title: 'Opposite Colored Bishops Endgames, Part 1', channel: 'Hanging Pawns' },
  oppositeBishops2: { id: 'YDd3w4Tkkgs', title: 'Opposite Colored Bishops Endgames | Endgame Strategy', channel: 'Chessfactor' },
  queenEndings: { id: 'E4NhQt5nRpk', title: 'Queen vs Bishop & Queen vs Knight Chess Endgame', channel: 'KeSetoKaiba' },
  bishopKnightMate: { id: 'dHnz4U7qjfk', title: 'Knight + Bishop Checkmate (THE EASY WAY)', channel: 'Chess Vibes' },

  // — Competitive mastery —
  analyzeGames: { id: 'cpYxBIWH5S4', title: 'How to analyze your chess games for maximum improvement', channel: 'Sam Asaka' },
  gameReview: { id: 'f8QrRbmaHxE', title: 'Improve On Your Own: Game Review Explained', channel: 'ChessCoach Andras' },
  learnFromMistakes: { id: 'Qb_MDIf3lCs', title: 'How to analyze your games and learn from your mistakes', channel: 'Hanging Pawns' },
  trainingPlan: { id: '7d4y6vxFNMw', title: 'How to Analyze Your Game for Improvement', channel: 'Better Chess Training' },
  clockManagement: { id: 'd_K8Xe3obMM', title: 'Time Management In Chess', channel: 'GothamChess' },
  timeTips: { id: 'wdwxErflrY0', title: '7 Tips for Better Time Management in Chess', channel: 'Kamryn' },
  timeControl: { id: 'FuTBc6TvV24', title: 'The Best Time Control For Chess Improvement', channel: 'GM Noel Studer' },
} as const satisfies Record<string, CuratedVideo>

type VideoKey = keyof typeof LIBRARY

/** Lesson slug → curated video. Slugs with no entry fall back to a search. */
const LESSON_VIDEOS: Partial<Record<string, VideoKey>> = {
  // Fundamentals
  'fundamentals-board-orientation-light-square': 'rulesKid',
  'fundamentals-files-ranks-square-names': 'rulesKid',
  'fundamentals-starting-position': 'rulesKid',
  'fundamentals-pieces-what-they-worth': 'rules8min',
  'fundamentals-how-rook-moves-captures': 'rulesAll',
  'fundamentals-how-bishop-moves-captures': 'rulesAll',
  'fundamentals-how-queen-moves-captures': 'rulesAll',
  'fundamentals-how-knight-moves-captures': 'rulesAll',
  'fundamentals-how-king-moves': 'rulesAll',
  'fundamentals-attacked-squares': 'rulesAll',
  'fundamentals-check-three-legal-responses': 'rulesAll',
  'fundamentals-pawn-movement-two-square': 'rules8min',
  'fundamentals-pawn-captures': 'rules8min',
  'fundamentals-en-passant': 'enPassant',
  'fundamentals-pawn-promotion-underpromotion': 'specialMoves',
  'fundamentals-castling-kingside-queenside': 'specialMoves8',
  'fundamentals-when-castling-illegal': 'hiddenRules',
  'fundamentals-checkmate': 'rulesAll',
  'fundamentals-stalemate': 'stalemate',
  'fundamentals-draws-repetition-fifty-move': 'drawStalemate',
  'fundamentals-resignation-draw-offers': 'hiddenRules',
  'fundamentals-clocks-time-controls-flagging': 'timeControl',

  // Tactics
  'tactics-mate-one': 'matePatterns',
  'tactics-escape-square-counting': 'matePatterns',
  'tactics-ladder-mate': 'rookMate',
  'tactics-hanging-pieces': 'tacticsMustKnow',
  'tactics-checks-captures-threats-scan': 'calculateLikeGM',
  'tactics-candidate-moves': 'candidateMoves',
  'tactics-forks': 'forksPinsSkewers',
  'tactics-knight-forks': 'forksPinsSkewers2',
  'tactics-double-attacks': 'everyTactic',
  'tactics-loose-pieces': 'tacticsMustKnow',
  'tactics-pins-absolute-relative': 'pinsForksSkewers3',
  'tactics-attacking-pinned-piece': 'tacticsMustKnow',
  'tactics-skewers': 'forksPinsSkewers',
  'tactics-x-rays': 'everyTactic',
  'tactics-alignments': 'everyTactic',
  'tactics-discovered-attacks': 'discovered',
  'tactics-discovered-check': 'discovered2',
  'tactics-double-check': 'discovered3',
  'tactics-batteries': 'everyTactic',
  'tactics-removal-defender': 'geometry',
  'tactics-deflection': 'decoyDeflection',
  'tactics-attraction': 'decoy',
  'tactics-overloading': 'geometry',
  'tactics-zwischenzug': 'everyTactic',
  'tactics-back-rank-mate': 'backRank',
  'tactics-smothered-mate': 'smothered',
  'tactics-corridor-box-mates': 'backRank2',
  'tactics-battery-mates': 'matePatterns',
  'tactics-stalemate-as-saving-resource': 'stalemate',

  // Calculation and attack
  'calculation-building-calculation-tree': 'calculateLikeGM',
  'calculation-forcing-moves-first': 'calculateLikeGM',
  'calculation-visualization': 'visualization',
  'calculation-board-reconstruction': 'visualizationDrills',
  'calculation-finding-opponents-best-defense': 'calcVisEval',
  'calculation-refutation-discipline': 'calcVisEval',
  'calculation-non-forcing-calculation': 'calcVisEval',
  'calculation-calculation-under-time-pressure': 'timeTrouble',
  'calculation-preconditions-attack': 'attackCastled',
  'calculation-opening-lines-against-uncastled': 'attackCastled',
  'calculation-same-side-castling-attacks': 'attackCastled',
  'calculation-opposite-side-castling-attacks': 'oppositeCastling',
  'calculation-pawn-storms': 'pawnStorms',
  'calculation-greek-gift': 'greekGift',
  'calculation-sacrifices-attack': 'sacrifice',
  'calculation-judging-compensation': 'sacrifice',

  // Positional
  'positional-complete-position-evaluation': 'calcVisEval',
  'positional-weak-pawns-isolated-doubled': 'weakPawns',
  'positional-weak-squares-holes': 'weakSquares',
  'positional-outposts': 'outposts',
  'positional-good-bishop-bad-bishop': 'goodBadBishop',
  'positional-bishop-knight': 'bishopVsKnight',
  'positional-open-files': 'openFiles',
  'positional-seventh-rank': 'seventhRank',
  'positional-major-piece-coordination': 'rookCoordination',
  'positional-prophylaxis': 'prophylaxis',
  'positional-detecting-opponents-plan': 'prophylaxis',

  // Pawn structures and openings
  'structures-control-center': 'centralControl',
  'structures-development': 'development',
  'structures-king-safety-opening': 'kingSafety',
  'structures-connecting-rooks': 'openingPrinciples',
  'structures-choosing-your-first-openings': 'openingPrinciples9',
  'structures-isolated-queens-pawn-attacking': 'iqpAttack',
  'structures-isolated-queens-pawn-blockading': 'iqpBlockade',
  'structures-panov-structures': 'iqpStructures',
  'structures-carlsbad-structure': 'carlsbad',
  'structures-minority-attack': 'minorityAttack',

  // Endgames
  'endgames-king-rook-king': 'rookMate',
  'endgames-opposition': 'opposition',
  'endgames-distant-opposition': 'opposition2',
  'endgames-key-squares': 'keySquares',
  'endgames-bishop-knight-mate': 'bishopKnightMate',
  'endgames-lucena-position': 'lucena',
  'endgames-philidor-position': 'philidor',
  'endgames-cutting-off-king': 'rookEndgames',
  'endgames-short-side-defense': 'rookEndgames2',
  'endgames-frontal-defense-side-checks': 'rookEndgames3',
  'endgames-practical-multi-pawn-rook': 'rookPractical',
  'endgames-opposite-colored-bishop-endings': 'oppositeBishops',
  'endgames-same-colored-bishop-endings': 'oppositeBishops2',
  'endgames-queen-endings': 'queenEndings',

  // Competitive mastery
  'mastery-playing-complete-slow-game': 'timeControl',
  'mastery-independent-game-analysis': 'analyzeGames',
  'mastery-analyzing-without-engine': 'gameReview',
  'mastery-error-taxonomy': 'learnFromMistakes',
  'mastery-designing-training-plan': 'trainingPlan',
  'mastery-clock-management': 'clockManagement',
  'mastery-practical-decisions': 'timeTips',
}

/**
 * The video for a lesson: an explicit `youtubeId` in frontmatter wins, then the
 * curated library. Returns null when neither has one — the caller should offer a
 * search instead of an empty player.
 */
export function getLessonVideo(lesson: Lesson): CuratedVideo | null {
  if (lesson.youtubeId) {
    return { id: lesson.youtubeId, title: lesson.title, channel: '' }
  }
  const key = LESSON_VIDEOS[lesson.slug]
  return key ? LIBRARY[key] : null
}

/** A prepared YouTube search for lessons with no curated video yet. */
export function videoSearchUrl(lesson: Lesson): string {
  const query = `chess ${lesson.title}`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
