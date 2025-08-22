import * as React from 'react';

export const Input = React.forwardRef(function Input(
  { className = '', type = 'text', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={
        [
          'flex h-10 w-full rounded-md border border-gray-300 bg-white',
          'px-3 py-2 text-sm placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-black/10',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        ].join(' ')
      }
      {...props}
    />
  );
});

export default Input;
