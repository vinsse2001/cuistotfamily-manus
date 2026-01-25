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
    this.recipesService.getOne(id).subscribe({
      next: (data: Recipe) => {
        this.recipe = data;
        this.servings = 4;
        this.baseServings = 4;
        const userId = localStorage.getItem('userId');
        this.isOwner = userId === data.ownerId;
        this.userRating = data.userRating || 0;
        this.isFavorite = data.isFavorite || false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.notificationService.show('Erreur lors du chargement de la recette', 'error');
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
      next: (res: any) => {
        // Utiliser la réponse du serveur pour être sûr de l'état
        this.isFavorite = res.isFavorite;
        this.notificationService.show(this.isFavorite ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success');
        this.cdr.detectChanges();
      }
    });
  }

  onRate(score: number) {
    if (!this.recipe?.id) return;
    this.recipesService.rate(this.recipe.id, score).subscribe({
      next: (res: any) => {
        this.userRating = score;
        if (this.recipe) {
          this.recipe.averageRating = res.averageRating;
          this.recipe.ratingCount = res.ratingCount;
        }
        this.notificationService.show('Merci pour votre note !', 'success');
        this.cdr.detectChanges();
      }
    });
  }

  onAdapt() {
    if (!this.recipe?.id) return;
    // Si propriétaire, on édite directement l'originale
    if (this.isOwner) {
      this.router.navigate(['/recipes', this.recipe.id, 'edit']);
    } else {
      // Sinon on crée un fork
      this.recipesService.fork(this.recipe.id).subscribe({
        next: (newRecipe: Recipe) => {
          this.notificationService.show('Recette adaptée à votre carnet !', 'success');
          this.router.navigate(['/recipes', newRecipe.id, 'edit']);
        }
      });
    }
  }

  onDelete() {
    if (!this.recipe?.id || !confirm('Voulez-vous vraiment supprimer cette recette ?')) return;
    this.recipesService.delete(this.recipe.id).subscribe({
      next: () => {
        this.notificationService.show('Recette supprimée', 'success');
        this.router.navigate(['/recipes']);
      }
    });
  }

  onAnalyze() {
    if (!this.recipe) return;
    this.isAnalyzing = true;
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
      this.notificationService.show('Analyse nutritionnelle terminée', 'success');
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
    const hasPhoto = !!this.recipe.photoUrl;

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
    const colWidth = hasPhoto ? (contentWidth / 2) - 5 : contentWidth;

    // Ingrédients
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

    // Image (si présente et à droite)
    let maxImageHeight = 0;
    if (hasPhoto && this.recipe.photoUrl) {
      try {
        const imgUrl = this.getFullUrl(this.recipe.photoUrl);
        const img = await this.loadImage(imgUrl);
        const imgWidth = colWidth;
        const imgHeight = (img.height * imgWidth) / img.width;
        const limitedImgHeight = Math.min(imgHeight, 60);
        doc.addImage(img, 'WEBP', margin + colWidth + 10, startY, imgWidth, limitedImgHeight);
        maxImageHeight = limitedImgHeight;
      } catch (e) {
        console.error('Erreur chargement image PDF', e);
      }
    }

    // Étapes
    y = Math.max(ingredientsEndY, startY + maxImageHeight) + 10;
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
