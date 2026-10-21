import { localized, sortedMenu, type Dish, type Lang } from './menu';
import { lunchAvailable, lunchKind, pickupSlots } from './lunch';

export type LunchItem = {
  id:string; name:string; description:string; imageUrl:string;
  regularPriceCents:number|null; lunchPriceCents:number|null;
};
export type LunchCatalog = {
  dishes:LunchItem[]; drinks:LunchItem[]; pickupSlots:string[];
  closedDates:string[]; availabilityReady:boolean;
};

/** Public data only. Calendar availability is deliberately checked separately. */
export function lunchCatalog(menu:Dish[],lang:Lang):LunchCatalog {
  const available=sortedMenu(menu).filter(lunchAvailable);
  const item=(dish:Dish):LunchItem=>{
    const text=localized(dish,lang);
    return {id:dish.id,name:text.name,description:text.description,imageUrl:dish.imageUrl,regularPriceCents:dish.regularPriceCents,lunchPriceCents:dish.lunchPriceCents};
  };
  return {
    dishes:available.filter(dish=>lunchKind(dish)==='main').map(item),
    drinks:available.filter(dish=>lunchKind(dish)==='drink').map(item),
    pickupSlots:[...pickupSlots],closedDates:[],availabilityReady:false,
  };
}
