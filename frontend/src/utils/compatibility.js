import { calcAge } from './profile.js';

export function computeCompatibility(candidate, partnerPrefs) {
  if (!candidate || !partnerPrefs) return null;
  let total = 0;
  let matched = 0;
  const age = calcAge(candidate.dob);

  if (partnerPrefs.age_min != null || partnerPrefs.age_max != null) {
    total++;
    if (age != null) {
      const min = partnerPrefs.age_min ?? 0;
      const max = partnerPrefs.age_max ?? 200;
      if (age >= min && age <= max) matched++;
    }
  }

  if (partnerPrefs.height_min != null || partnerPrefs.height_max != null) {
    total++;
    if (candidate.height_cm != null) {
      const min = partnerPrefs.height_min ?? 0;
      const max = partnerPrefs.height_max ?? 999;
      if (candidate.height_cm >= min && candidate.height_cm <= max) matched++;
    }
  }

  if (partnerPrefs.religion) {
    total++;
    if (candidate.religion && candidate.religion.toLowerCase() === partnerPrefs.religion.toLowerCase()) matched++;
  }

  if (partnerPrefs.city) {
    total++;
    if (candidate.city && candidate.city.toLowerCase() === partnerPrefs.city.toLowerCase()) matched++;
  }

  if (total === 0) return null;
  return Math.round((matched / total) * 100);
}
