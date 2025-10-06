# AI Assessment System Integration Guide

## Overview

This guide provides comprehensive instructions for integrating and using the AI-powered assessment system in the Newomen platform.

## System Architecture

### Database Schema
- **ai_assessment_configs**: AI configuration settings
- **assessments_enhanced**: Enhanced assessments with AI support
- **assessment_attempts**: User attempts and AI processing
- **ai_processing_queue**: Queue for AI processing tasks
- **ai_usage_logs**: AI usage tracking and billing
- **assessment_categories**: Assessment categories
- **user_assessment_progress**: User progress tracking
- **ai_rate_limits**: Rate limiting for AI API calls

### React Components
- **AIAssessmentManagement.tsx**: Admin panel for AI assessment management
- **Assessment.tsx**: User-facing assessment taking interface
- **Assessments.tsx**: Assessment listing and discovery page
- **AssessmentTest.tsx**: Test interface for development and testing

### Utility Functions
- **ai-assessment-utils.ts**: Core utility functions for AI processing
- **useAIProvider.ts**: React hooks for AI provider management
- **AIAssessmentAnalyzer.tsx**: Component for AI analysis display
- **AICouplesAnalyzer.tsx**: Component for couples challenge analysis

## Routes Configuration

### User Routes
```typescript
// Assessment listing page
/assessments-new -> Assessments.tsx

// Individual assessment taking
/assessment/:id -> Assessment.tsx

// Test interface
/assessment-test -> AssessmentTest.tsx
```

### Admin Routes
```typescript
// Admin panel with AI Assessment Management tab
/admin -> Admin.tsx (includes AIAssessmentManagement.tsx)
```

## Usage Examples

### 1. Creating an Assessment (Admin)

```typescript
// In AIAssessmentManagement.tsx
const newAssessment = {
  title: "Emotional Intelligence Assessment",
  description: "Measure your emotional intelligence skills",
  type: "assessment",
  category: "personality",
  difficulty_level: "medium",
  time_limit_minutes: 30,
  max_attempts: 3,
  is_public: true,
  is_active: true,
  ai_config_id: "ai-config-uuid",
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      question: "How do you handle stress?",
      options: ["Avoid it", "Face it head-on", "Seek help", "Ignore it"],
      required: true
    }
  ],
  scoring_rubric: {
    emotional_awareness: 0.3,
    self_regulation: 0.3,
    empathy: 0.2,
    social_skills: 0.2
  }
};
```

### 2. Taking an Assessment (User)

```typescript
// In Assessment.tsx
const handleSubmit = async () => {
  // Submit responses
  const success = await submitAssessmentResponses(attemptId, responses, timeSpent);
  
  if (success && assessment.ai_config_id) {
    // Process with AI
    const aiResult = await processAssessmentWithAI(assessment.id, {
      assessment_id: assessment.id,
      user_id: userId,
      responses,
      time_spent_minutes: timeSpent
    });
    
    if (aiResult) {
      setAiResults(aiResult);
    }
  }
};
```

### 3. AI Configuration (Admin)

```typescript
// In AIAssessmentManagement.tsx
const aiConfig = {
  name: "Personality Assessment AI",
  description: "AI configuration for personality assessments",
  provider_id: "openai-provider-id",
  model_id: "gpt-4-model-id",
  use_case_id: "assessment-completion",
  behavior_id: "supportive-companion",
  temperature: 0.7,
  max_tokens: 1000,
  system_prompt: "You are an expert psychologist analyzing personality assessment results...",
  evaluation_criteria: {
    scoring_method: "weighted_average",
    categories: ["emotional_intelligence", "communication", "leadership"]
  },
  fallback_message: "AI analysis is temporarily unavailable. Please try again later.",
  is_active: true
};
```

## API Integration

### AI Provider Configuration

```typescript
// Configure AI providers
const provider = {
  name: "OpenAI GPT-4",
  type: "openai",
  api_base: "https://api.openai.com/v1",
  openai_compatible: true,
  max_tokens: 4096,
  temperature: 0.7,
  system_instructions: "You are a helpful AI assistant..."
};
```

### Assessment Processing

```typescript
// Process assessment with AI
const aiResult = await processAssessmentWithAI(assessmentId, {
  assessment_id: assessmentId,
  user_id: userId,
  responses: userResponses,
  time_spent_minutes: timeSpent
});

// AI Result Structure
interface AIAnalysisResult {
  score: number;
  feedback: string;
  explanation: string;
  insights: string[];
  recommendations: string[];
  strengths: string[];
  areas_for_improvement: string[];
}
```

## Testing the System

### 1. Test Interface
Visit `/assessment-test` to test the AI assessment system with sample data.

### 2. Admin Testing
- Go to `/admin` and navigate to the "AI Assessments" tab
- Create test AI configurations
- Create test assessments
- Monitor AI usage and analytics

