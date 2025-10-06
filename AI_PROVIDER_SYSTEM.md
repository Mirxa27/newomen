# AI Provider Management System

## Overview

The AI Provider Management System provides a comprehensive solution for managing OpenAI-compatible AI providers, prompt templates, and behaviors for different use cases in the Newomen platform.

## Features

### 🚀 **OpenAI-Compatible Provider Management**
- Add and configure OpenAI-compatible AI providers
- Set custom API endpoints, temperature, and other parameters
- Manage provider-specific settings and behaviors

### 📝 **Prompt Template System**
- Create reusable prompt templates for different use cases
- Support for template variables (e.g., `{user_name}`, `{assessment_type}`)
- Default and custom template management
- Use case-specific prompt optimization

### 🧠 **AI Behavior Profiles**
- Define AI personality traits and communication styles
- Configure emotional tones and response lengths
- Create behavior profiles for different interaction types

### ⚙️ **Model Configuration**
- Map AI models to specific use cases
- Set primary and secondary model configurations
- Priority-based model selection
- Behavior-specific model assignments

## Database Schema

### Core Tables

#### `providers` (Enhanced)
```sql
- id: UUID
- name: TEXT
- type: TEXT
- api_base: TEXT
- region: TEXT
- status: TEXT
- openai_compatible: BOOLEAN
- max_tokens: INTEGER
- temperature: DECIMAL
- top_p: DECIMAL
- frequency_penalty: DECIMAL
- presence_penalty: DECIMAL
- system_instructions: TEXT
- behavior_config: JSONB
```

#### `ai_use_cases`
```sql
- id: UUID
- name: TEXT (e.g., "Assessment Completion")
- description: TEXT
- category: TEXT (e.g., "assessment", "challenge")
- is_active: BOOLEAN
```

#### `prompt_templates`
```sql
- id: UUID
- use_case_id: UUID → ai_use_cases(id)
- provider_id: UUID → providers(id)
- name: TEXT
- system_prompt: TEXT
- user_prompt_template: TEXT
- variables: JSONB
- temperature: DECIMAL
- max_tokens: INTEGER
- is_default: BOOLEAN
- is_active: BOOLEAN
```

#### `ai_behaviors`
```sql
- id: UUID
- name: TEXT
- description: TEXT
- personality_traits: JSONB
- communication_style: TEXT
- response_length: TEXT
- emotional_tone: TEXT
- is_active: BOOLEAN
```

#### `ai_model_configs`
```sql
- id: UUID
- provider_id: UUID → providers(id)
- model_id: UUID → models(id)
- use_case_id: UUID → ai_use_cases(id)
- behavior_id: UUID → ai_behaviors(id)
- is_primary: BOOLEAN
- priority: INTEGER
- is_active: BOOLEAN
```

## Default Use Cases

The system comes pre-configured with these use cases:

1. **Assessment Completion** - AI responses for completed assessments
2. **Couples Challenge** - AI analysis for couples challenges
3. **Narrative Exploration** - AI guidance for narrative identity
4. **Wellness Guidance** - AI wellness advice and meditation
5. **Community Moderation** - AI moderation for discussions
6. **General Chat** - General conversational AI
7. **Assessment Analysis** - AI analysis of assessment results
8. **Goal Setting** - AI assistance with personal goals
9. **Relationship Advice** - AI relationship guidance
10. **Crisis Support** - AI support for crisis situations

## Default AI Behaviors

1. **Supportive Companion** - Warm, empathetic, encouraging
2. **Analytical Guide** - Logical, thorough, insightful
3. **Challenging Coach** - Direct, motivating, growth-focused
4. **Creative Facilitator** - Imaginative, inspiring, open-minded
5. **Crisis Counselor** - Calm, professional, supportive

## Usage Examples

### 1. Basic AI Response Generation

```typescript
import { generateAIResponse } from '@/lib/ai-provider-utils';

// Generate assessment analysis
const analysis = await generateAIResponse(
  'assessment-completion',
  'Please analyze this assessment result',
  {
    user_name: 'John Doe',
    assessment_type: 'Personality Test',
    assessment_scores: { openness: 0.8, conscientiousness: 0.7 },
    key_insights: 'High openness, moderate conscientiousness'
  }
);
```

