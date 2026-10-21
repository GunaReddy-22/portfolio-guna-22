import { connectDatabase, disconnectDatabase } from '../src/database/connection.js';
import { provisionOwner } from '../src/database/provision-owner.js';

export { provisionOwner, provisionOwner as seedAdmin };

async function main() {
  console.log('\n============================================================');
  console.log('🛡️  Guna CMS — Owner Account Provisioning');
  console.log('============================================================\n');

  try {
    await connectDatabase();
    await provisionOwner();
  } catch (err: any) {
    console.error('❌ Owner provisioning halted:', err.message);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

if (process.argv[1]?.includes('seed-admin')) {
  main();
}
