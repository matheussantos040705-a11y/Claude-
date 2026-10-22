// examples/demo-music-beat.js: Musical rhythm and beat-synchronization example.
// Demonstrates how to lock character movement, camera impact shakes, and background lighting
// to a song's tempo (BPM) without relying on text subtitles.
(() => {
  // Shot A: Beat pulse and rhythmic choreography
  function shotRhythm(t, lt, dur) {
    // 1. Camera pulse on each downbeat
    const hit = downbeatHit(t, 1, 6);
    const shake = shakeXY(t, hit * 8);
    camBegin(W / 2 + shake[0], H / 2 + shake[1], 1 + hit * 0.04);

    // 2. Stage backdrop with musical light pulse
    boilSeed('stage_bg');
    paint(rectPts(-200, -200, W + 400, H + 400), { wash: PAL.night, ink: null });
    
    // Beat-synchronized background glow
    const beatPulse = pulse(t, 4);
    glow(W / 2, H * 0.45, 450 + 80 * beatPulse, PAL.violet, 0.4 + 0.5 * beatPulse);

    // 3. Stage floor
    boilSeed('stage_floor');
    paint(ellPts(W / 2, H * 1.1, W * 0.7, H * 0.35, 30, 2), {
      wash: PAL.indigo,
      fill: PAL.violet,
      fillOp: 80,
      ink: PAL.ink,
      sw: 1.2
    });

    // 4. Character dancing locked to the beat
    // Switches styles on bar boundaries
    const bar = barNumber(t);
    const style = bar % 2 === 0 ? 'bounce' : 'roof';
    const characterOpts = {
      ...move(style, t),
      eyes: 'happy',
      mouth: 'grin',
      lookX: Math.sin(t * 3) * 0.6,
      emote: hit > 0.6 ? 'music' : null,
      emoteK: hit,
      emoteAge: lt
    };
    actor(W / 2, H * 0.85, 26, characterOpts);

    const charScreen = toScreen(W / 2, H * 0.85 - 120);
    camEnd();

    // 5. Transitions
    if (lt < 0.4) iris(...charScreen, lerp(0, 1600, easeIn(lt / 0.4)));
    if (lt > dur - 0.4) brushWipe((lt - (dur - 0.4)) / 0.8, [PAL.violet, PAL.night]);
  }

  shots([
    [0, shotRhythm]
  ]);
})();
