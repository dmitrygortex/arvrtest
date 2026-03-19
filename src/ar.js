(function registerArStatus(globalScope) {
  if (!globalScope || !globalScope.addEventListener || typeof document === 'undefined') {
    return;
  }

  globalScope.addEventListener('load', () => {
    const statusElement = document.getElementById('ar-status');
    const camera = document.querySelector('[gps-new-camera]');

    if (!statusElement || !camera) {
      return;
    }

    camera.addEventListener('gps-camera-update-position', (event) => {
      const { latitude, longitude } = event.detail.position;
      statusElement.textContent = `GPS updated: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    });
  });
})(typeof window !== 'undefined' ? window : globalThis);
