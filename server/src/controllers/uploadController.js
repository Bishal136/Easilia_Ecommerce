import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { getFileInfo, deleteLocalFile } from '../utils/fileHelper.js';

/**
 * @desc    Upload a single file (image, video, doc)
 * @route   POST /api/v1/upload/single
 * @access  Public / Protected
 */
export const uploadSingleFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file was uploaded');
  }

  const fileInfo = getFileInfo(req, req.file);

  res.status(201).json(
    new ApiResponse(201, 'File uploaded successfully', {
      file: fileInfo,
    })
  );
});

/**
 * @desc    Upload multiple files
 * @route   POST /api/v1/upload/multiple
 * @access  Public / Protected
 */
export const uploadMultipleFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files were uploaded');
  }

  const fileInfos = req.files.map((file) => getFileInfo(req, file));

  res.status(201).json(
    new ApiResponse(201, `${fileInfos.length} files uploaded successfully`, {
      files: fileInfos,
    })
  );
});

/**
 * @desc    Delete a file from VPS storage
 * @route   DELETE /api/v1/upload
 * @access  Protected
 */
export const removeFile = asyncHandler(async (req, res) => {
  const { filePath } = req.body;

  if (!filePath) {
    throw new ApiError(400, 'File path is required');
  }

  // Prevent directory traversal attacks
  if (filePath.includes('..')) {
    throw new ApiError(400, 'Invalid file path');
  }

  const deleted = deleteLocalFile(filePath);

  if (!deleted) {
    throw new ApiError(404, 'File not found or already removed');
  }

  res.status(200).json(
    new ApiResponse(200, 'File removed successfully')
  );
});

export default {
  uploadSingleFile,
  uploadMultipleFiles,
  removeFile,
};
