import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipesService } from '../../../core/services/recipes';
import { Recipe } from '../../../core/models/recipe';
import { NotificationService } from '../../../core/services/notification';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-detail.html'
})
export class RecipeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recipesService = inject(RecipesService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  recipe: Recipe | null = null;
  servings: number = 4;
  baseServings: number = 4;
  isFavorite: boolean = false;
  userRating: number = 0;
  isOwner: boolean = false;
  isAnalyzing: boolean = false;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRecipe(id);
    }
  }

  loadRecipe(id: string) {
    this.recipesService.getById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        this.servings = data.servings || 4;
        this.baseServings = data.servings || 4;
        this.isOwner = this.recipesService.isOwner(data);
        // Simulation des favoris et notes pour l'instant
        this.isFavorite = false; 
        this.userRating = 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notificationService.error('Erreur lors du chargement de la recette');
        this.router.navigate(['/recipes']);
      }
    });
  }

  updateServings(delta: number) {
    if (this.servings + delta > 0) {
      this.servings += delta;
    }
  }

  onToggleFavorite() {
    if (!this.recipe?.id) return;
    this.recipesService.toggleFavorite(this.recipe.id).subscribe({
      next: () => {
        this.isFavorite = !this.isFavorite;
        this.notificationService.success(this.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris');
      }
    });
  }

  onRate(score: number) {
    if (!this.recipe?.id) return;
    this.recipesService.rate(this.recipe.id, score).subscribe({
      next: (res) => {
        this.userRating = score;
        if (this.recipe) {
          this.recipe.averageRating = res.averageRating;
          this.recipe.ratingCount = res.ratingCount;
        }
        this.notificationService.success('Merci pour votre note !');
        this.cdr.detectChanges();
      }
    });
  }

  onAdapt() {
    if (!this.recipe?.id) return;
    if (this.isOwner) {
      this.router.navigate(['/recipes', this.recipe.id, 'edit']);
    } else {
      this.recipesService.fork(this.recipe.id).subscribe({
        next: (newRecipe) => {
          this.notificationService.success('Recette adaptée à votre carnet !');
          this.router.navigate(['/recipes', newRecipe.id, 'edit']);
        }
      });
    }
  }

  onDelete() {
    if (!this.recipe?.id || !confirm('Voulez-vous vraiment supprimer cette recette ?')) return;
    this.recipesService.delete(this.recipe.id).subscribe({
      next: () => {
        this.notificationService.success('Recette supprimée');
        this.router.navigate(['/recipes']);
      }
    });
  }

  onAnalyze() {
    if (!this.recipe) return;
    this.isAnalyzing = true;
    // Simulation d'analyse nutritionnelle
    setTimeout(() => {
      if (this.recipe) {
        this.recipe.nutritionalInfo = {
          calories: Math.floor(Math.random() * 500) + 200,
          proteins: Math.floor(Math.random() * 20) + 5,
          carbs: Math.floor(Math.random() * 50) + 10,
          fat: Math.floor(Math.random() * 30) + 5
        };
      }
      this.isAnalyzing = false;
      this.notificationService.success('Analyse nutritionnelle terminée');
      this.cdr.detectChanges();
    }, 1500);
  }

  getFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url}`;
  }

  async onPrint() {
    if (!this.recipe) return;

    const doc = new jsPDF();
    const saumonColor = [255, 120, 100]; // #FF7864
    const natureColor = [45, 55, 72]; // #2D3748
    
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Titre centré
    doc.setTextColor(saumonColor[0], saumonColor[1], saumonColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(this.recipe.title, contentWidth);
    doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += (titleLines.length * 10) + 5;

    // Description en italique
    if (this.recipe.description) {
      doc.setTextColor(natureColor[0], natureColor[1], natureColor[2]);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      const descLines = doc.splitTextToSize(this.recipe.description, contentWidth - 20);
      doc.text(descLines, pageWidth / 2, y, { align: 'center' });
      y += (descLines.length * 5) + 10;
    }

    const startY = y;
    const colWidth = (contentWidth / 2) - 5;

    // Colonne de gauche : Ingrédients
    doc.setTextColor(saumonColor[0], saumonColor[1], saumonColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Ingrédients', margin, y);
    y += 8;

    doc.setTextColor(natureColor[0], natureColor[1], natureColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    this.recipe.ingredients.forEach(ing => {
      const qty = (ing.quantity * this.servings / this.baseServings).toFixed(1).replace('.0', '');
      const text = `• ${ing.name} : ${qty} ${ing.unit}`;
      const lines = doc.splitTextToSize(text, colWidth);
      doc.text(lines, margin, y);
      y += (lines.length * 5);
    });

    const ingredientsEndY = y;

    // Colonne de droite : Image (si présente)
    if (this.recipe.photoUrl) {
      try {
        const imgUrl = this.getFullUrl(this.recipe.photoUrl);
        const img = await this.loadImage(imgUrl);
        const imgWidth = colWidth;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, 'WEBP', margin + colWidth + 10, startY, imgWidth, Math.min(imgHeight, 80));
      } catch (e) {
        console.error('Erreur chargement image PDF', e);
      }
    }

    // On se place après le bloc le plus long (ingrédients ou image)
    y = Math.max(ingredientsEndY, startY + 85) + 15;

    // Étapes en dessous
    doc.setTextColor(saumonColor[0], saumonColor[1], saumonColor[2]);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Préparation', margin, y);
    y += 10;

    doc.setTextColor(natureColor[0], natureColor[1], natureColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    (this.recipe.instructions || []).forEach((step, i) => {
      const stepText = `${i + 1}. ${step}`;
      const lines = doc.splitTextToSize(stepText, contentWidth);
      
      // Vérifier si on doit changer de page
      if (y + (lines.length * 5) > 280) {
        doc.addPage();
        y = 20;
      }
      
      doc.text(lines, margin, y);
      y += (lines.length * 5) + 3;
    });

    doc.save(`recette-${this.recipe.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }
}
