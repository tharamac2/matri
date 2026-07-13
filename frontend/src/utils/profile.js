export function calcAge(dob) {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function toCardDisplay(profile) {
  const age = calcAge(profile.dob);
  return {
    id: profile.id,
    name: profile.name,
    age: age != null ? String(age) : '-',
    education: profile.education || '-',
    profession: profile.profession || '-',
    salary: profile.income_lpa ? `${profile.income_lpa} LPA` : '-',
    location: profile.city || '-',
    height: profile.height_cm ? `${profile.height_cm} cm` : '-',
    religious: profile.religion || '-',
    caste: profile.caste || '-',
    maritalStatus: profile.marital_status || '-',
    motherTongue: profile.mother_tongue || '-',
    bio: profile.bio || '-',
    photos: profile.photos || [],
    familyDetails: profile.family_details || null,
    lifestyle: profile.lifestyle || null,
    physicalAttributes: profile.physical_attributes || null,
    horoscope: profile.horoscope || null,
    idVerificationStatus: profile.id_verification_status || null,
    lastActive: profile.last_active || null,
    image:
      profile.photo_url ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || '?')}`,
  };
}
