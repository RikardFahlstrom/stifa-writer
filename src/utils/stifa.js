/**
 * Calculate stifa: elevation gain (m) / distance (km).
 * Returns a string with exactly 1 decimal place, e.g. "12.0", "7.4".
 * Returns null if distance is zero.
 *
 * Reference values (for validation):
 *   Lidingöloppet      30 km / 524 m elev  → 17.5
 *   Göteborgsvarvet    21.1 km / 99 m elev → 4.7
 *   NY Marathon        42.2 km / 261 m elev → 6.2
 *   Vasaloppet         90 km / 838 m elev  → 9.3
 *   VM-5-milen 2021    50 km / 1770 m elev → 35.4
 *   Nordenskiöldsloppet 220 km / 1892 m elev → 8.6
 *   Vätternrundan      300 km / 1290 m elev → 4.3
 */
export function calcStifa(distanceMeters, elevationGainMeters) {
  const distKm = distanceMeters / 1000;
  if (distKm === 0) return null;
  return (elevationGainMeters / distKm).toFixed(1);
}

/** The text block appended to the activity description. */
export function formatStifaBlock(stifaValue) {
  return `\n\nstifa ${stifaValue} (add-stifa.info)`;
}

/** Guard against double-appending. Detects both old format ("Stifa:") and new format ("stifa X.X"). */
export function alreadyHasStifa(description) {
  return (
    typeof description === 'string' &&
    (description.includes('Stifa:') || description.includes('\nstifa '))
  );
}
