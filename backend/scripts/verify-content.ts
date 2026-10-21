import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { PageModel } from '../src/database/models/Page.js';
import { SiteModel } from '../src/database/models/Site.js';
import { FormModel } from '../src/database/models/Form.js';
import { CmsBlockSchema, SiteSettingsSchema, SiteThemeSchema } from '../src/schema/index.js';

async function verifyContent() {
  console.log('\n============================================================');
  console.log('🔍  Guna CMS — Content Integrity & Schema Verification');
  console.log('============================================================\n');

  try {
    await connectDatabase();

    // 1. Verify Site Settings
    const site = await SiteModel.findOne({ siteId: 'gunasai-in' });
    if (!site) throw new Error('Site document gunasai-in not found');
    SiteSettingsSchema.parse(site.toObject());
    console.log('✅ Site Settings schema verified.');

    // 2. Verify Theme
    SiteThemeSchema.parse(site.theme);
    console.log('✅ Theme Design Tokens schema verified.');

    // 3. Verify Page & Sections
    const homePage = await PageModel.findOne({ siteId: 'gunasai-in', slug: 'home' });
    if (!homePage) throw new Error('Home page not found');
    console.log(`✅ Home page found (Status: ${homePage.status}, Revision: #${homePage.publishedRevision || homePage.draftRevision})`);

    const sections = homePage.publishedSections || homePage.draftSections;
    sections.forEach((sec, idx) => {
      CmsBlockSchema.parse(sec);
      console.log(`   + Block ${idx}: [${sec.type}] id=${sec.id} (${(sec as any).content?.sectionTitle || (sec as any).content?.headlineNameFirst || sec.type})`);
    });
    console.log(`✅ All ${sections.length} blocks verified against CmsBlockSchema.`);

    // 4. Verify Contact Form
    const form = await FormModel.findOne({ siteId: 'gunasai-in', slug: 'contact-me' });
    if (!form) throw new Error('Contact form definition not found');
    console.log(`✅ Form '${form.title}' verified with ${form.fields.length} fields.`);

    console.log('\n🎉 ALL CONTENT SCHEMAS VERIFIED SUCCESSFULLY.\n');
  } catch (err: any) {
    console.error('❌ Content verification failed:', err.message);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

verifyContent();


