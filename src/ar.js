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
    const leftButton = document.getElementById('ar-left-button');
    const rightButton = document.getElementById('ar-right-button');
    const startButton = document.getElementById('ar-start-button');

    if (!scene || !camera || !statusElement || !scoreElement || !timeElement || !leftButton || !rightButton || !startButton) {
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

    function buildHazardEntity(hazardIndex, hazardConfig) {
      const entity = document.createElement('a-entity');
      entity.dataset.hazardIndex = String(hazardIndex);
      entity.dataset.lane = String(hazardConfig.lane);
      entity.innerHTML = `
        <a-cone color="#ff7c70" radius-bottom="0.8" radius-top="0.08" height="1.8"></a-cone>
        <a-cone color="#ffe184" radius-bottom="0.55" radius-top="0.06" height="1.2" position="0.55 0.1 0"></a-cone>
        <a-cone color="#ffe184" radius-bottom="0.55" radius-top="0.06" height="1.2" position="-0.55 0.1 0"></a-cone>
      `;
      entity.object3D.position.set(config.laneX[hazardConfig.lane], 0.7, hazardConfig.z);
      return entity;
    }

    function renderLanePosition() {
      if (!carEntity || !config) {
        return;
      }

      const x = config.laneX[state.lane];
      carEntity.setAttribute('animation__lane', `property: position; to: ${x} 0.38 ${config.carZ}; dur: 160; easing: easeOutCubic`);
      carEntity.object3D.position.set(x, 0.38, config.carZ);
    }

    function resetHazards() {
      hazardEntities.forEach((hazard, index) => {
        const hazardConfig = config.hazardOffsets[index];
        hazard.lane = hazardConfig.lane;
        hazard.entity.dataset.lane = String(hazardConfig.lane);
        hazard.z = hazardConfig.z;
        hazard.entity.object3D.position.set(config.laneX[hazardConfig.lane], 0.7, hazardConfig.z);
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

      gameAnchor.innerHTML = `
        <a-plane rotation="-90 0 0" width="6" height="28" color="#20262d" position="0 0 -10"></a-plane>
        <a-plane rotation="-90 0 0" width="0.12" height="28" color="#f5f0c8" position="0 0.01 -10"></a-plane>
        <a-plane rotation="-90 0 0" width="0.08" height="28" color="#f5f0c8" position="-0.95 0.01 -10"></a-plane>
        <a-plane rotation="-90 0 0" width="0.08" height="28" color="#f5f0c8" position="0.95 0.01 -10"></a-plane>
        <a-plane rotation="-90 0 0" width="16" height="28" color="#395b33" position="0 -0.01 -10"></a-plane>
        <a-text value="AR SPIKE RUN" align="center" width="10" color="#ffffff" position="0 2 -2"></a-text>
      `;

      carEntity = document.createElement('a-entity');
      carEntity.id = 'ar-car-model';
      carEntity.setAttribute('gltf-model', '#centerpiece-model');
      carEntity.setAttribute('rotation', '0 180 0');
      carEntity.setAttribute('scale', '0.38 0.38 0.38');
      gameAnchor.appendChild(carEntity);

      hazardEntities = anchorConfig.hazardOffsets.map((hazardConfig, index) => {
        const entity = buildHazardEntity(index, hazardConfig);
        gameAnchor.appendChild(entity);
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
      updateHud();
      renderLanePosition();
      resetHazards();
      setStatus('AR run active. Если трассу не видно, повернись на месте на 180°.');
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
        hazard.entity.object3D.position.set(config.laneX[hazard.lane], 0.7, hazard.z);

        if (hazard.lane === state.lane && hazard.z >= config.carZ - 0.8 && hazard.z <= config.carZ + 0.6) {
          stopRun('Crash in AR');
          return;
        }

        if (hazard.z > config.carZ + 2) {
          hazard.lane = Math.floor(Math.random() * config.laneX.length);
          hazard.entity.dataset.lane = String(hazard.lane);
          hazard.z = -20 - Math.random() * 8;
          hazard.entity.object3D.position.set(config.laneX[hazard.lane], 0.7, hazard.z);
        }
      }

      if (state.elapsedSeconds >= 25) {
        stopRun('AR finish reached');
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
      setStatus('GPS ready. Нажми Start, затем медленно поверни телефон, если трасса не видна сразу.');
    });

    leftButton.addEventListener('click', () => handleLaneShift(-1));
    rightButton.addEventListener('click', () => handleLaneShift(1));
    startButton.addEventListener('click', startRun);
    globalScope.requestAnimationFrame(tick);
  });
})(typeof window !== 'undefined' ? window : globalThis);
