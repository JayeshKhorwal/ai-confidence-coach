class RPGEngine {
  constructor() {
    this.storageKey = 'critique_rpg_data';
    this.state = this.loadState();
  }

  loadState() {
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse RPG data', e);
      }
    }
    return {
      level: 1,
      totalXP: 0,
      streak: 0,
      lastActionDate: null,
      stats: { charisma: 0, looks: 0, discipline: 0 }
    };
  }

  setDailyCompletion(isComplete) {
    const today = new Date().toISOString().split('T')[0];
    const isAlreadyComplete = this.state.lastActionDate === today;

    if (isComplete && !isAlreadyComplete) {
      if (this.state.lastActionDate) {
        const lastDate = new Date(this.state.lastActionDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          this.state.streak += 1;
        } else if (diffDays > 1) {
          this.state.streak = 1;
        }
      } else {
        this.state.streak = 1;
      }
      this.state.lastActionDate = today;
    } else if (!isComplete && isAlreadyComplete) {
      this.state.streak = Math.max(0, this.state.streak - 1);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      this.state.lastActionDate = yesterday.toISOString().split('T')[0];
    }
    
    this.saveState();
    return this.state.streak;
  }

  saveState() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  calculateLevel(xp) {
    return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  }

  getXPForLevel(level) {
    if (level <= 1) return 0;
    return Math.pow(level - 1, 2) * 100;
  }

  getXPForNextLevel() {
    return this.getXPForLevel(this.state.level + 1);
  }

  getXPForCurrentLevel() {
    return this.getXPForLevel(this.state.level);
  }

  loseXP(baseAmount, statCategory) {
    // Apply negative XP
    this.state.totalXP = Math.max(0, this.state.totalXP - baseAmount);
    if (statCategory && this.state.stats[statCategory] !== undefined) {
      this.state.stats[statCategory] = Math.max(0, this.state.stats[statCategory] - baseAmount);
    }

    // Check leveling (might drop a level)
    const newLevel = this.calculateLevel(this.state.totalXP);
    const isLevelDrop = newLevel < this.state.level;
    this.state.level = newLevel;

    this.saveState();

    return {
      xpLost: baseAmount,
      isLevelDrop,
      currentLevel: this.state.level
    };
  }

  gainXP(baseAmount, statCategory) {
    // Streak bonus calculation (5% bonus per streak day, max 50%)
    const streakDays = Math.max(0, this.state.streak - 1);
    const streakBonus = Math.min(streakDays * 0.05, 0.5);
    const xpGained = Math.round(baseAmount * (1 + streakBonus));

    // Apply XP
    this.state.totalXP += xpGained;
    if (statCategory && this.state.stats[statCategory] !== undefined) {
      this.state.stats[statCategory] += xpGained;
    }

    // Check leveling
    const newLevel = this.calculateLevel(this.state.totalXP);
    const isLevelUp = newLevel > this.state.level;
    this.state.level = newLevel;

    this.saveState();

    return {
      xpGained,
      isLevelUp,
      currentLevel: this.state.level,
      currentStreak: this.state.streak
    };
  }
}
