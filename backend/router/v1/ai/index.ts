import { Router } from 'express';
import outfitSuggestionsRouter from './outfitSuggestions';
import ootdRouter from './ootd';
import recommendationsRouter from './recommendations';
import wardrobePairingsRouter from './wardrobePairings';
import tryOnRouter from './tryOn';


const aiRouter = Router();

aiRouter.use(outfitSuggestionsRouter);
aiRouter.use(ootdRouter);
aiRouter.use(recommendationsRouter);
aiRouter.use(wardrobePairingsRouter);
aiRouter.use(tryOnRouter);

export default aiRouter;
