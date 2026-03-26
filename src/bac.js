// Widmark BAC calculation
// BAC = (drinks × volume_ml × (abv/100) × 0.789) / (weight_kg × r) − (0.015 × hours_elapsed)

const ETHANOL_DENSITY = 0.789; // g/ml
const METABOLISM_RATE = 0.015; // BAC reduction per hour

function calculateBAC(profile, totalDrinks, sessionStartTime) {
  if (totalDrinks === 0) return 0;

  const hoursElapsed = (Date.now() - sessionStartTime) / (1000 * 60 * 60);
  const r = profile.sex === 'male' ? 0.68 : 0.55;
  const alcoholPerDrink = (profile.drinkVolumeMl * (profile.drinkAbv / 100) * ETHANOL_DENSITY);
  const totalAlcohol = totalDrinks * alcoholPerDrink;
  const bac = (totalAlcohol / (profile.weightKg * r)) - (METABOLISM_RATE * hoursElapsed);

  return Math.max(0, bac);
}

function timeToSober(currentBAC) {
  if (currentBAC <= 0) return 0;
  return currentBAC / METABOLISM_RATE; // hours
}

function formatTimeToSober(currentBAC) {
  const hours = timeToSober(currentBAC);
  if (hours <= 0) return 'Sober';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `~${m}m`;
  return `~${h}h ${m}m`;
}

function getBACStatus(bac) {
  if (bac <= 0) return { label: 'Sober', color: '#888888' };
  if (bac <= 0.05) return { label: 'Buzzed', color: '#4ade80' };
  if (bac <= 0.10) return { label: 'Tipsy', color: '#facc15' };
  if (bac <= 0.20) return { label: 'Drunk', color: '#f97316' };
  return { label: 'Dangerously drunk', color: '#ef4444' };
}

module.exports = { calculateBAC, timeToSober, formatTimeToSober, getBACStatus };
