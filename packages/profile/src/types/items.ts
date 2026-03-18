/** Item from the items collection tab. */
export interface CollectionItem {
  id: number;
  type: string;
  name: string;
  collected: boolean;
  limitedEdition: boolean;
  imageUrl: string | null;
  quantity: number | null;
  category: string;
}

/** Item category with progress. */
export interface ItemCategory {
  key: string;
  name: string;
  progress: string | null;
  complete: boolean;
}

/** Items tab data. */
export interface ItemsData {
  items: CollectionItem[];
  categories: ItemCategory[];
}
