import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExternalLink, Key, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyManagerProps {
  onApiKeyChange: (apiKey: string) => void;
}

export default function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('aviationstack_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      onApiKeyChange(savedKey);
      setIsValid(true);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.length >= 32 && /^[a-zA-Z0-9]+$/.test(apiKey)) {
      localStorage.setItem('aviationstack_api_key', apiKey);
      onApiKeyChange(apiKey);
      setIsValid(true);
      toast.success('API key saved successfully');
    } else {
      toast.error('Invalid API key format');
    }
  };

  if (isValid) {
    return null;
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Key className="h-6 w-6 mt-1 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold mb-1">AviationStack API Key</h2>
            <p className="text-sm text-muted-foreground mb-4">
              An API key is required to fetch real-time flight data from AviationStack.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="font-mono"
            />
            <Button onClick={handleSave}>Save Key</Button>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">How to get an API key:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Visit <a href="https://aviationstack.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">
              AviationStack <ExternalLink className="h-3 w-3" />
            </a></li>
            <li>Click "Get Free API Key"</li>
            <li>Complete the registration process</li>
            <li>Copy the API key from your dashboard</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}