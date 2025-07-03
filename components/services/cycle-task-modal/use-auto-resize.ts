import { useEffect, useRef } from 'react';

export const useAutoResize = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(textarea.scrollHeight, 40) + 'px';
    }
  }, [value]);

  return textareaRef;
};
