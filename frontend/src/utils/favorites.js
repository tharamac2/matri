const KEY = 'matri_favorites';

export function getFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY)) || []);
  } catch {
    return new Set();
  }
}

export function isFavorite(memberId) {
  return getFavorites().has(memberId);
}

export function toggleFavorite(memberId) {
  const favorites = getFavorites();
  if (favorites.has(memberId)) {
    favorites.delete(memberId);
  } else {
    favorites.add(memberId);
  }
  localStorage.setItem(KEY, JSON.stringify([...favorites]));
  return favorites.has(memberId);
}
