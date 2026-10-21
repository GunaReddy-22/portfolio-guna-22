import { describe, it, expect } from 'vitest';
import { SiteModel } from '../src/database/models/Site.js';
import { PageModel } from '../src/database/models/Page.js';
import { FormModel } from '../src/database/models/Form.js';
import { runImportStaticPortfolio } from '../scripts/import-static-portfolio.js';
import './setup.js';

describe('CMS Importer Overwrite Protection & Dry-Run Safety', () => {
  it('dry-run mode is strictly read-only and does not write to the database', async () => {
    // Clear site and page documents
    await SiteModel.deleteMany({ siteId: 'gunasai-in' });
    await PageModel.deleteMany({ siteId: 'gunasai-in' });
    await FormModel.deleteMany({ siteId: 'gunasai-in' });

    const report = await runImportStaticPortfolio({ isDryRun: true });
    expect(report).toBeDefined();

    // Verify zero documents were created in dry-run mode
    const siteAfterDryRun = await SiteModel.findOne({ siteId: 'gunasai-in' });
    expect(siteAfterDryRun).toBeNull();

    const pageAfterDryRun = await PageModel.findOne({ siteId: 'gunasai-in', slug: 'home' });
    expect(pageAfterDryRun).toBeNull();
  });

  it('normal import creates initial content when none exists', async () => {
    await SiteModel.deleteMany({ siteId: 'gunasai-in' });
    await PageModel.deleteMany({ siteId: 'gunasai-in' });
    await FormModel.deleteMany({ siteId: 'gunasai-in' });

    const report = await runImportStaticPortfolio({ isDryRun: false, autoPublish: true });
    expect(report.importedBlocks.length).toBeGreaterThan(0);

    const site = await SiteModel.findOne({ siteId: 'gunasai-in' });
    expect(site).not.toBeNull();
    expect(site?.siteName).toBe('Guna Sai Portfolio');

    const page = await PageModel.findOne({ siteId: 'gunasai-in', slug: 'home' });
    expect(page).not.toBeNull();
    expect(page?.status).toBe('published');
  });

  it('normal import preserves existing custom CMS settings, theme, and content without --overwrite', async () => {
    // 1. Simulate an administrator editing site settings through the CMS dashboard
    await SiteModel.updateOne(
      { siteId: 'gunasai-in' },
      {
        siteName: 'Custom Brand Name Edited in CMS',
        title: 'Custom Title Edited in CMS',
        metaDescription: 'Custom description authored by admin',
      }
    );

    // 2. Simulate editing page content through the Page Builder
    const customSections = [
      {
        id: 'sec-custom-hero',
        type: 'hero',
        order: 0,
        isVisible: true,
        content: {
          headline: 'Custom Headline Edited by User',
          subheadline: 'Custom subheadline',
        },
      },
    ];

    await PageModel.updateOne(
      { siteId: 'gunasai-in', slug: 'home' },
      {
        draftSections: customSections,
        publishedSections: customSections,
        draftRevision: 42,
        publishedRevision: 42,
      }
    );

    // 3. Run a normal static import (WITHOUT --overwrite)
    const report = await runImportStaticPortfolio({ isDryRun: false, allowOverwrite: false });
    expect(report.skippedItems).toContain('Site Settings & Theme (CMS settings protected)');
    expect(report.skippedItems).toContain('Home Page (CMS edits preserved)');

    // 4. Verify that existing CMS edits were NOT overwritten
    const siteAfter = await SiteModel.findOne({ siteId: 'gunasai-in' });
    expect(siteAfter?.siteName).toBe('Custom Brand Name Edited in CMS');
    expect(siteAfter?.title).toBe('Custom Title Edited in CMS');
    expect(siteAfter?.metaDescription).toBe('Custom description authored by admin');

    const pageAfter = await PageModel.findOne({ siteId: 'gunasai-in', slug: 'home' });
    expect(pageAfter?.draftRevision).toBe(42);
    expect(pageAfter?.draftSections?.[0]?.content?.headline).toBe('Custom Headline Edited by User');
  });

  it('explicitly authorized import with allowOverwrite=true overwrites CMS settings and content', async () => {
    // Run with allowOverwrite = true
    const report = await runImportStaticPortfolio({
      isDryRun: false,
      allowOverwrite: true,
      autoPublish: true,
    });

    expect(report.importedBlocks).toContain('Site Settings & Theme (Overwritten)');
    expect(report.importedBlocks).toContain('Home Page (Overwritten)');

    // Verify settings were reset to baseline
    const siteAfter = await SiteModel.findOne({ siteId: 'gunasai-in' });
    expect(siteAfter?.siteName).toBe('Guna Sai Portfolio');

    const pageAfter = await PageModel.findOne({ siteId: 'gunasai-in', slug: 'home' });
    expect(pageAfter?.draftRevision).toBe(43); // Incremented from 42
  });
});
