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
  '.m4v': 'video/x-m4v',
  '.3gp': 'video/3gpp',
  '.3g2': 'video/3gpp2',
  '.wmv': 'video/x-ms-wmv',
  '.flv': 'video/x-flv',
  '.ogv': 'video/ogg',
  '.ts': 'video/mp2t',
  '.mts': 'video/mp2t',
  '.m2ts': 'video/mp2t',
  '.mpg': 'video/mpeg',
  '.mpeg': 'video/mpeg',
  '.vob': 'video/dvd',
  '.asf': 'video/x-ms-asf',

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
      ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.3gp', '.wmv', '.flv', '.mpg', '.mpeg', '.ts', '.ogv'].includes(ext) ||
      req.path?.includes('video') ||
      req.originalUrl?.includes('video');

    if (isImage) {
      if (req.baseUrl?.includes('user') || req.path?.includes('avatar')) {
        folder = 'avatars';
      } else if (req.baseUrl?.includes('product') || req.path?.includes('product')) {
        folder = 'products';
      } else {
        folder = 'images';
      }
    } else if (isVideo) {
      folder = 'videos';
    }

    const destinationPath = path.join(UPLOAD_ROOT, folder);
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    let sanitizedExt = path.extname(file.originalname || '').toLowerCase();

    // Fallback extension from MIME type or route if missing (e.g. mobile recordings or blobs)
    if (!sanitizedExt && file.mimetype) {
      const mimeToExt = {
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/quicktime': '.mov',
        'video/x-matroska': '.mkv',
        'video/x-msvideo': '.avi',
        'video/3gpp': '.3gp',
        'video/3gpp2': '.3g2',
        'video/x-ms-wmv': '.wmv',
        'video/x-flv': '.flv',
        'video/ogg': '.ogv',
        'video/mp2t': '.ts',
        'video/mpeg': '.mpeg',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/svg+xml': '.svg',
        'application/pdf': '.pdf',
      };
      sanitizedExt =
        mimeToExt[file.mimetype] ||
        (file.mimetype.startsWith('video/')
          ? '.mp4'
          : req.originalUrl?.includes('video')
          ? '.mp4'
          : '');
    }

    if (!sanitizedExt && (req.originalUrl?.includes('video') || req.path?.includes('video'))) {
      sanitizedExt = '.mp4';
    }

    const baseName =
      path
        .basename(file.originalname || 'video', sanitizedExt)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 50) || 'media';
    cb(null, `${baseName}-${uniqueSuffix}${sanitizedExt}`);
  },
});

// File filter based on allowed mimetypes & extensions
const fileFilter = (req, file, cb) => {
  const { ext, mimetype } = normalizeMimeType(file);

  const isKnownExtension = Boolean(EXTENSION_MAP[ext]);
  const isImage = mimetype?.startsWith('image/') || isKnownExtension;
  const isVideo =
    mimetype?.startsWith('video/') ||
    isKnownExtension ||
    ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v', '.3gp', '.wmv', '.flv', '.mpg', '.mpeg', '.ts', '.ogv'].includes(ext);
  const isDoc = mimetype?.startsWith('application/') || isKnownExtension;
  const isVideoEndpoint =
    req.baseUrl?.includes('video') || req.path?.includes('video') || req.originalUrl?.includes('video');

  if (isKnownExtension || isImage || isVideo || isDoc || isVideoEndpoint) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Unsupported file type: "${ext || mimetype}". Allowed: Images (JPG, PNG, WEBP, GIF, SVG, AVIF), Videos (MP4, WEBM, MOV, MKV, AVI, etc.), Docs (PDF, DOCX, ZIP)`
      ),
      false
    );
  }
};

// Size limits from environment or defaults (generous for modern video recordings)
const maxImageSize = (parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 25) * 1024 * 1024;
const maxVideoSize = (parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 250) * 1024 * 1024;
const maxDocSize = (parseInt(process.env.MAX_DOC_SIZE_MB, 10) || 50) * 1024 * 1024;

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(maxImageSize, maxVideoSize, maxDocSize),
  },
});

// Flexible single uploader supporting any single file field
export const uploadSingle = (primaryField = 'image') => {
  const uploader = upload.any();

  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err) return next(err);
      if (req.files && req.files.length > 0) {
        req.file =
          req.files.find((f) => f.fieldname === primaryField) ||
          req.files.find((f) => ['video', 'file', 'image', 'photo', 'avatar', 'media'].includes(f.fieldname)) ||
          req.files[0];
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
