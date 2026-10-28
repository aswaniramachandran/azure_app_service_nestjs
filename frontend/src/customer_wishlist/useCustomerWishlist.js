import { useEffect, useState } from 'react';
import {
  addCustomerWishlistItem,
  fetchCustomerWishlist,
  notifyCustomerWishlistUpdated,
  removeCustomerWishlistItem,
} from './customerWishlistApi.js';

export function useCustomerWishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyProductIds, setBusyProductIds] = useState(() => new Set());

  useEffect(() => {
    let isCurrent = true;
    fetchCustomerWishlist()
      .then((wishlist) => {
        if (isCurrent) setItems(wishlist.items);
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message || 'Unable to load your wishlist.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    const syncWishlist = (event) => {
      if (Array.isArray(event.detail?.wishlist?.items)) {
        setItems(event.detail.wishlist.items);
      }
    };
    window.addEventListener('customer-wishlist-updated', syncWishlist);
    return () => {
      isCurrent = false;
      window.removeEventListener('customer-wishlist-updated', syncWishlist);
    };
  }, []);

  const toggleProduct = async (productId) => {
    const normalizedProductId = Number(productId);
    const key = String(normalizedProductId);
    const existingItem = items.find(
      (item) => Number(item.productId) === normalizedProductId,
    );
    setBusyProductIds((current) => new Set(current).add(key));
    setError('');
    try {
      const wishlist = existingItem
        ? await removeCustomerWishlistItem(existingItem.id)
        : await addCustomerWishlistItem(normalizedProductId);
      setItems(wishlist.items);
      notifyCustomerWishlistUpdated(wishlist);
    } catch (requestError) {
      setError(requestError.message || 'Unable to update your wishlist.');
      throw requestError;
    } finally {
      setBusyProductIds((current) => {
        const updated = new Set(current);
        updated.delete(key);
        return updated;
      });
    }
  };

  return {
    items,
    loading,
    error,
    isProductBusy: (productId) => busyProductIds.has(String(Number(productId))),
    toggleProduct,
  };
}
