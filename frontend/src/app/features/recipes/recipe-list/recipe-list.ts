import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  recipes: Recipe[] = [];
  filteredRecipes: Recipe[] = [];
  searchQuery: string = '';
  activeFilter: 'all' | 'mine' | 'favorites' | 'private' | 'friends' | 'public' = 'all';
  activeCategory: string = 'all';
  categories = ['Entrée', 'Plat', 'Dessert', 'Cocktail', 'Soupe', 'Autre'];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 20;
  itemsPerPageOptions = [10, 20, 50];
  displayMode: 'grid' | 'list' = 'grid';
  paginatedRecipes: Recipe[] = [];
  
  // Tri
  sortBy: 'title' | 'date' | 'rating' = 'title';
  sidebarOpen: boolean = true;

  constructor(
    private recipesService: RecipesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDisplayMode();
    this.loadItemsPerPage();
    this.loadSidebarState();
    this.loadRecipes();
  }

  loadDisplayMode() {
    const saved = localStorage.getItem('recipeDisplayMode');
    if (saved === 'list' || saved === 'grid') {
      this.displayMode = saved;
    }
  }

  loadItemsPerPage() {
    const saved = localStorage.getItem('recipeItemsPerPage');
    if (saved && [10, 20, 50].includes(parseInt(saved))) {
      this.itemsPerPage = parseInt(saved);
    }
  }

  loadSidebarState() {
    const saved = localStorage.getItem('recipeSidebarOpen');
    if (saved !== null) {
      this.sidebarOpen = saved === 'true';
    }
  }

  setDisplayMode(mode: 'grid' | 'list') {
    this.displayMode = mode;
    localStorage.setItem('recipeDisplayMode', mode);
    this.currentPage = 1;
    this.updatePagination();
  }

  setItemsPerPage(count: number) {
    this.itemsPerPage = count;
    localStorage.setItem('recipeItemsPerPage', count.toString());
    this.currentPage = 1;
    this.updatePagination();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecipes.length / this.itemsPerPage);
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedRecipes = this.filteredRecipes.slice(start, end);
    this.cdr.detectChanges();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
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
    
    // Appliquer le tri sélectionné
    this.filteredRecipes = this.sortRecipes(this.filteredRecipes);
    this.currentPage = 1;
    this.updatePagination();
  }

  sortRecipes(recipes: Recipe[]): Recipe[] {
    const sorted = [...recipes];
    switch (this.sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'rating':
        sorted.sort((a, b) => {
          const avgA = this.getAverageRating(a);
          const avgB = this.getAverageRating(b);
          return avgB - avgA;
        });
        break;
      case 'title':
      default:
        sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }

  getAverageRating(recipe: Recipe): number {
    if (recipe.averageRating) return recipe.averageRating;
    return 0;
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    localStorage.setItem('recipeSidebarOpen', this.sidebarOpen.toString());
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
