const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createInitialState,
  moveLane,
  registerCollision,
  restartState,
  tickRace
} = require('../src/game-state.js');

test('createInitialState returns the expected driving defaults', () => {
  const state = createInitialState({
    finishSeconds: 45,
    baseSpeed: 18,
    speedRampPerSecond: 0.5,
    scorePerSecond: 12
  });

  assert.deepEqual(
    {
      lane: state.lane,
      score: state.score,
      elapsedSeconds: state.elapsedSeconds,
      finishSeconds: state.finishSeconds,
      speed: state.speed,
      maxSpeed: state.maxSpeed,
      status: state.status,
      result: state.result
    },
    {
      lane: 1,
      score: 0,
      elapsedSeconds: 0,
      finishSeconds: 45,
      speed: 18,
      maxSpeed: 18,
      status: 'running',
      result: 'in-progress'
    }
  );
});

test('moveLane moves left and right but respects road bounds', () => {
  let state = createInitialState();

  state = moveLane(state, -1);
  state = moveLane(state, -1);

  assert.equal(state.lane, 0);

  state = moveLane(state, 1);
  state = moveLane(state, 1);
  state = moveLane(state, 1);

  assert.equal(state.lane, 2);
});

test('tickRace increases elapsed time, speed, score, and max speed', () => {
  const initialState = createInitialState({
    baseSpeed: 16,
    speedRampPerSecond: 0.75,
    scorePerSecond: 20
  });
  const nextState = tickRace(initialState, 2);

  assert.equal(nextState.elapsedSeconds, 2);
  assert.equal(nextState.speed, 17.5);
  assert.equal(nextState.maxSpeed, 17.5);
  assert.equal(nextState.score, 40);
  assert.equal(nextState.status, 'running');
});

test('tickRace ends the run with a win when finish time is reached', () => {
  const initialState = createInitialState({
    finishSeconds: 5,
    scorePerSecond: 10
  });
  const finishedState = tickRace(initialState, 5);

  assert.equal(finishedState.elapsedSeconds, 5);
  assert.equal(finishedState.status, 'ended');
  assert.equal(finishedState.result, 'survived');
  assert.match(finishedState.message, /finish|survive|escaped/i);
});

test('registerCollision ends the run immediately with a crash result', () => {
  const initialState = createInitialState();
  const crashedState = registerCollision(initialState);

  assert.equal(crashedState.status, 'ended');
  assert.equal(crashedState.result, 'crash');
  assert.match(crashedState.message, /crash|spike|collision/i);
});

test('restartState resets lane, score, speed, and elapsed time', () => {
  let state = createInitialState({
    finishSeconds: 30,
    baseSpeed: 20,
    speedRampPerSecond: 1,
    scorePerSecond: 15
  });

  state = moveLane(state, 1);
  state = tickRace(state, 4);
  state = registerCollision(state);

  const restartedState = restartState(state);

  assert.equal(restartedState.lane, 1);
  assert.equal(restartedState.score, 0);
  assert.equal(restartedState.speed, 20);
  assert.equal(restartedState.maxSpeed, 20);
  assert.equal(restartedState.elapsedSeconds, 0);
  assert.equal(restartedState.status, 'running');
  assert.equal(restartedState.result, 'in-progress');
});
