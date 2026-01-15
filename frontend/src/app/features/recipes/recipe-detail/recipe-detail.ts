import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { AuthService } from '../../../core/services/auth';
import { Recipe } from '../../../core/models/recipe';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipesService = inject(RecipesService);
  private authService = inject(AuthService);

  recipe?: Recipe;
  servings = 4;
  baseServings = 4;
  isOwner = false;
  isFavorite = false;
  userRating = 0;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRecipe(id);
    }
  }

  loadRecipe(id: string) {
    this.recipesService.getOne(id).subscribe({
      next: (data) => {
        this.recipe = data;
        this.checkOwnership();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de la recette', err);
      }
    });
  }

  checkOwnership() {
    this.authService.currentUser$.subscribe(user => {
      if (user && this.recipe) {
        this.isOwner = user.id === this.recipe.ownerId;
      }
    });
  }

  updateServings(delta: number) {
    this.servings = Math.max(1, this.servings + delta);
  }

  onFork() {
    if (this.recipe?.id) {
      this.recipesService.fork(this.recipe.id).subscribe({
        next: (newRecipe) => {
          alert('Recette forkée avec succès !');
          this.router.navigate(['/recipes', newRecipe.id]);
        },
        error: (err) => {
          alert('Erreur lors du fork de la recette');
        }
      });
    }
  }

  onToggleFavorite() {
    if (this.recipe?.id) {
      this.recipesService.toggleFavorite(this.recipe.id).subscribe({
        next: (res) => {
          this.isFavorite = res.isFavorite;
        }
      });
    }
  }

  onRate(score: number) {
    if (this.recipe?.id) {
      this.recipesService.rate(this.recipe.id, score).subscribe({
        next: () => {
          this.userRating = score;
        }
      });
    }
  }
}
