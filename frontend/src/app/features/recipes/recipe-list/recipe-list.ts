import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecipesService } from '../../../core/services/recipes';
import { Recipe } from '../../../core/models/recipe';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.css'
})
export class RecipeListComponent implements OnInit {
  private recipesService = inject(RecipesService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  searchQuery: string = '';

  ngOnInit() {
    this.loadRecipes();
  }

  loadRecipes() {
    this.recipesService.getAll().subscribe({
      next: (data) => {
        this.recipes = [...data];
        this.filterRecipes();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des recettes', err);
      }
    });
  }

  filterRecipes() {
    if (!this.searchQuery.trim()) {
      this.filteredRecipes = [...this.recipes];
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredRecipes = this.recipes.filter(r => 
        r.title.toLowerCase().includes(query) || 
        (r.description && r.description.toLowerCase().includes(query))
      );
    }
    this.cdr.detectChanges();
  }

  getFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  }

  goToDetail(id?: string) {
    if (id) {
      this.router.navigate(['/recipes', id]);
    }
  }
}
