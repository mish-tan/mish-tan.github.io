// Pomodoro timer with a tail-swishing cat.
// The tail is a flipbook: one <img> per drawn frame, and we show one at a time.
(function () {
  var timer = document.querySelector('.pomodoro-timer');
  if (!timer) return;

  var minutes = Number(timer.dataset.minutes) || 15;
  var total = minutes * 60 * 1000;

  var display = timer.querySelector('.time');
  var status = timer.querySelector('[data-status]');
  var tails = timer.querySelectorAll('.tail');
  var pageTitle = document.title;

  var remaining = total;  // ms left
  var endsAt = null;      // when running: the clock time we finish at
  var ticker = null;

  // ---------- the tail ----------
  // Play the frames forwards then backwards (1 2 3 4 5 4 3 2 1 ...) so it swishes
  var order = [];
  for (var i = 0; i < tails.length; i++) order.push(i);
  for (var j = tails.length - 2; j > 0; j--) order.push(j);

  var step = 0;
  var wagger = null;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FRAME_MS = reduceMotion ? 900 : 220;

  function showTail(index) {
    tails.forEach(function (t, n) { t.classList.toggle('is-showing', n === index); });
  }

  function startWagging() {
    if (reduceMotion || wagger) return;
    wagger = setInterval(function () {
      step = (step + 1) % order.length;
      showTail(order[step]);
    }, FRAME_MS);
  }

  function stopWagging() {
    clearInterval(wagger);
    wagger = null;
    step = 0;
    showTail(0);
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
    document.title = endsAt ? text + ' · ' + pageTitle : pageTitle;
  }

  function tick() {
    // Work from the end time rather than counting ticks, so the timer
    // stays accurate even when the tab is in the background.
    remaining = Math.max(0, endsAt - Date.now());
    render();
    if (remaining === 0) finish();
  }

  function start() {
    if (endsAt || remaining === 0) return;
    endsAt = Date.now() + remaining;
    ticker = setInterval(tick, 250);
    startWagging();
    status.textContent = 'Timer started';
  }

  function pause() {
    if (!endsAt) return;
  tick();
  if (!endsAt) return;
  clearInterval(ticker);
    endsAt = null;
    stopWagging();
    render();
    status.textContent = 'Timer paused';
  }

  function reset() {
    clearInterval(ticker);
    endsAt = null;
    remaining = total;
    stopWagging();
    timer.classList.remove('is-done');
    render();
    status.textContent = 'Timer reset';
  }

  function finish() {
    clearInterval(ticker);
    endsAt = null;
    stopWagging();
    timer.classList.add('is-done');
    document.title = 'Done! · ' + pageTitle;
    status.textContent = 'Time is up';
    chime();
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

  timer.querySelector('[data-action="start"]').addEventListener('click', start);
  timer.querySelector('[data-action="pause"]').addEventListener('click', pause);
  timer.querySelector('[data-action="reset"]').addEventListener('click', reset);

  render();
})();
