import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecipesService } from '../../../core/services/recipes';
import { Recipe } from '../../../core/models/recipe';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './recipe-list.html'
})
export class RecipeListComponent implements OnInit {
  private recipesService = inject(RecipesService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  allRecipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  paginatedRecipes: Recipe[] = [];
  isLoading = true;
  viewMode: 'grid' | 'table' = 'grid';

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  // Filtres
  searchTerm = '';
  selectedCategory = 'Toutes';
  selectedVisibility = 'Toutes';
  sortBy = 'newest';
  
  // Nouveaux filtres régimes
  filterVegetarian = false;
  filterVegan = false;
  filterGlutenFree = false;

  ngOnInit() {
    this.loadSavedFilters();
    this.loadRecipes();
  }

  private loadSavedFilters(): void {
    const saved = localStorage.getItem('recipe_filters');
    if (saved) {
      try {
        const filters = JSON.parse(saved);
        this.viewMode = filters.viewMode || 'grid';
        this.selectedCategory = filters.selectedCategory || 'Toutes';
        this.selectedVisibility = filters.selectedVisibility || 'Toutes';
        this.sortBy = filters.sortBy || 'newest';
        this.filterVegetarian = !!filters.filterVegetarian;
        this.filterVegan = !!filters.filterVegan;
        this.filterGlutenFree = !!filters.filterGlutenFree;
      } catch (e) {
        console.error('Erreur lors du chargement des filtres sauvegardés', e);
      }
    }
  }

  private saveFilters(): void {
    const filters = {
      viewMode: this.viewMode,
      selectedCategory: this.selectedCategory,
      selectedVisibility: this.selectedVisibility,
      sortBy: this.sortBy,
      filterVegetarian: this.filterVegetarian,
      filterVegan: this.filterVegan,
      filterGlutenFree: this.filterGlutenFree
    };
    localStorage.setItem('recipe_filters', JSON.stringify(filters));
  }

  loadRecipes() {
    this.isLoading = true;
    this.recipesService.getAll().subscribe({
      next: (data) => {
        this.allRecipes = data;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur chargement recettes:', err);
        this.notificationService.show('Erreur lors du chargement des recettes', 'error');
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.saveFilters();
    let result = [...this.allRecipes];

    // 1. Filtre de visibilité / favoris / masqués
    if (this.selectedVisibility === 'favorites') {
      result = result.filter(r => r.isFavorite && !r.isHidden);
    } else if (this.selectedVisibility === 'hidden') {
      result = result.filter(r => r.isHidden);
    } else if (this.selectedVisibility === 'private') {
      result = result.filter(r => r.visibility === 'private' && !r.isHidden);
    } else if (this.selectedVisibility === 'friends') {
      result = result.filter(r => r.visibility === 'friends' && !r.isHidden);
    } else if (this.selectedVisibility === 'public') {
      result = result.filter(r => r.visibility === 'public' && !r.isHidden);
    } else {
      // "Toutes" -> On cache les masquées par défaut
      result = result.filter(r => !r.isHidden);
    }

    // 2. Filtre de recherche
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(search) || 
        r.description?.toLowerCase().includes(search) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(search))
      );
    }

    // 3. Filtre de catégorie
    if (this.selectedCategory !== 'Toutes') {
      result = result.filter(r => r.category === this.selectedCategory);
    }

    // 4. Filtres régimes alimentaires
    if (this.filterVegetarian) {
      result = result.filter(r => r.isVegetarian);
    }
    if (this.filterVegan) {
      result = result.filter(r => r.isVegan);
    }
    if (this.filterGlutenFree) {
      result = result.filter(r => r.isGlutenFree);
    }

    // 5. Tri
    result.sort((a, b) => {
      if (this.sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (this.sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (this.sortBy === 'rating') {
        return (b.averageRating || 0) - (a.averageRating || 0);
      }
      if (this.sortBy === 'userRating') {
        return (b.userRating || 0) - (a.userRating || 0);
      }
      if (this.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    this.filteredRecipes = result;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredRecipes.length / this.pageSize);
    if (this.currentPage > this.totalPages) this.currentPage = Math.max(1, this.totalPages);
    
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedRecipes = this.filteredRecipes.slice(start, end);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedCategory = 'Toutes';
    this.selectedVisibility = 'Toutes';
    this.sortBy = 'newest';
    this.filterVegetarian = false;
    this.filterVegan = false;
    this.filterGlutenFree = false;
    this.applyFilters();
  }

  toggleHide(event: Event, recipe: Recipe) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!recipe.id) return;

    this.recipesService.toggleHide(recipe.id).subscribe({
      next: (res) => {
        // Mettre à jour l'état dans la liste source
        const recipeInAll = this.allRecipes.find(r => r.id === recipe.id);
        if (recipeInAll) {
          recipeInAll.isHidden = res.isHidden;
        }
        
        this.notificationService.show(
          res.isHidden ? 'Recette masquée' : 'Recette affichée',
          'success'
        );
        this.applyFilters();
      },
      error: () => {
        this.notificationService.show('Erreur lors de l\'action', 'error');
      }
    });
  }

  getFullUrl(path: string): string {
    if (!path) return '/no_picture.jpg';
    if (path.startsWith('http')) return path;
    return `http://localhost:3000${path.startsWith('/') ? '' : '/'}${path}`;
  }
}
