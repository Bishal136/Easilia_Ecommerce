import path from 'path';
import fs from 'fs';

/**
 * Construct public accessible URL for uploaded file on the VPS
 * @param {import('express').Request} req
 * @param {Object} file - Multer file object
 * @returns {Object}
 */
export const getFileInfo = (req, file) => {
  if (!file) return null;

  // Dynamically resolve serverUrl: adapt to host header if accessed via IP/localhost or SERVER_URL unset
  let serverUrl = process.env.SERVER_URL?.trim()?.replace(/\/+$/, '') || '';
  if (
    !serverUrl ||
    (req &&
      (req.get('host')?.includes('192.168.') ||
        req.get('host')?.includes('localhost') ||
        req.get('host')?.includes('127.0.0.1') ||
        req.get('host')?.includes('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(req.get('host') || '')))
  ) {
    if (req) {
      serverUrl = `${req.protocol}://${req.get('host')}`;
    }
  }

  // Extract relative path from upload root
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || 'uploads');
  const relativePath = path.relative(uploadRoot, file.path).replace(/\\/g, '/');
  const publicUrl = `${serverUrl}/uploads/${relativePath}`;

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: `uploads/${relativePath}`,
    url: publicUrl,
  };
};

/**
 * Safely delete a local file from VPS disk
 * @param {string} relativeOrAbsolutePath - Path to file (e.g. 'uploads/images/xyz.jpg')
 * @returns {boolean}
 */
export const deleteLocalFile = (relativeOrAbsolutePath) => {
  if (!relativeOrAbsolutePath) return false;

  try {
    const absolutePath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.resolve(process.cwd(), relativeOrAbsolutePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
  } catch (error) {
    console.error(`[FILE DELETE ERROR] Failed to delete file ${relativeOrAbsolutePath}:`, error.message);
  }
  return false;
};

export default {
  getFileInfo,
  deleteLocalFile,
};
