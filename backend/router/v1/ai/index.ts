import { Router } from 'express';
import outfitSuggestionsRouter from './outfitSuggestions';
import ootdRouter from './ootd';
import recommendationsRouter from './recommendations';
import wardrobePairingsRouter from './wardrobePairings';

const aiRouter = Router();

aiRouter.use(outfitSuggestionsRouter);
aiRouter.use(ootdRouter);
aiRouter.use(recommendationsRouter);
aiRouter.use(wardrobePairingsRouter);

export default aiRouter;
