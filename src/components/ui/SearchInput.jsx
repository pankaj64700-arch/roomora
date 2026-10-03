import React from 'react';
import {Search,X} from 'lucide-react';

export default function SearchInput({value='',onChange,placeholder='Search…',className=''}){return <div className={`ui-search ${className}`.trim()}><Search size={18} aria-hidden="true"/><input className="ui-input" value={value} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder} aria-label={placeholder}/>{value&&<button type="button" className="ui-search-clear" onClick={()=>onChange?.('')} aria-label="Clear search"><X size={16}/></button>}</div>}
