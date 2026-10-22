#!/usr/bin/env node
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function usage() {
  console.log(`codeanimation project scaffolder:
  node scaffold.mjs [target_directory] [options]

Options:
  --aspect=16:9|9:16|1:1   Aspect ratio (default: 16:9)
  --bpm=120               Tempo in BPM (default: 120)
  --duration=10           Duration in seconds (default: 10)
  --audio=path/to/song.mp3 Path to audio file (optional)
  --character=actor|custom Character template to include (default: actor)
`);
}

const args = Object.fromEntries(
  process.argv.slice(2).filter(a => a.startsWith('--')).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

if (args.help) { usage(); process.exit(0); }
if (!['16:9', '9:16', '1:1'].includes(args.aspect || '16:9')) {
  console.error('Unsupported aspect ratio'); process.exit(1);
}
for (const key of ['bpm', 'duration']) {
  if (args[key] !== undefined && (!Number.isFinite(Number(args[key])) || Number(args[key]) <= 0)) {
    console.error(`${key} must be a positive number`); process.exit(1);
  }
}

const targetPos = process.argv.slice(2).find(a => !a.startsWith('--'));
const targetDir = resolve(targetPos || '.');

if (existsSync(targetDir) && readdirSync(targetDir).length) {
  console.error('Choose a new or empty project directory to avoid overwriting existing work'); process.exit(1);
}

const aspect = args.aspect || '16:9';
let width = 1920, height = 1080;
if (aspect === '9:16') { width = 1080; height = 1920; }
else if (aspect === '1:1') { width = 1080; height = 1080; }

const bpm = +(args.bpm || 120);
const duration = +(args.duration || 10);
const audio = args.audio ? args.audio : null;

console.log(`Scaffolding codeanimation project in ${targetDir} (${width}x${height}, ${duration}s @ ${bpm} BPM)...`);

mkdirSync(join(targetDir, 'src', 'scenes'), { recursive: true });
mkdirSync(join(targetDir, 'src', 'characters'), { recursive: true });
mkdirSync(join(targetDir, 'assets'), { recursive: true });
mkdirSync(join(targetDir, 'out', 'check'), { recursive: true });

// 1. package.json
const pkgJsonPath = join(targetDir, 'package.json');
if (!existsSync(pkgJsonPath)) {
  writeFileSync(pkgJsonPath, JSON.stringify({
    name: 'codeanimation-project',
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      "sheet": "node render.mjs --sheet=0,1,2,3,4,5 --out=out/sheet.jpg",
      "video": "node render.mjs --clip --out=out/video.mp4"
    },
    dependencies: {
      "p5": "^2.3.3",
      "p5.brush": "^2.2.3",
      "puppeteer-core": "^25.11.0"
    }
  }, null, 2) + '\n');
}

// 2. config.js
writeFileSync(join(targetDir, 'src', 'config.js'), `// config.js: project settings
const PROJECT = {
  duration: ${duration},
  bpm: ${bpm},
  offset: 0,
  width: ${width},
  height: ${height},
  audio: ${JSON.stringify(audio)}
};
`);

// 3. Engine core files
copyFileSync(join(__dirname, 'core.js'), join(targetDir, 'src', 'core.js'));
copyFileSync(join(__dirname, 'timeline.js'), join(targetDir, 'src', 'timeline.js'));
copyFileSync(join(__dirname, 'sheets.js'), join(targetDir, 'src', 'sheets.js'));
copyFileSync(join(__dirname, 'characters', 'actor.js'), join(targetDir, 'src', 'characters', 'actor.js'));
copyFileSync(join(__dirname, 'characters', 'template.js'), join(targetDir, 'src', 'characters', 'template.js'));
copyFileSync(join(__dirname, 'audio.js'), join(targetDir, 'src', 'audio.js'));
copyFileSync(join(__dirname, 'render.mjs'), join(targetDir, 'render.mjs'));

