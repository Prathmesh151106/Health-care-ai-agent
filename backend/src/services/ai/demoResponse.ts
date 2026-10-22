/**
 * services/ai/demoResponse.ts
 * Responses returned in demo mode (no AI provider configured).
 * Clearly identified as demo responses.
 */

import { AssistantResponse } from '../../types';

const DEMO_RESPONSES: AssistantResponse[] = [
  {
    message:
      '👋 This is a demo response from the Daily Health Companion assistant. ' +
      'To use the AI assistant, ask your administrator to configure an AI provider. ' +
      'In the meantime, you can use all other features, including health logs and reminders.',
    isDemoMode: true,
  },
  {
    message:
      'Demo mode: The assistant can help you organise your health logs and reminders. ' +
      'Connect an AI provider to get real responses. Your health data stays private.',
    isDemoMode: true,
  },
  {
    message:
      '📋 Demo mode active. Here is what I can help with when connected: summarising your recorded entries, ' +
      'suggesting log items or reminders (as drafts only), and preparing summaries for healthcare visits.',
    isDemoMode: true,
  },
];

export function getDemoResponse(message: string): AssistantResponse {
  // Check for emergency keywords – always guide to emergency services
  const EMERGENCY_KEYWORDS = [
    'chest pain','can\'t breathe','cannot breathe','unconscious','stroke','seizure',
    'emergency','911','999','112','ambulance','heart attack','overdose',
  ];
  const lower = message.toLowerCase();
  if (EMERGENCY_KEYWORDS.some((kw) => lower.includes(kw))) {
    return {
      message:
        'Please contact your local emergency services or a healthcare professional immediately.',
      isDemoMode:           true,
      isEmergencyGuidance:  true,
    };
  }

  const idx = Math.floor(Math.random() * DEMO_RESPONSES.length);
  return DEMO_RESPONSES[idx];
}
