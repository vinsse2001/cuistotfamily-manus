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
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.css'
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
    ingredients: [{ name: '', quantity: 0, unit: '' }],
    instructions: [''],
    visibility: 'private'
  };

  units = [
    { value: '', label: 'Choisir une unité', disabled: true },
    { value: 'g', label: 'Grammes (g)' },
    { value: 'kg', label: 'Kilogrammes (kg)' },
    { value: 'ml', label: 'Millilitres (ml)' },
    { value: 'cl', label: 'Centilitres (cl)' },
    { value: 'l', label: 'Litres (l)' },
    { value: 'unite', label: 'Unité(s)' },
    { value: 'cuillere_soupe', label: 'Cuillère à soupe' },
    { value: 'cuillere_cafe', label: 'Cuillère à café' },
    { value: 'pincee', label: 'Pincée' },
    { value: 'autre', label: 'Autre' }
  ];

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
      }
    });
  }

  addIngredient() {
    this.recipe.ingredients.push({ name: '', quantity: 0, unit: '' });
    
    const index = this.recipe.ingredients.length - 1;
    setTimeout(() => {
      const element = document.getElementById(`ing-input-${index}`);
      if (element) element.focus();
    }, 0);
  }

  removeIngredient(index: number) {
    this.recipe.ingredients.splice(index, 1);
  }

  addInstruction() {
    this.recipe.instructions.push('');
    
    const index = this.recipe.instructions.length - 1;
    setTimeout(() => {
      const element = document.getElementById(`step-input-${index}`);
      if (element) element.focus();
    }, 0);
  }

  removeInstruction(index: number) {
    this.recipe.instructions.splice(index, 1);
  }

  isFormValid(): boolean {
    const hasTitle = !!this.recipe.title && this.recipe.title.trim().length > 0;
    const hasIngredients = this.recipe.ingredients.length > 0 && 
      this.recipe.ingredients.every(i => i.name.trim() !== '' && i.quantity > 0 && i.unit !== '');
    const hasSteps = this.recipe.instructions.length > 0 && 
      this.recipe.instructions.every(s => s.trim() !== '');
    
    return !!hasTitle && !!hasIngredients && !!hasSteps;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.isFormValid()) {
      this.notificationService.show('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    if (this.isEdit && this.recipe.id) {
      this.recipesService.update(this.recipe.id, this.recipe).subscribe({
        next: () => {
          this.notificationService.show('Recette modifiée avec succès !', 'success');
          this.router.navigate(['/recipes', this.recipe.id]);
        },
        error: (err) => this.notificationService.show('Erreur lors de la modification', 'error')
      });
    } else {
      this.recipesService.create(this.recipe).subscribe({
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
