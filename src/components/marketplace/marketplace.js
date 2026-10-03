export const MARKETPLACE_CATEGORIES=[['room','Rooms'],['furniture','Furniture'],['stationery','Stationery'],['second_hand','Other second-hand items']];
export const MARKETPLACE_FALLBACKS={room:'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=900&q=85',furniture:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85',stationery:'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=85',second_hand:'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=85'};
export const categoryLabel=c=>MARKETPLACE_CATEGORIES.find(([v])=>v===c)?.[1]||'Marketplace item';
export const normalizedCategory=c=>['second_hand','other'].includes(c)?'second_hand':c;
export const getMarketplaceImage=(item,category)=>item?.image_url||item?.image_urls?.[0]||MARKETPLACE_FALLBACKS[normalizedCategory(category||item?.category)];
export const isActiveListing=item=>item?.status==='published'&&(!item.expires_at||new Date(item.expires_at)>new Date());
export const formatMarketplacePrice=p=>`₹${Number(p||0).toLocaleString('en-IN')}`;
export const matchesMarketplaceSearch=(item,q)=>`${item?.title||''} ${item?.description||''} ${item?.locality||''} ${item?.city||''}`.toLowerCase().includes((q||'').trim().toLowerCase());
export const groupMarketplaceItems=(items,filter='all',q='')=>Object.fromEntries(MARKETPLACE_CATEGORIES.map(([cat])=>[cat,(items||[]).filter(item=>(filter==='all'||normalizedCategory(item.category)===filter)&&normalizedCategory(item.category)===cat&&matchesMarketplaceSearch(item,q))]));
