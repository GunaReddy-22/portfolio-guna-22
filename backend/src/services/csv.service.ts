import { stringify } from 'csv-stringify/sync';

export function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) {
    return '';
  }

  let str = typeof val === 'object' ? JSON.stringify(val) : String(val);

  // If value starts with formula triggers (=, +, -, @, \t, \r), prefix with single quote
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return str;
}

export function generateSafeSubmissionsCsv(submissions: any[]): string {
  if (!submissions || submissions.length === 0) {
    return 'ID,Form Slug,Status,Created At,Data\n';
  }

  // Collect all data field names across submissions
  const allFieldKeys = new Set<string>();
  submissions.forEach((s) => {
    if (s.data && typeof s.data === 'object') {
      Object.keys(s.data).forEach((k) => allFieldKeys.add(k));
    }
  });

  const header = ['ID', 'Form Slug', 'Status', 'Created At', ...Array.from(allFieldKeys)];

  const rows = submissions.map((s) => {
    const row: Record<string, string> = {
      ID: sanitizeCsvValue(s._id || s.id),
      'Form Slug': sanitizeCsvValue(s.formSlug),
      Status: sanitizeCsvValue(s.status),
      'Created At': sanitizeCsvValue(s.createdAt ? new Date(s.createdAt).toISOString() : ''),
    };

    allFieldKeys.forEach((k) => {
      row[k] = sanitizeCsvValue(s.data ? s.data[k] : '');
    });

    return row;
  });

  return stringify(rows, { header: true });
}

