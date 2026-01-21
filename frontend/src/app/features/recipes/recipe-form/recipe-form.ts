import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { NotificationService } from '../../../core/services/notification';
import { Recipe } from '../../../core/models/recipe';

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

  isEdit = false;
  
  // Utilisation d'objets pour les instructions pour stabiliser le focus Angular
  recipeData = {
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: 1, unit: '' }],
    instructions: [{ text: '' }],
    visibility: 'private' as 'private' | 'friends' | 'public',
    photoUrl: ''
  };

  recipeId?: string;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.recipeId = id;
      this.loadRecipe(id);
    }
  }

  loadRecipe(id: string) {
    this.recipesService.getOne(id).subscribe({
      next: (data) => {
        this.recipeData = {
          title: data.title,
          description: data.description || '',
          ingredients: data.ingredients.length > 0 ? [...data.ingredients] : [{ name: '', quantity: 1, unit: '' }],
          instructions: data.instructions.map(text => ({ text })),
          visibility: data.visibility,
          photoUrl: data.photoUrl || ''
        };
      },
      error: (err) => {
        this.notificationService.show('Erreur lors du chargement de la recette', 'error');
        this.router.navigate(['/recipes']);
      }
    });
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

  validateForm(): { valid: boolean, message: string } {
    if (!this.recipeData.title || this.recipeData.title.trim().length === 0) {
      return { valid: false, message: 'Le titre de la recette est obligatoire.' };
    }
    
    const validIngredients = this.recipeData.ingredients.filter(i => i.name && i.name.trim() !== '');
    if (validIngredients.length === 0) {
      return { valid: false, message: 'Veuillez ajouter au moins un ingrédient avec un nom.' };
    }
    
    const validSteps = this.recipeData.instructions.filter(s => s.text && s.text.trim() !== '');
    if (validSteps.length === 0) {
      return { valid: false, message: 'Veuillez ajouter au moins une étape de préparation.' };
    }
    
    return { valid: true, message: '' };
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const validation = this.validateForm();
    
    if (!validation.valid) {
      this.notificationService.show(validation.message, 'error');
      return;
    }

    const finalRecipe: Recipe = {
      title: this.recipeData.title,
      description: this.recipeData.description,
      ingredients: this.recipeData.ingredients.filter(i => i.name && i.name.trim() !== ''),
      instructions: this.recipeData.instructions.filter(s => s.text && s.text.trim() !== '').map(s => s.text),
      visibility: this.recipeData.visibility,
      photoUrl: this.recipeData.photoUrl
    };

    if (this.isEdit && this.recipeId) {
      this.recipesService.update(this.recipeId, finalRecipe).subscribe({
        next: () => {
          this.notificationService.show('Recette modifiée avec succès !', 'success');
          this.router.navigate(['/recipes', this.recipeId]);
        },
        error: (err) => this.notificationService.show('Erreur lors de la modification', 'error')
      });
    } else {
      this.recipesService.create(finalRecipe).subscribe({
        next: (newRecipe) => {
          this.notificationService.show('Recette créée avec succès !', 'success');
          this.router.navigate(['/recipes', newRecipe.id]);
        },
        error: (err) => this.notificationService.show('Erreur lors de la création', 'error')
      });
    }
  }

  onCancel() {
    this.router.navigate(['/recipes']);
  }
}
