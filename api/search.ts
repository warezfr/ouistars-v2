import { createEtgHandler } from '../server/etg/http.js';
import { handleSearch, parseSearchBody } from '../server/etg/handlers/search.js';

export default createEtgHandler('/search', async body => handleSearch(parseSearchBody(body)));
