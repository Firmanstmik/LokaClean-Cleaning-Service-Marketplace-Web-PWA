const fs = require('fs');
const path = require('path');

const migrationPath = path.join(__dirname, '../prisma/migrations/20260207113141_add_geo_tables/migration.sql');

console.log('Checking migration file at:', migrationPath);

if (!fs.existsSync(migrationPath)) {
  console.error('Migration file not found!');
  process.exit(1);
}

try {
  let content = fs.readFileSync(migrationPath, 'utf8');
  let modified = false;

  // Comment out OrderStatus CANCELLED if active
  if (content.includes('ALTER TYPE "OrderStatus" ADD VALUE \'CANCELLED\';') && !content.includes('-- ALTER TYPE "OrderStatus" ADD VALUE \'CANCELLED\';')) {
    content = content.replace(
      'ALTER TYPE "OrderStatus" ADD VALUE \'CANCELLED\';', 
      '-- ALTER TYPE "OrderStatus" ADD VALUE \'CANCELLED\';'
    );
    modified = true;
    console.log('Commented out OrderStatus CANCELLED');
  }

  // Comment out Role CLEANER if active
  if (content.includes('ALTER TYPE "Role" ADD VALUE \'CLEANER\';') && !content.includes('-- ALTER TYPE "Role" ADD VALUE \'CLEANER\';')) {
    content = content.replace(
      'ALTER TYPE "Role" ADD VALUE \'CLEANER\';', 
      '-- ALTER TYPE "Role" ADD VALUE \'CLEANER\';'
    );
    modified = true;
    console.log('Commented out Role CLEANER');
  }

  if (modified) {
    fs.writeFileSync(migrationPath, content);
    console.log('Successfully modified migration file to skip existing enum values.');
  } else {
    console.log('No changes needed or already modified.');
  }

} catch (error) {
  console.error('Error modifying migration file:', error);
  process.exit(1);
}
