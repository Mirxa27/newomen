import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube, Loader2 } from "lucide-react";

interface TestResultCardProps {
  testResults: {
    testing: boolean;
    configId: string;
    success?: boolean;
    response?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    time?: number;
    error?: string;
  } | null;
}

export const TestResultCard = ({ testResults }: TestResultCardProps) => {
  if (!testResults) return null;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 gradient-text">
          <TestTube className="w-5 h-5" />
          Test Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        {testResults.testing ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span>Testing AI configuration...</span>
          </div>
        ) : testResults.success ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default">✓ Test Successful</Badge>
              <span className="text-sm text-muted-foreground">
                Response time: {testResults.time}ms
              </span>
            </div>
            {testResults.usage && (
              <div className="text-sm text-muted-foreground">
                Tokens: {testResults.usage.prompt_tokens} prompt + {testResults.usage.completion_tokens} completion = {testResults.usage.total_tokens} total
              </div>
            )}
            <div className="glass p-3 rounded-lg">
              <p className="text-sm">{testResults.response}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-500">
            <Badge variant="destructive">✗ Test Failed</Badge>
            <span className="text-sm">{testResults.error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
