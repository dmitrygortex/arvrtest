# A-Frame Speed Runner Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the collection-based prototype with a lane-based speed-runner where the player avoids spike obstacles while the car accelerates and score rises with survival.

**Architecture:** Keep the project as a static site with plain HTML, CSS, JS, and local assets. Split logic into a pure state module for lanes, speed, score, and end conditions, plus a scene controller that renders the car, road, obstacles, HUD, and restart flow in A-Frame.

**Tech Stack:** HTML, CSS, vanilla JavaScript, A-Frame, aframe-physics-system, AR.js, Node built-in test runner

---

## Chunk 1: Replace The Game State Model

### Task 1: Rewrite tests for racing state

**Files:**
- Modify: `tests/game-state.test.js`
- Modify: `src/game-state.js`

- [ ] **Step 1: Write the failing test**
Add tests for:
- initial lane, speed, score, and status
- moving left and right within lane bounds
- ticking time increases score and speed
- collision ends the run
- timeout win ends the run
- restart resets the run

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/game-state.test.js`
Expected: FAIL because the old crystal-based API no longer matches

- [ ] **Step 3: Write minimal implementation**
Implement pure helpers for:
- `createInitialState`
- `moveLane`
- `tickRace`
- `registerCollision`
- `restartState`

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/game-state.test.js`
Expected: PASS

## Chunk 2: Replace Scene Markup And Helper Tests

### Task 2: Rewrite helper tests around the road layout

**Files:**
- Modify: `tests/game-helpers.test.js`
- Modify: `src/game.js`

- [ ] **Step 1: Write the failing test**
Replace collectible layout tests with:
- road lane positions
- obstacle spawn helper shape
- result message formatting for crash and survival win

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/game-helpers.test.js`
Expected: FAIL because old helpers describe the arena game

- [ ] **Step 3: Write minimal implementation**
Export helper functions for:
- lane positions
- obstacle spawning
- result formatting

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/game-helpers.test.js`
Expected: PASS

### Task 3: Rewrite desktop page structure for the driving scene

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `tests/assets-and-pages.test.js`

- [ ] **Step 1: Write the failing test**
Update the structure test so `index.html` must include:
- road scene
- car root
- obstacle root
- score, speed, time, status HUD ids

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/assets-and-pages.test.js`
Expected: FAIL because the existing markup still targets the old game

- [ ] **Step 3: Write minimal implementation**
Replace the arena scene with:
- a road
- player car hierarchy
- obstacle container
- start and result overlays
- updated HUD styling

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test tests/assets-and-pages.test.js`
Expected: PASS

## Chunk 3: Wire The Driving Gameplay

### Task 4: Implement the driving loop

**Files:**
- Modify: `src/game.js`
- Modify: `index.html`

- [ ] **Step 1: Write the failing test**
Confirm helper expectations first, then run the full suite and observe failures tied to missing new logic.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test`
Expected: FAIL until driving helpers and page expectations are aligned

- [ ] **Step 3: Write minimal implementation**
Implement:
- keyboard lane switching
- obstacle spawning
- score and speed progression
- collision detection
- crash handling
- successful finish handling
- restart flow
- audio unlock

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test`
Expected: PASS

### Task 5: Add polish and ensure the AR page still fits

**Files:**
- Modify: `src/game.js`
- Modify: `styles.css`
- Verify: `ar.html`
- Verify: `src/ar.js`
- Modify: `README.md`

- [ ] **Step 1: Write the failing test**
Update README expectations to mention the driving concept if needed.

- [ ] **Step 2: Run test to verify it fails**
Run: `node --test tests/assets-and-pages.test.js`
Expected: FAIL if docs are stale

- [ ] **Step 3: Write minimal implementation**
Add:
- lane change animation
- crash flash
- clearer result text
- updated README controls and deployment steps

- [ ] **Step 4: Run test to verify it passes**
Run: `node --test`
Expected: PASS

## Verification Checklist

- Run: `node --test`
- Run: `python3 -m http.server 8000`
- Open: `http://localhost:8000/index.html`
- Verify lane changes with `A/D` and arrow keys
- Verify score and speed increase over time
- Verify collision ends the run
- Verify restart works
- Open: `http://localhost:8000/ar.html`
