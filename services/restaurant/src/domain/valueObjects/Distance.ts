export class Distance {
  constructor(public readonly valueInKm: number) {}

  static calculate(coord1: [number, number], coord2: [number, number]): Distance {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = +(6371 * c).toFixed(2);

    return new Distance(distanceKm);
  }
}
