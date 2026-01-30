// middleware/frontendResolver.js

const ALLOWED_FRONTENDS = [
  "http://localhost:5173",
  "https://youtube-mini-app-p93f.onrender.com"
];

export function frontendResolver(req, res, next) {
  const origin = req.headers.origin;

  req.frontend = ALLOWED_FRONTENDS.includes(origin)
    ? origin
    : "http://localhost:5173";

  next();
}
