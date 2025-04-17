// Execute the seed-tasks script
const { execSync } = require('child_process');

try {
  console.log('Starting the database seeding process...');
  execSync('npx tsx server/seed-tasks.ts', { stdio: 'inherit' });
  console.log('Database seeding completed successfully!');
} catch (error) {
  console.error('Error during database seeding:', error);
}