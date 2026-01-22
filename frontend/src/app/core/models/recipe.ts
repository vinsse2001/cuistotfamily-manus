export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id?: string;
  title: string;
  description?: string;
  photoUrl?: string;
  ingredients: Ingredient[];
  instructions?: string[];
  nutritionalInfo?: any;
  visibility: 'private' | 'friends' | 'public';
  ownerId?: string;
  forkedFromId?: string;
  createdAt?: Date;
  averageRating?: number;
  ratingCount?: number;
}
