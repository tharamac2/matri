// Simplified Ashtakoot (Guna Milan) astrological compatibility score, 0-36.
// This is a lightweight approximation of the traditional 8-koota system for
// prototype/informational purposes only — not a substitute for a real Kundli reading.

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

const RASHIS = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

const RASHI_LORD = {
  Mesha: 'Mars', Vrishabha: 'Venus', Mithuna: 'Mercury', Karka: 'Moon', Simha: 'Sun', Kanya: 'Mercury',
  Tula: 'Venus', Vrishchika: 'Mars', Dhanu: 'Jupiter', Makara: 'Saturn', Kumbha: 'Saturn', Meena: 'Jupiter',
};

const PLANET_FRIENDSHIP = {
  Sun: { friends: ['Moon', 'Mars', 'Jupiter'], enemies: ['Venus', 'Saturn'] },
  Moon: { friends: ['Sun', 'Mercury'], enemies: [] },
  Mars: { friends: ['Sun', 'Moon', 'Jupiter'], enemies: ['Mercury'] },
  Mercury: { friends: ['Sun', 'Venus'], enemies: ['Moon'] },
  Jupiter: { friends: ['Sun', 'Moon', 'Mars'], enemies: ['Mercury', 'Venus'] },
  Venus: { friends: ['Mercury', 'Saturn'], enemies: ['Sun', 'Moon'] },
  Saturn: { friends: ['Mercury', 'Venus'], enemies: ['Sun', 'Moon', 'Mars'] },
};

const VARNA_RANK = {
  Karka: 4, Vrishchika: 4, Meena: 4,
  Mesha: 3, Simha: 3, Dhanu: 3,
  Vrishabha: 2, Kanya: 2, Makara: 2,
  Mithuna: 1, Tula: 1, Kumbha: 1,
};

const VASHYA_GROUP = {
  Mesha: 'chatushpad', Vrishabha: 'chatushpad', Simha: 'chatushpad', Dhanu: 'chatushpad', Makara: 'chatushpad',
  Mithuna: 'manav', Kanya: 'manav', Tula: 'manav', Kumbha: 'manav',
  Karka: 'jalachar', Meena: 'jalachar',
  Vrishchika: 'keeta',
};

const GANA = {
  Ashwini: 'deva', Mrigashira: 'deva', Punarvasu: 'deva', Pushya: 'deva', Hasta: 'deva', Swati: 'deva',
  Anuradha: 'deva', Shravana: 'deva', Revati: 'deva',
  Bharani: 'manushya', Rohini: 'manushya', Ardra: 'manushya', 'Purva Phalguni': 'manushya',
  'Uttara Phalguni': 'manushya', 'Purva Ashadha': 'manushya', 'Uttara Ashadha': 'manushya',
  'Purva Bhadrapada': 'manushya', 'Uttara Bhadrapada': 'manushya',
  Krittika: 'rakshasa', Ashlesha: 'rakshasa', Magha: 'rakshasa', Chitra: 'rakshasa', Vishakha: 'rakshasa',
  Jyeshtha: 'rakshasa', Mula: 'rakshasa', Dhanishta: 'rakshasa', Shatabhisha: 'rakshasa',
};

const NADI = {
  Ashwini: 'aadi', Ardra: 'aadi', Punarvasu: 'aadi', 'Uttara Phalguni': 'aadi', Hasta: 'aadi', Jyeshtha: 'aadi',
  Mula: 'aadi', Shatabhisha: 'aadi', 'Purva Bhadrapada': 'aadi',
  Bharani: 'madhya', Mrigashira: 'madhya', Pushya: 'madhya', 'Purva Phalguni': 'madhya', Chitra: 'madhya',
  Anuradha: 'madhya', 'Purva Ashadha': 'madhya', Dhanishta: 'madhya', 'Uttara Bhadrapada': 'madhya',
  Krittika: 'antya', Rohini: 'antya', Ashlesha: 'antya', Magha: 'antya', Swati: 'antya', Vishakha: 'antya',
  'Uttara Ashadha': 'antya', Shravana: 'antya', Revati: 'antya',
};

const YONI = {
  Ashwini: 'Horse', Bharani: 'Elephant', Krittika: 'Sheep', Rohini: 'Serpent', Mrigashira: 'Serpent', Ardra: 'Dog',
  Punarvasu: 'Cat', Pushya: 'Sheep', Ashlesha: 'Cat', Magha: 'Rat', 'Purva Phalguni': 'Rat', 'Uttara Phalguni': 'Cow',
  Hasta: 'Buffalo', Chitra: 'Tiger', Swati: 'Buffalo', Vishakha: 'Tiger', Anuradha: 'Deer', Jyeshtha: 'Deer',
  Mula: 'Dog', 'Purva Ashadha': 'Monkey', 'Uttara Ashadha': 'Mongoose', Shravana: 'Monkey', Dhanishta: 'Lion',
  Shatabhisha: 'Horse', 'Purva Bhadrapada': 'Lion', 'Uttara Bhadrapada': 'Cow', Revati: 'Elephant',
};

