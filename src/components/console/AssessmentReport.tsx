import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProgramStore, FinalReport } from '@/lib/programStore';
import { ArrowLeft, Download, Share2 } from 'lucide-react';

interface AssessmentReportProps {
  report: FinalReport;
}

export default function AssessmentReport({ report }: AssessmentReportProps) {
  const resetReport = useProgramStore(state => state.resetReport);

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Assessment Report</CardTitle>
          <Button variant="ghost" size="icon" onClick={resetReport}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Summary</h3>
          <p className="text-muted-foreground">{report.summary}</p>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Strengths</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {report.strengths.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Areas for Growth</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {report.growthAreas.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Recommendations</h3>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            {report.recommendations.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
        <div className="flex gap-4 pt-4">
          <Button className="flex-1"><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
          <Button variant="outline" className="flex-1"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
        </div>
      </CardContent>
    </Card>
  );
}