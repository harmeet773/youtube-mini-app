// middleware/frontendResolver.js

const ALLOWED_FRONTENDS = process.env.ALLOWED_FRONTENDS 
  ? process.env.ALLOWED_FRONTENDS.split(",").map(url => url.trim())
  : ["http://localhost:5173"];

export function frontendResolver(req, res, next) {
  const origin = req.headers.origin;

  req.frontend = ALLOWED_FRONTENDS.includes(origin)
    ? origin
    : "http://localhost:5173";

  next();
}
