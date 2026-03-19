const test = require('node:test');
const assert = require('node:assert/strict');

const { buildArGameConfig, createOffsetCoordinate } = require('../src/ar.js');

test('createOffsetCoordinate moves latitude northward and longitude eastward', () => {
  const origin = { latitude: 55.75, longitude: 37.61 };
  const shifted = createOffsetCoordinate(origin, 10, 5);

  assert.equal(shifted.latitude > origin.latitude, true);
  assert.equal(shifted.longitude > origin.longitude, true);
});

test('buildArGameConfig derives anchor positions from the current GPS coordinate', () => {
  const origin = { latitude: 55.75, longitude: 37.61 };
  const config = buildArGameConfig(origin);

  assert.equal(Array.isArray(config.laneX), true);
  assert.deepEqual(config.laneX, [-1.6, 0, 1.6]);
  assert.equal(config.hazardOffsets.length, 3);
  assert.equal(Math.abs(config.anchor.latitude - origin.latitude) < 0.000001, true);
});
