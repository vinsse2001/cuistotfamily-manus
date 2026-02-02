import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { NotificationService } from '../../../core/services/notification';
import { Recipe } from '../../../core/models/recipe';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-form.html'
})
export class RecipeFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipesService = inject(RecipesService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  isEdit = false;
  isUploading = false;
  
  recipeData = {
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: 1, unit: '' }],
    instructions: [{ text: '' }],
    visibility: 'private' as 'private' | 'friends' | 'public',
    category: 'Autre' as 'Entrée' | 'Plat' | 'Dessert' | 'Cocktail' | 'Soupe' | 'Autre',
    photoUrl: '',
    servings: 4,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false
  };

  recipeId?: string;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.recipeId = id;
        this.loadRecipe(id);
      } else {
        this.isEdit = false;
        this.recipeId = undefined;
        this.resetForm();
      }
    });
  }

  resetForm() {
    this.recipeData = {
      title: '',
      description: '',
      ingredients: [{ name: '', quantity: 1, unit: '' }],
      instructions: [{ text: '' }],
      visibility: 'private',
      category: 'Autre',
      photoUrl: '',
      servings: 4,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false
    };
  }

  loadRecipe(id: string) {
    this.recipesService.getOne(id).subscribe({
      next: (data) => {
        let mappedInstructions = [{ text: '' }];
        if (data.instructions && Array.isArray(data.instructions) && data.instructions.length > 0) {
          mappedInstructions = data.instructions.map(text => ({ text: String(text) }));
        }

        this.recipeData = {
          title: data.title || '',
          description: data.description || '',
          ingredients: (data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0) 
            ? data.ingredients.map(i => ({ ...i })) 
            : [{ name: '', quantity: 1, unit: '' }],
          instructions: mappedInstructions,
          visibility: data.visibility || 'private',
          category: data.category || 'Autre',
          photoUrl: data.photoUrl || '',
          servings: data.servings || 4,
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          isGlutenFree: data.isGlutenFree || false
        };
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.show('Erreur lors du chargement de la recette', 'error');
        this.router.navigate(['/recipes']);
      }
    });
  }

  getFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

      this.http.post<any>('http://localhost:3000/recipes/upload', formData, { headers }).subscribe({
        next: (res) => {
          this.recipeData.photoUrl = res.url;
          this.isUploading = false;
          this.notificationService.show('Image uploadée avec succès', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isUploading = false;
          console.error('Erreur upload:', err);
          this.notificationService.show('Erreur lors de l\'upload de l\'image', 'error');
        }
      });
    }
  }

  addIngredient() {
    this.recipeData.ingredients.push({ name: '', quantity: 1, unit: '' });
  }

  removeIngredient(index: number) {
    if (this.recipeData.ingredients.length > 1) {
      this.recipeData.ingredients.splice(index, 1);
    }
  }

  addInstruction() {
    this.recipeData.instructions.push({ text: '' });
  }

  removeInstruction(index: number) {
    if (this.recipeData.instructions.length > 1) {
      this.recipeData.instructions.splice(index, 1);
    }
  }

  onCancel() {
    if (this.isEdit && this.recipeId) {
      this.router.navigate(['/recipes', this.recipeId]);
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  private capitalize(s: string): string {
    if (!s) return '';
    const trimmed = s.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    
    // Nettoyage des données (Trim + Capitalize)
    const cleanTitle = this.capitalize(this.recipeData.title);
    const cleanDescription = this.capitalize(this.recipeData.description);
    
    const cleanIngredients = this.recipeData.ingredients
      .filter(i => i.name && i.name.trim() !== '')
      .map(i => ({
        name: this.capitalize(i.name),
        quantity: i.quantity,
        unit: i.unit.trim()
      }));

    const cleanInstructions = this.recipeData.instructions
      .filter(i => i.text && i.text.trim() !== '')
      .map(i => this.capitalize(i.text));

    if (!cleanTitle) {
      this.notificationService.show('Le titre de la recette est obligatoire.', 'error');
      return;
    }

    if (cleanIngredients.length === 0) {
      this.notificationService.show('Veuillez ajouter au moins un ingrédient avec un nom.', 'error');
      return;
    }

    if (cleanInstructions.length === 0) {
      this.notificationService.show('Veuillez ajouter au moins une étape de préparation.', 'error');
      return;
    }

    const finalRecipe: Recipe = {
      title: cleanTitle,
      description: cleanDescription,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      visibility: this.recipeData.visibility,
      category: this.recipeData.category,
      photoUrl: this.recipeData.photoUrl,
      servings: this.recipeData.servings,
      isVegetarian: this.recipeData.isVegetarian,
      isVegan: this.recipeData.isVegan,
      isGlutenFree: this.recipeData.isGlutenFree
    };

    if (this.isEdit && this.recipeId) {
      this.recipesService.update(this.recipeId, finalRecipe).subscribe({
        next: () => {
          this.notificationService.show('Recette mise à jour !', 'success');
          this.router.navigate(['/recipes', this.recipeId]);
          window.scrollTo(0, 0);
        },
        error: () => {
          this.notificationService.show('Erreur lors de la mise à jour', 'error');
        }
      });
    } else {
      this.recipesService.create(finalRecipe).subscribe({
        next: (res) => {
          this.notificationService.show('Recette créée !', 'success');
          this.router.navigate(['/recipes', res.id]);
          window.scrollTo(0, 0);
        },
        error: () => {
          this.notificationService.show('Erreur lors de la création', 'error');
        }
      });
    }
  }
}
