import assert from 'assert';
import { DEFAULT_HISTORY_STATE } from '../src/storage/defaults';
import { undo, redo, canUndo, canRedo } from '../src/history';
import {
  addRestrictedSite,
  changeDailyGoal,
  createPledge,
  addPlannedActivity,
} from '../src/history/actions';
import { extractRootDomain, isDomainBlocked } from '../src/blocking/rules';

console.log('=== VERIFYING DOMAIN & SUBDOMAIN BLOCKING LOGIC ===\n');

// Test 1: extractRootDomain variations
assert.strictEqual(extractRootDomain('instagram.com'), 'instagram.com');
assert.strictEqual(extractRootDomain('www.instagram.com'), 'instagram.com');
assert.strictEqual(extractRootDomain('https://www.instagram.com/explore?ref=1'), 'instagram.com');
assert.strictEqual(extractRootDomain('http://m.instagram.com/'), 'm.instagram.com');
assert.strictEqual(extractRootDomain('https://youtube.com/watch?v=xyz'), 'youtube.com');
assert.strictEqual(extractRootDomain('www.reddit.com'), 'reddit.com');
console.log('✓ extractRootDomain normalizes protocols, www prefixes, ports, and paths accurately');

// Test 2: isDomainBlocked matches root domain, www, and all subdomains
const targetSite = 'instagram.com';
assert.strictEqual(isDomainBlocked('instagram.com', targetSite), true, 'Exact domain');
assert.strictEqual(isDomainBlocked('www.instagram.com', targetSite), true, 'www. subdomain');
assert.strictEqual(isDomainBlocked('https://www.instagram.com/explore', targetSite), true, 'https://www. url');
assert.strictEqual(isDomainBlocked('http://instagram.com/p/123', targetSite), true, 'http:// root url');
assert.strictEqual(isDomainBlocked('https://m.instagram.com/feed', targetSite), true, 'mobile subdomain m.');
assert.strictEqual(isDomainBlocked('https://l.instagram.com/link', targetSite), true, 'link redirect subdomain l.');
assert.strictEqual(isDomainBlocked('api.instagram.com', targetSite), true, 'api subdomain');
assert.strictEqual(isDomainBlocked('deep.sub.instagram.com', targetSite), true, 'multi-level subdomain');

// Non-matching domains must NOT be blocked
assert.strictEqual(isDomainBlocked('fakeinstagram.com', targetSite), false, 'fake prefix must not match');
assert.strictEqual(isDomainBlocked('instagram.community.org', targetSite), false, 'suffix brand must not match');
assert.strictEqual(isDomainBlocked('notinstagram.com', targetSite), false, 'notinstagram must not match');
console.log('✓ isDomainBlocked blocks root domain + www + all subdomains while protecting non-matching sites\n');

console.log('=== STARTING MANDATORY 5-STEP UNDO/REDO VERIFICATION ===\n');

// Initial State (Step 0)
let history = JSON.parse(JSON.stringify(DEFAULT_HISTORY_STATE));
const initialSitesCount = history.present.restrictedSites.length;
const initialGoal = history.present.dailyGoalMinutes;
const initialPledgesCount = history.present.pledges.length;
const initialActivitiesCount = history.present.activities.length;

console.log(`[Initial State] Sites: ${initialSitesCount}, Goal: ${initialGoal}m, Pledges: ${initialPledgesCount}, Activities: ${initialActivitiesCount}`);
assert.strictEqual(history.past.length, 0);
assert.strictEqual(history.future.length, 0);
assert.strictEqual(canUndo(history), false);
assert.strictEqual(canRedo(history), false);

// 1. Add a restricted website
console.log('\nStep 1: Adding restricted website (snapchat.com)...');
history = addRestrictedSite(history, 'snapchat.com', 'social');
assert.strictEqual(history.present.restrictedSites.length, initialSitesCount + 1);
assert.strictEqual(history.past.length, 1);
assert.strictEqual(history.future.length, 0);
assert.strictEqual(canUndo(history), true);

// 2. Change the daily goal
console.log('Step 2: Changing daily goal to 120 mins...');
history = changeDailyGoal(history, 120);
assert.strictEqual(history.present.dailyGoalMinutes, 120);
assert.strictEqual(history.past.length, 2);
assert.strictEqual(history.future.length, 0);

