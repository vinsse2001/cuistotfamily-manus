import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { AuthService } from '../../../core/services/auth';
import { AiService } from '../../../core/services/ai';
import { Recipe } from '../../../core/models/recipe';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  private aiService = inject(AiService);

  recipe?: Recipe;
  servings = 4;
  baseServings = 4;
  isOwner = false;
  isFavorite = false;
  userRating = 0;
  isAnalyzing = false;

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

  onAnalyze() {
    if (this.recipe?.id) {
      this.isAnalyzing = true;
      this.aiService.analyzeRecipe(this.recipe.id).subscribe({
        next: (analysis) => {
          if (this.recipe) {
            this.recipe.nutritionalInfo = analysis;
          }
          this.isAnalyzing = false;
        },
        error: () => {
          alert('Erreur lors de l\'analyse nutritionnelle');
          this.isAnalyzing = false;
        }
      });
    }
  }

  onPrint() {
    const data = document.getElementById('recipe-content');
    if (data) {
      html2canvas(data).then(canvas => {
        const imgWidth = 208;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        const contentDataURL = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(`${this.recipe?.title || 'recette'}.pdf`);
      });
    }
  }
}
