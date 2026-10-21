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

const [mode, destination] = process.argv.slice(2);
if (!['assets', 'contact'].includes(mode) || !destination) {
  throw Error(
    'Usage: node scripts/store_assets/render.mjs assets|contact OUTPUT',
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
    const html = join('build/store-assets/layouts', `${name}.html`);
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
      `${name === 'icon/serienlog-icon-512.png' ? 'PNG32' : 'PNG24'}:${path}`,
    ]);
    console.log(path);
  }

  const frames = [
    ['01-uebersicht', 'Deine Serien<br>im Blick'],
    ['02-seriendetails', 'Deinen Serienabend<br>festhalten'],
    ['03-folgenstand', 'Wissen, wo du<br>aufgehört hast'],
    ['04-verlauf', 'Deinen Verlauf<br>wiederfinden'],
    ['05-erinnerungen', 'Ans Weiterschauen<br>denken'],
  ];
  const tabletFrames = [
    ['01-uebersicht', '01-uebersicht'],
    ['04-verlauf', '02-verlauf'],
    ['03-folgenstand', '03-folgenstand'],
    ['05-erinnerungen', '04-erinnerungen'],
  ];
  const rawRoot = resolve('build/store-assets/raw');
  const logo = uri('assets/icon.png');
  if (mode === 'assets') {
    await render(
      'icon/serienlog-icon-512.png',
      512,
      512,
      `<img src="${logo}" width="512" height="512">`,
      'body{background:#0C0C0F}',
    );
    const overview = uri(join(rawRoot, 'phone/01-uebersicht.png'));
    await render(
      'feature/serienlog-feature-1024x500.png',
      1024,
      500,
      `<div class="glow"></div><main><div class="brand"><img src="${logo}"><span>SerienLog</span></div><h1>Wissen, wo du<br>aufgehört hast.</h1><div class="line"></div><p>Staffel · Folge · Erinnerungen</p></main><img class="screen" src="${overview}">`,
      'body{background:#121216;color:#FAFAFA}.glow{position:absolute;inset:0;background:radial-gradient(ellipse at 95% 30%,#96101C 0%,#38151B 35%,#121216 75%)}main{position:absolute;left:64px;top:54px;z-index:2}.brand{display:flex;align-items:center;gap:12px;font-size:30px;font-weight:700}.brand img{width:54px;height:54px}h1{font-size:54px;line-height:1.12;letter-spacing:-1.5px;margin:36px 0 26px}.line{width:64px;height:5px;background:#E50914;border-radius:4px}p{font-size:22px;color:#D8D8DF;margin:25px 0 0}.screen{position:absolute;right:68px;top:38px;height:424px;width:auto;box-shadow:0 12px 35px #0008;z-index:2}',
    );
    for (let i = 0; i < frames.length; i++) {
      const [name, headline] = frames[i];
      const raw = join(rawRoot, `phone/${name}.png`);
      if (!existsSync(raw)) throw Error(`Missing real capture: ${raw}`);
      await render(
        `phone/${name}.png`,
        1080,
        1920,
        `<header><div class="brand"><span class="dot"></span>SERIENLOG <span class="number">0${i + 1}</span></div><h1>${headline}</h1></header><img class="screen" src="${uri(raw)}">`,
        'body{background:radial-gradient(ellipse at 100% 0%,#3D141B 0%,#151519 40%,#151519 100%);color:#FAFAFA}header{height:330px;padding:44px 76px 0}.brand{display:flex;align-items:center;gap:16px;font-size:22px;font-weight:700;letter-spacing:3px}.dot{width:11px;height:11px;background:#E50914;border-radius:50%}.number{margin-left:auto;color:#B7B7C2;font-weight:400;letter-spacing:1px}h1{font-size:66px;line-height:1.1;letter-spacing:-1.7px;margin:29px 0 0}.screen{display:block;height:1550px;width:auto;margin:0 auto;box-shadow:0 10px 30px #0005}',
      );
    }
    for (const folder of ['tablet7', 'tablet10']) {
      for (const [name, destinationName] of tabletFrames) {
        const raw = join(rawRoot, folder, `${name}.png`);
        if (!existsSync(raw))
          throw Error(`Missing real tablet capture: ${raw}`);
        mkdirSync(join(out, folder), { recursive: true });
        writeFileSync(
          join(out, folder, `${destinationName}.png`),
          readFileSync(raw),
        );
      }
    }
  } else {
    let body =
      '<h1>SerienLog <span>Store-Grafiken · Deutsch</span></h1><section class="branding">';
    for (const name of [
      'icon/serienlog-icon-512.png',
      'feature/serienlog-feature-1024x500.png',
    ]) {
      body += `<img src="${uri(join(out, name))}">`;
    }
    body += '</section><h2>Smartphone</h2><section class="grid phones">';
    for (const [name] of frames) {
      body += `<figure><img src="${uri(join(out, `phone/${name}.png`))}"><figcaption>${name}</figcaption></figure>`;
    }
    body += '</section>';
    for (const [folder, label] of [
      ['tablet7', '7-Zoll-Tablet'],
      ['tablet10', '10-Zoll-Tablet'],
    ]) {
      body += `<h2>${label}</h2><section class="grid tablets">`;
      for (const [, name] of tabletFrames) {
        body += `<figure><img src="${uri(join(out, `${folder}/${name}.png`))}"><figcaption>${name}</figcaption></figure>`;
      }
      body += '</section>';
    }
    await render(
      'VORSCHAU.png',
      1680,
      2360,
      body,
      'body{background:#202025;padding:44px;color:#FAFAFA}h1{font-size:36px;margin:0 0 32px}h1 span{font-size:22px;font-weight:400;margin-left:24px;color:#B7B7C2}.branding{display:flex;gap:34px;height:220px}.branding img{height:100%;width:auto}h2{font-size:28px;margin:34px 0 22px}.grid{display:grid;gap:26px}.phones{grid-template-columns:repeat(5,1fr)}.tablets{grid-template-columns:repeat(4,1fr)}figure{margin:0}figure img{width:100%;display:block}.tablets img{height:535px;object-fit:contain;background:#151519}figcaption{font-size:17px;margin-top:12px;color:#C4C4CD}',
    );
  }
} finally {
  socket?.close();
  chrome.kill();
  await delay(300);
  rmSync(profile, { recursive: true, force: true });
}
