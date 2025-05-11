import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FlightSearchProps {
  onSearch: (flightNumber: string) => void;
  loading: boolean;
}

export default function FlightSearch({ onSearch, loading }: FlightSearchProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(input.trim().toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Enter flight number (e.g., BA123)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="max-w-md"
      />
      <Button type="submit" disabled={loading}>
        {loading ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <Search className="h-4 w-4" />
        )}
        <span className="ml-2">Track</span>
      </Button>
    </form>
  );
}