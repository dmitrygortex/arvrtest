(function registerGameState(globalScope) {
function createInitialState(config = {}) {
  const normalizedConfig = {
    laneCount: config.laneCount ?? 3,
    finishSeconds: config.finishSeconds ?? 45,
    baseSpeed: config.baseSpeed ?? 18,
    speedRampPerSecond: config.speedRampPerSecond ?? 0.5,
    scorePerSecond: config.scorePerSecond ?? 12
  };

  return {
    lane: Math.floor(normalizedConfig.laneCount / 2),
    laneCount: normalizedConfig.laneCount,
    score: 0,
    elapsedSeconds: 0,
    finishSeconds: normalizedConfig.finishSeconds,
    speed: normalizedConfig.baseSpeed,
    maxSpeed: normalizedConfig.baseSpeed,
    baseSpeed: normalizedConfig.baseSpeed,
    speedRampPerSecond: normalizedConfig.speedRampPerSecond,
    scorePerSecond: normalizedConfig.scorePerSecond,
    status: 'running',
    result: 'in-progress',
    message: 'Stay on the road and dodge the spikes.'
  };
}

function moveLane(state, direction) {
  if (state.status !== 'running') {
    return state;
  }

  const lane = Math.max(0, Math.min(state.laneCount - 1, state.lane + direction));

  return {
    ...state,
    lane
  };
}

function tickRace(state, deltaSeconds) {
  if (state.status !== 'running') {
    return state;
  }

  const elapsedSeconds = Math.min(state.finishSeconds, state.elapsedSeconds + deltaSeconds);
  const speed = Number((state.baseSpeed + (elapsedSeconds * state.speedRampPerSecond)).toFixed(2));
  const score = Math.floor(elapsedSeconds * state.scorePerSecond);
  const hasFinished = elapsedSeconds >= state.finishSeconds;

  return {
    ...state,
    elapsedSeconds,
    speed,
    maxSpeed: Math.max(state.maxSpeed, speed),
    score,
    status: hasFinished ? 'ended' : state.status,
    result: hasFinished ? 'survived' : state.result,
    message: hasFinished ? 'You survived the full speed run and escaped the spikes.' : state.message
  };
}

function registerCollision(state) {
  if (state.status !== 'running') {
    return state;
  }

  return {
    ...state,
    status: 'ended',
    result: 'crash',
    message: 'The car crashed into the spike barrier.'
  };
}

function restartState(state) {
  return createInitialState({
    laneCount: state.laneCount,
    finishSeconds: state.finishSeconds,
    baseSpeed: state.baseSpeed,
    speedRampPerSecond: state.speedRampPerSecond,
    scorePerSecond: state.scorePerSecond
  });
}

const api = {
  createInitialState,
  moveLane,
  registerCollision,
  restartState,
  tickRace
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (globalScope) {
  globalScope.GameState = api;
}
})(typeof window !== 'undefined' ? window : globalThis);
