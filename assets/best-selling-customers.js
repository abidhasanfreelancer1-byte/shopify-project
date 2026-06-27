/**
 * Best Selling Customers — scroll-based infinite slider (LPF-style)
 */

class BestSellingCustomersSlider {
  static instances = new WeakMap();

  constructor(root) {
    this.root = root;
    this.track = root.querySelector('[data-bsc-track]');
    if (!this.track || this.track.children.length === 0) return;

    this.infiniteLoop = root.dataset.infiniteLoop !== 'false';
    this.scrollStep = parseFloat(root.dataset.scrollStep) || 0;
    this.scrollInterval = parseInt(root.dataset.scrollInterval, 10) || 20;
    this.resumeDelay = parseInt(root.dataset.resumeDelay, 10) || 3000;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.isDown = false;
    this.startX = 0;
    this.scrollLeft = 0;
    this.autoTimer = null;
    this.resumeTimer = null;
    this.userInteracting = false;
    this.halfWidth = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);

    this.setup();
    BestSellingCustomersSlider.instances.set(root, this);
  }

  setup() {
    this.bindEvents();
    this.calcHalfWidth();
    if (!this.reducedMotion && this.scrollStep > 0) this.startAutoScroll();
  }

  calcHalfWidth() {
    this.halfWidth = this.infiniteLoop ? this.track.scrollWidth / 2 : 0;
  }

  bindEvents() {
    this.track.addEventListener('mousedown', this.onMouseDown);
    this.track.addEventListener('mousemove', this.onMouseMove);
    this.track.addEventListener('mouseup', this.onMouseUp);
    this.track.addEventListener('mouseleave', this.onMouseUp);
    this.track.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.track.addEventListener('touchend', this.onTouchEnd, { passive: true });
    this.track.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
  }

  unbindEvents() {
    this.track.removeEventListener('mousedown', this.onMouseDown);
    this.track.removeEventListener('mousemove', this.onMouseMove);
    this.track.removeEventListener('mouseup', this.onMouseUp);
    this.track.removeEventListener('mouseleave', this.onMouseUp);
    this.track.removeEventListener('touchstart', this.onTouchStart);
    this.track.removeEventListener('touchend', this.onTouchEnd);
    this.track.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  }

  destroy() {
    this.stopAutoScroll();
    clearTimeout(this.resumeTimer);
    this.unbindEvents();
    BestSellingCustomersSlider.instances.delete(this.root);
  }

  pauseAuto() {
    this.userInteracting = true;
    this.track.classList.add('is-paused');
    this.stopAutoScroll();
    clearTimeout(this.resumeTimer);
  }

  resumeAuto(delay) {
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.userInteracting = false;
      this.track.classList.remove('is-paused');
      if (!this.reducedMotion) this.startAutoScroll();
    }, delay || this.resumeDelay);
  }

  startDrag(clientX) {
    this.isDown = true;
    this.pauseAuto();
    this.track.classList.add('is-dragging');
    this.startX = clientX;
    this.scrollLeft = this.track.scrollLeft;
  }

  moveDrag(clientX) {
    if (!this.isDown) return;
    this.track.scrollLeft = this.scrollLeft - (clientX - this.startX);
  }

  endDrag() {
    if (!this.isDown) return;
    this.isDown = false;
    this.track.classList.remove('is-dragging');
    this.resumeAuto(this.resumeDelay);
  }

  onMouseDown(event) {
    if (event.button !== 0) return;
    this.startDrag(event.pageX);
  }

  onMouseMove(event) {
    if (!this.isDown) return;
    event.preventDefault();
    this.moveDrag(event.pageX);
  }

  onMouseUp() {
    this.endDrag();
  }

  onTouchStart() {
    this.pauseAuto();
  }

  onTouchEnd() {
    this.resumeAuto(this.resumeDelay);
  }

  onScroll() {
    if (this.userInteracting || this.isDown || !this.infiniteLoop) return;
    this.calcHalfWidth();
    if (this.halfWidth > 0 && this.track.scrollLeft >= this.halfWidth) {
      this.track.scrollLeft -= this.halfWidth;
    }
  }

  onResize() {
    this.calcHalfWidth();
  }

  startAutoScroll() {
    this.stopAutoScroll();
    if (this.scrollStep <= 0) return;

    this.calcHalfWidth();

    this.autoTimer = setInterval(() => {
      if (this.userInteracting || this.isDown) return;

      this.track.scrollLeft += this.scrollStep;

      if (this.infiniteLoop && this.halfWidth > 0 && this.track.scrollLeft >= this.halfWidth) {
        this.track.scrollLeft -= this.halfWidth;
      }
    }, this.scrollInterval);
  }

  stopAutoScroll() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = null;
    }
  }

  setPaused(paused) {
    if (paused) {
      this.pauseAuto();
    } else {
      this.resumeAuto(0);
    }
  }
}

function initBestSellingCustomersSliders(scope = document) {
  scope.querySelectorAll('[data-bsc-slider]').forEach((root) => {
    const existing = BestSellingCustomersSlider.instances.get(root);
    if (existing) existing.destroy();
    new BestSellingCustomersSlider(root);
  });
}

function destroyBestSellingCustomersSliders(scope) {
  scope.querySelectorAll('[data-bsc-slider]').forEach((root) => {
    const instance = BestSellingCustomersSlider.instances.get(root);
    if (instance) instance.destroy();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initBestSellingCustomersSliders());
} else {
  initBestSellingCustomersSliders();
}

document.addEventListener('shopify:section:load', (event) => {
  initBestSellingCustomersSliders(event.target);
});

document.addEventListener('shopify:section:unload', (event) => {
  destroyBestSellingCustomersSliders(event.target);
});

document.addEventListener('shopify:section:reorder', () => {
  initBestSellingCustomersSliders();
});

document.addEventListener('shopify:block:select', (event) => {
  const slider = event.target.closest('[data-bsc-slider]');
  if (!slider) return;
  const instance = BestSellingCustomersSlider.instances.get(slider);
  if (instance) instance.setPaused(true);
});

document.addEventListener('shopify:block:deselect', (event) => {
  const slider = event.target.closest('[data-bsc-slider]');
  if (!slider) return;
  const instance = BestSellingCustomersSlider.instances.get(slider);
  if (instance) instance.setPaused(false);
});