// 4. studio.html
const studioHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Animation Studio</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=block">
<style>
  html, body { margin: 0; background: #1b1820; color: #eee; font: 13px system-ui, sans-serif; }
  main { padding: 12px; display: grid; gap: 8px; justify-items: center; }
  #out { width: min(100%, ${aspect === '9:16' ? '450px' : '1280px'}); aspect-ratio: ${width} / ${height}; height: auto; background: #F3EBDC; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
  .p5Canvas { display: none !important; }
  .bar { display: flex; gap: 10px; align-items: center; width: min(100%, ${aspect === '9:16' ? '450px' : '1280px'}); }
  #scrub { flex: 1; }
  #tt { font-variant-numeric: tabular-nums; min-width: 190px; }
</style>
<script src="node_modules/p5/lib/p5.min.js"></script>
<script src="node_modules/p5.brush/dist/p5.brush.js"></script>
</head>
<body>
<main>
  <canvas id="out" width="${width}" height="${height}"></canvas>
  <div class="bar">
    <input id="scrub" type="range" min="0" max="${duration}" step="0.0417" value="0">
    <span id="tt">loading…</span>
  </div>
</main>
<!-- engine -->
<script src="src/config.js"></script>
<script src="src/core.js"></script>
<script src="src/timeline.js"></script>
<script src="src/characters/actor.js"></script>
<script src="src/audio.js"></script>
<script src="src/sheets.js"></script>
<!-- video scenes -->
<script src="src/scenes/main.js"></script>
<script>
  const q = new URLSearchParams(location.search).get('loop');
  if (q && typeof LOOPS !== 'undefined' && LOOPS[q]) window.LOOP = LOOPS[q];
</script>
</body>
</html>
`;
writeFileSync(join(targetDir, 'studio.html'), studioHtml);

// 5. Starter main.js scene
const starterScene = `// src/scenes/main.js
(() => {
  // Shot A: Opening scene
  function sceneA(t, lt, dur) {
    camBegin(W / 2 + 15 * Math.sin(lt * .5), H / 2, 1 + .015 * lt);

    // Background & ground
    paint(rectPts(-200, -200, W + 400, H + 400), { wash: PAL.night, ink: null });
    paint(ellPts(W / 2, H * 1.15, W * .8, H * .4, 40, 2), { wash: PAL.sap, fill: PAL.night, fillOp: 90, ink: PAL.ink, sw: 1 });

    // Character or focal subject
    const mood = emotions(lt, [
      [0, 'happy'],
      [Math.min(dur * .5, 2), 'excited']
    ]);
    actor(W / 2, H * .85, 28, { ...mood, pulse: pulse(t, 4) });

    const at = toScreen(W / 2, H * .85 - 100);
    camEnd();

    // Transitions
    if (lt < .5) iris(...at, lerp(0, Math.max(W, H), easeIn(lt / .5)));
    if (lt > dur - .4) brushWipe((lt - (dur - .4)) / .8);
  }

  shots([
    [0, sceneA]
  ]);
})();
`;
writeFileSync(join(targetDir, 'src', 'scenes', 'main.js'), starterScene);

// 6. STORYBOARD.md template
const storyboard = `# Storyboard & Vision

Logline: [One sentence summarizing the concept or narrative]
Format: ${aspect} (${width}x${height}), ${duration}s duration, ${bpm} BPM
Palette: Base paper (#F3EBDC), Ink (#2B2233), Accents: [...]
Audio: ${audio || 'None / rhythm beat only'}

## Shot Breakdown

### Shot A (0.0s – ${duration}s)
- **Visual**: [What is on screen]
- **Event**: [What happens / changes]
- **Reaction**: [How character/subject reacts]
- **Reads**:
  - 0.0s – 1.5s: First read (viewer discovers the setting and character)
  - 1.5s – 3.0s: The action / event occurs
  - 3.0s – ${duration}s: Reaction lands, resolves, and transitions out
- **Transition In**: Iris open on character
- **Transition Out**: Brush wipe / Iris shut
`;
writeFileSync(join(targetDir, 'STORYBOARD.md'), storyboard);

console.log(`Scaffolding complete! Next steps:
  1. cd ${targetDir}
  2. npm install (if not already installed)
  3. node render.mjs --sheet=0.5,1,1.5 --out=out/check/sheet.jpg
  4. open studio.html in Chrome to scrub timeline
`);
