/**
 * Best Selling Customers — infinite marquee slider
 * Vanilla JS: auto-scroll, drag, touch, pause on interaction.
 */

class BestSellingCustomersSlider {
  static instances = new WeakMap();

  constructor(root) {
    this.root = root;
    this.wrapper = root.querySelector('[data-bsc-track-wrapper]');
    this.track = root.querySelector('[data-bsc-track]');

    if (!this.wrapper || !this.track || this.track.children.length === 0) return;

    this.speed = parseFloat(root.dataset.autoScrollSpeed) || 0.35;
    this.infiniteLoop = root.dataset.infiniteLoop !== 'false';
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.position = 0;
    this.halfWidth = 0;
    this.maxScroll = 0;
    this.isPaused = false;
    this.isDragging = false;
    this.isHovered = false;
    this.isTouching = false;
    this.dragStartX = 0;
    this.dragStartPosition = 0;
    this.rafId = null;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.tick = this.tick.bind(this);
    this.onResize = this.debounce(this.onResize.bind(this), 150);

    this.setup();
    BestSellingCustomersSlider.instances.set(root, this);
  }

  setup() {
    this.resetTrack();
    this.bindEvents();
    this.start();
  }

  resetTrack() {
    this.track.querySelectorAll('.bsc-card--clone').forEach((node) => node.remove());
    this.track.style.transform = 'translate3d(0, 0, 0)';
    this.position = 0;

    if (this.infiniteLoop && this.track.children.length > 0) {
      const originals = Array.from(this.track.children);
      originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.classList.add('bsc-card--clone');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('img').forEach((img) => {
          img.setAttribute('loading', 'lazy');
          img.setAttribute('decoding', 'async');
        });
        this.track.appendChild(clone);
      });
      this.halfWidth = this.track.scrollWidth / 2;
    } else {
      this.halfWidth = 0;
      this.maxScroll = Math.max(0, this.track.scrollWidth - this.wrapper.clientWidth);
    }
  }

  bindEvents() {
    this.wrapper.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    this.wrapper.addEventListener('mouseenter', this.onMouseEnter);
    this.wrapper.addEventListener('mouseleave', this.onMouseLeave);
    this.wrapper.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.wrapper.addEventListener('touchend', this.onTouchEnd);
    this.wrapper.addEventListener('touchcancel', this.onTouchEnd);
    window.addEventListener('resize', this.onResize);
  }

  unbindEvents() {
    this.wrapper.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.wrapper.removeEventListener('mouseenter', this.onMouseEnter);
    this.wrapper.removeEventListener('mouseleave', this.onMouseLeave);
    this.wrapper.removeEventListener('touchstart', this.onTouchStart);
    this.wrapper.removeEventListener('touchend', this.onTouchEnd);
    this.wrapper.removeEventListener('touchcancel', this.onTouchEnd);
    window.removeEventListener('resize', this.onResize);
  }

  start() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this.tick);
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.unbindEvents();
    BestSellingCustomersSlider.instances.delete(this.root);
  }

  shouldAutoScroll() {
    return !this.reducedMotion && !this.isPaused && !this.isDragging && !this.isHovered && !this.isTouching;
  }

  tick() {
    if (this.shouldAutoScroll()) {
      this.position += this.speed;

      if (this.infiniteLoop && this.halfWidth > 0) {
        if (this.position >= this.halfWidth) {
          this.position -= this.halfWidth;
        }
      } else if (this.maxScroll > 0) {
        if (this.position >= this.maxScroll) {
          this.position = 0;
        }
      }
    }

    this.applyTransform();
    this.rafId = requestAnimationFrame(this.tick);
  }

  applyTransform() {
    this.track.style.transform = `translate3d(-${this.position}px, 0, 0)`;
  }

  setPaused(paused) {
    this.isPaused = paused;
    this.wrapper.classList.toggle('is-paused', paused);
  }

  onPointerDown(event) {
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartPosition = this.position;
    this.wrapper.classList.add('is-dragging');
    this.setPaused(true);

    if (this.wrapper.setPointerCapture && event.pointerId !== undefined) {
      try {
        this.wrapper.setPointerCapture(event.pointerId);
      } catch (_error) {
        /* ignore */
      }
    }
  }

  onPointerMove(event) {
    if (!this.isDragging) return;

    const delta = this.dragStartX - event.clientX;
    let nextPosition = this.dragStartPosition + delta;

    if (this.infiniteLoop && this.halfWidth > 0) {
      while (nextPosition < 0) nextPosition += this.halfWidth;
      while (nextPosition >= this.halfWidth) nextPosition -= this.halfWidth;
    } else {
      nextPosition = Math.max(0, Math.min(nextPosition, this.maxScroll));
    }

    this.position = nextPosition;
    this.applyTransform();
  }

  onPointerUp(event) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.wrapper.classList.remove('is-dragging');

    if (this.wrapper.releasePointerCapture && event.pointerId !== undefined) {
      try {
        this.wrapper.releasePointerCapture(event.pointerId);
      } catch (_error) {
        /* ignore */
      }
    }

    if (!this.isHovered && !this.isTouching) {
      this.setPaused(false);
    }
  }

  onMouseEnter() {
    this.isHovered = true;
    this.setPaused(true);
  }

  onMouseLeave() {
    this.isHovered = false;
    if (!this.isDragging && !this.isTouching) {
      this.setPaused(false);
    }
  }

  onTouchStart() {
    this.isTouching = true;
    this.setPaused(true);
  }

  onTouchEnd() {
    this.isTouching = false;
    if (!this.isDragging && !this.isHovered) {
      this.setPaused(false);
    }
  }

  onResize() {
    this.resetTrack();
  }

  debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
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
  if (instance && !instance.isHovered && !instance.isTouching && !instance.isDragging) {
    instance.setPaused(false);
  }
});
