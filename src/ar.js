(function registerArSpikeRun(globalScope) {
  function createOffsetCoordinate(origin, northMeters, eastMeters) {
    const latitudeOffset = northMeters / 111111;
    const longitudeOffset = eastMeters / (111111 * Math.cos((origin.latitude * Math.PI) / 180));

    return {
      latitude: origin.latitude + latitudeOffset,
      longitude: origin.longitude + longitudeOffset
    };
  }

  function buildArGameConfig(origin) {
    return {
      anchor: {
        latitude: origin.latitude,
        longitude: origin.longitude
      },
      laneX: [-1.6, 0, 1.6],
      hazardOffsets: [
        { lane: 0, z: -7 },
        { lane: 1, z: -13 },
        { lane: 2, z: -19 }
      ],
      carZ: 4.6
    };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      buildArGameConfig,
      createOffsetCoordinate
    };
  }

  if (!globalScope || !globalScope.addEventListener || typeof document === 'undefined') {
    return;
  }

  globalScope.addEventListener('load', () => {
    const scene = document.querySelector('a-scene');
    const camera = document.querySelector('[gps-new-camera]');
    const statusElement = document.getElementById('ar-status');
    const scoreElement = document.getElementById('ar-score-value');
    const timeElement = document.getElementById('ar-time-value');
    const overlayElement = document.getElementById('ar-overlay');
    const overlayTitleElement = document.getElementById('ar-overlay-title');
    const overlayTextElement = document.getElementById('ar-overlay-text');
    const restartButton = document.getElementById('ar-restart-button');
    const leftButton = document.getElementById('ar-left-button');
    const rightButton = document.getElementById('ar-right-button');
    const startButton = document.getElementById('ar-start-button');

    if (
      !scene ||
      !camera ||
      !statusElement ||
      !scoreElement ||
      !timeElement ||
      !overlayElement ||
      !overlayTitleElement ||
      !overlayTextElement ||
      !restartButton ||
      !leftButton ||
      !rightButton ||
      !startButton
    ) {
      return;
    }

    const state = {
      lane: 1,
      running: false,
      ready: false,
      elapsedSeconds: 0,
      score: 0,
      speed: 3.8
    };

    let config = null;
    let gameAnchor = null;
    let trackRoot = null;
    let carEntity = null;
    let hazardEntities = [];
    let lastFrame = 0;

    function updateHud() {
      scoreElement.textContent = String(state.score);
      timeElement.textContent = state.elapsedSeconds.toFixed(1);
    }

    function setStatus(text) {
      statusElement.textContent = text;
    }

    function setOverlay(title, text, visible) {
      overlayTitleElement.textContent = title;
      overlayTextElement.textContent = text;
      overlayElement.classList.toggle('is-visible', visible);
    }

    function buildHazardEntity(hazardIndex, hazardConfig) {
      const entity = document.createElement('a-entity');
      entity.dataset.hazardIndex = String(hazardIndex);
      entity.dataset.lane = String(hazardConfig.lane);
      entity.innerHTML = `
        <a-sphere color="#ffb087" radius="0.5" opacity="0.3" position="0 0.95 0"></a-sphere>
        <a-cone color="#ff655b" radius-bottom="1.05" radius-top="0.08" height="2.35"></a-cone>
        <a-cone color="#ffd36f" radius-bottom="0.74" radius-top="0.06" height="1.5" position="0.76 0.12 0"></a-cone>
        <a-cone color="#ffd36f" radius-bottom="0.74" radius-top="0.06" height="1.5" position="-0.76 0.12 0"></a-cone>
      `;
      entity.object3D.position.set(config.laneX[hazardConfig.lane], 1.02, hazardConfig.z);
      return entity;
    }

    function renderLanePosition() {
      if (!carEntity || !config) {
        return;
      }

      const x = config.laneX[state.lane];
      carEntity.setAttribute('animation__lane', `property: position; to: ${x} 0.62 ${config.carZ}; dur: 180; easing: easeOutCubic`);
      carEntity.object3D.position.set(x, 0.62, config.carZ);
    }

    function resetHazards() {
      hazardEntities.forEach((hazard, index) => {
        const hazardConfig = config.hazardOffsets[index];
        hazard.lane = hazardConfig.lane;
        hazard.entity.dataset.lane = String(hazardConfig.lane);
        hazard.z = hazardConfig.z;
        hazard.entity.object3D.position.set(config.laneX[hazardConfig.lane], 1.02, hazardConfig.z);
      });
    }

    function buildGame(anchorConfig) {
      if (gameAnchor) {
        gameAnchor.remove();
      }

      gameAnchor = document.createElement('a-entity');
      gameAnchor.id = 'ar-game-anchor';
      gameAnchor.setAttribute(
        'gps-new-entity-place',
        `latitude: ${anchorConfig.anchor.latitude}; longitude: ${anchorConfig.anchor.longitude}`
      );

      trackRoot = document.createElement('a-entity');
      trackRoot.id = 'ar-track-root';
      trackRoot.setAttribute('position', '0 -4.2 -9');
      trackRoot.setAttribute('rotation', '0 0 0');
      trackRoot.setAttribute('scale', '1.35 1.35 1.35');
      trackRoot.innerHTML = `
        <a-plane rotation="-90 0 0" width="8" height="34" color="#141b22" position="0 0 -12"></a-plane>
        <a-plane rotation="-90 0 0" width="0.2" height="34" color="#fff1a8" position="0 0.02 -12"></a-plane>
        <a-plane rotation="-90 0 0" width="0.14" height="34" color="#fff1a8" position="-1.25 0.02 -12"></a-plane>
        <a-plane rotation="-90 0 0" width="0.14" height="34" color="#fff1a8" position="1.25 0.02 -12"></a-plane>
        <a-plane rotation="-90 0 0" width="19" height="34" color="#244d30" position="0 -0.01 -12"></a-plane>
        <a-box width="0.22" height="0.22" depth="34" color="#72f4ff" position="-3.15 0.18 -12" opacity="0.82"></a-box>
        <a-box width="0.22" height="0.22" depth="34" color="#72f4ff" position="3.15 0.18 -12" opacity="0.82"></a-box>
        <a-ring radius-inner="0.36" radius-outer="0.58" color="#72f4ff" position="0 2.8 -2.2"></a-ring>
        <a-text value="AR SPIKE RUN" align="center" width="12" color="#ffffff" position="0 3.1 -2.2"></a-text>
      `;
      gameAnchor.appendChild(trackRoot);

      carEntity = document.createElement('a-entity');
      carEntity.id = 'ar-car-model';
      carEntity.setAttribute('gltf-model', '#centerpiece-model');
      carEntity.setAttribute('rotation', '0 180 0');
      carEntity.setAttribute('scale', '0.52 0.52 0.52');
      trackRoot.appendChild(carEntity);

      hazardEntities = anchorConfig.hazardOffsets.map((hazardConfig, index) => {
        const entity = buildHazardEntity(index, hazardConfig);
        trackRoot.appendChild(entity);
        return {
          entity,
          lane: hazardConfig.lane,
          z: hazardConfig.z
        };
      });

      scene.appendChild(gameAnchor);
      renderLanePosition();
      resetHazards();
    }

    function stopRun(message) {
      state.running = false;
      setStatus(message);
    }

    function finishRun(kind) {
      if (kind === 'win') {
        stopRun('AR finish reached');
        setOverlay('You Win', `Время: ${state.elapsedSeconds.toFixed(1)} c. Очки: ${state.score}.`, true);
        return;
      }

      stopRun('Crash in AR');
      setOverlay('Game Over', `Ты врезался в шипы. Очки: ${state.score}.`, true);
    }

    function startRun() {
      if (!state.ready || !config) {
        setStatus('Сначала дождись GPS, потом жми Start.');
        return;
      }

      state.running = true;
      state.elapsedSeconds = 0;
      state.score = 0;
      state.speed = 3.8;
      state.lane = 1;
      lastFrame = 0;
      setOverlay('AR Spike Run', 'Нажми Start после GPS lock и уворачивайся от шипов.', false);
      updateHud();
      renderLanePosition();
      resetHazards();
      setStatus('AR run active. Трасса лежит ниже камеры параллельно полу, смотри на неё сверху вниз.');
    }

    function handleLaneShift(direction) {
      if (!state.ready) {
        return;
      }

      state.lane = Math.max(0, Math.min(config.laneX.length - 1, state.lane + direction));
      renderLanePosition();
    }

    function tick(now) {
      globalScope.requestAnimationFrame(tick);

      if (!state.running || !config) {
        return;
      }

      if (!lastFrame) {
        lastFrame = now;
        return;
      }

      const deltaSeconds = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;

      state.elapsedSeconds += deltaSeconds;
      state.score = Math.floor(state.elapsedSeconds * 18);
      state.speed = 3.8 + state.elapsedSeconds * 0.28;
      updateHud();

      for (const hazard of hazardEntities) {
        hazard.z += state.speed * deltaSeconds;
        hazard.entity.object3D.position.set(config.laneX[hazard.lane], 1.02, hazard.z);

        if (hazard.lane === state.lane && hazard.z >= config.carZ - 0.8 && hazard.z <= config.carZ + 0.6) {
          finishRun('crash');
          return;
        }

        if (hazard.z > config.carZ + 2) {
          hazard.lane = Math.floor(Math.random() * config.laneX.length);
          hazard.entity.dataset.lane = String(hazard.lane);
          hazard.z = -20 - Math.random() * 8;
          hazard.entity.object3D.position.set(config.laneX[hazard.lane], 1.02, hazard.z);
        }
      }

      if (state.elapsedSeconds >= 25) {
        finishRun('win');
      }
    }

    camera.addEventListener('gps-camera-update-position', (event) => {
      const origin = event.detail.position;
      setStatus(`GPS ready: ${origin.latitude.toFixed(5)}, ${origin.longitude.toFixed(5)}`);

      if (state.ready) {
        return;
      }

      config = buildArGameConfig(origin);
      buildGame(config);
      state.ready = true;
      updateHud();
      setOverlay('AR Spike Run', 'GPS пойман. Нажми Start и смотри вниз: трасса лежит на полу перед тобой.', true);
      setStatus('GPS ready. Трасса лежит ниже камеры параллельно полу.');
    });

    leftButton.addEventListener('click', () => handleLaneShift(-1));
    rightButton.addEventListener('click', () => handleLaneShift(1));
    startButton.addEventListener('click', startRun);
    restartButton.addEventListener('click', startRun);
    globalScope.requestAnimationFrame(tick);
  });
})(typeof window !== 'undefined' ? window : globalThis);
