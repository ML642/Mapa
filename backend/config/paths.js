const path = require("path");

// /app/uploads is the persistent volume mounted in docker-compose (see
// backend_uploads / backend_uploads_prod). process.cwd() is the backend's
// WORKDIR (/app) both when the server runs and when bootstrap-superuser.cjs
// runs standalone, unlike __dirname, which points into dist/ once compiled
// and is neither chowned for appuser nor covered by the uploads volume.
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

// Resolves a path stored in the DB (e.g. "uploads/events/<id>/image-0.jpg",
// as found in event.event_image / user.profilePicture) to an absolute
// filesystem path under UPLOADS_DIR.
const resolveUploadPath = (storedPath) => path.join(UPLOADS_DIR, storedPath.replace(/^uploads[/\\]?/, ""));

module.exports = { UPLOADS_DIR, resolveUploadPath };
