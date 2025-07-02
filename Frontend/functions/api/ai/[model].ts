// Cloudflare Pages Function for AI model routing
export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const { model } = context.params;
    const body = await request.json();
    const { prompt, context: reqContext, maxTokens, temperature } = body;

    // Validate request
    if (!prompt || typeof prompt !== 'string') {
      return new Response('Invalid prompt', { status: 400 });
    }

    // Route to appropriate AI service
    let response;
    switch (model) {
      case 'gpt-4':
      case 'gpt-4o':
        response = await callOpenAI(prompt, reqContext, env, {
          model: model === 'gpt-4o' ? 'gpt-4o' : 'gpt-4',
          maxTokens,
          temperature
        });
        break;
        
      case 'claude':
        response = await callAnthropic(prompt, reqContext, env, {
          maxTokens,
          temperature
        });
        break;
        
      case 'gemini-vision':
        response = await callGemini(prompt, reqContext, env, {
          maxTokens,
          temperature
        });
        break;
        
      case 'mistral':
        response = await callMistral(prompt, reqContext, env, {
          maxTokens,
          temperature
        });
        break;
        
      default:
        return new Response('Unsupported model', { status: 400 });
    }

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'private, max-age=0'
      }
    });
    
  } catch (error) {
    console.error('AI API Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

// OpenAI API integration
async function callOpenAI(prompt: string, context: any, env: any, options: any) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const enhancedPrompt = enhancePrompt(prompt, context);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert coding assistant. Provide clear, accurate, and helpful responses.'
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.1,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const result = await response.json();
  
  return {
    content: result.choices[0].message.content,
    model: options.model,
    tokens: result.usage?.total_tokens || 0,
    confidence: 0.9
  };
}

// Anthropic Claude integration
async function callAnthropic(prompt: string, context: any, env: any, options: any) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const enhancedPrompt = enhancePrompt(prompt, context);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.1,
      messages: [
        {
          role: 'user',
          content: enhancedPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const result = await response.json();
  
  return {
    content: result.content[0].text,
    model: 'claude',
    tokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
    confidence: 0.85
  };
}

// Google Gemini integration
async function callGemini(prompt: string, context: any, env: any, options: any) {
  const apiKey = env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('Google API key not configured');
  }

  const enhancedPrompt = enhancePrompt(prompt, context);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: enhancedPrompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 2048,
          temperature: options.temperature || 0.2
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const result = await response.json();
  
  return {
    content: result.candidates[0].content.parts[0].text,
    model: 'gemini-vision',
    tokens: 0, // Gemini doesn't provide token counts
    confidence: 0.8
  };
}

// Mistral integration
async function callMistral(prompt: string, context: any, env: any, options: any) {
  const apiKey = env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error('Mistral API key not configured');
  }

  const enhancedPrompt = enhancePrompt(prompt, context);

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature || 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status}`);
  }

  const result = await response.json();
  
  return {
    content: result.choices[0].message.content,
    model: 'mistral',
    tokens: result.usage?.total_tokens || 0,
    confidence: 0.8
  };
}

// Enhance prompt with context
function enhancePrompt(prompt: string, context: any): string {
  let enhanced = prompt;

  if (context?.filename) {
    enhanced = `File: ${context.filename}\n\n${enhanced}`;
  }

  if (context?.language) {
    enhanced = `Language: ${context.language}\n\n${enhanced}`;
  }

  if (context?.content) {
    enhanced = `${enhanced}\n\nCode Context:\n\`\`\`${context.language || 'text'}\n${context.content}\n\`\`\``;
  }

  return enhanced;
}