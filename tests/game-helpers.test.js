const test = require('node:test');
const assert = require('node:assert/strict');

const { buildRoadLayout, createObstacleState, getResultDetails } = require('../src/game.js');

test('buildRoadLayout returns three stable lane positions', () => {
  const layout = buildRoadLayout();

  assert.deepEqual(layout.laneX, [-3.5, 0, 3.5]);
  assert.equal(layout.roadLength, 180);
  assert.equal(layout.finishLineZ, -120);
});

test('createObstacleState returns an obstacle bound to a valid lane', () => {
  const layout = buildRoadLayout();
  const obstacle = createObstacleState(layout, 2, 1);

  assert.equal(obstacle.id, 'obstacle-2');
  assert.equal(obstacle.lane, 1);
  assert.equal(obstacle.x, 0);
  assert.equal(typeof obstacle.z, 'number');
  assert.equal(obstacle.z < -20, true);
});

test('getResultDetails formats the survival win state', () => {
  const details = getResultDetails({
    result: 'survived',
    score: 540,
    elapsedSeconds: 45,
    maxSpeed: 40
  });

  assert.match(details.title, /finish|surviv/i);
  assert.match(details.summary, /45/);
  assert.match(details.summary, /40/);
});

test('getResultDetails formats the crash state', () => {
  const details = getResultDetails({
    result: 'crash',
    score: 180,
    elapsedSeconds: 16,
    maxSpeed: 28
  });

  assert.match(details.title, /crash|wreck|impact/i);
  assert.match(details.summary, /16/);
  assert.match(details.summary, /180/);
});
