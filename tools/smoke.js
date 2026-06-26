// Headless smoke test of the game flow.
const { chromium } = require('playwright-core');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(300);

  const wordCount = await page.evaluate(() => window.WORDS.length);
  const word0 = await page.textContent('#word');
  console.log('WORDS loaded:', wordCount, '| first word shown:', JSON.stringify(word0));

  // initial team
  let team = await page.evaluate(() => document.body.className);
  console.log('initial body class:', team);

  // Start the timer
  await page.click('#startBtn');
  await page.waitForTimeout(150);
  const playVisible = await page.isVisible('#gotBtn');
  console.log('after Start, GOT IT visible:', playVisible);

  // Press Got It -> should switch team, back to ready
  await page.click('#gotBtn');
  await page.waitForTimeout(100);
  const team2 = await page.evaluate(() => document.body.className);
  const passes = await page.textContent('#passes');
  console.log('after Got It, body class:', team2, '| passes text:', JSON.stringify(passes.trim()));

  // Start again, then test +5 bump and pause
  await page.click('#startBtn');
  await page.waitForTimeout(100);
  await page.click('#plus5Btn');
  await page.click('#pauseBtn');
  const pauseLabel = await page.textContent('#pauseBtn');
  console.log('pause button label after pause:', JSON.stringify(pauseLabel.trim()));
  await page.click('#pauseBtn'); // resume

  // Force time up quickly by setting turn to 5 via settings then letting it run
  // Instead, drive timeUp directly by waiting—shorten remaining via evaluate is internal; emulate by clicking reset then award path:
  // Set a tiny turn length through settings UI:
  await page.click('#settingsBtn');
  await page.waitForTimeout(100);
  // reduce turn to minimum (5) by clicking minus several times
  for (let i=0;i<10;i++){ await page.click('[data-step="turn,-5"]'); }
  const turnVal = await page.textContent('#vTurn');
  console.log('min turn length:', turnVal);
  await page.click('#closeSettings');

  // reset to apply, start, wait for timeup (5s)
  await page.click('#resetBtn');
  await page.click('#startBtn');
  await page.waitForTimeout(5600);
  const timeupVisible = await page.isVisible('#awardBtn');
  const status = await page.textContent('#statusMsg');
  console.log('after countdown, timeup award visible:', timeupVisible, '| status:', JSON.stringify(status.trim()));

  // grace
  await page.click('#give4Btn');
  await page.waitForTimeout(100);
  const afterGrace = await page.isVisible('#gotBtn');
  console.log('after grace, back to play controls:', afterGrace);

  // let it expire and award point
  await page.waitForTimeout(4300);
  const award2 = await page.isVisible('#awardBtn');
  console.log('expired again, award visible:', award2);
  const score0before = await page.textContent('#pts0');
  const score1before = await page.textContent('#pts1');
  await page.click('#awardBtn');
  await page.waitForTimeout(100);
  const s0 = await page.textContent('#pts0');
  const s1 = await page.textContent('#pts1');
  console.log('scores before award:', score0before, score1before, '-> after:', s0, s1);

  // check log recorded
  const logLen = await page.evaluate(() => JSON.parse(localStorage.getItem('sts_logs')||'[]').length);
  const lastLog = await page.evaluate(() => { const l=JSON.parse(localStorage.getItem('sts_logs')||'[]'); return l[l.length-1]; });
  console.log('logs recorded:', logLen, '| last:', JSON.stringify(lastLog));

  console.log('CONSOLE ERRORS:', errors.length ? errors : 'none');
  await browser.close();
})().catch(e => { console.error('TEST FAILED:', e); process.exit(1); });