### 2. Using React Hooks

```typescript
import { useAIResponse } from '@/hooks/useAIProvider';

function AssessmentComponent() {
  const { response, loading, error, generateResponse } = useAIResponse('assessment-completion');
  
  const handleAnalyze = async () => {
    await generateResponse('Analyze this assessment', {
      user_name: 'John',
      assessment_type: 'Personality'
    });
  };
  
  return (
    <div>
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      {response && <div>{response}</div>}
    </div>
  );
}
```

### 3. Custom Prompt Templates

```typescript
// Create a custom prompt template
const template = {
  use_case_id: 'assessment-completion',
  provider_id: 'provider-uuid',
  name: 'Detailed Personality Analysis',
  system_prompt: 'You are an expert psychologist analyzing personality assessment results...',
  user_prompt_template: 'Analyze the personality assessment for {user_name}. Results: {assessment_scores}. Provide detailed insights about {key_insights}.',
  variables: {
    user_name: 'string',
    assessment_scores: 'object',
    key_insights: 'string'
  },
  temperature: 0.7,
  max_tokens: 1000
};
```

## Admin Interface

The admin interface provides:

### **Providers Tab**
- Add/edit OpenAI-compatible providers
- Configure API settings and parameters
- Test provider connections
- Manage provider status

### **Templates Tab**
- Create/edit prompt templates
- Manage template variables
- Set default templates
- Test template effectiveness

### **Behaviors Tab**
- Define AI personality traits
- Configure communication styles
- Set emotional tones
- Create behavior profiles

### **Configurations Tab**
- Map models to use cases
- Set primary/secondary configurations
- Configure behavior assignments
- Manage configuration priorities

## API Integration

### OpenAI-Compatible Endpoints

The system supports any OpenAI-compatible API endpoint:

```typescript
// Example provider configuration
{
  name: "Custom GPT Provider",
  type: "openai",
  api_base: "https://api.custom-gpt.com/v1",
  openai_compatible: true,
  max_tokens: 4096,
  temperature: 0.7,
  system_instructions: "You are a helpful AI assistant..."
}
```

### Supported Providers

- OpenAI GPT-4/GPT-3.5
- Azure OpenAI
- Anthropic Claude
- Custom OpenAI-compatible APIs
- Local AI models with OpenAI-compatible interfaces

## Security Considerations

- API keys are encrypted in the database
- Row Level Security (RLS) policies restrict access to admin users
- All AI interactions are logged for monitoring
- Rate limiting and usage tracking
- Secure prompt template management

## Monitoring and Analytics

- Track AI response quality and effectiveness
- Monitor provider performance and costs
- Analyze user satisfaction with AI responses
- Generate usage reports and insights

## Best Practices

1. **Prompt Design**
   - Use clear, specific instructions
   - Include context and examples
   - Test templates thoroughly
   - Iterate based on user feedback

2. **Behavior Configuration**
   - Match AI personality to use case
   - Consider user demographics
   - Test different approaches
   - Monitor user satisfaction

3. **Provider Management**
   - Use multiple providers for redundancy
   - Monitor costs and performance
   - Set appropriate rate limits
   - Keep API keys secure

4. **Template Variables**
   - Use descriptive variable names
   - Provide fallback values
   - Validate input data
   - Handle edge cases gracefully

## Troubleshooting

### Common Issues

1. **Provider Connection Errors**
   - Check API endpoint and credentials
   - Verify network connectivity
   - Review rate limits and quotas

2. **Template Issues**
   - Validate variable syntax
   - Check template content
   - Test with sample data

3. **Response Quality**
   - Adjust temperature settings
   - Refine prompt templates
   - Consider different behaviors
   - Monitor user feedback

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// Enable debug mode
process.env.AI_DEBUG = 'true';
```

This will log all AI provider interactions and responses for debugging purposes.

## Future Enhancements

- Multi-language support
- Advanced prompt optimization
- A/B testing for templates
- Real-time performance monitoring
- Automated quality assessment
- Integration with external AI services
- Custom model fine-tuning
- Advanced analytics and reporting
