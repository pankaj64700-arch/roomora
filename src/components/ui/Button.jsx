import React from 'react';

export default function Button({variant='primary',size='md',className='',type='button',loading=false,disabled=false,children,...props}){
  return <button type={type} className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`.trim()} disabled={disabled||loading} aria-busy={loading||undefined} {...props}>{loading?'Please wait…':children}</button>;
}
