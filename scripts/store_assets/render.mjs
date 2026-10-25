// Code-native layouts around unchanged, real Android screenshots. Node >= 22.
import { spawn, execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  renameSync,
  rmSync,
} from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const [mode, destination, locale] = process.argv.slice(2);
if (!['assets', 'contact'].includes(mode) || !destination || !locale) {
  throw Error(
    'Usage: node scripts/store_assets/render.mjs assets|contact OUTPUT LOCALE',
  );
}
const out = resolve(destination);
mkdirSync(out, { recursive: true });
const profile = mkdtempSync('/dev/shm/sl-assets-chrome-');
const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
let socket;
try {
  for (let i = 0; !existsSync(join(profile, 'DevToolsActivePort')); i++) {
    if (i > 100) throw Error('Chrome did not start');
    await delay(100);
  }
  const port = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split(
    '\n',
  )[0];
  const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(
    pages.find((p) => p.type === 'page').webSocketDebuggerUrl,
  );
  await new Promise((ok, fail) => {
    socket.onopen = ok;
    socket.onerror = fail;
  });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (pending.has(message.id)) {
      const { ok, fail } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) fail(Error(JSON.stringify(message.error)));
      else ok(message.result);
    }
  };
  const call = (method, params = {}) =>
    new Promise((ok, fail) => {
      pending.set(++id, { ok, fail });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const uri = (p) => pathToFileURL(resolve(p)).href;
  const font = `@font-face{font-family:Roboto;src:url('${uri('assets/ui/Roboto-Regular.ttf')}')}@font-face{font-family:Roboto;src:url('${uri('assets/ui/Roboto-Bold.ttf')}');font-weight:700}`;
  async function render(name, width, height, body, css = '') {
    const path = join(out, name);
    mkdirSync(resolve(path, '..'), { recursive: true });
    const html = join(out, 'raw/layouts', `${name}.html`);
    mkdirSync(resolve(html, '..'), { recursive: true });
    if (existsSync(`${path}.html`)) renameSync(`${path}.html`, html);
    writeFileSync(
      html,
      `<!doctype html><meta charset="utf-8"><style>${font}*{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#fff;font-family:Roboto,sans-serif}${css}</style>${body}`,
    );
    await call('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await call('Page.navigate', { url: uri(html) });
    await delay(100);
    const ready = await call('Runtime.evaluate', {
      expression:
        'Promise.all([document.fonts.ready,...Array.from(document.images).map(i=>i.decode())])',
      awaitPromise: true,
    });
    if (ready.exceptionDetails)
      throw Error(`Image/font loading failed for ${name}`);
    const result = await call('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    writeFileSync(path, Buffer.from(result.data, 'base64'));
    // Lossless RGB encoding only: no changes to the screenshot content.
    execFileSync('convert', [
      path,
      `${name === 'icon/app-icon.png' ? 'PNG32' : 'PNG24'}:${path}`,
    ]);
    console.log(path);
  }

  const copy = JSON.parse(
    readFileSync(join('store', locale, 'copy.json'), 'utf8'),
  );
  const escape = (text) =>
    text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  const names = [
    '01-overview',
    '02-details',
    '03-progress',
    '04-history',
    '05-reminders',
    '06-pdf',
  ];
  const tabletNames = [names[0], names[3], names[4], names[5]];
  if (mode === 'assets') {
    const logo = uri('assets/icon.png');
    await render(
      'icon/app-icon.png',
      512,
      512,
      `<img src="${logo}" width="512" height="512">`,
      'body{background:#0C0C0F}',
    );
    const overview = uri(join(out, 'raw/phone/01-overview.png'));
    await render(
      'feature/feature-graphic.png',
      1024,
      500,
      `<main><div class="brand"><img src="${logo}">${escape(copy.name)}</div><h1>${escape(copy.feature).replaceAll('\n', '<br>')}</h1><p>${escape(copy.strap)}</p></main><img class="screen" src="${overview}"><div class="circle"></div>`,
      'body{background:#0C0C0F;color:#FAFAFA}main{position:absolute;left:50px;top:64px;z-index:2;width:630px}.brand{display:flex;align-items:center;gap:12px;font-size:30px;font-weight:700}.brand img{width:52px;height:52px}h1{font-size:44px;line-height:1.15;letter-spacing:-1px;margin:42px 0 32px}p{font-size:22px;color:#D8D8DF;margin:0}.screen{position:absolute;right:48px;top:36px;height:428px;width:auto;box-shadow:0 10px 35px #00000066;z-index:2}.circle{position:absolute;right:-130px;top:-80px;width:650px;height:650px;border:1px solid #E5091455;border-radius:50%}',
    );
    for (const [folder, width, height] of [
      ['phone', 1080, 1920],
      ['tablet7', 1080, 1920],
      ['tablet10', 1440, 2560],
    ]) {
      for (const name of folder === 'phone' ? names : tabletNames) {
        const index = names.indexOf(name);
        const raw = join(out, `raw/${folder}/${name}.png`);
        if (!existsSync(raw)) throw Error(`Missing real capture: ${raw}`);
        const scale = width / 1080;
        await render(
          `${folder}/${name}.png`,
          width,
          height,
          `<header><div class="brand">${escape(copy.name).toLocaleUpperCase(copy.locale)} <span>· ${String(index + 1).padStart(2, '0')}</span></div><h1>${escape(copy.frames[index]).replaceAll('\n', '<br>')}</h1></header><img class="screen" src="${uri(raw)}">`,
          `body{background:#121216;color:#FAFAFA}header{height:${330 * scale}px;padding:${45 * scale}px ${60 * scale}px 0}.brand{font-size:${22 * scale}px;font-weight:700;letter-spacing:${2 * scale}px}.brand span{color:#B7B7C2}h1{font-size:${56 * scale}px;line-height:1.12;letter-spacing:${-scale}px;margin:${25 * scale}px 0 0}.screen{display:block;height:${1550 * scale}px;width:auto;margin:0 auto;box-shadow:0 8px 26px #FAFAFA20}`,
        );
      }
    }
  } else {
    let body = `<h1>${escape(copy.name)} <span>${locale} · 1.0.0 (2)</span></h1><section class="branding"><img src="${uri(join(out, 'icon/app-icon.png'))}"><img src="${uri(join(out, 'feature/feature-graphic.png'))}"></section>`;
    for (const folder of ['phone', 'tablet7', 'tablet10']) {
      body += `<h2>${folder}</h2><section class="grid">`;
      for (const name of folder === 'phone' ? names : tabletNames)
        body += `<figure><img src="${uri(join(out, folder, name + '.png'))}"><figcaption>${folder}/${name}.png</figcaption></figure>`;
      body += '</section>';
    }
    await render(
      'VORSCHAU.png',
      1920,
      2400,
      body,
      'body{background:#121216;padding:36px;color:#FAFAFA}h1{font-size:32px;margin:0 0 22px}h1 span{font-size:22px;font-weight:400;margin-left:20px}.branding{display:flex;gap:28px;height:200px}.branding img{height:100%;width:auto}h2{font-size:26px;margin:26px 0 18px}.grid{display:grid;grid-template-columns:repeat(6,1fr);gap:20px}figure{margin:0}figure img{width:100%;display:block}figcaption{font-size:13px;margin-top:10px}',
    );
  }
} finally {
  socket?.close();
  chrome.kill();
  await delay(300);
  rmSync(profile, { recursive: true, force: true });
}
