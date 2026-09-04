import multer from 'multer';
import path from 'path';
import fs from 'fs';
import ApiError from '../utils/ApiError.js';

// Base upload directory on VPS
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || 'uploads');

// Ensure root and sub-directories exist
const subDirs = ['images', 'videos', 'documents', 'avatars', 'products'];
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}
subDirs.forEach((sub) => {
  const dirPath = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Extension to MIME type map
const EXTENSION_MAP = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',

  // Videos
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.tar': 'application/x-tar',
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
};

// Helper: Normalize file MIME type from extension if missing or generic octet-stream
const normalizeMimeType = (file) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (
    (!file.mimetype || file.mimetype === 'application/octet-stream') &&
    EXTENSION_MAP[ext]
  ) {
    file.mimetype = EXTENSION_MAP[ext];
  }
  return { ext, mimetype: file.mimetype };
};

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { ext, mimetype } = normalizeMimeType(file);
    let folder = 'documents';

    const isImage =
      mimetype?.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.ico', '.avif'].includes(ext);

    const isVideo =
      mimetype?.startsWith('video/') ||
      ['.mp4', '.webm', '.mkv', '.mov', '.avi'].includes(ext);

    if (isImage) {
      if (req.baseUrl.includes('user') || req.path.includes('avatar')) {
        folder = 'avatars';
      } else if (req.baseUrl.includes('product') || req.path.includes('product')) {
        folder = 'products';
      } else {
        folder = 'images';
      }
    } else if (isVideo) {
      folder = 'videos';
    }

    const destinationPath = path.join(UPLOAD_ROOT, folder);
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedExt = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, sanitizedExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    cb(null, `${baseName}-${uniqueSuffix}${sanitizedExt}`);
  },
});

// File filter based on allowed mimetypes & extensions
const fileFilter = (req, file, cb) => {
  const { ext, mimetype } = normalizeMimeType(file);

  const isKnownExtension = Boolean(EXTENSION_MAP[ext]);
  const isImage = mimetype?.startsWith('image/') || isKnownExtension;
  const isVideo = mimetype?.startsWith('video/') || isKnownExtension;
  const isDoc = mimetype?.startsWith('application/') || isKnownExtension;

  if (isKnownExtension || isImage || isVideo || isDoc) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported file type: "${ext || mimetype}". Allowed: Images (JPG, PNG, WEBP, GIF, SVG, AVIF), Videos (MP4, WEBM, MOV), Docs (PDF, DOCX, ZIP)`
      ),
      false
    );
  }
};

// Size limits from environment or defaults
const maxImageSize = (parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 15) * 1024 * 1024;
const maxVideoSize = (parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 100) * 1024 * 1024;
const maxDocSize = (parseInt(process.env.MAX_DOC_SIZE_MB, 10) || 25) * 1024 * 1024;

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(maxImageSize, maxVideoSize, maxDocSize),
  },
});

// Flexible single uploader supporting common field names: 'image', 'file', 'photo', 'avatar', 'video', 'media'
export const uploadSingle = (primaryField = 'image') => {
  const commonFields = Array.from(new Set([primaryField, 'image', 'file', 'photo', 'avatar', 'video', 'media']));
  const fields = commonFields.map((name) => ({ name, maxCount: 1 }));
  const uploader = upload.fields(fields);

  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) return next(err);
      if (req.files) {
        for (const field of commonFields) {
          if (req.files[field] && req.files[field][0]) {
            req.file = req.files[field][0];
            break;
          }
        }
      }
      next();
    });
  };
};

// Flexible multiple uploader supporting 'images', 'files', 'photos', 'videos'
export const uploadMultiple = (primaryField = 'images', maxCount = 10) => {
  const commonFields = Array.from(new Set([primaryField, 'images', 'files', 'photos', 'videos']));
  const fields = commonFields.map((name) => ({ name, maxCount }));
  const uploader = upload.fields(fields);

  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) return next(err);
      if (req.files) {
        for (const field of commonFields) {
          if (req.files[field] && req.files[field].length > 0) {
            req.files = req.files[field];
            break;
          }
        }
        if (!Array.isArray(req.files)) {
          req.files = [];
        }
      }
      next();
    });
  };
};

export const uploadFields = (fieldsArray) => upload.fields(fieldsArray);

export default upload;
