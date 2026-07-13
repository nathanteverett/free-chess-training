import type { Lesson } from '../types'

/** A focused YouTube Short for each lesson that has a curated video. */
export interface CuratedVideo {
  /** YouTube video id (the part after `/shorts/`). */
  id: string
  /** Video title as shown to the learner. */
  title: string
  /** Uploading channel, when known. */
  channel?: string
}

/**
 * Lesson slug → concept-specific YouTube Short.
 *
 * Keep these assignments one-to-one by concept. A broad compilation should
 * not be reused across several lessons: the clip should demonstrate only the
 * idea named by the lesson.
 */
const LESSON_SHORTS: Partial<Record<string, CuratedVideo>> = {
  "fundamentals-board-orientation-light-square": { id: "NQwITZ4YGuM", title: "How to setup a Chess Board?" },
  "fundamentals-files-ranks-square-names": { id: "lDgYeJ2_qdY", title: "CHESS BOARD | FILES | RANKS | PIECES NAMES AND POINTS | #masterofchessbrain | #chess |" },
  "fundamentals-starting-position": { id: "1mshvpn8NLI", title: "How to Set Up the Board in Chess" },
  "fundamentals-pieces-what-they-worth": { id: "p3AFtv9eC-o", title: "how much are chess pieces worth? #chess" },
  "fundamentals-how-rook-moves-captures": { id: "nwdXjEwVH1w", title: "Why the Rook Moves in Straight Lines #chess #shorts #facts" },
  "fundamentals-how-bishop-moves-captures": { id: "bjbQWbsWjYI", title: "How the BISHOP Moves in Chess" },
  "fundamentals-how-queen-moves-captures": { id: "dZTXFsocGEg", title: "How The Queen Moves In Chess" },
  "fundamentals-how-knight-moves-captures": { id: "gbKjLoHg1yg", title: "Magnus Carlsen Explains How the Knight Moves" },
  "fundamentals-how-king-moves": { id: "K-Fz9KnZ2WM", title: "How the KING Moves in Chess ♔ | Chess Basics Explained* #chess #chesstactics #shorts #chessshorts" },
  "fundamentals-attacked-squares": { id: "zjU8jozyW2E", title: "Attack the vulnerable squares in chess.#chess #shorts" },
  "fundamentals-check-three-legal-responses": { id: "1xz3588Qumo", title: "How to Use the King" },
  "fundamentals-pawn-movement-two-square": { id: "YUQVDf1tmFc", title: "Why Can Pawns Move 2 Squares First? 😳♟️🤯" },
  "fundamentals-pawn-captures": { id: "A4DtMPBegSA", title: "Mastering Chess: Understanding Pawn Movement and Capturing" },
  "fundamentals-en-passant": { id: "M-f95OHjkLA", title: "En Passant Explained" },
  "fundamentals-pawn-promotion-underpromotion": { id: "V09wOvcJJbM", title: "What Pawn Promotion Actually Looks Like ♟️🔥 | White Endgame" },
  "fundamentals-castling-kingside-queenside": { id: "EZLDDwuJ0yE", title: "What is the Difference Between Queenside and Kingside Castling?" },
  "fundamentals-when-castling-illegal": { id: "4Gt9pQ-ZSWo", title: "Legal or Illegal Castling? #chess #shorts" },
  "fundamentals-checkmate": { id: "b5Drs_7uo1g", title: "Is This Checkmate? #shorts #chess #memes" },
  "fundamentals-stalemate": { id: "qq5Hwguev_k", title: "What Is Stalemate In Chess?" },
  "fundamentals-draws-repetition-fifty-move": { id: "dpd0rhi1_JM", title: "Chess: How to Get a Draw" },
  "fundamentals-resignation-draw-offers": { id: "xyuJ1xnu6SM", title: "Opponent Declined a Draw Offer and Eventually Resigned" },
  "fundamentals-clocks-time-controls-flagging": { id: "MGY08JdlzA4", title: "Chess Clock Ticking: Can I Flag My Opponent in Time?! #chess #puzzle #chessmaster" },
  "tactics-mate-one": { id: "oSvOUXIwbxE", title: "Mate in 1." },
  "tactics-escape-square-counting": { id: "wb5SOdHaBwk", title: "Escape Square" },
  "tactics-ladder-mate": { id: "hWAI7TK8Pkw", title: "What is the Ladder Mate in Chess?" },
  "tactics-hanging-pieces": { id: "8sIttks8Qdo", title: "Hanging Pieces | Chess Tactics Series #chess" },
  "tactics-checks-captures-threats-scan": { id: "xV49NG0vmjg", title: "Checks, Captures, & Threats #chess" },
  "tactics-candidate-moves": { id: "hA38MWhmVaI", title: "Use Candidate Moves to Win Games!" },
  "tactics-forks": { id: "CO0NrCI-DoU", title: "Forks! 🍴🍴 Beginner chess tactic explained!" },
  "tactics-knight-forks": { id: "STuEMfX7wyw", title: "Instantly See Knight Forks #shorts" },
  "tactics-double-attacks": { id: "6REmOlwvIDk", title: "Why Double Attacks Win Games | Chess Tactics Explained#shorts" },
  "tactics-loose-pieces": { id: "ODWkot5PRjE", title: "Loose Piece Tactic" },
  "tactics-pins-absolute-relative": { id: "9VW-prKt35U", title: "You have to know this (Absolute and Relative Pins) !! #chess #shorts" },
  "tactics-attacking-pinned-piece": { id: "lS1LWJgvtFM", title: "Attack the Pinned Piece in Chess!" },
  "tactics-skewers": { id: "qrzKcB-UEfg", title: "Everything You MUST KNOW About Skewers in Chess!" },
  "tactics-x-rays": { id: "UdIHIvv7KkI", title: "X - Ray Tactics  #chess #chessgame #checkmate #chesstactics" },
  "tactics-alignments": { id: "UdIHIvv7KkI", title: "X-Ray Tactics" },
  "tactics-discovered-attacks": { id: "L2wxgxpKs6U", title: "Discovered attacks explained. chess for beginners  #shorts #chessdawgs #chess" },
  "tactics-discovered-check": { id: "JyL3ol4NuJA", title: "What is a Discovered Check in Chess?" },
  "tactics-double-check": { id: "NyvLQ6RsM94", title: "Double Check | Chess Tactics Series #chess" },
  "tactics-batteries": { id: "ehywYybGggw", title: "Batteries | Chess Tactics Series #chess" },
  "tactics-removal-defender": { id: "qH_RX9334CQ", title: "Understanding the Removal of the Defender." },
  "tactics-deflection": { id: "nZponwYci1E", title: "Deflection | Chess Tactics Series #chess" },
  "tactics-attraction": { id: "MEpu-Fx2-g8", title: "Attraction | Chess Tactics" },
  "tactics-overloading": { id: "JCGPL1FF1s8", title: "Overloading Tactics Explained" },
  "tactics-zwischenzug": { id: "VNZCMfTwPbs", title: "Zwischenzug | Chess Tactics Series #chess" },
  "tactics-back-rank-mate": { id: "cdlfnjdjZE8", title: "Back-Rank Mate #chess #chesstipsandtricks #chessendgame #shortsfeed #shorts #sports #gaming" },
  "tactics-smothered-mate": { id: "OCAwLnjoeeU", title: "How the Smothered mate works!" },
  "tactics-corridor-box-mates": { id: "SHpwm_95Fis", title: "What is the Corridor Checkmate in Chess?" },
  "tactics-battery-mates": { id: "DXw_cDa2eC4", title: "Mating Motifs: The Battery 🔋" },
  "tactics-stalemate-as-saving-resource": { id: "qq5Hwguev_k", title: "What Is Stalemate In Chess?" },
  "calculation-building-calculation-tree": { id: "EgUfY0x5dN4", title: "A Simple Trick to Calculate Deeper in Chess" },
  "calculation-forcing-moves-first": { id: "GyWHD_vloR8", title: "Forcing Moves WINS in Chess (PROOF)" },
  "calculation-visualization": { id: "GwjMMlx03z8", title: "Secret Hack To Chess Visualization" },
  "calculation-board-reconstruction": { id: "ttVNVNRTljc", title: "How to Visualize the Chess Board in under 1 Minute" },
  "calculation-finding-opponents-best-defense": { id: "XpXuoHoKBAI", title: "How Far Can a Chess Grandmaster Calculate?" },
  "calculation-refutation-discipline": { id: "PHQ28BlvFeA", title: "Crush the Stafford Gambit: Refutation Guide" },
  "calculation-non-forcing-calculation": { id: "X46dM3bXng8", title: "How to Calculate in Chess" },
  "calculation-calculation-under-time-pressure": { id: "wZFhRExVCf0", title: "Nice Calculation under Pressure" },
  "calculation-preconditions-attack": { id: "GnHp4OgFnCs", title: "To the attack! 💨 #chess" },
  "calculation-opening-lines-against-uncastled": { id: "MPhfgBJxhg4", title: "Learn The Castling Trap (Opening Trap Series)" },
  "calculation-same-side-castling-attacks": { id: "Gat32ZVHb4U", title: "How To Attack The Castled King" },
  "calculation-opposite-side-castling-attacks": { id: "7wetopPp5Vo", title: "Attacking Opposite Side Castling" },
  "calculation-pawn-storms": { id: "vC9m5s-1oMI", title: "How Pawn Storms Work #chess #attack #middlegame #checkmate #chesscom #pawnstorm #strategy #tactics" },
  "calculation-greek-gift": { id: "muPh6O8jnQE", title: "The Greek Gift!" },
  "calculation-sacrifices-attack": { id: "bZduvmOBYe8", title: "Mikhail Tal - The GOD Of Sacrifices In Chess" },
  "calculation-judging-compensation": { id: "9jgsPIfqNDo", title: "Compensation in Chess ♟" },
  "positional-complete-position-evaluation": { id: "gRWgrhtoakQ", title: "How to evaluate a chess position?! 🤔♟️" },
  "positional-weak-pawns-isolated-doubled": { id: "ESuhEueJQrI", title: "Doubled Isolated Pawn ? | How To Play Against Doubled Isolated Pawns !? | #shorts #chessshorts" },
  "positional-weak-squares-holes": { id: "uP0OjJ-0ikw", title: "Weak squares for dummies ! #chess #pawnbreak.com" },
  "positional-outposts": { id: "TmyJN2MtR0o", title: "Chess For Beginners: Chess Weaknesses and Outposts | #chess #chessforbeginners #education" },
  "positional-good-bishop-bad-bishop": { id: "2DU_N2PkEjY", title: "Bad Bishop vs Good Bishop" },
  "positional-bishop-knight": { id: "5a_IJFYK3CA", title: "Bishop vs Knight | Which is the better chess piece? #chess #chesscom #shorts" },
  "positional-open-files": { id: "cKs0m3Kj_Jc", title: "Why Rooks ❤️ Open Files & 7th Rank" },
  "positional-seventh-rank": { id: "pQYOIQGToqQ", title: "The seventh rule in chess: Rooks on the seventh rank #chess" },
  "positional-major-piece-coordination": { id: "O017LYBPNNY", title: "Piece Coordination & Tactical Combination" },
  "positional-prophylaxis": { id: "N6WmHGKLaa8", title: "PROPHYLAXIS in Chess. GM Johan Hellsten explains." },
  "positional-detecting-opponents-plan": { id: "rwLttI0TypA", title: "Figure out your opponent’s plan! ♟️#chessmaster #grandmaster #russianschoolofchess" },
  "structures-control-center": { id: "9WXgdSjnMM0", title: "control of the center #chess #kasparov" },
  "structures-development": { id: "19I2qqCH1MA", title: "Development Chess Game #chess #shorts" },
  "structures-king-safety-opening": { id: "DZHjxQpGi1w", title: "King Safety In Chess" },
  "structures-connecting-rooks": { id: "2iFRrwohzbk", title: "Principles Expanded 5 | Connecting The Rooks" },
  "structures-choosing-your-first-openings": { id: "fpSdJEoE6kg", title: "Top 5 Most Popular Chess Openings" },
  "structures-isolated-queens-pawn-attacking": { id: "vxDSXwYl-Ns", title: "Pegasus Chess Strategy: Isolated Queen's Pawn and Passed Pawn for Attack" },
  "structures-isolated-queens-pawn-blockading": { id: "Ws0rEqkmYPM", title: "An Isolated Queen's Pawn | Karpov vs Spassky #chess #shorts #king" },
  "structures-panov-structures": { id: "k0y0bB92tPM", title: "Caro-Kann: Accelerated Panov Attack" },
  "structures-carlsbad-structure": { id: "wqplsMYrO-U", title: "What Is The CARLSBAD STRUCTURE??? #chess #catan #chessgame #chesscom #chesstactics #checkmate" },
  "structures-minority-attack": { id: "5O0pED_mzCo", title: "The Minority Attack in Action #shorts" },
  "endgames-king-rook-king": { id: "3yf7vPz1px4", title: "How To Checkmate With a Rook and King" },
  "endgames-opposition": { id: "8KzGER982O8", title: "Opposition and Outflanking" },
  "endgames-distant-opposition": { id: "oSYOFZ8yXjY", title: "Distant Opposition | Chess Tactics Series #chess" },
  "endgames-key-squares": { id: "56s3vdC0eLs", title: "Win with Key Squares 🔑" },
  "endgames-bishop-knight-mate": { id: "2jfFsz_cJjE", title: "LEARN BISHOP & KNIGHT MATE WITH HIKARU!!" },
  "endgames-lucena-position": { id: "PfUvc1Q972s", title: "The Lucena Position Explained #chesslesson #learnchess #chess #chessnest" },
  "endgames-philidor-position": { id: "njMAZ2K0nyM", title: "Mastering the Philidor Position | Essential Endgame Technique in Chess" },
  "endgames-cutting-off-king": { id: "A61XYKjVZqU", title: "5 Rook Endgame Ideas You Must Know" },
  "endgames-short-side-defense": { id: "A61XYKjVZqU", title: "5 Rook Endgame Ideas You Must Know" },
  "endgames-frontal-defense-side-checks": { id: "A61XYKjVZqU", title: "5 Rook Endgame Ideas You Must Know" },
  "endgames-practical-multi-pawn-rook": { id: "GMExfFl1n4A", title: "IMPORTANT ROOK VS PASSED PAWNS ENDGAME TIP!!" },
  "endgames-opposite-colored-bishop-endings": { id: "m_6RJn126b8", title: "Pov: you're an opposite-colored bishop trying to win an endgame #chess #shorts" },
  "endgames-same-colored-bishop-endings": { id: "Wg0xOOjWDlk", title: "Same color bishops endgame | win or draw" },
  "endgames-queen-endings": { id: "VFArEWXCU8g", title: "Queen Endgame Tricks You Must Know" },
  "mastery-playing-complete-slow-game": { id: "g5Hm0lH7UNw", title: "Too Fast and Too Slow" },
  "mastery-independent-game-analysis": { id: "yyNOqZmXD1s", title: "How to Analyze Your Chess Game" },
  "mastery-analyzing-without-engine": { id: "SRl8NZ5ObKM", title: "Why analyze without the Chess engine first | Schemas and learning objectives" },
  "mastery-error-taxonomy": { id: "UWQ8LbVqo44", title: "Rookie Error #beginnerchess #learnchess #checkmate #chessfun #chesscom" },
  "mastery-designing-training-plan": { id: "fG5ZIQUwnI4", title: "Design Your Path to Chess Mastery: Training Plan!" },
  "mastery-clock-management": { id: "qWxcsZeMfqE", title: "How to Get Better at Chess: Time Management" },
  "mastery-practical-decisions": { id: "hA38MWhmVaI", title: "Use Candidate Moves to Win Games" },
}

/**
 * The Short for a lesson: an explicit `youtubeId` in frontmatter wins, then
 * the curated per-lesson library. Returns null when neither has one.
 */
export function getLessonVideo(lesson: Lesson): CuratedVideo | null {
  if (lesson.youtubeId) {
    return { id: lesson.youtubeId, title: lesson.title }
  }
  return LESSON_SHORTS[lesson.slug] ?? null
}

/** A prepared YouTube Shorts search for lessons with no curated clip yet. */
export function videoSearchUrl(lesson: Lesson): string {
  const query = `chess ${lesson.title} shorts`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
