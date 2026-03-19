const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('required local media assets exist', () => {
  const requiredAssets = [
    'assets/textures/ground.svg',
    'assets/textures/crystal.svg',
    'assets/images/panel.svg',
    'assets/models/centerpiece.glb',
    'assets/audio/collect.wav',
    'assets/audio/hit.wav',
    'assets/audio/win.wav',
    'assets/audio/ambient.wav'
  ];

  requiredAssets.forEach((assetPath) => {
    assert.equal(fs.existsSync(path.join(projectRoot, assetPath)), true, assetPath);
  });
});

test('index.html includes the required desktop scene structure', () => {
  const html = readFile('index.html');

  assert.match(html, /<a-scene/i);
  assert.match(html, /<a-assets/i);
  assert.match(html, /<a-sky/i);
  assert.match(html, /id="car-root"/i);
  assert.match(html, /id="road-root"/i);
  assert.match(html, /id="obstacle-root"/i);
  assert.match(html, /id="score-value"/i);
  assert.match(html, /id="speed-value"/i);
  assert.match(html, /id="time-value"/i);
  assert.match(html, /id="status-value"/i);
});

test('desktop and AR pages both use the same glb car model', () => {
  const html = readFile('index.html');
  const arHtml = readFile('ar.html');

  assert.match(html, /id="car-model"/i);
  assert.match(html, /gltf-model="#centerpiece-model"/i);
  assert.match(arHtml, /<a-asset-item id="centerpiece-model"/i);
  assert.match(arHtml, /gltf-model="#centerpiece-model"/i);
});

test('desktop scene stylesheet makes the scene fill the viewport', () => {
  const css = readFile('styles.css');

  assert.match(css, /a-scene/i);
  assert.match(css, /height:\s*100vh/i);
});

test('ar.html includes AR.js and GPS hooks', () => {
  const html = readFile('ar.html');

  assert.match(html, /ar-threex-location-only/i);
  assert.match(html, /gps-new-camera/i);
  assert.match(html, /gps-new-entity-place/i);
});

test('README describes local launch and GitHub Pages deployment', () => {
  const readme = readFile('README.md');

  assert.match(readme, /python3 -m http\.server 8000/i);
  assert.match(readme, /index\.html/i);
  assert.match(readme, /ar\.html/i);
  assert.match(readme, /github pages/i);
  assert.match(readme, /A\/D|arrow/i);
  assert.match(readme, /spike|obstacle|speed/i);
});
