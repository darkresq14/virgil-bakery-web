import 'dotenv/config';
import { main } from './media-pull';

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
