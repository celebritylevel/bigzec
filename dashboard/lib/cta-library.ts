export type CTAType = 'question' | 'engagement' | 'link' | 'save' | 'follow' | 'share' | 'comment' | 'debate';

export interface CTATemplate {
  type: CTAType;
  template: string;
  examples: string[];
  engagementLevel: 'low' | 'medium' | 'high';
}

export const ctaTemplates: Record<CTAType, CTATemplate> = {
  question: {
    type: 'question',
    template: "What's your experience with [X]?",
    examples: [
      "What's your experience with this approach?",
      "What would you add to this list?",
      "What's worked best for you?",
      "What's your biggest challenge with this?"
    ],
    engagementLevel: 'high'
  },
  engagement: {
    type: 'engagement',
    template: "Drop a [emoji] if you agree",
    examples: [
      "Drop a 🔥 if you agree",
      "Drop a 💡 if this was helpful",
      "Drop a ❤️ if you needed to hear this",
      "Double tap if this resonates"
    ],
    engagementLevel: 'medium'
  },
  link: {
    type: 'link',
    template: "Link in comments 👇",
    examples: [
      "Link in comments 👇",
      "Full guide in comments 👇",
      "Get the template in comments 👇",
      "Free resource in comments 👇"
    ],
    engagementLevel: 'medium'
  },
  save: {
    type: 'save',
    template: "Save this for later",
    examples: [
      "Save this for later 📌",
      "Bookmark this post",
      "Save this post - you'll thank me later",
      "Hit save before you scroll past"
    ],
    engagementLevel: 'low'
  },
  follow: {
    type: 'follow',
    template: "Follow for more [topic] content",
    examples: [
      "Follow for more content like this",
      "Follow for daily tips",
      "Hit follow if you want more",
      "Join 50K+ others and follow"
    ],
    engagementLevel: 'low'
  },
  share: {
    type: 'share',
    template: "Share with someone who needs this",
    examples: [
      "Share with someone who needs to hear this",
      "Tag a friend who needs this",
      "Repost to help others",
      "Share this with your team"
    ],
    engagementLevel: 'medium'
  },
  comment: {
    type: 'comment',
    template: "Comment [keyword] and I'll send you [resource]",
    examples: [
      "Comment \"GUIDE\" and I'll send you the full PDF",
      "Comment \"YES\" if you want the template",
      "Drop your biggest takeaway below",
      "Tell me in the comments: what's your take?"
    ],
    engagementLevel: 'high'
  },
  debate: {
    type: 'debate',
    template: "Agree or disagree? Let's discuss.",
    examples: [
      "Agree or disagree? Let's discuss in the comments.",
      "Hot take? Cold take? You tell me.",
      "Am I wrong? I want to hear your perspective.",
      "Fight me on this in the comments."
    ],
    engagementLevel: 'high'
  }
};

export function getCTAByType(type: CTAType): CTATemplate {
  return ctaTemplates[type];
}

export function getRandomCTA(): CTATemplate {
  const types = Object.keys(ctaTemplates) as CTAType[];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return ctaTemplates[randomType];
}

export function getCTAExample(type: CTAType): string {
  const cta = ctaTemplates[type];
  return cta.examples[Math.floor(Math.random() * cta.examples.length)];
}

export function getCTAsByEngagement(level: CTATemplate['engagementLevel']): CTATemplate[] {
  return Object.values(ctaTemplates).filter(c => c.engagementLevel === level);
}

export function formatCTATemplate(template: string, replacements: Record<string, string>): string {
  let result = template;
  Object.entries(replacements).forEach(([key, value]) => {
    result = result.replace(`[${key}]`, value);
  });
  return result;
}

export function getHighEngagementCTAs(): CTATemplate[] {
  return getCTAsByEngagement('high');
}

export function getRecommendedCTA(platform: 'linkedin' | 'twitter'): CTATemplate {
  if (platform === 'linkedin') {
    const linkedinCTAs: CTAType[] = ['question', 'comment', 'save', 'share'];
    const selectedType = linkedinCTAs[Math.floor(Math.random() * linkedinCTAs.length)];
    return ctaTemplates[selectedType];
  } else {
    const twitterCTAs: CTAType[] = ['engagement', 'question', 'debate', 'follow'];
    const selectedType = twitterCTAs[Math.floor(Math.random() * twitterCTAs.length)];
    return ctaTemplates[selectedType];
  }
}
