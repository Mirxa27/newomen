import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logging';
import { Tables } from '@/integrations/supabase/types';

type AIConfig = Tables<'ai_configurations'>;

export class AIAssessmentService {
  private static instance: AIAssessmentService;

  private constructor() {}

  public static getInstance(): AIAssessmentService {
    if (!AIAssessmentService.instance) {
      AIAssessmentService.instance = new AIAssessmentService();
    }
    return AIAssessmentService.instance;
  }

  public async getAIConfigForAssessment(assessmentId: string): Promise<AIConfig | null> {
    return this.getAIConfigForService('assessment', assessmentId);
  }

  public async getDefaultAIConfig(): Promise<AIConfig | null> {
    return this.getAIConfigForService('default');
  }

  private async getAIConfigForService(serviceType: string, serviceId?: string): Promise<AIConfig | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_config_for_service', {
        service_type_param: serviceType,
        service_id_param: serviceId,
      });

      if (error) {
        logger.error(`Error fetching AI config for ${serviceType}:`, error as unknown as Record<string, unknown>);
        return null;
      }
      return data as AIConfig | null;
    } catch (e) {
      logger.error(`Exception fetching AI config for ${serviceType}:`, e);
      return null;
    }
  }
}

export const aiAssessmentService = AIAssessmentService.getInstance();