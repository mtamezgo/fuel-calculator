// This is a Vercel Serverless Function
export default async function handler(req, res) {
  // Dynamically import the build
  const { createRequestHandler } = await import("@react-router/node");
  const build = await import("../build/server/index.js");

  const requestHandler = createRequestHandler({ build });

  // Convert Vercel request to standard Request
  const url = new URL(req.url || '/', `https://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: new Headers(req.headers),
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
  });

  try {
    const response = await requestHandler(request);

    // Set status code
    res.status(response.status);

    // Set headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send body
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
