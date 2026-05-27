import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const SLUGS = [
  "bmw",
  "audi",
  "mercedes",
  "volkswagen",
  "mini",
  "porsche",
  "landrover",
  "toyota",
  "ford",
  "vauxhall",
  "nissan",
  "honda",
  "hyundai",
  "kia",
  "peugeot",
  "renault",
  "skoda",
  "volvo",
  "tesla",
  "seat",
  "lexus",
];

const outDir = join(process.cwd(), "public", "brands");
await mkdir(outDir, { recursive: true });

async function fetchSvg(url, outName) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAIL ${outName}: ${res.status} ${url}`);
    return false;
  }
  let svg = await res.text();
  if (!svg.includes('fill="currentColor"')) {
    svg = svg.replace(/<svg /, '<svg fill="currentColor" ');
  }
  await writeFile(join(outDir, `${outName}.svg`), svg, "utf8");
  console.log(`OK ${outName}`);
  return true;
}

for (const slug of SLUGS) {
  await fetchSvg(
    `https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/${slug}.svg`,
    slug
  );
}

// mercedes.svg and land-rover.svg are maintained manually (not in Simple Icons).
