export function errorHandler(err, req, res, next) {
  console.error('[Unhandled Error]', err);

  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'The uploaded file exceeds the 5MB size limit. Please upload a smaller file.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  // File type validation errors from custom filter
  if (err.message && (err.message.includes('Invalid file type') || err.message.includes('PDF'))) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Syntax or JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload received.',
    });
  }

  // General server error - sanitized for security (no sensitive stack traces exposed)
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'An unexpected error occurred on the server. Please try again later.'
    : err.message;

  return res.status(statusCode).json({
    success: false,
    message,
  });
}
