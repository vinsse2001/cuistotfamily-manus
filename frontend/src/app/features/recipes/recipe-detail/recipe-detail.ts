import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { AuthService } from '../../../core/services/auth';
import { AiService } from '../../../core/services/ai';
import { NotificationService } from '../../../core/services/notification';
import { Recipe } from '../../../core/models/recipe';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.css'
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipesService = inject(RecipesService);
  private authService = inject(AuthService);
  private aiService = inject(AiService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  recipe?: Recipe;
  servings = 4;
  baseServings = 4;
  isOwner = false;
  isFavorite = false;
  userRating = 0;
  isAnalyzing = false;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadRecipe(id);
      }
    });
  }

  loadRecipe(id: string) {
    this.recipesService.getOne(id).subscribe({
      next: (data) => {
        this.recipe = data;
        this.checkOwnership();
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      }
    });
  }

  updateServings(delta: number) {
    this.servings = Math.max(1, this.servings + delta);
  }

  onAdapt() {
    if (this.recipe?.id) {
      if (this.isOwner) {
        this.router.navigate(['/recipes', this.recipe.id, 'edit']);
      } else {
        this.recipesService.fork(this.recipe.id).subscribe({
          next: (newRecipe) => {
            this.notificationService.show('Recette adaptée avec succès !', 'success');
            this.router.navigate(['/recipes', newRecipe.id, 'edit']);
          },
          error: (err) => {
            this.notificationService.show('Erreur lors de l\'adaptation de la recette', 'error');
          }
        });
      }
    }
  }

  onDelete() {
    if (this.recipe?.id && confirm('Êtes-vous sûr de vouloir supprimer cette recette ?')) {
      this.recipesService.delete(this.recipe.id).subscribe({
        next: () => {
          this.notificationService.show('Recette supprimée avec succès', 'success');
          this.router.navigate(['/recipes']);
        },
        error: (err) => {
          this.notificationService.show('Erreur lors de la suppression de la recette', 'error');
        }
      });
    }
  }

  onToggleFavorite() {
    if (this.recipe?.id) {
      this.recipesService.toggleFavorite(this.recipe.id).subscribe({
        next: (res) => {
          this.isFavorite = res.isFavorite;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onRate(score: number) {
    if (this.recipe?.id) {
      this.recipesService.rate(this.recipe.id, score).subscribe({
        next: (res) => {
          this.userRating = score;
          if (this.recipe) {
            this.recipe.averageRating = res.averageRating;
            this.recipe.ratingCount = res.ratingCount;
          }
          this.cdr.detectChanges();
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
          this.cdr.detectChanges();
        },
        error: () => {
          this.notificationService.show('Erreur lors de l\'analyse nutritionnelle', 'error');
          this.isAnalyzing = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onPrint() {
    if (!this.recipe) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = margin;

    // 1. Titre centré
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(190, 75, 50); // Couleur saumon
    const titleLines = doc.splitTextToSize(this.recipe.title, contentWidth);
    doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
    currentY += (titleLines.length * 10) + 5;

    // 2. Description en italique
    if (this.recipe.description) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      const descLines = doc.splitTextToSize(this.recipe.description, contentWidth - 20);
      doc.text(descLines, pageWidth / 2, currentY, { align: 'center' });
      currentY += (descLines.length * 6) + 10;
    }

    // 3. Ligne de séparation
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // 4. Deux colonnes : Ingrédients et Image (si dispo)
    const colWidth = contentWidth / 2 - 5;
    const startYSection = currentY;

    // Colonne gauche : Ingrédients
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(50, 50, 50);
    doc.text('Ingrédients', margin, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    this.recipe.ingredients.forEach(ing => {
      const qty = ing.quantity ? (ing.quantity * this.servings / this.baseServings).toString() : '';
      const unit = ing.unit || '';
      const text = `• ${ing.name} ${qty ? '(' + qty + ' ' + unit + ')' : ''}`;
      const lines = doc.splitTextToSize(text, colWidth);
      doc.text(lines, margin + 2, currentY);
      currentY += (lines.length * 5);
    });

    // Colonne droite : Image (Placeholder ou texte si pas d'image)
    let rightColY = startYSection;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Détails', margin + colWidth + 10, rightColY);
    rightColY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Pour ${this.servings} personnes`, margin + colWidth + 10, rightColY);
    rightColY += 6;
    if (this.recipe.averageRating) {
      doc.text(`Note moyenne : ${this.recipe.averageRating}/5`, margin + colWidth + 10, rightColY);
      rightColY += 6;
    }

    // Ajuster currentY au max des deux colonnes
    currentY = Math.max(currentY, rightColY) + 10;

    // 5. Étapes sur une colonne
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Préparation', margin, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Algorithme d'ajustement de la taille de police si trop long
    const totalStepsText = (this.recipe.instructions || []).join('\n');
    const estimatedLines = doc.splitTextToSize(totalStepsText, contentWidth).length;
    if (estimatedLines > 25) {
      doc.setFontSize(9);
    }
    if (estimatedLines > 35) {
      doc.setFontSize(8);
    }

    (this.recipe.instructions || []).forEach((step, index) => {
      const stepText = `${index + 1}. ${step}`;
      const lines = doc.splitTextToSize(stepText, contentWidth);
      
      // Vérifier si on doit changer de page
      if (currentY + (lines.length * 5) > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
      
      doc.text(lines, margin, currentY);
      currentY += (lines.length * 5) + 3;
    });

    // Pied de page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Généré par Cuistot Family', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`${this.recipe.title.replace(/\s+/g, '_')}.pdf`);
  }
}
