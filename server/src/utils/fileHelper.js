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

  const serverUrl =
    process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;

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
