/* global AFRAME */

(function setupGame(globalScope) {
  const GameState =
    globalScope.GameState ||
    (typeof require === 'function' ? require('./game-state.js') : null);

  function buildRoadLayout() {
    return {
      laneX: [-3.5, 0, 3.5],
      roadLength: 180,
      finishLineZ: -120,
      spawnZ: -54,
      despawnZ: 16,
      carZ: 8,
      obstacleRadius: 1.15
    };
  }

  function createObstacleState(layout, index, lane) {
    const targetLane = lane ?? (index % layout.laneX.length);

    return {
      id: `obstacle-${index}`,
      lane: targetLane,
      x: layout.laneX[targetLane],
      z: layout.spawnZ - (index % 3) * 14,
      speedFactor: 0.95 + (index % 4) * 0.12
    };
  }

  function getResultDetails(state) {
    if (state.result === 'survived') {
      return {
        title: 'Finish Escape',
        summary: `You survived ${state.elapsedSeconds.toFixed(1)}s and reached top speed ${state.maxSpeed.toFixed(1)}.`
      };
    }

    return {
      title: 'Spike Crash',
      summary: `Impact after ${state.elapsedSeconds.toFixed(1)}s. Final score ${state.score}.`
    };
  }

  function formatPosition(x, y, z) {
    return `${x} ${y} ${z}`;
  }

  function playSound(audioElement, volume) {
    if (!audioElement) {
      return;
    }

    audioElement.pause();
    audioElement.currentTime = 0;
    if (typeof volume === 'number') {
      audioElement.volume = volume;
    }
    audioElement.play().catch(() => {});
  }

  function initGame() {
    if (typeof document === 'undefined' || !GameState) {
      return;
    }

    const scene = document.querySelector('a-scene');
    const carRoot = document.getElementById('car-root');
    const obstacleRoot = document.getElementById('obstacle-root');
    const hud = document.querySelector('.hud');
    const startOverlay = document.getElementById('start-overlay');
    const resultOverlay = document.getElementById('result-overlay');

    if (!scene || !carRoot || !obstacleRoot || !hud || !startOverlay || !resultOverlay) {
      return;
    }

    const elements = {
      score: document.getElementById('score-value'),
      speed: document.getElementById('speed-value'),
      time: document.getElementById('time-value'),
      status: document.getElementById('status-value'),
      startOverlay,
      resultOverlay,
      resultTitle: document.getElementById('result-title'),
      resultSummary: document.getElementById('result-summary'),
      resultScore: document.getElementById('result-score'),
      startButton: document.getElementById('start-button'),
      restartButton: document.getElementById('restart-button'),
      laneSound: document.getElementById('lane-sound'),
      hitSound: document.getElementById('hit-sound'),
      winSound: document.getElementById('win-sound'),
      ambientSound: document.getElementById('ambient-sound')
    };

    const layout = buildRoadLayout();
    const config = {
      finishSeconds: 45,
      baseSpeed: 18,
      speedRampPerSecond: 0.62,
      scorePerSecond: 16
    };

    let state = GameState.createInitialState(config);
    let runActive = false;
    let audioUnlocked = false;
    let obstacleCount = 0;
    let spawnCooldown = 0.6;
    let lastFrameTime = 0;
    const obstacles = [];

    function updateHud() {
      elements.score.textContent = String(state.score);
      elements.speed.textContent = state.speed.toFixed(1);
      elements.time.textContent = state.elapsedSeconds.toFixed(1);

      if (!runActive && state.status === 'running') {
        elements.status.textContent = 'Press Start';
        return;
      }

      if (state.status === 'ended') {
        elements.status.textContent = state.result === 'survived' ? 'Finish line reached' : 'Impact detected';
        return;
      }

      elements.status.textContent = `Lane ${state.lane + 1} / 3`;
    }

    function setCarLanePosition(animated) {
      const x = layout.laneX[state.lane];
      if (animated) {
        carRoot.setAttribute('animation__lane', `property: position; to: ${x} 0.9 ${layout.carZ}; dur: 180; easing: easeOutCubic`);
        carRoot.setAttribute('animation__tilt', `property: rotation; to: 0 0 ${x === 0 ? 0 : x < 0 ? 9 : -9}; dur: 120; dir: alternate; loop: 1`);
      }
      carRoot.object3D.position.set(x, 0.9, layout.carZ);
    }

    function removeObstacle(obstacle) {
      const index = obstacles.indexOf(obstacle);
      if (index >= 0) {
        obstacles.splice(index, 1);
      }
      obstacle.entity.remove();
    }

    function clearObstacles() {
      while (obstacles.length) {
        obstacles.pop().entity.remove();
      }
      obstacleRoot.innerHTML = '';
    }

    function spawnObstacle(forcedLane) {
      const lane = forcedLane ?? Math.floor(Math.random() * layout.laneX.length);
      const obstacle = createObstacleState(layout, obstacleCount + 1, lane);
      obstacleCount += 1;

      const entity = document.createElement('a-entity');
      entity.dataset.obstacleId = obstacle.id;
      entity.setAttribute('position', formatPosition(obstacle.x, 0.95, obstacle.z));
      entity.setAttribute('static-body', '');
      entity.innerHTML = `
        <a-cone
          radius-bottom="0.95"
          radius-top="0.1"
          height="2"
          color="#ff7d71"
          material="src: #crystal-texture; emissive: #ff6c5c; emissiveIntensity: 0.4"
          shadow="cast: true"
          animation="property: rotation; to: 0 360 0; loop: true; dur: 1300; easing: linear">
        </a-cone>
        <a-cone radius-bottom="0.82" radius-top="0.08" height="1.6" color="#ffe184" position="0 0.2 -0.8"></a-cone>
        <a-cone radius-bottom="0.82" radius-top="0.08" height="1.6" color="#ffe184" position="0 0.2 0.8"></a-cone>
      `;

      obstacle.entity = entity;
      obstacleRoot.appendChild(entity);
      obstacles.push(obstacle);
    }

    function unlockAudio() {
      if (audioUnlocked) {
        return;
      }

      audioUnlocked = true;
      elements.ambientSound.volume = 0.18;
      elements.ambientSound.play().catch(() => {});
    }

    function flashHit() {
      hud.classList.add('is-hit');
      window.setTimeout(() => hud.classList.remove('is-hit'), 180);
    }

    function finishRun() {
      runActive = false;
      const details = getResultDetails(state);
      elements.resultTitle.textContent = details.title;
      elements.resultSummary.textContent = details.summary;
      elements.resultScore.textContent = `Final score: ${state.score}`;
      elements.resultOverlay.classList.add('is-visible');

      if (state.result === 'survived') {
        playSound(elements.winSound, 0.4);
      } else {
        playSound(elements.hitSound, 0.48);
        flashHit();
        carRoot.setAttribute('animation__crash', 'property: rotation; to: 0 0 26; dur: 120; dir: alternate; loop: 3');
      }
    }

    function resetRun() {
      state = GameState.restartState(state);
      runActive = true;
      obstacleCount = 0;
      spawnCooldown = 0.45;
      lastFrameTime = 0;
      clearObstacles();
      setCarLanePosition(false);
      elements.resultOverlay.classList.remove('is-visible');
      elements.startOverlay.classList.remove('is-visible');
      updateHud();
    }

    function startRun() {
      unlockAudio();
      resetRun();
    }

    function handleKeydown(event) {
      if (!runActive || state.status !== 'running') {
        return;
      }

      let direction = 0;
      if (event.key === 'a' || event.key === 'A' || event.key === 'ArrowLeft') {
        direction = -1;
      }
      if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowRight') {
        direction = 1;
      }

      if (direction === 0) {
        return;
      }

      const nextState = GameState.moveLane(state, direction);
      if (nextState.lane !== state.lane) {
        state = nextState;
        setCarLanePosition(true);
        updateHud();
        playSound(elements.laneSound, 0.24);
      }
    }

    function updateObstacles(deltaSeconds) {
      spawnCooldown -= deltaSeconds;
      const dynamicSpawn = Math.max(0.38, 1.05 - state.elapsedSeconds * 0.015);

      if (spawnCooldown <= 0) {
        spawnObstacle();
        spawnCooldown = dynamicSpawn;
      }

      for (const obstacle of [...obstacles]) {
        obstacle.z += state.speed * obstacle.speedFactor * deltaSeconds;
        obstacle.entity.object3D.position.set(obstacle.x, 0.95, obstacle.z);

        const closeInLane = obstacle.lane === state.lane;
        const closeInDepth = obstacle.z >= layout.carZ - 1.9 && obstacle.z <= layout.carZ + 1.1;

        if (closeInLane && closeInDepth) {
          state = GameState.registerCollision(state);
          updateHud();
          finishRun();
          return;
        }

        if (obstacle.z > layout.despawnZ) {
          removeObstacle(obstacle);
        }
      }
    }

    function animate(now) {
      window.requestAnimationFrame(animate);
      if (!runActive) {
        return;
      }

      if (!lastFrameTime) {
        lastFrameTime = now;
        return;
      }

      const deltaSeconds = Math.min(0.05, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      if (state.status !== 'running') {
        return;
      }

      state = GameState.tickRace(state, deltaSeconds);
      updateHud();

      if (state.status === 'ended') {
        finishRun();
        return;
      }

      updateObstacles(deltaSeconds);
    }

    scene.addEventListener('loaded', () => {
      updateHud();
      setCarLanePosition(false);
      window.requestAnimationFrame(animate);
    }, { once: true });

    window.addEventListener('keydown', handleKeydown);
    elements.startButton?.addEventListener('click', startRun);
    elements.restartButton?.addEventListener('click', startRun);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      buildRoadLayout,
      createObstacleState,
      getResultDetails
    };
  }

  if (typeof document !== 'undefined') {
    window.addEventListener('DOMContentLoaded', initGame);
  }
})(typeof window !== 'undefined' ? window : globalThis);
