import { createEtgHandler } from '../server/etg/http.js';
import { handleStatus, parseStatusBody } from '../server/etg/handlers/status.js';

export default createEtgHandler('/status', async body => handleStatus(parseStatusBody(body)));
