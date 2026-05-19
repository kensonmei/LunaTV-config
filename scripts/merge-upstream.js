// Merge upstream jingjian.json with custom extras, split regular vs adult
// Run: node scripts/merge-upstream.js
// Requires: upstream.json (fetched from hafrey1/LunaTV-config)

const fs = require('fs');

const CUSTOM_EXTRAS = {
  "dbzy":       { "name": "🎬豆瓣资源", "api": "https://caiji.dbzy5.com/api.php/provide/vod", "detail": "https://dbzy.tv" },
  "lzizy":      { "name": "🎬量子影视", "api": "https://cj.lziapi.com/api.php/provide/vod", "detail": "https://lzizy.net" },
  "zuidazy":    { "name": "🎬最大点播", "api": "https://zuidazy.me/api.php/provide/vod", "detail": "https://zuidazy.co" },
  "wwzy":       { "name": "🎬旺旺短剧", "api": "https://wwzy.tv/api.php/provide/vod", "detail": "https://wwzy.tv" },
  "yayazy3":    { "name": "🎬鸭鸭资源", "api": "https://cj.yayazy.net/api.php/provide/vod", "detail": "https://yayazy3.com" },
  "suonizy":    { "name": "🎬索尼资源", "api": "https://suoniapi.com/api.php/provide/vod", "detail": "https://suonizy.net" },
  "kuaichezy":  { "name": "🎬快车资源", "api": "https://caiji.kuaichezy.org/api.php/provide/vod", "detail": "https://kuaichezy.com" },
  "shandianzy": { "name": "🎬闪电资源", "api": "https://xsd.sdzyapi.com/api.php/provide/vod", "detail": "https://shandianzy.com" },
  "yhzy":       { "name": "🎬樱花资源", "api": "https://m3u8.apiyhzy.com/api.php/provide/vod", "detail": "https://yhzy.cc" },
  "doudouzy":   { "name": "🔞豆豆资源", "api": "https://api.doudouzy.com/api.php/provide/vod", "detail": "https://doudouzy.com" },
  "ckzy":       { "name": "🔞 CK-资源", "api": "https://api.ckzy.me/api.php/provide/vod", "detail": "https://ckzy.me" },
  "xiangjiaozyw": { "name": "🔞香蕉资源", "api": "https://api.xiangjiazyw.com/api.php/provide/vod", "detail": "https://xiangjiazyw.com" },
  "xingba":     { "name": "🔞杏吧资源", "api": "https://api.xingbazy.com/api.php/provide/vod", "detail": "https://xingbazy.com" },
  "dadizy":     { "name": "🔞大地资源", "api": "https://api.ddizy.com/api.php/provide/vod", "detail": "https://dadizy.com" },
  "semaozy":    { "name": "🔞色猫资源", "api": "https://api.semaozy.com/api.php/provide/vod", "detail": "https://semaozy.com" },
  "aosikazy":   { "name": "🔞-奥斯卡-", "api": "https://api.aosikazy.com/api.php/provide/vod", "detail": "https://aosikazy.com" },
  "siwazy":     { "name": "🔞丝袜资源", "api": "https://api.siwazy.com/api.php/provide/vod", "detail": "https://siwazy.com" },
};

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(str) {
  const bytes = Buffer.from(str, 'utf-8');
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  if (n === 0n) return BASE58[0];
  let result = '';
  while (n > 0n) {
    result = BASE58[Number(n % 58n)] + result;
    n = n / 58n;
  }
  return result;
}

function normUrl(url) {
  return url.toLowerCase().replace(/\/+$/, '');
}

function writeConfigs(sites, prefix) {
  const config = { cache_time: 7200, api_site: sites };
  fs.writeFileSync(`${prefix}.json`, JSON.stringify(config, null, 2), 'utf-8');
  fs.writeFileSync(`${prefix}.txt`, base58Encode(JSON.stringify(config)), 'utf-8');
}

// Load upstream
const upstream = JSON.parse(fs.readFileSync('upstream.json', 'utf-8'));
const upstreamSites = upstream.api_site || {};

const regular = {}, adult = {};
let upNormal = 0, upAdult = 0;
for (const [key, val] of Object.entries(upstreamSites)) {
  if (val.name.startsWith('🔞')) { adult[key] = val; upAdult++; }
  else { regular[key] = val; upNormal++; }
}

// Add custom extras (skip if API already exists in same category)
const existingRegular = new Set(Object.values(regular).map(s => normUrl(s.api)));
const existingAdult = new Set(Object.values(adult).map(s => normUrl(s.api)));
let addedRegular = 0, addedAdult = 0;

for (const [key, val] of Object.entries(CUSTOM_EXTRAS)) {
  const isAdult = val.name.startsWith('🔞');
  if (isAdult && !existingAdult.has(normUrl(val.api))) {
    adult[key] = val;
    existingAdult.add(normUrl(val.api));
    addedAdult++;
  } else if (!isAdult && !existingRegular.has(normUrl(val.api))) {
    regular[key] = val;
    existingRegular.add(normUrl(val.api));
    addedRegular++;
  }
}

writeConfigs(regular, 'jingjian');
writeConfigs(adult, 'jingjian-adult');

console.log(`Upstream: ${upNormal} regular + ${upAdult} adult`);
console.log(`Custom added: ${addedRegular} regular + ${addedAdult} adult`);
console.log(`Output jingjian: ${Object.keys(regular).length} regular sources (NO adult)`);
console.log(`Output jingjian-adult: ${Object.keys(adult).length} adult sources`);
