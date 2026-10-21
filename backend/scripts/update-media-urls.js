import mongoose from 'mongoose';

const uri = 'mongodb+srv://workforguna_db_user:PNenvxo18DQAEigs@cluster0.fqaoxmg.mongodb.net/guna-cms?retryWrites=true&w=majority';

async function main() {
  await mongoose.connect(uri);
  const Page = mongoose.connection.collection('pages');
  const page = await Page.findOne({ siteId: 'gunasai-in', slug: 'home' });
  if (!page) {
    console.error('Home page not found');
    process.exit(1);
  }

  const heroPhoto = 'https://res.cloudinary.com/dzlqe2lvf/image/upload/v1792591876/guna-cms/portfolio/aes9l9kapokflfrywekr.jpg';
  const resumeImg = 'https://res.cloudinary.com/dzlqe2lvf/image/upload/v1792591891/guna-cms/portfolio/rd0h174mbxmy59fxpcbg.png';

  for (const sec of (page.publishedSections || [])) {
    if (sec.type === 'hero') {
      sec.content.photoUrl = heroPhoto;
    }
    if (sec.type === 'resume') {
      sec.content.previewImageUrl = resumeImg;
      sec.content.downloadPdfUrl = resumeImg;
    }
  }

  for (const sec of (page.draftSections || [])) {
    if (sec.type === 'hero') {
      sec.content.photoUrl = heroPhoto;
    }
    if (sec.type === 'resume') {
      sec.content.previewImageUrl = resumeImg;
      sec.content.downloadPdfUrl = resumeImg;
    }
  }

  await Page.updateOne(
    { _id: page._id },
    { $set: { publishedSections: page.publishedSections, draftSections: page.draftSections } }
  );

  console.log('✅ UPDATED ATLAS SUCCESSFULLY WITH CLOUDINARY ASSETS!');
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
