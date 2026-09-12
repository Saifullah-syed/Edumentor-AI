import multer from 'multer';

// Use memory storage for secure processing without public disk exposure
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/pdf',
];

const allowedExtensions = ['.pdf'];

export const uploadResume = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Resumes must be uploaded in PDF (.pdf) format under 5MB.'));
    }
  },
}).single('resume');
