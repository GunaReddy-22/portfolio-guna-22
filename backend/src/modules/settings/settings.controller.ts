import { Request, Response, NextFunction } from 'express';
import { SiteModel } from '../../database/models/Site.js';
import { SiteSettingsSchema } from '../../schema/index.js';
import { recordAuditLog } from '../../middleware/audit.js';

export async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    let site = await SiteModel.findOne({ siteId });

    if (!site) {
      const defaultSettings = SiteSettingsSchema.parse({ siteId });
      return res.json({
        success: true,
        data: defaultSettings,
      });
    }

    return res.json({
      success: true,
      data: {
        siteId: site.siteId,
        siteName: site.siteName,
        siteUrl: site.siteUrl,
        title: site.title,
        metaDescription: site.metaDescription,
        keywords: site.keywords,
        nav: site.nav,
        footer: site.footer,
        socialLinks: site.socialLinks,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.body.siteId as string) || 'gunasai-in';
    const validated = SiteSettingsSchema.parse(req.body);

    let site = await SiteModel.findOne({ siteId });
    if (!site) {
      site = await SiteModel.create({
        ...validated,
        siteId,
      });
    } else {
      site.siteName = validated.siteName;
      site.siteUrl = validated.siteUrl;
      site.title = validated.title;
      site.metaDescription = validated.metaDescription;
      site.keywords = validated.keywords;
      site.nav = validated.nav;
      site.footer = validated.footer;
      site.socialLinks = validated.socialLinks;
      site.markModified('nav');
      site.markModified('footer');
      site.markModified('socialLinks');
      await site.save();
    }

    await recordAuditLog({
      req,
      action: 'SETTINGS_UPDATE',
      resourceType: 'site',
      resourceId: siteId,
    });

    return res.json({
      success: true,
      data: site,
      message: 'Site settings updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

