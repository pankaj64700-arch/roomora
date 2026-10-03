import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const cats=[['room','Room'],['furniture','Furniture'],['second_hand','Second-hand item'],['stationery','Stationery'],['other','Other']];
export default function MarketplaceEditForm({value,onChange,onSubmit,onCancel,busy=false}){
 const set=(key,next)=>onChange({...value,[key]:next});
 return <form className="ui-form" onSubmit={e=>{e.preventDefault();onSubmit?.()}}>
  <label className="ui-field"><span className="ui-label">Category</span><select className="ui-input" value={value.category||''} onChange={e=>set('category',e.target.value)}>{cats.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
  <Input label="Title" value={value.title||''} maxLength={120} required onChange={e=>set('title',e.target.value)}/>
  <label className="ui-field"><span className="ui-label">Description</span><textarea className="ui-input" rows="4" value={value.description||''} onChange={e=>set('description',e.target.value)}/></label>
  <div className="role-grid"><Input label="Price (₹)" type="number" min="0" value={value.price??0} onChange={e=>set('price',e.target.value)}/><Input label="Locality / Area" value={value.locality||''} onChange={e=>set('locality',e.target.value)}/></div>
  <Input label="City" value={value.city||''} onChange={e=>set('city',e.target.value)}/>
  <div className="dash-action-row"><Button type="submit" variant="primary" disabled={busy}>{busy?'Saving…':'Save changes'}</Button><Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>Cancel</Button></div>
 </form>
}
