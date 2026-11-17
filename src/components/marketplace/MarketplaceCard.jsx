import React from 'react';
import { Bookmark, MapPin, Pencil, Trash2 } from 'lucide-react';
import MarketplaceImage from './MarketplaceImage';
import { formatMarketplacePrice, categoryLabel } from './marketplace';

export default function MarketplaceCard({ item, onOpen, onSave, saved = false, owner = false, onEdit, onDelete }) {
  const openCard = onOpen || (owner ? onEdit : undefined);
  const location = [item.locality, item.city].filter(Boolean).join(', ');
  const description = (item.description || '').trim();
  const title = item.title || 'Untitled listing';
  const content = (
    <>
      <div className="market-image-card-media">
        <MarketplaceImage item={item} alt={title} />
        <span className="market-card-category">{categoryLabel(item.category)}</span>
      </div>
      <div className="market-image-card-info">
        <strong className="market-card-title">{title}</strong>
        <span className="market-card-price">{formatMarketplacePrice(item.price)}</span>
        {location && <span className="market-card-location">
          <MapPin size={14} aria-hidden="true" /><span>{location}</span>
        </span>}
        {description && <p className="market-card-description">{description}</p>}
      </div>
    </>
  );
  return <article className="market-image-card ui-interactive">
    {openCard
      ? <button type="button" className="market-card-open" onClick={() => openCard(item)}
          aria-label={(owner ? 'Edit ' : 'View details for ') + title}>{content}</button>
      : <div className="market-card-open market-card-static">{content}</div>}
    {(onSave || owner) && <div className="market-card-actions">
      {onSave && <button type="button" className={'market-save' + (saved ? ' saved' : '')}
        onClick={() => onSave(item.id)}
        aria-label={(saved ? 'Remove from saved items: ' : 'Save item: ') + title}>
        <Bookmark size={14} aria-hidden="true"/>{saved ? 'Saved' : 'Save'}</button>}
      {owner && onEdit && <button type="button" className="market-save" onClick={() => onEdit(item)}>
        <Pencil size={14} aria-hidden="true"/>Edit</button>}
      {owner && onDelete && <button type="button" className="market-save danger" onClick={() => onDelete(item)}>
        <Trash2 size={14} aria-hidden="true"/>Delete</button>}
    </div>}
  </article>;
}
