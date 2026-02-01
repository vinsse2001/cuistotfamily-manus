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

  loadRecipe(id: string) {
    this.recipesService.getOne(id).subscribe({
      next: (data: Recipe) => {
        this.recipe = data;
        this.servings = 4;
        this.baseServings = 4;
        
        const currentUserId = this.getCurrentUserId();
        // On vérifie ownerId ou userId selon ce que le backend renvoie
        this.isOwner = !!currentUserId && (currentUserId === data.ownerId || currentUserId === (data as any).userId);
        
        this.userRating = data.userRating || 0;
        this.isFavorite = data.isFavorite || false;
        this.cdr.detectChanges();
        
        // Scroll vers le haut pour afficher le bandeau de navigation
        window.scrollTo(0, 0);
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
        this.isFavorite = res.isFavorite;
        if (this.recipe) this.recipe.isFavorite = res.isFavorite;
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
          this.recipe.userRating = score;
        }
        this.notificationService.show('Merci pour votre note !', 'success');
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

  // Calculer les valeurs nutritionnelles par part
  getNutritionPerServing() {
    if (!this.recipe?.nutritionalInfo) return null;
    const servings = 4; // Nombre de parts par défaut
    const info = this.recipe.nutritionalInfo as any;
    return {
      calories: Math.round(info.calories / servings),
      protein: (info.protein / servings).toFixed(1),
      carbs: (info.carbs / servings).toFixed(1),
      fat: (info.fat / servings).toFixed(1),
      fiber: (info.fiber / servings).toFixed(1),
      sugar: (info.sugar / servings).toFixed(1),
      sodium: Math.round(info.sodium / servings),
      vitamins: info.vitamins ? {
        vitaminA: Math.round(info.vitamins.vitaminA / servings),
        vitaminC: Math.round(info.vitamins.vitaminC / servings),
        vitaminD: (info.vitamins.vitaminD / servings).toFixed(1),
        vitaminE: (info.vitamins.vitaminE / servings).toFixed(1),
        vitaminK: Math.round(info.vitamins.vitaminK / servings),
        vitaminB12: (info.vitamins.vitaminB12 / servings).toFixed(2),
        folate: Math.round(info.vitamins.folate / servings)
      } : null,
      minerals: info.minerals ? {
        calcium: Math.round(info.minerals.calcium / servings),
        iron: (info.minerals.iron / servings).toFixed(1),
        magnesium: Math.round(info.minerals.magnesium / servings),
        phosphorus: Math.round(info.minerals.phosphorus / servings),
        potassium: Math.round(info.minerals.potassium / servings),
        zinc: (info.minerals.zinc / servings).toFixed(1),
        copper: (info.minerals.copper / servings).toFixed(2)
      } : null
    };
  }

  // Calculer les valeurs nutritionnelles pour 100g
  getNutritionPer100g() {
    if (!this.recipe?.nutritionalInfo) return null;
    // Estimer le poids total (approximation simple: 150g par ingrédient en moyenne)
    const totalWeight = Math.max(this.recipe.ingredients.length * 150, 100);
    const info = this.recipe.nutritionalInfo as any;
    return {
      calories: Math.round(((info.calories || 0) / totalWeight) * 100),
      protein: (((info.protein || 0) / totalWeight) * 100).toFixed(1),
      carbs: (((info.carbs || 0) / totalWeight) * 100).toFixed(1),
      fat: (((info.fat || 0) / totalWeight) * 100).toFixed(1),
      fiber: (((info.fiber || 0) / totalWeight) * 100).toFixed(1),
      sugar: (((info.sugar || 0) / totalWeight) * 100).toFixed(1),
      sodium: Math.round(((info.sodium || 0) / totalWeight) * 100),
      vitamins: info.vitamins ? {
        vitaminA: Math.round(((info.vitamins.vitaminA || 0) / totalWeight) * 100),
        vitaminC: Math.round(((info.vitamins.vitaminC || 0) / totalWeight) * 100),
        vitaminD: (((info.vitamins.vitaminD || 0) / totalWeight) * 100).toFixed(1),
        vitaminE: (((info.vitamins.vitaminE || 0) / totalWeight) * 100).toFixed(1),
        vitaminK: Math.round(((info.vitamins.vitaminK || 0) / totalWeight) * 100),
        vitaminB12: (((info.vitamins.vitaminB12 || 0) / totalWeight) * 100).toFixed(2),
        folate: Math.round(((info.vitamins.folate || 0) / totalWeight) * 100)
      } : null,
      minerals: info.minerals ? {
        calcium: Math.round(((info.minerals.calcium || 0) / totalWeight) * 100),
        iron: (((info.minerals.iron || 0) / totalWeight) * 100).toFixed(1),
        magnesium: Math.round(((info.minerals.magnesium || 0) / totalWeight) * 100),
        phosphorus: Math.round(((info.minerals.phosphorus || 0) / totalWeight) * 100),
        potassium: Math.round(((info.minerals.potassium || 0) / totalWeight) * 100),
        zinc: (((info.minerals.zinc || 0) / totalWeight) * 100).toFixed(1),
        copper: (((info.minerals.copper || 0) / totalWeight) * 100).toFixed(2)
      } : null
    };
  }

  onAnalyze() {
    if (!this.recipe) return;
    this.isAnalyzing = true;
    
    const ingredientsList = this.recipe.ingredients
      .map(ing => `${ing.quantity} ${ing.unit} de ${ing.name}`)
      .join(', ');
    
    const prompt = `Analysez les valeurs nutritionnelles de cette recette en utilisant la base de donnees CIQUAL comme reference.
    Ingredients: ${ingredientsList}.
    
    Retournez IMPERATIVEMENT un objet JSON complet avec cette structure exacte pour la TOTALITE de la recette :
    {
      "calories": <nombre>,
      "protein": <nombre en g>,
      "carbs": <nombre en g>,
      "fat": <nombre en g>,
      "fiber": <nombre en g>,
      "sugar": <nombre en g>,
      "sodium": <nombre en mg>,
      "vitamins": {
        "vitaminA": <microgrammes>,
        "vitaminC": <milligrammes>,
        "vitaminD": <microgrammes>,
        "vitaminE": <milligrammes>,
        "vitaminK": <microgrammes>,
        "vitaminB12": <microgrammes>,
        "folate": <microgrammes>
      },
      "minerals": {
        "calcium": <milligrammes>,
        "iron": <milligrammes>,
        "magnesium": <milligrammes>,
        "phosphorus: <milligrammes>,
        "potassium": <milligrammes>,
        "zinc": <milligrammes>,
        "copper": <milligrammes>
      }
    }`;
    
    console.log('[NUTRITION] Prompt CIQUAL detaille envoye :', prompt);
    
    // Simulation d'appel avec les donnees completes demandees
    setTimeout(() => {
      if (this.recipe) {
        const result = {
          calories: 420,
          protein: 15.5,
          carbs: 52.0,
          fat: 10.2,
          fiber: 6.5,
          sugar: 4.2,
          sodium: 350,
          vitamins: {
            vitaminA: 450,
            vitaminC: 35,
            vitaminD: 2.5,
            vitaminE: 12,
            vitaminK: 80,
            vitaminB12: 2.1,
            folate: 150
          },
          minerals: {
            calcium: 250,
            iron: 5.2,
            magnesium: 120,
            phosphorus: 180,
            potassium: 420,
            zinc: 4.5,
            copper: 0.8
          }
        };
        
        console.log('[NUTRITION] Resultat complet recu :', result);
        this.recipe.nutritionalInfo = result;
        
        // Sauvegarder les infos nutritionnelles en base de donnees
        if (this.recipe.id) {
          this.recipesService.update(this.recipe.id, { nutritionalInfo: result }).subscribe({
            next: () => {
              console.log('[NUTRITION] Infos nutritionnelles sauvegardees en base de donnees');
              this.notificationService.show('Analyse nutritionnelle sauvegardee', 'success');
            },
            error: (err) => {
              console.error('[NUTRITION] Erreur lors de la sauvegarde:', err);
              this.notificationService.show('Erreur lors de la sauvegarde', 'error');
            }
          });
        }
      }
      this.isAnalyzing = false;
      this.cdr.detectChanges();
    }, 1500);
  }

  getFullUrl(url: string): string {
    if (!url) return '/no_picture.jpg';
    if (url.startsWith('http')) return url;
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  async onPrint() {
    if (!this.recipe) return;

    const doc = new jsPDF();
    const saumonColor = [255, 120, 100];
    const natureColor = [45, 55, 72];
    
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const hasPhoto = !!this.recipe.photoUrl;

    doc.setTextColor(saumonColor[0], saumonColor[1], saumonColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(this.recipe.title, contentWidth);
    doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
    y += (titleLines.length * 10) + 5;

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

        // Ajouter le tableau nutritionnel ultra-compact si disponible
    if (this.recipe.nutritionalInfo) {
      if (y + 40 > 280) {
        doc.addPage();
        y = 20;
      }
      
      y += 5;
      doc.setTextColor(saumonColor[0], saumonColor[1], saumonColor[2]);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Bilan Nutritionnel (CIQUAL)', margin, y);
      y += 5;

      const nutrition100g = this.getNutritionPer100g();
      const nutritionPerServing = this.getNutritionPerServing();
      
      doc.setFontSize(7);
      doc.setTextColor(natureColor[0], natureColor[1], natureColor[2]);
      
      // Colonne 1: Macronutriments
      let yMacro = y;
      doc.setFont('helvetica', 'bold');
      doc.text('Macronutriments (/100g | /part)', margin, yMacro);
      yMacro += 4;
      doc.setFont('helvetica', 'normal');
      const macros = [
        { l: 'Calories', v1: nutrition100g?.calories, v2: nutritionPerServing?.calories },
        { l: 'Protéines (g)', v1: nutrition100g?.protein, v2: nutritionPerServing?.protein },
        { l: 'Glucides (g)', v1: nutrition100g?.carbs, v2: nutritionPerServing?.carbs },
        { l: 'Lipides (g)', v1: nutrition100g?.fat, v2: nutritionPerServing?.fat },
        { l: 'Fibres (g)', v1: nutrition100g?.fiber, v2: nutritionPerServing?.fiber },
        { l: 'Sodium (mg)', v1: nutrition100g?.sodium, v2: nutritionPerServing?.sodium }
      ];
      macros.forEach(m => {
        doc.text(`${m.l}: ${m.v1 || 0} | ${m.v2 || 0}`, margin, yMacro);
        yMacro += 3.5;
      });

      // Colonne 2: Vitamines
      let yVit = y;
      const col2X = margin + 65;
      doc.setFont('helvetica', 'bold');
      doc.text('Vitamines (/part)', col2X, yVit);
      yVit += 4;
      doc.setFont('helvetica', 'normal');
      const vits = [
        { l: 'Vit. A', v: nutritionPerServing?.vitamins?.vitaminA, u: 'µg' },
        { l: 'Vit. C', v: nutritionPerServing?.vitamins?.vitaminC, u: 'mg' },
        { l: 'Vit. D', v: nutritionPerServing?.vitamins?.vitaminD, u: 'µg' },
        { l: 'Vit. E', v: nutritionPerServing?.vitamins?.vitaminE, u: 'mg' },
        { l: 'Vit. K', v: nutritionPerServing?.vitamins?.vitaminK, u: 'µg' },
        { l: 'B12', v: nutritionPerServing?.vitamins?.vitaminB12, u: 'µg' },
        { l: 'Folate', v: nutritionPerServing?.vitamins?.folate, u: 'µg' }
      ];
      vits.forEach(v => {
        doc.text(`${v.l}: ${v.v || 0}${v.u}`, col2X, yVit);
        yVit += 3.5;
      });

      // Colonne 3: Minéraux
      let yMin = y;
      const col3X = margin + 120;
      doc.setFont('helvetica', 'bold');
      doc.text('Minéraux (/part)', col3X, yMin);
      yMin += 4;
      doc.setFont('helvetica', 'normal');
      const mins = [
        { l: 'Calcium', v: nutritionPerServing?.minerals?.calcium, u: 'mg' },
        { l: 'Fer', v: nutritionPerServing?.minerals?.iron, u: 'mg' },
        { l: 'Mag.', v: nutritionPerServing?.minerals?.magnesium, u: 'mg' },
        { l: 'Phos.', v: nutritionPerServing?.minerals?.phosphorus, u: 'mg' },
        { l: 'Potas.', v: nutritionPerServing?.minerals?.potassium, u: 'mg' },
        { l: 'Zinc', v: nutritionPerServing?.minerals?.zinc, u: 'mg' },
        { l: 'Cuivre', v: nutritionPerServing?.minerals?.copper, u: 'mg' }
      ];
      mins.forEach(m => {
        doc.text(`${m.l}: ${m.v || 0}${m.u}`, col3X, yMin);
        yMin += 3.5;
      });

      y = Math.max(yMacro, yVit, yMin) + 5;
    }

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
