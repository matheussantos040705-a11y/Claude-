// config.js: project settings.
//   duration: the video's length in seconds.
//   bpm:      the rhythm that bounces, dances and pulse() follow. Default 120. If using music,
//             set this to the song's tempo and set offset to the first downbeat.
//   offset:   time in seconds of the first downbeat (default 0).
//   width:    canvas width (default 1920; use 1080 for 9:16 vertical shorts or 1080 for 1:1 square).
//   height:   canvas height (default 1080; use 1920 for 9:16 vertical shorts or 1080 for 1:1 square).
//   audio:    path to audio file (e.g. 'assets/song.mp3' or null).
const PROJECT = {
  duration: 11,
  bpm: 120,
  offset: 0,
  width: 1920,
  height: 1080,
  audio: null
};