const YONI_ENEMIES = [
  ['Rat', 'Cat'], ['Cow', 'Tiger'], ['Horse', 'Buffalo'], ['Dog', 'Deer'],
  ['Monkey', 'Sheep'], ['Serpent', 'Mongoose'], ['Lion', 'Elephant'],
];

function isYoniEnemy(a, b) {
  return YONI_ENEMIES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function varnaScore(rashiA, rashiB) {
  const a = VARNA_RANK[rashiA];
  const b = VARNA_RANK[rashiB];
  if (a == null || b == null) return null;
  return b >= a ? 1 : 0;
}

function vashyaScore(rashiA, rashiB) {
  const a = VASHYA_GROUP[rashiA];
  const b = VASHYA_GROUP[rashiB];
  if (!a || !b) return null;
  if (a === b) return 2;
  if ((a === 'manav' && b === 'jalachar') || (a === 'jalachar' && b === 'manav')) return 1;
  if ((a === 'chatushpad' && b === 'manav') || (a === 'manav' && b === 'chatushpad')) return 1;
  return 0;
}

function taraScore(nakA, nakB) {
  const idxA = NAKSHATRAS.indexOf(nakA);
  const idxB = NAKSHATRAS.indexOf(nakB);
  if (idxA < 0 || idxB < 0) return null;
  const countAB = (((idxB - idxA + 27) % 27) + 1) % 9 || 9;
  const countBA = (((idxA - idxB + 27) % 27) + 1) % 9 || 9;
  const bad = (n) => [3, 5, 7].includes(n);
  const okAB = !bad(countAB);
  const okBA = !bad(countBA);
  if (okAB && okBA) return 3;
  if (okAB || okBA) return 1.5;
  return 0;
}

function yoniScore(nakA, nakB) {
  const a = YONI[nakA];
  const b = YONI[nakB];
  if (!a || !b) return null;
  if (a === b) return 4;
  if (isYoniEnemy(a, b)) return 0;
  return 2;
}

function grahaMaitriScore(rashiA, rashiB) {
  const lordA = RASHI_LORD[rashiA];
  const lordB = RASHI_LORD[rashiB];
  if (!lordA || !lordB) return null;
  if (lordA === lordB) return 5;
  const relA = PLANET_FRIENDSHIP[lordA];
  const relB = PLANET_FRIENDSHIP[lordB];
  const aFriend = relA.friends.includes(lordB);
  const aEnemy = relA.enemies.includes(lordB);
  const bFriend = relB.friends.includes(lordA);
  const bEnemy = relB.enemies.includes(lordA);
  if (aFriend && bFriend) return 5;
  if ((aFriend && !bEnemy) || (bFriend && !aEnemy)) return 4;
  if (!aEnemy && !bEnemy) return 3;
  if (aEnemy && bEnemy) return 0;
  return 1;
}

function ganaScore(nakA, nakB) {
  const a = GANA[nakA];
  const b = GANA[nakB];
  if (!a || !b) return null;
  if (a === b) return 6;
  if (a === 'rakshasa' || b === 'rakshasa') return 0;
  return 5;
}

function bhakootScore(rashiA, rashiB) {
  const idxA = RASHIS.indexOf(rashiA);
  const idxB = RASHIS.indexOf(rashiB);
  if (idxA < 0 || idxB < 0) return null;
  const distAB = (((idxB - idxA + 12) % 12) + 1);
  const distBA = (((idxA - idxB + 12) % 12) + 1);
  const dosha = (n) => [2, 12, 5, 9, 6, 8].includes(n);
  return dosha(distAB) || dosha(distBA) ? 0 : 7;
}

function nadiScore(nakA, nakB) {
  const a = NADI[nakA];
  const b = NADI[nakB];
  if (!a || !b) return null;
  return a === b ? 0 : 8;
}

/**
 * Computes a simplified 0-36 Guna Milan score plus a Manglik caution flag.
 * Returns null if either horoscope is missing rashi/nakshatra data.
 */
export function computeGunaScore(horoscopeA, horoscopeB) {
  if (!horoscopeA || !horoscopeB) return null;
  const { rashi: rashiA, nakshatra: nakA, manglik: manglikA } = horoscopeA;
  const { rashi: rashiB, nakshatra: nakB, manglik: manglikB } = horoscopeB;
  if (!rashiA || !rashiB || !nakA || !nakB) return null;

  const kootas = {
    varna: varnaScore(rashiA, rashiB),
    vashya: vashyaScore(rashiA, rashiB),
    tara: taraScore(nakA, nakB),
    yoni: yoniScore(nakA, nakB),
    grahaMaitri: grahaMaitriScore(rashiA, rashiB),
    gana: ganaScore(nakA, nakB),
    bhakoot: bhakootScore(rashiA, rashiB),
    nadi: nadiScore(nakA, nakB),
  };

  const values = Object.values(kootas).filter((v) => v != null);
  if (values.length === 0) return null;
  const score = Math.round(values.reduce((sum, v) => sum + v, 0) * 10) / 10;

  const isManglikA = String(manglikA).toLowerCase() === 'yes';
  const isManglikB = String(manglikB).toLowerCase() === 'yes';
  const manglikMatch = isManglikA === isManglikB ? 'ok' : 'caution';

  return { score, maxScore: 36, kootas, manglikMatch };
}
