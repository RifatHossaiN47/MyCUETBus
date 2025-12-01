# Share Location - Comprehensive Test Plan

## Test Date: November 29, 2025

## Version: 1.0

---

## 🔍 TEST CATEGORIES

### 1. **HAPPY PATH TESTS**

#### Test 1.1: Basic Share Flow

**Steps:**

1. Open app and sign in
2. Navigate to Share Location page
3. Select a bus from dropdown (e.g., "Borigonga")
4. Press "Share Location" button
5. Wait 5 seconds

**Expected Results:**

- ✅ Button shows "Starting..." briefly
- ✅ Success alert appears
- ✅ Button changes to red "Stop Sharing"
- ✅ Green status message appears below
- ✅ Console shows: `✅ Initial location sent for Borigonga`
- ✅ Every 5 seconds: `✅ BG location updated for Borigonga`
- ✅ Firebase shows bus data updating every 5 seconds
- ✅ Notification appears: "Sharing bus location - Sharing for Borigonga"

#### Test 1.2: Stop Sharing

**Steps:**

1. While sharing (from Test 1.1)
2. Press "Stop Sharing" button

**Expected Results:**

- ✅ Button shows "Stopping..." briefly
- ✅ Button changes to blue "Share Location"
- ✅ Green status message disappears
- ✅ Console shows: `🛑 Stopping location sharing...`
- ✅ Console shows: `-->Bus location removed from Firebase`
- ✅ Firebase data for bus is removed
- ✅ Notification disappears
- ✅ Background task stops

#### Test 1.3: Background Operation

**Steps:**

1. Start sharing location
2. Minimize app (press Home button)
3. Wait 30 seconds
4. Open app again
5. Check Firebase

**Expected Results:**

- ✅ Console shows updates while app is minimized
- ✅ Firebase timestamp updates every 5 seconds
- ✅ Notification remains visible
- ✅ Upon return, app still shows "Stop Sharing" button
- ✅ Location continues updating

---

### 2. **PERMISSION TESTS**

#### Test 2.1: No Foreground Permission

**Steps:**

1. Uninstall app
2. Reinstall app
3. Sign in
4. Navigate to Share Location
5. Select bus and press Share
6. Deny foreground location permission

**Expected Results:**

- ✅ Alert: "Permission Denied - Location permission is required"
- ✅ Sharing does not start
- ✅ Button remains "Share Location"

#### Test 2.2: No Background Permission

**Steps:**

1. Grant foreground permission
2. Select bus and press Share
3. Deny background location permission

**Expected Results:**

- ✅ Alert: "Background Permission Needed - Allow background location to keep sharing while minimized"
- ✅ Sharing does not start

#### Test 2.3: Location Services Disabled

**Steps:**

1. Go to phone Settings → Location → Turn OFF
2. Try to share location

**Expected Results:**

- ✅ Alert: "Location Services Disabled - Please enable location services in your device settings"
- ✅ Sharing does not start

---

### 3. **ERROR HANDLING TESTS**

#### Test 3.1: No Bus Selected

**Steps:**

1. Don't select any bus
2. Press "Share Location"

**Expected Results:**

- ✅ Alert: "Error - Please select a bus name"
- ✅ Sharing does not start

#### Test 3.2: Not Authenticated

**Steps:**

1. Sign out
2. Try to access Share Location page

**Expected Results:**

- ✅ Redirected to sign-in page OR
- ✅ Alert: "Authentication Error - Please sign in to share location"

#### Test 3.3: No Internet Connection

**Steps:**

1. Turn on Airplane mode
2. Select bus
3. Press Share Location

**Expected Results:**

- ✅ Alert: "Connection Error - Unable to connect to Firebase. Check your internet connection"
- ✅ Sharing does not start
- ✅ Console shows: `❌ Firebase connection test failed`

#### Test 3.4: GPS Signal Lost

**Steps:**

1. Start sharing location
2. Go indoors to area with poor GPS
3. Wait 30 seconds

**Expected Results:**

- ✅ Background task continues trying
- ✅ Console shows retry attempts
- ✅ When GPS returns, updates resume
- ✅ Firebase shows gaps in timestamps but no crashes

#### Test 3.5: Location Timeout

**Steps:**

1. Be in area with very poor GPS (deep indoors)
2. Try to share location

**Expected Results:**

- ✅ Initial location fetch times out after 15 seconds
- ✅ Alert: "Location Timeout - Could not get your location..."
- ✅ Option to "Cancel" or "Retry"
- ✅ Retry button attempts again

---

### 4. **EDGE CASE TESTS**

#### Test 4.1: Double-Click Share Button

**Steps:**

1. Select bus
2. Rapidly tap "Share Location" button 5 times

**Expected Results:**