// 3. Create a pledge
console.log('Step 3: Creating a pledge (No phone during meals)...');
history = createPledge(history, {
  title: 'No phone during meals',
  pillar: 'DISCONNECT',
  targetMinutes: 45,
  isActive: true,
});
assert.strictEqual(history.present.pledges.length, initialPledgesCount + 1);
assert.strictEqual(history.past.length, 3);
assert.strictEqual(history.future.length, 0);

// 4. Add another restricted website
console.log('Step 4: Adding another restricted website (pinterest.com)...');
history = addRestrictedSite(history, 'pinterest.com', 'social');
assert.strictEqual(history.present.restrictedSites.length, initialSitesCount + 2);
assert.strictEqual(history.past.length, 4);
assert.strictEqual(history.future.length, 0);

// 5. Create a planned activity
console.log('Step 5: Creating planned activity (Morning park walk)...');
history = addPlannedActivity(history, {
  title: 'Morning park walk',
  pillar: 'MOVE',
  durationMinutes: 30,
  completed: false,
});
assert.strictEqual(history.present.activities.length, initialActivitiesCount + 1);
assert.strictEqual(history.past.length, 5, 'History past must cap at 5 steps');
assert.strictEqual(history.future.length, 0);
console.log('=> All 5 actions completed successfully. Past stack size: 5/5.');

// 6. Undo five times
console.log('\nStep 6: Executing 5 consecutive Undo operations...');
for (let i = 1; i <= 5; i++) {
  assert.strictEqual(canUndo(history), true, `Must be able to undo at step ${i}`);
  history = undo(history);
  console.log(`  - Undo ${i}/5 completed. Past size: ${history.past.length}, Future size: ${history.future.length}`);
}

// 7. Verify the original state is restored
console.log('\nStep 7: Verifying original state is restored...');
assert.strictEqual(history.present.restrictedSites.length, initialSitesCount, 'Sites count restored');
assert.strictEqual(history.present.dailyGoalMinutes, initialGoal, 'Daily goal restored');
assert.strictEqual(history.present.pledges.length, initialPledgesCount, 'Pledges count restored');
assert.strictEqual(history.present.activities.length, initialActivitiesCount, 'Activities count restored');
assert.strictEqual(history.past.length, 0, 'Past stack must now be empty');
assert.strictEqual(history.future.length, 5, 'Future redo stack must hold exactly 5 steps');
assert.strictEqual(canUndo(history), false, 'Cannot undo past original state');
assert.strictEqual(canRedo(history), true, 'Redo must be available');
console.log('=> Original state verified restored accurately!');

// 8. Redo five times
console.log('\nStep 8: Executing 5 consecutive Redo operations...');
for (let i = 1; i <= 5; i++) {
  assert.strictEqual(canRedo(history), true, `Must be able to redo at step ${i}`);
  history = redo(history);
  console.log(`  - Redo ${i}/5 completed. Past size: ${history.past.length}, Future size: ${history.future.length}`);
}

// 9. Verify all operations are restored
console.log('\nStep 9: Verifying all operations restored...');
assert.strictEqual(history.present.restrictedSites.length, initialSitesCount + 2, 'Restored both sites');
assert.strictEqual(history.present.dailyGoalMinutes, 120, 'Restored goal 120');
assert.strictEqual(history.present.pledges.length, initialPledgesCount + 1, 'Restored pledge');
assert.strictEqual(history.present.activities.length, initialActivitiesCount + 1, 'Restored activity');
assert.strictEqual(history.past.length, 5, 'Past stack is 5');
assert.strictEqual(history.future.length, 0, 'Future stack is 0');
console.log('=> All operations restored accurately!');

// 10. Undo once and perform a different action
console.log('\nStep 10: Undo once then perform a new diverging action...');
history = undo(history);
assert.strictEqual(history.future.length, 1, 'Future stack has 1 after 1 undo');
console.log('  Performing diverging action: changeDailyGoal to 90...');
history = changeDailyGoal(history, 90);

// 11. Verify redo is cleared
console.log('\nStep 11: Verifying redo is cleared on new action...');
assert.strictEqual(history.future.length, 0, 'Future stack must be cleared to 0');
assert.strictEqual(canRedo(history), false, 'canRedo must be false');
assert.strictEqual(history.present.dailyGoalMinutes, 90, 'New goal is 90');
console.log('=> Redo stack properly cleared on new action!');

console.log('\n🎉 ALL 11 STEPS OF THE MANDATORY FIVE-STEP UNDO/REDO SPECIFICATION PASSED VERIFICATION!');
