import React from 'react';
export default function EmptyState({icon,title,message,action}){return <div className="ui-empty">{icon&&<div className="dash-empty-icon">{icon}</div>}{title&&<b>{title}</b>}{message&&<span>{message}</span>}{action}</div>}
