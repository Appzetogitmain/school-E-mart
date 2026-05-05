import { useRef, useEffect } from 'react';

/**
 * A hook that enables click-and-drag scrolling for a container.
 */
export const useDraggableScroll = () => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      isDown = true;
      el.classList.add('active');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMouseLeave = () => {
      isDown = false;
      el.style.cursor = 'grab';
    };

    const onMouseUp = () => {
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 2; // scroll-fast factor
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseleave', onMouseLeave);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.style.cursor = 'grab';

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return ref;
};
