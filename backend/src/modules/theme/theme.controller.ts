import { Request, Response, NextFunction } from 'express';
import { SiteModel } from '../../database/models/Site.js';
import { SiteThemeSchema } from '../../schema/index.js';
import { recordAuditLog } from '../../middleware/audit.js';

export async function getTheme(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.query.siteId as string) || 'gunasai-in';
    const site = await SiteModel.findOne({ siteId });

    if (!site || !site.theme || Object.keys(site.theme).length === 0) {
      // Default theme tokens matching baseline
      const defaultTheme = SiteThemeSchema.parse({ siteId });
      return res.json({
        success: true,
        data: defaultTheme,
      });
    }

    return res.json({
      success: true,
      data: site.theme,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTheme(req: Request, res: Response, next: NextFunction) {
  try {
    const siteId = (req.body.siteId as string) || 'gunasai-in';
    const validatedTheme = SiteThemeSchema.parse(req.body);

    let site = await SiteModel.findOne({ siteId });
    if (!site) {
      site = await SiteModel.create({
        siteId,
        theme: validatedTheme,
      });
    } else {
      site.theme = validatedTheme;
      site.markModified('theme');
      await site.save();
    }

    await recordAuditLog({
      req,
      action: 'THEME_UPDATE',
      resourceType: 'site',
      resourceId: siteId,
    });

    return res.json({
      success: true,
      data: site.theme,
      message: 'Theme settings updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

