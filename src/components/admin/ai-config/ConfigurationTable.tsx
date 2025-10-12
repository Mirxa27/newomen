import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, TestTube } from "lucide-react";
import type { Database } from '@/integrations/supabase/types';

type AIConfiguration = Database['public']['Tables']['ai_configurations']['Row'];

interface ConfigurationTableProps {
  configurations: AIConfiguration[];
  onEdit: (config: AIConfiguration) => void;
  onDelete: (configId: string) => void;
  onTest: (config: AIConfiguration) => void;
  testResults: { testing: boolean; configId: string } | null;
}

export const ConfigurationTable = ({ configurations, onEdit, onDelete, onTest, testResults }: ConfigurationTableProps) => {
  return (
    <ResponsiveTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Test</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configurations.map((config) => (
            <TableRow key={config.id}>
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold">{config.name}</div>
                  {config.description && (
                    <div className="text-sm text-muted-foreground">{config.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {config.provider}
                </Badge>
              </TableCell>
              <TableCell>{config.model_name}</TableCell>
              <TableCell>
                <Badge variant={config.is_active ? "default" : "secondary"}>
                  {config.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTest(config)}
                  disabled={testResults?.testing && testResults?.configId === config.id}
                  className="glass"
                >
                  <TestTube className="w-4 h-4" />
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(config)}
                    className="glass"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(config.id)}
                    className="glass"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTable>
  );
};