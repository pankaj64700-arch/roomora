import React from 'react';

export default function Toast({message,tone='info',onClose}){if(!message)return null;return <div className={`ui-toast ui-toast-${tone}`} role={tone==='error'?'alert':'status'}><span>{message}</span>{onClose&&<button type="button" className="ui-toast-close" onClick={onClose} aria-label="Dismiss notification">×</button>}</div>}
