import React from 'react';
import { Bookmark, Clock, MapPin, Pencil, ShoppingBag, Trash2 } from 'lucide-react';

export default function MarketplaceRows({ rows, grouped, user, saved, onSelect, onSave, onEdit, onDelete, imageFor }) {
  return (
    <div className="market-landing-rows">
      {rows.map(([cat, label]) => {
        const list = grouped[cat] || [];
        return (
          <div className="market-landing-row" key={cat}>
            <div className="market-row-title">
              <h3>{label}</h3>
              <span className="market-row-count">{list.length} available</span>
            </div>
            {list.length ? (
              <div className="market-horizontal">
                {list.map(item => {
                  const mine = item.user_id === user?.id;
                  const isSaved = saved.includes(item.id);
                  return (
                    <article className="market-detail-card" key={item.id}>
                      <button className="market-detail-image" onClick={() => onSelect(item)}>
                        <img src={imageFor(item, cat)} alt={item.title || label} loading="lazy" />
                      </button>
                      <div className="market-detail-body">
                        <span className="market-detail-category">{label}{mine ? ' · Your listing' : ''}</span>
                        <h4>{item.title}</h4>
                        <p>{item.description}</p>
                        <strong>₹{Number(item.price || 0).toLocaleString('en-IN')}</strong>
                        <small><MapPin size={12} /> {item.locality}, {item.city}</small>
                        <footer>
                          <span><Clock size={12} /> {item.expires_at ? `Until ${new Date(item.expires_at).toLocaleDateString()}` : 'Active'}</span>
                          <div className="market-card-actions">
                            <button className={isSaved ? 'market-save saved' : 'market-save'} onClick={() => onSave(item.id)}><Bookmark size={15} /> {isSaved ? 'Saved' : 'Save'}</button>
                            {mine && <>
                              <button className="market-save" onClick={() => onEdit({ ...item })}><Pencil size={14} /> Edit</button>
                              <button className="market-save" onClick={() => onDelete(item)}><Trash2 size={14} /> Delete</button>
                            </>}
                          </div>
                        </footer>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="dash-empty">
                <div className="dash-empty-icon"><ShoppingBag size={20} /></div>
                <b>No {label.toLowerCase()} available</b>
                <span>Published items will appear here until they expire.</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
