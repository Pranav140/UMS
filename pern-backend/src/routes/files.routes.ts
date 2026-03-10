import { Router, Request, Response } from 'express';
import { generateDownloadUrl, generateUploadUrl } from '../services/minio.service';
import { FileDownloadUrlSchema, FileUploadUrlSchema, validate, validateQuery } from '../schemas';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /upload-url
router.post('/upload-url', authenticate, validate(FileUploadUrlSchema), async (req: Request, res: Response) => {
  const { key, contentType } = req.body;

  try {
    const url = await generateUploadUrl(key, contentType);
    res.json({ success: true, url, key, expiresIn: 3600 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// POST /download-url
router.post('/download-url', authenticate, validate(FileDownloadUrlSchema), async (req: Request, res: Response) => {
  const { key } = req.body;

  try {
    const url = await generateDownloadUrl(key);
    res.json({ success: true, url, key, expiresIn: 3600 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// GET /download-url
router.get('/download-url', authenticate, validateQuery(FileDownloadUrlSchema), async (req: Request, res: Response) => {
  const { key } = req.query as { key: string };

  try {
    const url = await generateDownloadUrl(key);
    res.json({ success: true, url, key, expiresIn: 3600 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

export default router;
