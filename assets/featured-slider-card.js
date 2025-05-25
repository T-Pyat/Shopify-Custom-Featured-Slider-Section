(function () {
  'use strict';

  if (window.FeaturedSliderCardInitialized) {
    return;
  }
  window.FeaturedSliderCardInitialized = true;

  class FeaturedSliderCard extends HTMLElement {
    constructor() {
      super();
      this.variantId = null;
      this.quantity = 1;
      this.timer = null;
      this.initialized = false;
    }

    connectedCallback() {
      if (this.initialized) return;

      this._observer = new MutationObserver(() => {
        if (!this.initialized) {
          this.initializeComponent();
        }
      });
      this._observer.observe(this, { childList: true, subtree: true });

      requestAnimationFrame(() => {
        this.initializeComponent();
      });
    }

    initializeComponent() {
      if (this.initialized) return;

      this.variantId = this.dataset.variantId;
      this.quantity = 1;
      this.timer = null;

      this.addBtn = this.querySelector('.product-card__add-btn');
      this.qtyBox = this.querySelector('.product-card__quantity-controls');
      this.plus = this.querySelector('.qty-btn.plus');
      this.minus = this.querySelector('.qty-btn.minus');

      if (!this.addBtn || !this.qtyBox || !this.plus || !this.minus) {
        console.warn('[featured-slider-card] Не знайдено елемент(и):', {
          addBtn: !!this.addBtn,
          qtyBox: !!this.qtyBox,
          plus: !!this.plus,
          minus: !!this.minus,
          node: this,
        });
        return;
      }

      this.qtyVal = this.addBtn && this.addBtn.querySelector ? this.addBtn.querySelector('.qty-value') : null;
      this.qtyBoxVal = this.qtyBox && this.qtyBox.querySelector ? this.qtyBox.querySelector('.qty-value') : null;

      if (!this.qtyVal || !this.qtyBoxVal) {
        console.warn('[featured-slider-card] Не знайдено qty-value:', {
          qtyVal: !!this.qtyVal,
          qtyBoxVal: !!this.qtyBoxVal,
          node: this,
        });
        return;
      }

      this.addBtn.addEventListener('click', this.handleAddClick.bind(this));
      this.plus.addEventListener('click', () => this.updateQuantity(1));
      this.minus.addEventListener('click', () => this.updateQuantity(-1));

      this.fetchInitialCartQuantity();

      this.initialized = true;
      if (this._observer) {
        this._observer.disconnect();
      }
    }

    handleAddClick(e) {
      e.preventDefault();
      e.stopPropagation();
      this.activateQuantityControls();
    }

    activateQuantityControls() {
      this.addBtn.classList.add('is-hidden');
      this.qtyBox.classList.remove('is-hidden');
      this.resetTimer();
    }

    updateQuantity(change) {
      this.quantity = Math.max(1, this.quantity + change);
      if (this.qtyBoxVal) {
        this.qtyBoxVal.textContent = `${this.quantity} шт`;
      }
      this.resetTimer();
    }

    resetTimer() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.addToCart(), 3000);
    }

    async addToCart() {
      try {
        const addResponse = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this.variantId,
            quantity: this.quantity,
          }),
        });

        if (!addResponse.ok) {
          throw new Error('Failed to add to cart');
        }

        const sectionsResponse = await fetch(`${window.Shopify.routes.root}?sections=cart-drawer`);
        const sections = await sectionsResponse.json();

        this.updateCartDrawer(sections['cart-drawer']);

        this.addBtn.classList.add('in-cart');
        if (this.qtyVal) {
          this.qtyVal.textContent = this.quantity;
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.addBtn.classList.remove('is-hidden');
        this.qtyBox.classList.add('is-hidden');
      }
    }

    updateCartDrawer(html) {
      if (!html) return;

      const temp = document.createElement('div');
      temp.innerHTML = html;
      const newDrawer = temp.querySelector('cart-drawer');
      const existingDrawer = document.querySelector('cart-drawer');

      if (existingDrawer && newDrawer) {
        existingDrawer.replaceWith(newDrawer);
        newDrawer.classList.add('is-active');
        newDrawer.setAttribute('open', '');
        document.body.classList.add('overflow-hidden');

        if (typeof newDrawer.open === 'function') {
          newDrawer.open();
        }
        if (window.CartDrawer && typeof window.CartDrawer.init === 'function') {
          window.CartDrawer.init();
        }
      }
    }

    async fetchInitialCartQuantity() {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();

        const item = cart.items.find((i) => i.variant_id == this.variantId);
        if (item && this.qtyVal) {
          this.quantity = item.quantity;
          this.qtyVal.textContent = item.quantity;
          this.addBtn.classList.add('in-cart');
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    }

    disconnectedCallback() {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      if (this._observer) {
        this._observer.disconnect();
      }
    }
  }

  if (!customElements.get('featured-slider-card')) {
    customElements.define('featured-slider-card', FeaturedSliderCard);
  }
})();
