# A-Frame Speed Runner Design

**Date:** 2026-03-19
**Project:** Laboratory work 6
**Topic:** Desktop-first A-Frame obstacle-dodging racing game with a separate AR.js GPS demo

## Goal

Build a browser-based A-Frame mini-game where the player drives forward at speed and avoids spike obstacles on a three-lane road. The game must feel more like arcade driving than walking in a scene, while still covering the lab requirements and keeping the project deployable as a static site.

## Requirements Coverage

The implementation must include:

- Parent and child transformations
- `a-entity`
- `a-sky`
- Texture
- Blender 3D model
- Image
- Audio
- Text
- Ground
- Light
- Camera
- Animation
- Interactivity
- Event-driven animation
- Physics
- A separate AR.js page with camera and GPS coordinates

## Chosen Concept

The desktop game becomes a speed-runner:

- The vehicle moves forward automatically
- The player only changes lanes left and right
- Spike obstacles appear ahead and move toward the player
- Score increases from survived time and distance
- Speed gradually increases
- The run ends on collision or after the target survival time

This is a better fit than the previous collection mechanic because the core interaction is simpler, more reliable, and more readable as a game.

## Experience Overview

### Desktop Game

The main page contains:

- A long road with lane markings and scenery
- A player vehicle centered in third-person view
- Spike obstacles spawning in lanes
- HUD with score, speed, time, and best status text
- Start and end overlays
- Background engine-like loop and hit sound
- A visible crash reaction and result panel

### AR Demo

The AR page remains separate and simple:

- Uses AR.js with camera access
- Uses GPS coordinates to place themed objects nearby
- Reuses the same visual theme where practical
- Exists to satisfy the AR part of the lab, not to reproduce the full racing loop

## Scene Structure

### World

The desktop world includes:

- `a-sky`
- A textured road and side ground planes
- Light sources for readability
- Decorative roadside objects for depth

### Parent/Child Transformations

The vehicle demonstrates hierarchy:

- Parent `a-entity` for the whole car
- Child entities for wheels, body, lights, and an attached Blender model
- Lane changes move the parent and therefore all child parts together

This explicitly covers ancestor/descendant transformations.

### Player View

The player camera is attached behind and above the car, following the vehicle during lane changes. This keeps the “driving” feel stronger than a free first-person walk camera.

### Gameplay Objects

Gameplay objects include:

- Player car entity
- Spike obstacle entities
- Road decorations
- HUD and result overlay

## Gameplay Rules

### Start State

At the beginning of a run:

- Score is `0`
- Speed starts at a base value
- Time starts at `0`
- The player starts in the center lane
- Obstacles begin spawning after a short delay

### Lane Change

When the player presses `A/D` or left/right arrows:

- The car snaps or animates into the adjacent lane
- The camera follows the move
- The HUD remains active

### Scoring

The score is based on survival:

- Distance travelled
- Time survived
- Optional bonus for reaching speed milestones

### Obstacles

Spike obstacles:

- Spawn ahead of the player in one of three lanes
- Move toward the player relative to road speed
- Trigger a hit if they overlap the player lane at the car position

### End Conditions

The run ends when:

- The player collides with an obstacle
- Or the player survives to the target finish time and wins

The result screen shows:

- Final score
- Maximum speed reached
- Survival time
- Restart button

## Visual And Audio Design

### Visual Style

The game should feel like an arcade neon highway:

- Bright lane accents
- Strong contrast between road, spikes, and sky
- Motion-focused layout
- Clear HUD

### Audio

The audio set includes:

- Background loop
- Lane change or movement cue if useful
- Crash sound
- Win cue

## Technical Design

### Files

- `index.html` for the desktop speed-runner
- `ar.html` for the AR.js GPS demo
- `styles.css` for HUD and overlays
- `src/game-state.js` for pure race state logic
- `src/game.js` for scene orchestration
- `src/ar.js` for AR page behavior

### Game State

State tracks:

- Current lane
- Score
- Elapsed time
- Current speed
- Maximum speed reached
- Whether the run is active or ended

### Physics

Physics remains included because it is a lab requirement. The road uses a static body, the vehicle uses a body or collision representation, and obstacles have hitboxes. Even if collision resolution is simplified, physics-related components are present in the scene.

### Event-Driven Animation

Event-triggered animations include:

- Car sway during lane changes
- Crash flash or shake on impact
- Overlay reveal on game over

## Testing Strategy

Verification focuses on:

- Correct lane changes
- Score increasing over time
- Speed increasing over time
- Collision ending the run
- Restart restoring the initial state
- AR page loading with GPS hooks

## Deployment Plan

The project remains a static site:

- Run locally with a simple server
- Push to GitHub
- Enable GitHub Pages
- Open the published URL on mobile for the AR page

## Risks And Mitigations

### Collision Reliability

Instead of relying only on visual overlap, game logic should explicitly compare obstacle lane and z-position against the player position.

### Browser Audio Restrictions

Audio starts after the first user interaction.

### AR Mobile Constraints

AR is kept minimal and separate because it depends on real device permissions and HTTPS hosting.
