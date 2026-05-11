import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { GeneratePlanDto, RecommendationDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ollamaUrl: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.ollamaUrl = config.get('OLLAMA_BASE_URL', 'http://localhost:11434');
    this.model = config.get('OLLAMA_MODEL', 'llama3.2');
  }

  private async listAvailableModels(): Promise<string[]> {
    try {
      const response = await axios.get<{ models?: Array<{ name: string }> }>(
        `${this.ollamaUrl}/api/tags`,
      );
      return (response.data.models ?? []).map((m) => m.name).filter(Boolean);
    } catch {
      return [];
    }
  }

  private async generateWithModel(prompt: string, model: string): Promise<string> {
    const response = await axios.post<{ response: string }>(
      `${this.ollamaUrl}/api/generate`,
      {
        model,
        prompt,
        stream: false,
      },
    );

    return response.data.response;
  }

  private async chat(prompt: string): Promise<string> {
    try {
      return await this.generateWithModel(prompt, this.model);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      const status = axiosErr.response?.status;
      const ollamaError = axiosErr.response?.data?.error ?? axiosErr.message;

      // Ollama returns 404 for missing model; try a fallback installed model if possible.
      if (status === 404 && /model|not found/i.test(String(ollamaError))) {
        const installedModels = await this.listAvailableModels();
        const fallback = installedModels.find((name) => name !== this.model);

        if (fallback) {
          this.logger.warn(
            `Model "${this.model}" not found. Falling back to installed model "${fallback}".`,
          );
          try {
            return await this.generateWithModel(prompt, fallback);
          } catch (fallbackErr) {
            const fallbackAxiosErr = fallbackErr as AxiosError<{ error?: string }>;
            const fallbackStatus = fallbackAxiosErr.response?.status;
            const fallbackMessage =
              fallbackAxiosErr.response?.data?.error ?? fallbackAxiosErr.message;
            this.logger.error(
              `Fallback model "${fallback}" failed (${fallbackStatus ?? 'no-status'}): ${fallbackMessage}`,
            );
            throw new InternalServerErrorException(
              `Ollama model "${fallback}" failed (${fallbackStatus ?? 'no-status'}). ${fallbackMessage}`,
            );
          }
        }

        this.logger.error('Ollama model not available', ollamaError);
        throw new InternalServerErrorException(
          `Ollama model "${this.model}" not found. Run: ollama pull ${this.model}`,
        );
      }

      this.logger.error('Ollama request failed', err);
      throw new InternalServerErrorException(
        `AI service unavailable (${status ?? 'no-status'}). Ensure Ollama is running at ${this.ollamaUrl}.`,
      );
    }
  }

  private buildFallbackPlan(dto: GeneratePlanDto): { plan: string } {
    const hoursPerDay = dto.hoursPerDay ?? 2;
    const topics = dto.topics.length ? dto.topics : ['General'];
    const timeMinutes = Math.max(30, Math.round((hoursPerDay * 60) / Math.max(topics.length, 1)));

    const plan = {
      title: `${dto.goal} - Fallback Plan`,
      topics: topics.map((topic, index) => ({
        name: topic,
        tasks: [
          {
            title: `Study ${topic} fundamentals`,
            timeMinutes,
            deadline: `Day ${index + 1}`,
          },
          {
            title: `Practice ${topic} with exercises`,
            timeMinutes,
            deadline: `Day ${index + 2}`,
          },
        ],
      })),
    };

    return { plan: JSON.stringify(plan) };
  }

  private buildFallbackRecommendation(
    dto: RecommendationDto,
  ): { message: string; targetTopic: string } {
    if (!dto.recentProgress.length) {
      return {
        message:
          'Start with a focused 25-minute session on your highest-priority topic, then review progress at the end of the day.',
        targetTopic: 'General',
      };
    }

    const pending = dto.recentProgress.find((p) => p.status !== 'completed');
    const leastStudied = [...dto.recentProgress].sort((a, b) => a.timeSpent - b.timeSpent)[0];
    const target = pending?.topic ?? leastStudied?.topic ?? dto.recentProgress[0].topic;

    return {
      message: `Prioritize ${target} next. Do one uninterrupted 30-minute deep-focus block and finish with a 10-minute recap note.`,
      targetTopic: target,
    };
  }

  async generateStudyPlan(dto: GeneratePlanDto): Promise<{ plan: string }> {
    const prompt = `You are a study planning assistant. Create a structured daily study plan.
Goal: ${dto.goal}
Topics: ${dto.topics.join(', ')}
Hours per day: ${dto.hoursPerDay ?? 2}
Days available: ${dto.daysAvailable ?? 30}

Respond with a JSON object with this structure:
{
  "title": "plan title",
  "topics": [
    {
      "name": "topic name",
      "tasks": [
        { "title": "task title", "timeMinutes": 30, "deadline": "Day 1" }
      ]
    }
  ]
}
Only respond with the JSON object, no extra text.`;

    try {
      const raw = await this.chat(prompt);
      return { plan: raw.trim() };
    } catch (err) {
      this.logger.warn(
        `Falling back to local plan generation: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.buildFallbackPlan(dto);
    }
  }

  async getRecommendation(dto: RecommendationDto): Promise<{ message: string; targetTopic: string }> {
    const progressSummary = dto.recentProgress
      .map((p) => `${p.topic}: ${p.timeSpent} min, status: ${p.status}`)
      .join('\n');

    const prompt = `You are a study coach. Based on the student's recent progress, give one concise actionable recommendation.

Recent progress:
${progressSummary}

Respond with a JSON object:
{ "message": "your recommendation here", "targetTopic": "topic to focus on" }
Only respond with JSON.`;

    try {
      const raw = await this.chat(prompt);
      try {
        return JSON.parse(raw.trim());
      } catch {
        return { message: raw.trim(), targetTopic: dto.recentProgress[0]?.topic ?? '' };
      }
    } catch (err) {
      this.logger.warn(
        `Falling back to local recommendation: ${err instanceof Error ? err.message : String(err)}`,
      );
      return this.buildFallbackRecommendation(dto);
    }
  }
}
