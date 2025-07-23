'use client';

import { useCreditCheck } from '@/components/credits/credit-components';
import { Button } from '../ui/button';

function AIGenerationComponent({ teamId }: { teamId: number }) {
  const { hasSufficientCredits, loading } = useCreditCheck(teamId, 10);

  const handleGenerate = async () => {
    if (!hasSufficientCredits) {
      alert('Insufficient credits');
      return;
    }

    // Proceed with generation
    const response = await fetch('/api/ai-generation', {
      method: 'POST',
      body: JSON.stringify({ teamId, prompt: 'A sample prompt' }),
    });

    // Handle response
    const data = await response.json();
    alert(data.result);
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={!hasSufficientCredits || loading}
    >
      Generate (10 credits)
    </Button>
  );
}
