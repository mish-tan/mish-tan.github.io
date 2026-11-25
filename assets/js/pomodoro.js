// Pomodoro timer with a tail-flicking cat.
// Focus (15 min) and break (5 min) take turns until you pause or reset.
// The tail is a flipbook: one <img> per drawn frame, and we show one at a time.
(function () {
  var timer = document.querySelector('.pomodoro-timer');
  if (!timer) return;

  var phases = {
    focus: { ms: (Number(timer.dataset.focusMinutes) || 15) * 60 * 1000, label: 'Focus' },
    break: { ms: (Number(timer.dataset.breakMinutes) || 5) * 60 * 1000, label: 'Break' }
  };

  var display = timer.querySelector('.time');
  var status = timer.querySelector('[data-status]');
  var tails = timer.querySelectorAll('.tail');
  var toggleButton = timer.querySelector('[data-action="toggle"]');
  var pageTitle = document.title;

  var phase = 'focus';
  var remaining = phases.focus.ms; // ms left in this phase
  var endsAt = null;               // when running: the clock time this phase ends
  var ticker = null;

  // ---------- the tail ----------
  // Every 2 to 5 seconds, jump to a different, randomly picked tail frame
  var current = 0;
  var tailTimer = null;

  function showTail(index) {
    current = index;
    tails.forEach(function (t, n) { t.classList.toggle('is-showing', n === index); });
  }

  function flickTail() {
    var next = Math.floor(Math.random() * (tails.length - 1));
    if (next >= current) next++; // never pick the frame that's already showing
    showTail(next);
    scheduleFlick();
  }

  function scheduleFlick() {
    var wait = 2000 + Math.random() * 3000; // 2 to 5 seconds
    tailTimer = setTimeout(flickTail, wait);
  }

  function startTail() {
    if (!tailTimer) scheduleFlick();
  }

  function stopTail() {
    clearTimeout(tailTimer);
    tailTimer = null;
  }

  // ---------- the clock ----------
  function format(ms) {
    var secs = Math.ceil(ms / 1000);
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function render() {
    var text = format(remaining);
    display.textContent = text;
    timer.classList.toggle('is-break', phase === 'break');
    toggleButton.textContent = endsAt ? 'pause' : 'start';
    document.title = endsAt ? text + ' ' + phases[phase].label.toLowerCase() + ' · ' + pageTitle : pageTitle;
  }

  function tick() {
    // Work from the end time rather than counting ticks, so the timer
    // stays accurate even when the tab is in the background.
    remaining = Math.max(0, endsAt - Date.now());
    render();
    if (remaining === 0) phaseOver();
  }

  function run() {
    endsAt = Date.now() + remaining;
    clearInterval(ticker);
    ticker = setInterval(tick, 250);
    startTail();
    render();
  }

  function stop() {
    clearInterval(ticker);
    endsAt = null;
    stopTail();
  }

  function start() {
    if (endsAt) return;
    run();
    status.textContent = phases[phase].label + ' started';
  }

  function pause() {
    if (!endsAt) return;
    tick();
    stop();
    render();
    status.textContent = 'Paused';
  }

  function reset() {
    stop();
    phase = 'focus';
    remaining = phases.focus.ms;
    render();
    status.textContent = 'Reset to focus';
  }

  function toggle() {
    if (endsAt) pause();
    else start();
  }

  function phaseOver() {
    // Switch to the other phase and keep going: focus, break, focus, break...
    chime();
    phase = phase === 'focus' ? 'break' : 'focus';
    remaining = phases[phase].ms;
    run();
    status.textContent = phase === 'break' ? 'Break time' : 'Back to focus';
  }

  // A soft two-note chime, made in the browser so there's no sound file to host
  function chime() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = new Ctx();
    [659.25, 880].forEach(function (freq, n) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var t = ctx.currentTime + n * 0.35;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.85);
    });
  }

  toggleButton.addEventListener('click', toggle);
  timer.querySelector('[data-action="reset"]').addEventListener('click', reset);

  render();
})();
