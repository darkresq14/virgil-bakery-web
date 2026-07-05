import 'dotenv/config';
import { main } from './db-pull';

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});