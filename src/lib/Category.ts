import { StoreItem } from './StoreItem';

export interface Category extends StoreItem{
  default: boolean;
  label:string
}