# FORME Storefront

A responsive e-commerce storefront using FakeStoreAPI, plain HTML/CSS/JavaScript, and browser localStorage. No build step or application server is required.

## Use

Open `index.html` in a modern browser. The catalog loads from `https://fakestoreapi.com/products`, so an internet connection is needed. The cart is stored in localStorage under `forme.cart.v1` and survives reloads in the same browser.

## Included

- Product cards with image, price, rating, and collection badge
- Category filters, search, and sorting
- Slide-out cart with add, remove, and quantity controls
- Subtotal, 8% estimated tax, and $6 shipping below $100 (free at $100+)
- Demo checkout confirmation; it does not collect payment or submit an order
- Responsive layout and loading, error, and empty states
