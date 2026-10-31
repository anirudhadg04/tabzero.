import { Achievement, CoreAppState } from '../types';

export function evaluateAchievements(
  currentAchievements: Achievement[],
  state: CoreAppState
): Achievement[] {
  const { completedSessions, blockedAttemptsTotal, dailyGoalMinutes, activities } = state;

  // Calculate total offline focus minutes from completed sessions
  const totalSessionMinutes = completedSessions
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  // Calculate total offline activity minutes
  const totalActivityMinutes = activities
    .filter(a => a.completed)
    .reduce((acc, a) => acc + a.durationMinutes, 0);

  const totalOfflineMinutes = totalSessionMinutes + totalActivityMinutes;

  return currentAchievements.map(ach => {
    let unlocked = ach.unlocked;
    let progress = ach.progress;
    const now = Date.now();

    switch (ach.id) {
      case 'first_disconnect': {
        const completedCount = completedSessions.filter(s => s.status === 'completed').length;
        progress = Math.min(100, Math.round((completedCount / 1) * 100));
        if (completedCount >= 1 && !unlocked) {
          unlocked = true;
        }
        break;
      }

      case 'reset_30': {
        progress = Math.min(100, Math.round((totalOfflineMinutes / 30) * 100));
        if (totalOfflineMinutes >= 30 && !unlocked) {
          unlocked = true;
        }
        break;
      }

      case 'one_hour_free': {
        progress = Math.min(100, Math.round((totalOfflineMinutes / 60) * 100));
        if (totalOfflineMinutes >= 60 && !unlocked) {
          unlocked = true;
        }
        break;
      }

      case 'deep_focus': {
        const has2HourSession = completedSessions.some(
          s => s.status === 'completed' && s.durationMinutes >= 120
        );
        progress = has2HourSession ? 100 : 0;
        if (has2HourSession && !unlocked) {
          unlocked = true;
        }
        break;
      }

      case 'scroll_breaker': {
        progress = blockedAttemptsTotal > 0 ? 100 : 0;
        if (blockedAttemptsTotal > 0 && !unlocked) {
          unlocked = true;
        }
        break;
      }

      case 'consistency': {
        progress = Math.min(100, Math.round((totalOfflineMinutes / dailyGoalMinutes) * 100));
        if (totalOfflineMinutes >= dailyGoalMinutes && !unlocked) {
          unlocked = true;
        }
        break;
      }
    }

    return {
      ...ach,
      progress,
      unlocked,
      unlockedAt: unlocked ? (ach.unlockedAt || now) : undefined,
    };
  });
}
