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
  activeFilter: 'all' | 'mine' | 'favorites' | 'private' | 'friends' | 'public' = 'all';
  activeCategory: string = 'all';
  categories = ['Entree', 'Plat', 'Dessert', 'Cocktail', 'Soupe', 'Autre'];

  ngOnInit() {
    this.loadRecipes();
  }

  getCurrentUserId(): string | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.id || null;
    } catch (e) {
      return null;
    }
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

  toggleFilter(filter: 'all' | 'mine' | 'favorites' | 'private' | 'friends' | 'public') {
    this.activeFilter = filter;
    this.filterRecipes();
  }

  toggleCategory(category: string) {
    this.activeCategory = this.activeCategory === category ? 'all' : category;
    this.filterRecipes();
  }

  filterRecipes() {
    let filtered = [...this.recipes];
    const currentUserId = this.getCurrentUserId();

    if (this.activeFilter === 'mine') {
      filtered = filtered.filter(r => !!currentUserId && (r.ownerId === currentUserId || (r as any).userId === currentUserId));
    } else if (this.activeFilter === 'favorites') {
      filtered = filtered.filter(r => r.isFavorite === true);
    } else if (this.activeFilter === 'private') {
      filtered = filtered.filter(r => r.visibility === 'private');
    } else if (this.activeFilter === 'friends') {
      filtered = filtered.filter(r => r.visibility === 'friends');
    } else if (this.activeFilter === 'public') {
      filtered = filtered.filter(r => r.visibility === 'public');
    }

    // Filtre par categorie
    if (this.activeCategory !== 'all') {
      filtered = filtered.filter(r => r.category === this.activeCategory);
    }

    if (!this.searchQuery.trim()) {
      this.filteredRecipes = filtered;
    } else {
      const query = this.searchQuery.toLowerCase().trim();
      this.filteredRecipes = filtered.filter(r => {
        const titleMatch = r.title.toLowerCase().includes(query);
        const descMatch = r.description && r.description.toLowerCase().includes(query);
        const ingredientsMatch = r.ingredients && r.ingredients.some(i => i.name.toLowerCase().includes(query));
        return titleMatch || descMatch || ingredientsMatch;
      });
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