### 3. User Testing
- Visit `/assessments-new` to see available assessments
- Take assessments and test AI processing
- View AI-generated results and feedback

## Error Handling

### Common Issues

1. **AI Processing Failures**
   - Check AI provider configuration
   - Verify API keys and endpoints
   - Review rate limits and quotas
   - Check error logs for details

2. **Assessment Loading Issues**
   - Verify assessment is active and public
   - Check user permissions
   - Review database connectivity
   - Validate assessment data

3. **Performance Issues**
   - Monitor database performance
   - Check AI processing queue
   - Review caching strategies
   - Optimize database queries

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// Enable debug mode
process.env.AI_DEBUG = 'true';
process.env.ASSESSMENT_DEBUG = 'true';
```

## Security Considerations

### Authentication & Authorization
- **Protected Routes**: Only authenticated users can access assessments
- **Admin Access**: Role-based access control for admin functions
- **User Progress**: Users can only view their own progress and attempts

### Rate Limiting
- **AI API Limits**: Configurable rate limits per user/provider
- **Attempt Limits**: Maximum attempts per assessment
- **Time Limits**: Assessment time restrictions

### Data Protection
- **Input Validation**: All user inputs are validated and sanitized
- **Error Handling**: Graceful handling of AI failures
- **Fallback Messages**: Default responses when AI is unavailable

## Performance Optimization

### Caching
- **AI Responses**: Cache common AI responses for similar inputs
- **Assessment Data**: Cache assessment metadata and questions
- **User Progress**: Cache user progress and attempt history

### Database Optimization
- **Indexes**: Optimized indexes for common queries
- **Pagination**: Efficient pagination for large datasets
- **Connection Pooling**: Optimized database connections

### AI Processing
- **Async Processing**: Non-blocking AI processing
- **Queue Management**: Priority-based processing queue
- **Retry Logic**: Automatic retry for failed AI calls

## Monitoring & Analytics

### AI Usage Tracking
- **Token Usage**: Track AI token consumption
- **Cost Analysis**: Monitor AI processing costs
- **Success Rates**: Track AI processing success rates
- **Performance Metrics**: Monitor processing times

### User Analytics
- **Completion Rates**: Track assessment completion rates
- **Score Distributions**: Analyze score patterns
- **Time Analysis**: Monitor time spent on assessments
- **Progress Tracking**: Track user progress over time

## Deployment Checklist

### Database Setup
- [ ] Run all migration files
- [ ] Verify table creation
- [ ] Check RLS policies
- [ ] Test database connections

### Environment Configuration
- [ ] Set up AI provider API keys
- [ ] Configure rate limits
- [ ] Set up monitoring
- [ ] Test AI integrations

### Frontend Deployment
- [ ] Build and deploy React components
- [ ] Test all routes
- [ ] Verify UI components
- [ ] Test user flows

### Admin Panel
- [ ] Test admin access
- [ ] Verify AI configuration management
- [ ] Test assessment creation
- [ ] Monitor analytics dashboard

## Troubleshooting

### Common Solutions

1. **Database Connection Issues**
   ```sql
   -- Check database connectivity
   SELECT * FROM ai_assessment_configs LIMIT 1;
   ```

2. **AI Provider Issues**
   ```typescript
   // Test AI provider connection
   const testResult = await testAIProvider(providerId);
   ```

3. **Assessment Loading Issues**
   ```typescript
   // Check assessment data
   const assessment = await getAssessment(assessmentId);
   console.log(assessment);
   ```

### Support Resources

- **Documentation**: AI_ASSESSMENT_SYSTEM.md
- **API Reference**: ai-assessment-utils.ts
- **Component Examples**: Assessment.tsx, AIAssessmentManagement.tsx
- **Test Interface**: AssessmentTest.tsx

## Future Enhancements

### Planned Features
- **Multi-Model Support**: Support for multiple AI models
- **Custom Prompts**: User-defined AI prompts
- **A/B Testing**: Test different AI configurations
- **Learning Analytics**: Advanced learning insights

### Integration Features
- **LMS Integration**: Learning management system integration
- **API Access**: RESTful API for external integrations
- **Webhook Support**: Real-time notifications
- **Export Features**: Data export capabilities

### Performance Improvements
- **Edge Computing**: Deploy AI processing closer to users
- **Caching Strategies**: Advanced caching mechanisms
- **Load Balancing**: Distribute AI processing load
- **Auto-scaling**: Automatic scaling based on demand

## Conclusion

The AI Assessment System provides a comprehensive solution for creating, managing, and processing AI-powered assessments. With proper configuration and monitoring, it can handle high-volume assessment processing while providing personalized feedback to users.

For additional support or questions, refer to the documentation or contact the development team.
