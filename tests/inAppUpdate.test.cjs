const test = require('node:test');
const assert = require('node:assert/strict');

// Mock storage
const mockStorage = new Map();
const AsyncStorage = {
  getItem: async (key) => mockStorage.get(key) || null,
  setItem: async (key, val) => { mockStorage.set(key, String(val)); },
  removeItem: async (key) => { mockStorage.delete(key); },
  clear: async () => { mockStorage.clear(); },
};

function isUpdateAvailable(remoteVersionCode, localVersionCode = 3) {
  return typeof remoteVersionCode === 'number' && remoteVersionCode > localVersionCode;
}

async function isVersionDismissed(versionCode) {
  try {
    const raw = await AsyncStorage.getItem('@papula/dismissed_update_version');
    if (!raw) return false;
    const dismissed = parseInt(raw, 10);
    return dismissed >= versionCode;
  } catch {
    return false;
  }
}

async function dismissUpdate(versionCode) {
  await AsyncStorage.setItem('@papula/dismissed_update_version', String(versionCode));
}

test('isUpdateAvailable correctly detects higher versions', () => {
  assert.equal(isUpdateAvailable(4, 3), true, 'Version 4 is newer than 3');
  assert.equal(isUpdateAvailable(10, 3), true, 'Version 10 is newer than 3');
  assert.equal(isUpdateAvailable(3, 3), false, 'Same version is not newer');
  assert.equal(isUpdateAvailable(2, 3), false, 'Older version is not newer');
  assert.equal(isUpdateAvailable(null, 3), false, 'Null is rejected');
  assert.equal(isUpdateAvailable(undefined, 3), false, 'Undefined is rejected');
  assert.equal(isUpdateAvailable('4', 3), false, 'Non-number is rejected');
});

test('dismissUpdate stores version and suppresses duplicate prompts', async () => {
  await AsyncStorage.clear();
  
  assert.equal(await isVersionDismissed(4), false, 'Initially not dismissed');
  
  await dismissUpdate(4);
  assert.equal(await isVersionDismissed(4), true, 'Version 4 is now dismissed');
  assert.equal(await isVersionDismissed(3), true, 'Lower versions also considered handled');
  
  // Future new release (version 5) must NOT be suppressed
  assert.equal(await isVersionDismissed(5), false, 'Newer version 5 is NOT suppressed');
});

test('Update decision logic handles mandatory updates properly', async () => {
  await AsyncStorage.clear();
  await dismissUpdate(4);

  const optionalConfig = {
    latestVersionCode: 4,
    latestVersionName: '1.0.3',
    isMandatory: false,
  };

  const mandatoryConfig = {
    latestVersionCode: 4,
    latestVersionName: '1.0.3',
    isMandatory: true,
  };

  // For optional update, dismissal suppresses prompt
  const isDismissed = await isVersionDismissed(optionalConfig.latestVersionCode);
  const shouldShowOptional = isUpdateAvailable(optionalConfig.latestVersionCode, 3) && (!isDismissed || optionalConfig.isMandatory);
  assert.equal(shouldShowOptional, false, 'Dismissed optional update is suppressed');

  // For mandatory update, dismissal is ignored
  const shouldShowMandatory = isUpdateAvailable(mandatoryConfig.latestVersionCode, 3) && (!isDismissed || mandatoryConfig.isMandatory);
  assert.equal(shouldShowMandatory, true, 'Mandatory update is always presented');
});
