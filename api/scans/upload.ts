// This is a compatibility shim for older frontend bundles that might still hit this endpoint.
// It proxies the request to the main /api/scan handler.

export default async function handler(req: any, res: any) {
  console.log("🔄 API SHIM: Proxying request from /api/scans/upload to /api/scan");
  
  // Dynamically import the main handler to reuse logic
  const { default: mainHandler } = await import('../scan');
  
  return mainHandler(req, res);
}
