import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to detect clicks outside of a specified element.
 * Useful for closing modals, dropdowns, popovers, etc.
 * 
 * @param callback - Function to call when a click outside is detected
 * @param enabled - Whether the hook is active (default: true)
 * @returns ref to attach to the element you want to detect outside clicks for
 * 
 * @example
 * ```tsx
 * const modalRef = useClickOutside(() => {
 *   setIsModalOpen(false);
 * });
 * 
 * return (
 *   <div ref={modalRef}>
 *     Modal content
 *   </div>
 * );
 * ```
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  callback: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Ignore clicks if:
      // 1. The element doesn't exist yet
      // 2. The click is inside the referenced element
      if (!ref.current || ref.current.contains(target)) {
        return;
      }

      // Check if any Radix UI dialog/modal is currently open
      // Radix UI portals dialogs to the body with specific attributes
      const hasOpenDialog = document.querySelector('[data-state="open"][role="dialog"]') !== null;
      const hasOpenDropdown = document.querySelector('[data-radix-popper-content-wrapper]') !== null;
      
      // Don't close if a dialog or dropdown is open
      if (hasOpenDialog || hasOpenDropdown) {
        return;
      }

      // Check if the click target is inside a portal (dialog, dropdown, etc.)
      const element = target as HTMLElement;
      const isInPortal = element.closest('[data-radix-portal]') !== null ||
                        element.closest('[role="dialog"]') !== null ||
                        element.closest('[data-radix-popper-content-wrapper]') !== null;
      
      // Don't close if clicking inside a portal
      if (isInPortal) {
        return;
      }

      // Call the callback
      callback(event);
    },
    [callback]
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Use both mousedown and touchend for better browser compatibility
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchend', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, [handleClickOutside, enabled]);

  return ref;
}

export default useClickOutside;
