import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { Recipe } from '../../../core/models/recipe';

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.css'
})
export class RecipeFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipesService = inject(RecipesService);

  isEdit = false;
  recipe: Recipe = {
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: 0, unit: '' }],
    instructions: [''],
    visibility: 'private'
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
        console.error('Erreur lors du chargement de la recette', err);
      }
    });
  }

  addIngredient() {
    this.recipe.ingredients.push({ name: '', quantity: 0, unit: '' });
    
    // Focus sur le nouveau champ
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
    
    // Focus sur le nouveau champ
    const index = this.recipe.instructions.length - 1;
    setTimeout(() => {
      const element = document.getElementById(`step-input-${index}`);
      if (element) element.focus();
    }, 0);
  }

  removeInstruction(index: number) {
    this.recipe.instructions.splice(index, 1);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.isEdit && this.recipe.id) {
      this.recipesService.update(this.recipe.id, this.recipe).subscribe({
        next: () => this.router.navigate(['/recipes', this.recipe.id]),
        error: (err) => alert('Erreur lors de la modification')
      });
    } else {
      this.recipesService.create(this.recipe).subscribe({
        next: (newRecipe) => this.router.navigate(['/recipes', newRecipe.id]),
        error: (err) => alert('Erreur lors de la création')
      });
    }
  }

  onCancel() {
    this.router.navigate(['/recipes']);
  }
}
