# A-Frame Speed Runner

Laboratory work 6 project with a desktop A-Frame driving game and a separate AR.js page.

## Local launch

1. Open the project folder in a terminal.
2. Start a static server:

```bash
python3 -m http.server 8000
```

3. Open the desktop speed-runner at `http://localhost:8000/index.html`.
4. Open the AR demo at `http://localhost:8000/ar.html`.

## Desktop controls

- `A/D` or left/right arrow keys: switch lanes
- `Start Run`: begin the race and unlock audio
- Goal: avoid spike obstacles, survive at speed, and reach the finish timer

## GitHub Pages deployment

1. Create a Git repository in this folder if needed.
2. Push the project to GitHub.
3. Open the repository settings.
4. Go to `Pages`.
5. Enable GitHub Pages for the main branch and root folder.
6. Wait until GitHub gives you the public URL.
7. Open that URL on desktop for `index.html` or on a phone for `ar.html`.

## Notes for AR.js

- AR works best on a real phone with camera and geolocation access.
- Use HTTPS or GitHub Pages hosting.
- The `ar.html` page contains GPS-based AR.js entities and requests camera and location permissions when opened.
# arvrtest