- ✅ Button disables after first click
- ✅ Shows "Starting..." text
- ✅ Only one sharing session starts
- ✅ Console shows: `⚠️ Share operation already in progress` for extra clicks

#### Test 4.2: Double-Click Stop Button

**Steps:**

1. While sharing
2. Rapidly tap "Stop Sharing" button 5 times

**Expected Results:**

- ✅ Button disables after first click
- ✅ Shows "Stopping..." text
- ✅ Only one stop operation executes
- ✅ No crashes

#### Test 4.3: Change Bus While Sharing

**Steps:**

1. Start sharing "Borigonga"
2. Try to change dropdown to "Shuttlerain"

**Expected Results:**

- ✅ Alert: "Cannot Change Bus - Please stop sharing before selecting a different bus"
- ✅ Dropdown selection reverts to "Borigonga"
- ✅ Sharing continues for "Borigonga"

#### Test 4.4: Share Same Bus Twice

**Steps:**

1. Start sharing "Borigonga"
2. (Without stopping) Try to press Share again

**Expected Results:**

- ✅ Alert: "Already Sharing - You are already sharing location for Borigonga"
- ✅ No duplicate sharing sessions

#### Test 4.5: App Restart While Sharing

**Steps:**

1. Start sharing location
2. Force close app (swipe away from recent apps)
3. Reopen app
4. Navigate to Share Location page

**Expected Results:**

- ✅ On app startup, orphaned task is cleaned up
- ✅ Console shows: `🧹 Cleaning up orphaned background task...`
- ✅ Button shows "Share Location" (not "Stop Sharing")
- ✅ Firebase data cleaned up
- ✅ User can start fresh sharing session

#### Test 4.6: Multiple Rapid Start/Stop

**Steps:**

1. Share location
2. Immediately stop
3. Immediately share again
4. Repeat 5 times quickly

**Expected Results:**

- ✅ Each operation completes properly
- ✅ No race conditions
- ✅ AsyncStorage stays in sync
- ✅ Firebase data correct
- ✅ No orphaned background tasks

---

### 5. **DATA INTEGRITY TESTS**

#### Test 5.1: Firebase Data Structure

**Steps:**

1. Share location for "Borigonga"
2. Check Firebase Realtime Database

**Expected Results:**

```json
{
  "buses": {
    "Borigonga": {
      "latitude": 22.xxxxxx,
      "longitude": 91.xxxxxx,
      "accuracy": 10.5,
      "speed": 0,
      "heading": 0,
      "timestamp": 1732867200000,
      "deviceType": "student_share",
      "sharedBy": "Student Name or Email"
    }
  }
}
```

- ✅ All fields present
- ✅ Valid coordinates (-90 to 90 lat, -180 to 180 lng)
- ✅ Timestamp is recent (within 10 seconds)

#### Test 5.2: AsyncStorage Verification

**Steps:**

1. Share location for "Borigonga"
2. Check console logs

**Expected Results:**

- ✅ Console shows: `📦 Bus name stored: Borigonga, verified: Borigonga`
- ✅ Verification matches stored value
- ✅ Background task reads same value

#### Test 5.3: Special Characters in Bus Name

**Steps:**

1. If bus name contains special chars (e.g., "Bus #1", "Route A/B")
2. Share location

**Expected Results:**

- ✅ Special characters sanitized: `#` → `_`, `/` → `_`
- ✅ Firebase key is valid: `buses/Bus__1`, `buses/Route_A_B`
- ✅ No Firebase errors

---

### 6. **PERFORMANCE TESTS**

#### Test 6.1: Battery Consumption

**Steps:**

1. Fully charge phone to 100%
2. Start sharing location
3. Keep app in background for 1 hour
4. Check battery level

**Expected Results:**

- ✅ Battery drain ≤ 10% per hour
- ✅ No excessive CPU usage
- ✅ Phone doesn't overheat

#### Test 6.2: Network Usage

**Steps:**

1. Note data usage before test
2. Share location for 30 minutes
3. Check data usage after

**Expected Results:**

- ✅ Data usage ≤ 5 MB for 30 minutes
- ✅ Updates sent efficiently
- ✅ No data leaks

#### Test 6.3: Long Running Session

**Steps:**

1. Start sharing location
2. Leave running for 4+ hours
3. Check Firebase and console logs

**Expected Results:**

- ✅ Updates continue consistently
- ✅ No memory leaks
- ✅ No consecutive error warnings
- ✅ Firebase data still updating

---

### 7. **RECOVERY TESTS**

#### Test 7.1: Network Recovery

**Steps:**

1. Start sharing location
2. Turn on Airplane mode
3. Wait 1 minute
4. Turn off Airplane mode

**Expected Results:**

- ✅ Updates pause when offline
- ✅ Console shows retry attempts: `⏳ Retrying in Xms...`
- ✅ When network returns, updates resume automatically
- ✅ Firebase timestamp gap shows offline period

