import 'dotenv/config';
import { createApp } from './app';
import { logger } from './utils/logger';

const port = Number(process.env.PORT ?? 4877);
const app = createApp();

app.listen(port, () => {
  logger.info(`Market Pulse API listening on :${port} (market data: ${process.env.MARKET_DATA_MODE ?? 'demo'})`);
});
