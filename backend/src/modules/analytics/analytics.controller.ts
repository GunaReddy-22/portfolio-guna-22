import { Request, Response } from 'express';
import { VisitorLog } from '../../database/models/VisitorLog.js';
import {
  extractClientIp,
  resolveGeoLocation,
  parseUserAgent,
  parseReferrerSource,
} from '../../services/geoIp.service.js';

/**
 * Public: Track a page visit
 */
export async function trackVisit(req: Request, res: Response): Promise<void> {
  try {
    const ip = extractClientIp(req);
    const uaString = req.headers['user-agent'] || '';
    const uaResult = parseUserAgent(uaString);

    const body = req.body || {};
    const path = typeof body.path === 'string' && body.path.trim() ? body.path.trim() : '/';
    const referrer = typeof body.referrer === 'string' ? body.referrer.trim() : 'Direct';
    const utmSource = typeof body.utmSource === 'string' ? body.utmSource.trim() : undefined;
    const referrerSource = parseReferrerSource(referrer, utmSource);
    const screenResolution = typeof body.screenResolution === 'string' ? body.screenResolution : '';
    const language = typeof body.language === 'string' ? body.language : (req.headers['accept-language'] || '');
    const sessionId =
      typeof body.sessionId === 'string' && body.sessionId.trim()
        ? body.sessionId.trim()
        : `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Resolve Geolocation asynchronously
    const geo = await resolveGeoLocation(ip, req.headers);
    const now = new Date();

    // Save record asynchronously without holding up response
    const logEntry = new VisitorLog({
      ip,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      zip: geo.zip || '',
      timezone: geo.timezone || '',
      isp: geo.isp,
      org: geo.org || '',
      lat: geo.lat,
      lon: geo.lon,
      path,
      sections: [path],
      referrer,
      referrerSource,
      deviceType: uaResult.deviceType,
      browser: uaResult.browser,
      browserVersion: uaResult.browserVersion,
      os: uaResult.os,
      screenResolution,
      language: language.split(',')[0],
      sessionId,
      isBot: uaResult.isBot,
      visitedAt: now,
      lastActiveAt: now,
    });

    await logEntry.save();

    res.status(200).json({
      success: true,
      sessionId,
    });
  } catch (err: any) {
    // Non-blocking fallback
    res.status(200).json({ success: false, error: err?.message || 'Tracking bypassed' });
  }
}

/**
 * Public: Track engagement duration / in-page heartbeat
 */
export async function trackHeartbeat(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId, durationSeconds, path } = req.body || {};
    if (!sessionId || typeof durationSeconds !== 'number') {
      res.status(200).json({ success: false });
      return;
    }

    const now = new Date();
    const update: any = {
      $set: {
        durationSeconds: Math.min(durationSeconds, 86400),
        lastActiveAt: now,
      },
    };
    if (typeof path === 'string' && path.trim()) {
      update.$set.path = path.trim();
      update.$addToSet = { sections: path.trim() };
    }

    await VisitorLog.findOneAndUpdate(
      { sessionId },
      update,
      { sort: { visitedAt: -1 } }
    );

    res.status(200).json({ success: true });
  } catch {
    res.status(200).json({ success: false });
  }
}

/**
 * Admin: Get aggregated overview analytics
 */
export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const period = (req.query.period as string) || '7d';
    const startDate = computePeriodStartDate(period);

    const matchFilter: any = { isBot: false };
    if (startDate) {
      matchFilter.visitedAt = { $gte: startDate };
    }

    // 1. Total Visits
    const totalVisits = await VisitorLog.countDocuments(matchFilter);

    // 2. Unique Visitors (by distinct IP)
    const uniqueIps = await VisitorLog.distinct('ip', matchFilter);
    const uniqueVisitors = uniqueIps.length;

    // 3. Top Countries
    const topCountries = await VisitorLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { country: '$country', code: '$countryCode' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          country: '$_id.country',
          code: '$_id.code',
          count: 1,
        },
      },
    ]);

    // 4. Top Cities
    const topCities = await VisitorLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { city: '$city', country: '$country', code: '$countryCode' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
      {
        $project: {
          _id: 0,
          city: '$_id.city',
          country: '$_id.country',
          code: '$_id.code',
          count: 1,
        },
      },
    ]);

    // 5. Traffic / Referrer Sources
    const topReferrers = await VisitorLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$referrerSource',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          source: '$_id',
          count: 1,
        },
      },
    ]);

    // 6. Device Breakdown
    const deviceBreakdown = await VisitorLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          device: '$_id',
          count: 1,
        },
      },
    ]);

    // 7. OS Breakdown
    const osBreakdown = await VisitorLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$os',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          os: '$_id',
          count: 1,
        },
      },
    ]);

    // 8. Browser Breakdown
    const browserBreakdown = await VisitorLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$browser',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          browser: '$_id',
          count: 1,
        },
      },
    ]);

    // 9. Timeline (Daily or Hourly)
    const isToday = period === 'today';
    const timelineFormat = isToday ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

    const timeline = await VisitorLog.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: timelineFormat, date: '$visitedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ]);

    // 10. Avg Duration
    const durationAgg = await VisitorLog.aggregate([
      { $match: { ...matchFilter, durationSeconds: { $gt: 0, $lte: 3600 } } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$durationSeconds' },
        },
      },
    ]);
    const avgDuration = Math.round(durationAgg[0]?.avgDuration || 0);

    res.json({
      period,
      totalVisits,
      uniqueVisitors,
      avgDuration,
      topCountries,
      topCities,
      topReferrers,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
      timeline,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load analytics overview' });
  }
}

/**
 * Admin: Get paginated real-time visitor logs
 */
export async function getLiveLogs(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const device = typeof req.query.device === 'string' ? req.query.device.trim() : '';

    const filter: any = {};
    if (device && ['desktop', 'mobile', 'tablet', 'bot'].includes(device)) {
      filter.deviceType = device;
    }

    if (search) {
      filter.$or = [
        { ip: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { isp: { $regex: search, $options: 'i' } },
        { path: { $regex: search, $options: 'i' } },
        { referrer: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      VisitorLog.find(filter)
        .sort({ visitedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VisitorLog.countDocuments(filter),
    ]);

    // Self-healing: repair any legacy records with Unknown city or Cloudflare Network ISP
    for (const item of items) {
      if (
        (!item.city || item.city === 'Unknown' || item.isp === 'Cloudflare Network') &&
        item.ip &&
        item.ip !== '127.0.0.1' &&
        item.ip !== 'localhost'
      ) {
        resolveGeoLocation(item.ip).then((geo) => {
          if (geo && geo.city && geo.city !== 'Unknown') {
            VisitorLog.updateOne(
              { _id: item._id },
              {
                $set: {
                  country: geo.country,
                  countryCode: geo.countryCode,
                  region: geo.region,
                  city: geo.city,
                  zip: geo.zip || '',
                  timezone: geo.timezone || '',
                  isp: geo.isp,
                  org: geo.org || '',
                },
              }
            ).exec();
          }
        }).catch(() => {});
      }
    }

    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load live visitor feed' });
  }
}

/**
 * Admin: Clear visitor logs (Owner only)
 */
export async function clearLogs(req: Request, res: Response): Promise<void> {
  try {
    await VisitorLog.deleteMany({});
    res.json({ success: true, message: 'All visitor telemetry logs have been cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear logs' });
  }
}

/**
 * Admin: Export visitor logs as CSV with in/out times
 */
export async function exportCsv(req: Request, res: Response): Promise<void> {
  try {
    const logs = await VisitorLog.find({ isBot: false })
      .sort({ visitedAt: -1 })
      .limit(5000)
      .lean();

    const headers = [
      'Timestamp',
      'IP Address',
      'Country',
      'Country Code',
      'City',
      'Region',
      'Postal / Zip',
      'Timezone',
      'ISP / Carrier',
      'Organization',
      'In Time (Arrival)',
      'Out Time (Last Active)',
      'Duration (sec)',
      'Device',
      'OS',
      'Browser',
      'Referrer',
      'Referrer Source',
      'Visited Path',
      'Sections Explored',
    ];

    const rows = logs.map((l: any) => [
      l.visitedAt ? new Date(l.visitedAt).toISOString() : '',
      `"${l.ip || ''}"`,
      `"${l.country || ''}"`,
      `"${l.countryCode || ''}"`,
      `"${l.city || ''}"`,
      `"${l.region || ''}"`,
      `"${l.zip || ''}"`,
      `"${l.timezone || ''}"`,
      `"${l.isp || ''}"`,
      `"${l.org || ''}"`,
      l.visitedAt ? new Date(l.visitedAt).toISOString() : '',
      l.lastActiveAt ? new Date(l.lastActiveAt).toISOString() : (l.visitedAt ? new Date(l.visitedAt).toISOString() : ''),
      l.durationSeconds || 0,
      `"${l.deviceType || ''}"`,
      `"${l.os || ''}"`,
      `"${l.browser || ''}"`,
      `"${l.referrer || ''}"`,
      `"${l.referrerSource || ''}"`,
      `"${l.path || ''}"`,
      `"${(l.sections || []).join(' > ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="guna-portfolio-visitors-${Date.now()}.csv"`);
    res.status(200).send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to export CSV' });
  }
}

function computePeriodStartDate(period: string): Date | null {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (period === '30d') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  if (period === '90d') {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  return null; // 'all'
}
