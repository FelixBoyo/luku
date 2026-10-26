import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import productsRouter from './products';
import profileRouter from './profile';
import connectionsRouter from './connections';
import aiRouter from './ai/index';
import wishlistRouter from './wishlist';
import cartRouter from './cart';
import ordersRouter from './orders';
import inboxRouter from './inbox';
import notificationsRouter from './notifications';
import wardrobeRouter from './wardrobe';
import uploadsRouter from './uploads';
import listingsRouter from './listings';
import outfitsRouter from './outfits';
import internalRouter from './internal';

const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/profile', profileRouter);
v1Router.use('/connections', connectionsRouter);
v1Router.use('/products', productsRouter);
v1Router.use('/ai', aiRouter);
v1Router.use('/wishlist', wishlistRouter);
v1Router.use('/cart', cartRouter);
v1Router.use('/orders', ordersRouter);
v1Router.use('/inbox', inboxRouter);
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/wardrobe', wardrobeRouter);
v1Router.use('/uploads', uploadsRouter);
v1Router.use('/listings', listingsRouter);
v1Router.use('/outfits', outfitsRouter);
v1Router.use('/internal', internalRouter);

export default v1Router;
