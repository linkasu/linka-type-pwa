import { StoreItem } from './StoreItem';

export interface Statement extends StoreItem{
  categoryId: string;
  text:string
}