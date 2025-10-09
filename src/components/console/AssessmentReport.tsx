// src/components/console/AssessmentReport.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { FinalReport, useProgramStore } from '@/lib/programStore';
import { ArrowLeft, Download, Share2 } from 'lucide-react';

interface AssessmentReportProps {
  report: FinalReport;
}

export default function AssessmentReport({ report }: AssessmentReportProps) {
  const resetReport = useProgramStore(state => state.resetReport);

  // A helper to render different parts of the analysis
  const renderAnalysisPart = (title: string, content: string | string[] | undefined) => {
    if (!content) return null;
    return (
      <div className="report-section glass-card p-6">
        <h3 className="text-lg font-semibold text-primary mb-3">{title}</h3>
        {Array.isArray(content) ? (
          <ul className="space-y-2">
            {content.map((item, index) => (
              <li key={index} className="text-sm leading-relaxed">{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-relaxed">{content}</p>
        )}
      </div>
    );
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My ${report.title} Results`,
          text: `Check out my ${report.title} analysis from Newomen!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownload = () => {
    const reportData = JSON.stringify(report, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/\s+/g, '_').toLowerCase()}_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="assessment-report-container min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="report-header mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Your {report.title} Results
              </h1>
              <p className="text-muted-foreground">
                AI-powered analysis curated by NewMe
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>

        <div className="report-body space-y-6">
          {renderAnalysisPart("Your Archetype", report.analysis.archetype as string)}
          {renderAnalysisPart("Core Dynamics", report.analysis.coreDynamics as string[])}
          {renderAnalysisPart("Hidden Potential", report.analysis.hiddenPotential as string)}
          {renderAnalysisPart("Your Growth Edge", report.analysis.growthEdge as string)}
          {renderAnalysisPart("Final Insight", report.analysis.finalInsight as string)}
          {renderAnalysisPart("Decision Profile", report.analysis.decisionProfile as string)}
          {renderAnalysisPart("Dominant Bias", report.analysis.dominantBias as string)}
          {renderAnalysisPart("Strategic Blindspot", report.analysis.strategicBlindspot as string)}
          {renderAnalysisPart("Actionable Upgrades", report.analysis.actionableUpgrades as string[])}
          {renderAnalysisPart("Final Verdict", report.analysis.finalVerdict as string)}
          {renderAnalysisPart("Communication Archetype", report.analysis.communicationArchetype as string)}
          {renderAnalysisPart("Primary Mode", report.analysis.primaryMode as string)}
          {renderAnalysisPart("Conflict Stance", report.analysis.conflictStance as string)}
          {renderAnalysisPart("Growth Vector", report.analysis.growthVector as string)}
          {renderAnalysisPart("Final Mantra", report.analysis.finalMantra as string)}
          {renderAnalysisPart("Balance Profile", report.analysis.balanceProfile as string)}
          {renderAnalysisPart("Strength Areas", report.analysis.strengthAreas as string[])}
          {renderAnalysisPart("Neglect Areas", report.analysis.neglectAreas as string[])}
          {renderAnalysisPart("Integration Strategy", report.analysis.integrationStrategy as string)}
          {renderAnalysisPart("Wellness Mantra", report.analysis.wellnessMantra as string)}
          {renderAnalysisPart("Attachment Style", report.analysis.attachmentStyle as string)}
          {renderAnalysisPart("Relationship Needs", report.analysis.relationshipNeeds as string)}
          {renderAnalysisPart("Communication Pattern", report.analysis.communicationPattern as string)}
          {renderAnalysisPart("Growth Opportunity", report.analysis.growthOpportunity as string)}
          {renderAnalysisPart("Relationship Wisdom", report.analysis.relationshipWisdom as string)}
          {renderAnalysisPart("Stress Profile", report.analysis.stressProfile as string)}
          {renderAnalysisPart("Primary Triggers", report.analysis.primaryTriggers as string[])}
          {renderAnalysisPart("Coping Strengths", report.analysis.copingStrengths as string[])}
          {renderAnalysisPart("Resilience Gaps", report.analysis.resilienceGaps as string[])}
          {renderAnalysisPart("Stress Mastery", report.analysis.stressMastery as string[])}
        </div>

        <div className="report-footer mt-8 text-center">
          <Button
            onClick={resetReport}
            className="gap-2"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
