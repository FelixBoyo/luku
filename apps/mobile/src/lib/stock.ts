import type { Product } from '../types/domain/product';

/**
 * Availability rule shared by the cards, the detail screen and the cart, so a
 * product cannot look buyable in one place and unavailable in another.
 *
 * `stockQuantity` is deliberately three-valued. `undefined` means the seller
 * never tracked stock for this listing, which is not the same as none left —
 * treating it as sold out would hide most of the catalogue.
 */
export const isSoldOut = (product: Pick<Product, 'stockQuantity'>): boolean =>
    product.stockQuantity === 0;

/**
 * Upper bound for a quantity selector. Untracked stock has no cap; tracked
 * stock caps at what is left. Sold-out items return 0, which callers should
 * treat as "cannot add" rather than as an unlimited cap.
 */
export const maxSelectableQty = (product: Pick<Product, 'stockQuantity'>): number =>
    product.stockQuantity == null ? Number.MAX_SAFE_INTEGER : product.stockQuantity;

/**
 * Billboard pick: prefer something still buyable so Home / Discover / Market
 * do not promote a dead listing. Falls back to the first item when the whole
 * catalogue is sold out, so the screen is not empty — callers still overlay
 * the sold-out treatment on that fallback.
 */
export const firstInStock = <T extends Pick<Product, 'stockQuantity'>>(
    products: T[],
): T | undefined => products.find((p) => !isSoldOut(p)) ?? products[0];
