import { Router } from 'express';
import {
  listPages,
  createPage,
  getPage,
  updateDraft,
  addSection,
  updateSection,
  reorderSections,
  deleteSection,
  generatePreview,
  publishPage,
  getVersions,
  restoreVersion,
} from './pages.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listPages);
router.post('/', createPage);
router.get('/:pageId', getPage);
router.put('/:pageId/draft', updateDraft);
router.post('/:pageId/sections', addSection);
router.patch('/:pageId/sections/reorder', reorderSections);
router.patch('/:pageId/sections/:sectionId', updateSection);
router.delete('/:pageId/sections/:sectionId', deleteSection);
router.post('/:pageId/preview', generatePreview);
router.post('/:pageId/publish', requireRole('owner'), publishPage);
router.get('/:pageId/versions', getVersions);
router.post('/:pageId/restore/:revision', requireRole('owner'), restoreVersion);

export default router;

