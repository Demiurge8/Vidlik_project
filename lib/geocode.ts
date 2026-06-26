const DEFAULT_GEOCODER_URL =
  process.env.GEOCODER_URL ||
  "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=";

const DEFAULT_USER_AGENT =
  process.env.GEOCODER_USER_AGENT || "vidlik-app/1.0 (contact: admin@vidlik)";

type GeocodeResult = { lat: number; lon: number } | null;

const timeoutPromise = (ms: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Geocode timeout")), ms)
  );

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const controller = new AbortController();
  const url = `${DEFAULT_GEOCODER_URL}${encodeURIComponent(trimmed)}`;

  try {
    const response = (await Promise.race([
      fetch(url, {
        headers: { "User-Agent": DEFAULT_USER_AGENT },
        signal: controller.signal,
      }),
      timeoutPromise(5000),
    ])) as Response;

    if (!response.ok) return null;
    const data = (await response.json()) as Array<{
      lat?: string;
      lon?: string;
    }>;

    if (!Array.isArray(data) || data.length === 0) return null;
    const { lat, lon } = data[0]!;
    if (!lat || !lon) return null;

    const latNum = Number(lat);
    const lonNum = Number(lon);
    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) return null;
    if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180)
      return null;

    return { lat: latNum, lon: lonNum };
  } catch {
    return null;
  } finally {
    controller.abort();
  }
}
