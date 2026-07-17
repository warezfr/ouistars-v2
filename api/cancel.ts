import { createEtgHandler } from '../server/etg/http.js';
import { handleCancel, parseCancelBody } from '../server/etg/handlers/cancel.js';

export default createEtgHandler('/cancel', async body => handleCancel(parseCancelBody(body)));
