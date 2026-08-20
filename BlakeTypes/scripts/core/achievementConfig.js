export const ACHIEVEMENT_CATEGORIES = [
  { id: "speed", label: "Speed", description: "WPM milestones earned in any recorded activity." },
  { id: "accuracy", label: "Accuracy", description: "Clean typing and perfect-session milestones." },
  { id: "practice", label: "Practice & Endurance", description: "Long-term session and practice-time milestones." },
  { id: "curriculum", label: "Curriculum", description: "Progress through HyperSoft's typing lessons." },
  { id: "arcade", label: "Typing Arcade", description: "Badges from Blake's eight increasingly questionable typing games, random challenges, and tournaments." }
];

export const ACHIEVEMENTS = [
  // Speed
  { id: "speed30", category: "speed", icon: "30", title: "Getting Moving", description: "Reach 30 WPM in a recorded activity.", points: 10, criterion: { type: "bestWpm", value: 30 } },
  { id: "speed40", category: "speed", icon: "40", title: "Office Ready", description: "Reach 40 WPM.", points: 15, criterion: { type: "bestWpm", value: 40 } },
  { id: "speed60", category: "speed", icon: "60", title: "Quick Fingers", description: "Reach 60 WPM.", points: 25, criterion: { type: "bestWpm", value: 60 } },
  { id: "speed80", category: "speed", icon: "80", title: "Speed Demon", description: "Reach 80 WPM.", points: 40, criterion: { type: "bestWpm", value: 80 } },
  { id: "speed100", category: "speed", icon: "100", title: "Century Club", description: "Reach 100 WPM.", points: 60, criterion: { type: "bestWpm", value: 100 } },
  { id: "speed120", category: "speed", icon: "BB", title: "Blake's Rearview Mirror", description: "Reach 120 WPM. Blake has requested an audit of your keyboard.", points: 100, criterion: { type: "bestWpm", value: 120 } },

  // Accuracy
  { id: "accuracy95", category: "accuracy", icon: "95%", title: "Clean Copy", description: "Finish a substantial activity at 95% accuracy or better.", points: 15, criterion: { type: "qualifiedAccuracy", value: 95 } },
  { id: "accuracy98", category: "accuracy", icon: "98%", title: "Precision Typist", description: "Finish a substantial activity at 98% accuracy or better.", points: 25, criterion: { type: "qualifiedAccuracy", value: 98 } },
  { id: "accuracy100", category: "accuracy", icon: "100", title: "Perfect Form", description: "Finish a substantial activity with 100% accuracy.", points: 40, criterion: { type: "qualifiedAccuracy", value: 100 } },
  { id: "perfect3", category: "accuracy", icon: "3×", title: "No Typos Today", description: "Record three substantial 100%-accuracy sessions.", points: 60, criterion: { type: "perfectSessions", value: 3 } },

  // Practice & endurance
  { id: "session1", category: "practice", icon: "1", title: "Clocked In", description: "Complete your first recorded session.", points: 5, criterion: { type: "sessions", value: 1 } },
  { id: "session10", category: "practice", icon: "10", title: "Regular Trainee", description: "Complete 10 recorded sessions.", points: 15, criterion: { type: "sessions", value: 10 } },
  { id: "session25", category: "practice", icon: "25", title: "Keyboard Habit", description: "Complete 25 recorded sessions.", points: 25, criterion: { type: "sessions", value: 25 } },
  { id: "session50", category: "practice", icon: "50", title: "Half-Century", description: "Complete 50 recorded sessions.", points: 40, criterion: { type: "sessions", value: 50 } },
  { id: "session100", category: "practice", icon: "100", title: "HyperSoft Veteran", description: "Complete 100 recorded sessions.", points: 75, criterion: { type: "sessions", value: 100 } },
  { id: "time5", category: "practice", icon: "5m", title: "Five-Minute File", description: "Accumulate 5 minutes of recorded practice.", points: 5, criterion: { type: "practiceMinutes", value: 5 } },
  { id: "time30", category: "practice", icon: "30m", title: "Lunch-Break Typist", description: "Accumulate 30 minutes of recorded practice.", points: 15, criterion: { type: "practiceMinutes", value: 30 } },
  { id: "time60", category: "practice", icon: "1h", title: "One Hour In", description: "Accumulate 1 hour of recorded practice.", points: 25, criterion: { type: "practiceMinutes", value: 60 } },
  { id: "time300", category: "practice", icon: "5h", title: "Serious Practice", description: "Accumulate 5 hours of recorded practice.", points: 50, criterion: { type: "practiceMinutes", value: 300 } },
  { id: "time600", category: "practice", icon: "10h", title: "Ten-Hour Typist", description: "Accumulate 10 hours of recorded practice.", points: 85, criterion: { type: "practiceMinutes", value: 600 } },

  // Curriculum
  { id: "lesson1", category: "curriculum", icon: "L1", title: "First Lesson", description: "Complete any typing lesson.", points: 5, criterion: { type: "lessonSessions", value: 1 } },
  { id: "homeRowMaster", category: "curriculum", icon: "AS", title: "Home Row Foundation", description: "Meet the targets in both Home Row Keys and Home Row Words.", points: 25, criterion: { type: "lessonSetTargets", ids: ["homeRowKeys", "homeRowWarmup"] } },
  { id: "alphabetMaster", category: "curriculum", icon: "AZ", title: "Full Alphabet", description: "Meet the Full Alphabet Flow target.", points: 25, criterion: { type: "lessonTarget", id: "fullAlphabetFlow" } },
  { id: "shiftMaster", category: "curriculum", icon: "⇧", title: "Shift Supervisor", description: "Meet the Shift & Capital Letters target.", points: 25, criterion: { type: "lessonTarget", id: "shiftCapitals" } },
  { id: "numbersMaster", category: "curriculum", icon: "123", title: "Number Row Ready", description: "Meet the Number Row target.", points: 25, criterion: { type: "lessonTarget", id: "numberRow" } },
  { id: "punctuationMaster", category: "curriculum", icon: ";?!", title: "Punctuation Department", description: "Meet the Punctuation Basics target.", points: 30, criterion: { type: "lessonTarget", id: "punctuationBasics" } },
  { id: "mixedMaster", category: "curriculum", icon: "MIX", title: "Full Keyboard Operator", description: "Meet the Full Keyboard Mix target.", points: 40, criterion: { type: "lessonTarget", id: "fullKeyboardMix" } },
  { id: "adaptiveComplete", category: "curriculum", icon: "WK", title: "Weak-Key Worker", description: "Complete a Weak-Key Workshop session.", points: 20, criterion: { type: "lessonPlayed", id: "adaptiveWorkshop" } },
  { id: "targets3", category: "curriculum", icon: "3★", title: "Three Targets Down", description: "Meet the target in 3 different lessons.", points: 20, criterion: { type: "lessonTargets", value: 3 } },
  { id: "targets7", category: "curriculum", icon: "7★", title: "Halfway Competent", description: "Meet the target in 7 different lessons.", points: 40, criterion: { type: "lessonTargets", value: 7 } },
  { id: "targetsAll", category: "curriculum", icon: "14", title: "Curriculum Complete", description: "Meet the target in all 14 lessons.", points: 100, criterion: { type: "lessonTargets", value: 14 } },

  // Arcade
  { id: "game1", category: "arcade", icon: "G1", title: "Arcade Visitor", description: "Complete your first typing-game session.", points: 5, criterion: { type: "gameSessions", value: 1 } },
  { id: "creaturePlayed", category: "arcade", icon: "DNA", title: "Specimen Handler", description: "Record a Creature Lab session.", points: 15, criterion: { type: "gamePlayed", id: "creatureLab" } },
  { id: "farOffPlayed", category: "arcade", icon: "AIR", title: "Typing Aeronaut", description: "Record a Far Off Adventures flight.", points: 15, criterion: { type: "gamePlayed", id: "farOffAdventures" } },
  { id: "checkoutPlayed", category: "arcade", icon: "10K", title: "Ten-Key Clerk", description: "Work a Check-Out Time shift.", points: 15, criterion: { type: "gamePlayed", id: "checkOutTime" } },
  { id: "roadPlayed", category: "arcade", icon: "CAR", title: "Road Tested", description: "Record a Road Race.", points: 15, criterion: { type: "gamePlayed", id: "roadRace" } },
  { id: "chameleonPlayed", category: "arcade", icon: "ANT", title: "Picnic Shift", description: "Record a Chameleon Picnic session.", points: 15, criterion: { type: "gamePlayed", id: "chameleonPicnic" } },
  { id: "spacePlayed", category: "arcade", icon: "ORB", title: "Orbital Shift", description: "Record a Space Junk session.", points: 15, criterion: { type: "gamePlayed", id: "spaceJunk" } },
  { id: "sharkPlayed", category: "arcade", icon: "SEA", title: "Shark Encounter", description: "Record a Shark Attack session.", points: 15, criterion: { type: "gamePlayed", id: "sharkAttack" } },
  { id: "penguinPlayed", category: "arcade", icon: "ICE", title: "Ice Shift", description: "Record a Penguin Crossing session.", points: 15, criterion: { type: "gamePlayed", id: "penguinCrossing" } },
  { id: "allGames", category: "arcade", icon: "8G", title: "Arcade Tour", description: "Record at least one session in all eight typing games.", points: 60, criterion: { type: "uniqueGames", value: 8 } },
  { id: "roadWin", category: "arcade", icon: "🏁", title: "Road Champion", description: "Win Road Race.", points: 30, criterion: { type: "gameSuccess", id: "roadRace" } },
  { id: "spaceWin", category: "arcade", icon: "★", title: "Orbit Secured", description: "Survive a Space Junk shift.", points: 30, criterion: { type: "gameSuccess", id: "spaceJunk" } },
  { id: "sharkWin", category: "arcade", icon: "◈", title: "Shark Bait No More", description: "Reach shore in Shark Attack.", points: 30, criterion: { type: "gameSuccess", id: "sharkAttack" } },
  { id: "penguinWin", category: "arcade", icon: "❄", title: "Penguin Commuter", description: "Complete a Penguin Crossing.", points: 30, criterion: { type: "gameSuccess", id: "penguinCrossing" } },

  // Arcade depth + meta progression (v0.11.5)
  { id: "creatureWin", category: "arcade", icon: "LAB", title: "Batch Certified", description: "Complete a Creature Lab research batch.", points: 30, criterion: { type: "gameSuccess", id: "creatureLab" } },
  { id: "farOffWin", category: "arcade", icon: "UP", title: "Safe Landing", description: "Complete a Far Off Adventures flight.", points: 30, criterion: { type: "gameSuccess", id: "farOffAdventures" } },
  { id: "checkoutWin", category: "arcade", icon: "$", title: "Lane Closed Cleanly", description: "Survive a complete Check-Out Time shift.", points: 30, criterion: { type: "gameSuccess", id: "checkOutTime" } },
  { id: "chameleonWin", category: "arcade", icon: "CMB", title: "Picnic Protected", description: "Survive a Chameleon Picnic round.", points: 30, criterion: { type: "gameSuccess", id: "chameleonPicnic" } },
  { id: "arcadeWins5", category: "arcade", icon: "5W", title: "Five Wins", description: "Record five successful arcade-game runs.", points: 25, criterion: { type: "gameWins", value: 5 } },
  { id: "arcadeWins15", category: "arcade", icon: "15W", title: "Arcade Regular", description: "Record fifteen successful arcade-game runs.", points: 45, criterion: { type: "gameWins", value: 15 } },
  { id: "arcadeWins30", category: "arcade", icon: "30W", title: "Cabinet Veteran", description: "Record thirty successful arcade-game runs.", points: 75, criterion: { type: "gameWins", value: 30 } },
  { id: "allGameWins", category: "arcade", icon: "8★", title: "Eight-Game Sweep", description: "Successfully complete all eight arcade games at least once.", points: 90, criterion: { type: "uniqueGameWins", value: 8 } },
  { id: "winStreak3", category: "arcade", icon: "3🔥", title: "Hot Streak", description: "Win three arcade-game runs in a row.", points: 35, criterion: { type: "gameWinStreak", value: 3 } },
  { id: "winStreak5", category: "arcade", icon: "5🔥", title: "Blake Is Watching", description: "Win five arcade-game runs in a row.", points: 65, criterion: { type: "gameWinStreak", value: 5 } },
  { id: "cleanFastWin", category: "arcade", icon: "60/95", title: "Fast and Clean", description: "Win an arcade game at 60+ WPM and 95%+ accuracy.", points: 45, criterion: { type: "gameWinQuality", wpm: 60, accuracy: 95 } },
  { id: "randomChallengeWin", category: "arcade", icon: "?W", title: "Challenge Accepted", description: "Win a Blake's Random Challenge.", points: 25, criterion: { type: "challengeWins", value: 1 } },
  { id: "randomChallenge5", category: "arcade", icon: "?5", title: "Unplanned Competence", description: "Win five randomized arcade challenges.", points: 55, criterion: { type: "challengeWins", value: 5 } },
  { id: "challengeStreak3", category: "arcade", icon: "?3", title: "Chaos Specialist", description: "Win three Random Challenges consecutively.", points: 60, criterion: { type: "challengeStreak", value: 3 } },
  { id: "tournamentFinish", category: "arcade", icon: "CUP", title: "Cup Competitor", description: "Complete your first HyperSoft Typing Tournament.", points: 30, criterion: { type: "tournamentSessions", value: 1 } },
  { id: "tournamentWin", category: "arcade", icon: "🏆", title: "HyperSoft Champion", description: "Earn a successful tournament finish.", points: 65, criterion: { type: "tournamentSuccesses", value: 1 } },
  { id: "grandTourWin", category: "arcade", icon: "8C", title: "Grand Tour Champion", description: "Successfully complete an eight-game Grand Tour tournament.", points: 110, criterion: { type: "tournamentFormatSuccess", id: "grand" } },
  { id: "goldTournament", category: "arcade", icon: "GOLD", title: "Gold Cup", description: "Earn a Gold medal in any Typing Tournament.", points: 125, criterion: { type: "tournamentMedal", id: "Gold" } }
];
