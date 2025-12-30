// backend/src/utils/routeValidator.ts
import * as turf from "@turf/turf";

export function validateScanOnRoute(
  route: { lat: number; lng: number }[],
  scanLat: number,
  scanLng: number,
  distance: number
) {
  const scanPoint = turf.point([scanLng, scanLat]);

  for (let i = 0; i < route.length - 1; i++) {
    const line = turf.lineString([
      [route[i].lng, route[i].lat],
      [route[i + 1].lng, route[i + 1].lat],
    ]);

    const distanceKm = turf.pointToLineDistance(scanPoint, line, {
      units: "kilometers",
    });

    if (distanceKm * 1000 <= distance) return true;
  }

  return false;
}
