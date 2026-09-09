import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

// Vector source for the existing tilted b. badge; paths keep icons font-independent.
const mark = `<rect x="14" y="14" width="60" height="60" fill="#e879f9"/>
<g transform="rotate(-6 38 38)">
<rect x="6" y="6" width="60" height="60" fill="#bef264" stroke="#09090b" stroke-width="2.5"/>
<path fill="#09090b" fill-rule="evenodd" d="M16 13h8v15c3-3 6-4 10-4 8 0 14 6 14 14s-6 14-14 14c-4 0-7-1-10-4v3h-8V13zm17 18c-5 0-8 3-8 7s3 7 8 7 7-3 7-7-2-7-7-7Z"/>
<path fill="#09090b" d="M51 44h8v8h-8z"/>
</g>`;
const svg = (width, height, contents) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${contents}</svg>`;
const icon = svg(80, 80, mark);
const brand = `<svg x="64" y="42" width="96" height="96" viewBox="0 0 80 80">${mark}</svg>
<text x="178" y="109" font-size="62" font-weight="900">bzzr.</text>`;
const landscape = svg(
  1200,
  630,
  `<rect width="1200" height="630" fill="#fafafa"/>
<g font-family="Arial, Helvetica, sans-serif" fill="#09090b">${brand}
<path d="M64 157h1072" stroke="#09090b" stroke-width="3"/>
<text x="64" y="289" font-size="100" font-weight="900" letter-spacing="-5">FIRST IN.</text>
<g transform="rotate(-3 350 370)"><rect x="72" y="316" width="592" height="116" fill="#e879f9"/><rect x="64" y="306" width="592" height="116" fill="#bef264"/>
<text x="78" y="397" font-size="100" font-weight="900" letter-spacing="-5">GAME ON.</text></g>
<text x="67" y="495" font-size="28">Your people. One room code. A buzzer for everyone.</text>
<circle cx="942" cy="351" r="145" fill="#27272a"/><circle cx="942" cy="336" r="145" fill="#bef264" stroke="#d9f99d" stroke-width="16"/>
<text x="942" y="354" text-anchor="middle" font-size="58" font-weight="900">BUZZ</text>
<g transform="rotate(5 969 497)"><rect x="832" y="479" width="266" height="49" fill="#67e8f9" stroke="#09090b" stroke-width="3"/><text x="965" y="512" text-anchor="middle" font-size="23" font-weight="700">TRIVIA NIGHT, SORTED.</text></g>
<path d="M64 555h1072" stroke="#09090b" stroke-width="3"/>
<text x="64" y="597" font-size="22" font-weight="700">NO ACCOUNTS. JUST QUICK REFLEXES.</text><text x="1136" y="597" text-anchor="end" font-size="24" font-weight="700">bzzr.app</text></g>`,
);
const square = svg(
  1080,
  1080,
  `<rect width="1080" height="1080" fill="#fafafa"/>
<g font-family="Arial, Helvetica, sans-serif" fill="#09090b">${brand}
<path d="M64 162h952" stroke="#09090b" stroke-width="3"/>
<text x="64" y="310" font-size="126" font-weight="900" letter-spacing="-6">FIRST IN.</text>
<g transform="rotate(-3 470 412)"><rect x="75" y="341" width="797" height="146" fill="#e879f9"/><rect x="64" y="330" width="797" height="146" fill="#bef264"/>
<text x="80" y="451" font-size="134" font-weight="900" letter-spacing="-6">GAME ON.</text></g>
<text x="68" y="554" font-size="32">A buzzer for your next trivia night.</text>
<circle cx="540" cy="763" r="147" fill="#27272a"/><circle cx="540" cy="748" r="147" fill="#bef264" stroke="#d9f99d" stroke-width="16"/>
<text x="540" y="770" text-anchor="middle" font-size="64" font-weight="900">BUZZ</text>
<path d="M64 964h952" stroke="#09090b" stroke-width="3"/>
<text x="64" y="1020" font-size="26" font-weight="700">NO ACCOUNTS. JUST QUICK REFLEXES.</text><text x="1016" y="1020" text-anchor="end" font-size="28" font-weight="700">bzzr.app</text></g>`,
);

await mkdir("public", { recursive: true });
await writeFile("public/favicon.svg", icon);
await writeFile("public/social-card.svg", landscape);
await writeFile("public/social-square.svg", square);
const browser = await chromium.launch({ args: ["--disable-gpu"] });
try {
  const page = await browser.newPage();
  async function render(source, width, height, path) {
    await page.setViewportSize({ width, height });
    await page.setContent(
      `<html><body style="margin:0">${source}</body></html>`,
    );
    return page.screenshot({ path, omitBackground: true });
  }
  await render(landscape, 1200, 630, "public/social-card.png");
  await render(square, 1080, 1080, "public/social-square.png");
  await render(
    svg(
      180,
      180,
      `<rect width="180" height="180" fill="#fafafa"/><g transform="translate(10 10) scale(2)">${mark}</g>`,
    ),
    180,
    180,
    "public/apple-touch-icon.png",
  );
  const icons = [];
  for (const size of [16, 32, 48]) {
    icons.push(
      await render(
        icon.replace(
          'width="80" height="80"',
          `width="${size}" height="${size}"`,
        ),
        size,
        size,
        size === 32 ? "public/favicon-32.png" : undefined,
      ),
    );
  }
  const header = Buffer.alloc(6 + icons.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icons.length, 4);
  let offset = header.length;
  icons.forEach((bytes, index) => {
    const entry = 6 + index * 16;
    header[entry] = header[entry + 1] = [16, 32, 48][index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(bytes.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += bytes.length;
  });
  await writeFile("public/favicon.ico", Buffer.concat([header, ...icons]));
} finally {
  await browser.close();
}
