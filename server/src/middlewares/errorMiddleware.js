import ApiError from '../utils/ApiError.js';

/**
 * Global Error Handling Middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Body-Parser Malformed JSON SyntaxError
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ApiError(
      400,
      'Invalid JSON format in request body. Please verify that all keys and string values are enclosed in double quotes (e.g. "email": "seller@example.com") and properly separated by commas.'
    );
  }

  // Convert non-ApiError instances into ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || [], err.stack);
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id: ${err.value}`;
    error = new ApiError(404, message);
  }

  // Handle Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {}).join(', ');
    const message = `Duplicate value entered for field(s): ${fields}`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message,
    }));
    error = new ApiError(400, 'Validation Error', errors);
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  }

  // Handle JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired');
  }

  // Handle Multer Upload Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_VIDEO_SIZE_MB || 250;
      error = new ApiError(400, `File size too large. Maximum allowed size is ${maxMb}MB.`);
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new ApiError(400, `Unexpected form field "${err.field}". Please use "video", "image", or "file".`);
    } else {
      error = new ApiError(400, `Upload error: ${err.message}`);
    }
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors?.length ? error.errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  // Server-side logging
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${error.statusCode} ${error.message}`);
    if (error.statusCode === 500 && error.stack) {
      console.error(error.stack);
    }
  }

  res.status(error.statusCode).json(response);
};

export default errorHandler;
