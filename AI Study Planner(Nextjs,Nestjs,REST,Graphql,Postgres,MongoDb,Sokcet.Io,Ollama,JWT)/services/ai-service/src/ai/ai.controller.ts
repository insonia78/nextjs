import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeneratePlanDto, RecommendationDto } from './dto/ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // POST /api/ai/generate-plan
  @Post('generate-plan')
  generatePlan(@Body() dto: GeneratePlanDto) {
    return this.aiService.generateStudyPlan(dto);
  }

  // POST /api/ai/recommend
  @Post('recommend')
  recommend(@Body() dto: RecommendationDto) {
    return this.aiService.getRecommendation(dto);
  }
}
