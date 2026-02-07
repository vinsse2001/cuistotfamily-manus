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

    const prompt = `Analyse nutritionnelle pour la recette suivante :
    Titre: ${recipe.title}
    Ingrédients: ${JSON.stringify(recipe.ingredients)}
    
    Fournis une estimation des calories, protéines, glucides et lipides pour une portion.
    Réponds uniquement au format JSON avec les clés: calories, proteins, carbs, fat.`;

    const isMistral = !!this.configService.get<string>('MISTRAL_API_KEY');
    const response = await this.openai.chat.completions.create({
      model: isMistral ? 'mistral-small-latest' : 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: isMistral ? undefined : { type: 'json_object' },
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

    const systemPrompt = `Tu es Lia, l'assistante virtuelle de l'application Cuistot Family. 
    Tu es experte en cuisine, nutrition et organisation familiale. 
    Tu es chaleureuse, aidante et concise.`;

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
