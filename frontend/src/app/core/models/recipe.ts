export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: {
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    vitaminB12?: number;
    folate?: number;
  };
  minerals?: {
    calcium?: number;
    iron?: number;
    magnesium?: number;
    phosphorus?: number;
    potassium?: number;
    zinc?: number;
    copper?: number;
  };
}

export interface Recipe {
  id?: string;
  title: string;
  description?: string;
  photoUrl?: string;
  ingredients: Ingredient[];
  instructions?: string[];
  nutritionalInfo?: NutritionalInfo;
  visibility: 'private' | 'friends' | 'public';
  category?: 'Entrée' | 'Plat' | 'Dessert' | 'Cocktail' | 'Soupe' | 'Autre';
  ownerId?: string;
  forkedFromId?: string;
  createdAt?: Date;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
  isFavorite?: boolean;
  isHidden?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  servings?: number;
}
