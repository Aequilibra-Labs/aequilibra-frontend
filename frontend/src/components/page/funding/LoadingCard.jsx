import { Card, CardContent } from '@/components/ui/card';

export default function LoadingCard() {
  return (
    <Card className="border-border shadow-lg bg-card/60 backdrop-blur-sm">
      <CardContent className="py-8 px-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-muted/60 rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
