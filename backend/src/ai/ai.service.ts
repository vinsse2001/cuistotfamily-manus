import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async analyzeRecipe(recipe: any) {
    const prompt = `Analyse nutritionnelle pour la recette suivante :
    Titre: ${recipe.title}
    Ingrédients: ${JSON.stringify(recipe.ingredients)}
    
    Fournis une estimation des calories, protéines, glucides et lipides pour une portion.
    Réponds uniquement au format JSON avec les clés: calories, proteins, carbs, fat.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  }

  async askLia(question: string) {
    const systemPrompt = `Tu es Lia, l'assistante virtuelle de l'application Cuistot Family. 
    Tu es experte en cuisine, nutrition et organisation familiale. 
    Tu es chaleureuse, aidante et concise.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
    });

    return { answer: response.choices[0].message.content };
  }
}