#### Test 7.2: GPS Recovery

**Steps:**

1. Start sharing location
2. Go deep indoors (parking garage)
3. Wait 2 minutes
4. Go back outside

**Expected Results:**

- ✅ Background task continues trying
- ✅ When GPS returns, location updates resume
- ✅ No app crash

#### Test 7.3: Firebase Timeout

**Steps:**

1. Start sharing during poor network
2. Observe console logs

**Expected Results:**

- ✅ Write operations timeout after 10 seconds
- ✅ Retry mechanism activates
- ✅ Console shows: `❌ BG write failed (attempt 1/4)`
- ✅ Exponential backoff: 1s, 2s, 4s delays
- ✅ After 3 retries, gives up and waits for next interval

---

### 8. **UI/UX TESTS**

#### Test 8.1: Button States

**Expected States:**

- ✅ Before selection: "Share Location" (blue, disabled)
- ✅ After selection: "Share Location" (blue, enabled)
- ✅ While starting: "Starting..." (gray, disabled)
- ✅ While sharing: "Stop Sharing" (red, enabled)
- ✅ While stopping: "Stopping..." (gray, disabled)

#### Test 8.2: Dropdown States

**Expected States:**

- ✅ Before sharing: Normal gray border, white background
- ✅ While sharing: Light gray border, gray background, disabled
- ✅ Can't change selection while sharing

#### Test 8.3: Status Message

**Expected:**

- ✅ Hidden when not sharing
- ✅ Visible when sharing
- ✅ Shows correct bus name
- ✅ Green background with dark text

---

## 🐛 KNOWN ISSUES & FIXES

### Issue 1: Bus Name Returns Null

**Fixed:** Added AsyncStorage verification and 200ms delay before starting background task

### Issue 2: Updates Not Every 5 Seconds

**Fixed:** Changed `distanceInterval: 0` to make updates time-based only

### Issue 3: Orphaned Background Tasks

**Fixed:** Added cleanup on app startup in `_layout.jsx`

### Issue 4: Race Conditions

**Fixed:** Added `isProcessing` state to prevent double-clicks

### Issue 5: Invalid Coordinates

**Fixed:** Added coordinate validation in both foreground and background

---

## 📋 TEST EXECUTION CHECKLIST

### Pre-Test Setup

- [ ] Fresh install of app
- [ ] Device fully charged
- [ ] Good GPS signal area
- [ ] Stable internet connection
- [ ] Firebase console open
- [ ] Metro bundler console visible

### During Testing

- [ ] Monitor console logs continuously
- [ ] Check Firebase updates in real-time
- [ ] Note any warnings or errors
- [ ] Test on multiple devices (if available)
- [ ] Test on different Android versions

### Post-Test Validation

- [ ] All tests passed
- [ ] No memory leaks detected
- [ ] No orphaned data in Firebase
- [ ] No background tasks still running
- [ ] Battery consumption acceptable
- [ ] Network usage reasonable

---

## 🔧 DEBUGGING COMMANDS

### Check AsyncStorage

```bash
# In React Native Debugger Console
AsyncStorage.getAllKeys().then(keys => console.log(keys))
AsyncStorage.getItem('BUS_NAME').then(val => console.log(val))
```

### Check Background Task Status

```javascript
Location.hasStartedLocationUpdatesAsync(BACKGROUND_TASK_NAME).then((started) =>
  console.log("Task running:", started)
);
```

### Check Firebase Data

Navigate to: `https://console.firebase.google.com/project/mycuetbus/database/mycuetbus-default-rtdb/data/~2Fbuses`

### Monitor Logs

- **Metro Console**: Watch for 🔄 📦 ✅ ❌ emojis
- **Android Logcat**: `adb logcat | grep -i "expo\|location\|firebase"`

---

## ✅ TEST RESULTS SUMMARY

| Test Category  | Total Tests | Passed | Failed | Notes |
| -------------- | ----------- | ------ | ------ | ----- |
| Happy Path     | 3           | -      | -      | -     |
| Permissions    | 3           | -      | -      | -     |
| Error Handling | 5           | -      | -      | -     |
| Edge Cases     | 6           | -      | -      | -     |
| Data Integrity | 3           | -      | -      | -     |
| Performance    | 3           | -      | -      | -     |
| Recovery       | 3           | -      | -      | -     |
| UI/UX          | 3           | -      | -      | -     |
| **TOTAL**      | **29**      | **-**  | **-**  | **-** |

---

## 🚀 READY FOR PRODUCTION?

**Checklist:**

- [ ] All 29 tests pass
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Battery consumption reasonable
- [ ] Network usage efficient
- [ ] Error recovery works properly
- [ ] User experience smooth
- [ ] Documentation complete

**Approval:** ********\_\_\_********  
**Date:** ********\_\_\_********
