/**
 * /api/vehicles is deprecated. Permanently redirected to /api/vehicle-lookup.
 * 301 for GET (safe to cache), 308 for POST (method-preserving permanent redirect).
 */
export async function GET(request: Request) {
  const search = new URL(request.url).search;
  return Response.redirect(
    new URL(`/api/vehicle-lookup${search}`, request.url),
    301
  );
}

export async function POST(request: Request) {
  return Response.redirect(
    new URL("/api/vehicle-lookup", request.url),
    308
  );
}
