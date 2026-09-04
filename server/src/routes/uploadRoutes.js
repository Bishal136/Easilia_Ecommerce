import { Router } from 'express';
import {
  uploadSingleFile,
  uploadMultipleFiles,
  removeFile,
} from '../controllers/uploadController.js';
import { uploadSingle, uploadMultiple } from '../middlewares/uploadMiddleware.js';

const router = Router();

// Upload endpoints
router.post('/single', uploadSingle('file'), uploadSingleFile);
router.post('/image', uploadSingle('image'), uploadSingleFile);
router.post('/video', uploadSingle('video'), uploadSingleFile);
router.post('/images', uploadMultiple('images', 10), uploadMultipleFiles);
router.post('/files', uploadMultiple('files', 10), uploadMultipleFiles);

// Delete endpoint
router.delete('/', removeFile);

export default router;
