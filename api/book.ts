import { createEtgHandler } from '../server/etg/http.js';
import { handleBook, parseBookBody } from '../server/etg/handlers/book.js';

export default createEtgHandler('/book', async body => handleBook(parseBookBody(body)));
