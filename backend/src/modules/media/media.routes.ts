import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { listMedia, uploadIntent, uploadLocal, registerMedia, deleteMedia } from './media.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

import crypto from 'crypto';

const uploadDir = path.resolve(process.cwd(), 'public_assets');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `asset_${randomName}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIMES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported or dangerous file type: ${file.mimetype}. SVG and executable formats are prohibited.`));
    }
  },
});

const router = Router();

router.use(requireAuth);

router.get('/', listMedia);
router.post('/upload-intent', uploadIntent);
router.post('/upload-local', upload.single('file'), uploadLocal);
router.post('/register', registerMedia);
router.delete('/:mediaId', requireRole('owner'), deleteMedia);

export default router;

