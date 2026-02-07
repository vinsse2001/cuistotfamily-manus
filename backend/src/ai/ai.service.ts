import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const mistralKey = this.configService.get<string>('MISTRAL_API_KEY');
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    
    if (mistralKey) {
      this.openai = new OpenAI({
        apiKey: mistralKey,
        baseURL: 'https://api.mistral.ai/v1',
      });
    } else if (openaiKey) {
      this.openai = new OpenAI({
        apiKey: openaiKey,
      });
    } else {
      console.warn('Aucune clé API IA trouvée (MISTRAL_API_KEY ou OPENAI_API_KEY)');
    }
  }

  async analyzeRecipe(recipe: any) {
    if (!this.openai) {
      throw new Error('Service IA non configuré. Veuillez renseigner MISTRAL_API_KEY ou OPENAI_API_KEY.');
    }

    const detailedPrompt = `Effectue une analyse nutritionnelle détaillée pour la recette suivante, en te basant sur les ingrédients fournis. Calcule les valeurs pour le TOTAL de la recette, pas par portion.\n    Titre: ${recipe.title}\n    Ingrédients: ${JSON.stringify(recipe.ingredients)}\n\n    Instructions pour la réponse :\n    1. Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte, préambule ou balisage Markdown supplémentaire.\n    2. L'objet JSON doit STRICTEMENT suivre la structure fournie ci-dessous, en incluant TOUTES les clés.\n    3. Pour chaque nutriment, si la valeur est nulle, indétectable ou négligeable, utilise 0.\n    4. Les valeurs doivent être des nombres (entiers ou décimaux) et les unités implicites (calories en kcal, protéines/glucides/lipides/fibres/sucres/sodium en grammes, vitamines/minéraux en unités standard comme µg ou mg si applicable, sinon 0).\n
    Exemple de structure JSON attendue :\n    {\n      "calories": 0,\n      "protein": 0,\n      "carbs": 0,\n      "fat": 0,\n      "fiber": 0,\n      "sugar": 0,\n      "sodium": 0,\n      "vitamins": {\n        "vitaminA": 0,\n        "vitaminC": 0,\n        "vitaminD": 0,\n        "vitaminE": 0,\n        "vitaminK": 0,\n        "vitaminB12": 0,\n        "folate": 0\n      },\n      "minerals": {\n        "calcium": 0,\n        "iron": 0,\n        "magnesium": 0,\n        "phosphorus": 0,\n        "potassium": 0,\n        "zinc": 0,\n        "copper": 0\n      }\n    }\n    `;

    const prompt = detailedPrompt;
    const isMistral = !!this.configService.get<string>('MISTRAL_API_KEY');
    const response = await this.openai.chat.completions.create({
      model: isMistral ? 'mistral-small-latest' : 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    let content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Réponse vide de l\'IA');
    }

    // Nettoyage pour Mistral qui peut ajouter des balises markdown
    if (isMistral) {
      content = content.replace(/```json\n?|\n?```/g, '').trim();
    }

    return JSON.parse(content);
  }

  async askLia(question: string) {
    if (!this.openai) {
      throw new Error('Service IA non configuré. Veuillez renseigner MISTRAL_API_KEY ou OPENAI_API_KEY.');
    }

    const systemPrompt = `Tu es Lia, l\'assistante virtuelle de l\'application Cuistot Family. \n    Tu es experte en cuisine, nutrition et organisation familiale. \n    Tu es chaleureuse, aidante et concise.`;

    const isMistral = !!this.configService.get<string>('MISTRAL_API_KEY');
    const response = await this.openai.chat.completions.create({
      model: isMistral ? 'mistral-small-latest' : 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
    });

    return { answer: response.choices[0].message.content };
  }
}
