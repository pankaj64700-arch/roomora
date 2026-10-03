import React from 'react';

export default function Input({label,error,helpText,id,className='',...props}){
  const inputId=id||props.name;
  return <label className="ui-field" htmlFor={inputId}>{label&&<span className="ui-label">{label}</span>}<input id={inputId} className={`ui-input ${error?'ui-input-error':''} ${className}`.trim()} aria-invalid={error?'true':undefined} {...props}/>{error?<span className="ui-field-error" role="alert">{error}</span>:helpText?<span className="ui-field-help">{helpText}</span>:null}</label>;
}
