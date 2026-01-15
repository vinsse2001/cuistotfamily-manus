import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { Recipe } from '../../../core/models/recipe';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeListComponent implements OnInit {
  private recipesService = inject(RecipesService);
  recipes: Recipe[] = [];

  ngOnInit() {
    this.loadRecipes();
  }

  loadRecipes() {
    this.recipesService.getAll().subscribe({
      next: (data) => {
        this.recipes = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des recettes', err);
      }
    });
  }
}
