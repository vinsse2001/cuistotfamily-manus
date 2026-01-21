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
  recipe: Recipe = {
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: 1, unit: '' }],
    instructions: [''],
    visibility: 'private',
    photoUrl: ''
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.loadRecipe(id);
    }
  }

  loadRecipe(id: string) {
    this.recipesService.getOne(id).subscribe({
      next: (data) => {
        this.recipe = data;
      },
      error: (err) => {
        this.notificationService.show('Erreur lors du chargement de la recette', 'error');
        this.router.navigate(['/recipes']);
      }
    });
  }

  addIngredient() {
    this.recipe.ingredients.push({ name: '', quantity: 1, unit: '' });
  }

  removeIngredient(index: number) {
    if (this.recipe.ingredients.length > 1) {
      this.recipe.ingredients.splice(index, 1);
    }
  }

  addInstruction() {
    this.recipe.instructions.push('');
  }

  removeInstruction(index: number) {
    if (this.recipe.instructions.length > 1) {
      this.recipe.instructions.splice(index, 1);
    }
  }

  validateForm(): { valid: boolean, message: string } {
    if (!this.recipe.title || this.recipe.title.trim().length === 0) {
      return { valid: false, message: 'Le titre de la recette est obligatoire.' };
    }
    
    const validIngredients = this.recipe.ingredients.filter(i => i.name && i.name.trim() !== '');
    if (validIngredients.length === 0) {
      return { valid: false, message: 'Veuillez ajouter au moins un ingrédient avec un nom.' };
    }
    
    const validSteps = this.recipe.instructions.filter(s => s && s.trim() !== '');
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

    const cleanedRecipe = {
      ...this.recipe,
      ingredients: this.recipe.ingredients.filter(i => i.name && i.name.trim() !== ''),
      instructions: this.recipe.instructions.filter(s => s && s.trim() !== '')
    };

    if (this.isEdit && this.recipe.id) {
      this.recipesService.update(this.recipe.id, cleanedRecipe).subscribe({
        next: () => {
          this.notificationService.show('Recette modifiée avec succès !', 'success');
          this.router.navigate(['/recipes', this.recipe.id]);
        },
        error: (err) => this.notificationService.show('Erreur lors de la modification', 'error')
      });
    } else {
      this.recipesService.create(cleanedRecipe).subscribe({
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
