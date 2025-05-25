class FeaturedCollectionSlider extends HTMLElement {
  constructor() {
    super();
    this._slider = null;
    this._leftArrow = null;
    this._rightArrow = null;
    this._updateArrows = this._updateArrows.bind(this);
    this._slideLeft = this._slideLeft.bind(this);
    this._slideRight = this._slideRight.bind(this);
  }

  connectedCallback() {
    const container = this.querySelector('.featured-collection__slider-container');
    if (!container) return;

    this._slider = container.querySelector('.featured-collection__slider');
    this._leftArrow = container.querySelector('.featured-collection__arrow--left');
    this._rightArrow = container.querySelector('.featured-collection__arrow--right');

    if (!this._slider || !this._leftArrow || !this._rightArrow) return;

    this._leftArrow.addEventListener('click', this._slideLeft);
    this._rightArrow.addEventListener('click', this._slideRight);
    this._slider.addEventListener('scroll', this._updateArrows);

    this._updateArrows();
  }

  disconnectedCallback() {
    if (this._leftArrow) this._leftArrow.removeEventListener('click', this._slideLeft);
    if (this._rightArrow) this._rightArrow.removeEventListener('click', this._slideRight);
    if (this._slider) this._slider.removeEventListener('scroll', this._updateArrows);
  }

  _updateArrows() {
    const scrollLeft = this._slider.scrollLeft;
    const maxScrollLeft = this._slider.scrollWidth - this._slider.clientWidth;
    this._leftArrow.style.display = scrollLeft <= 0 ? 'none' : 'flex';
    this._rightArrow.style.display = scrollLeft >= maxScrollLeft - 1 ? 'none' : 'flex';
  }

  _slideLeft() {
    this._slider.scrollBy({ left: -300, behavior: 'smooth' });
  }

  _slideRight() {
    this._slider.scrollBy({ left: 300, behavior: 'smooth' });
  }
}

if (!customElements.get('featured-collection-slider')) {
  customElements.define('featured-collection-slider', FeaturedCollectionSlider);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.featured-collection__slider-wrapper').forEach((wrapper) => {
    if (!wrapper.matches('featured-collection-slider')) {
      wrapper.outerHTML = `<featured-collection-slider class="featured-collection__slider-wrapper">${wrapper.innerHTML}</featured-collection-slider>`;
    }
  });
});
