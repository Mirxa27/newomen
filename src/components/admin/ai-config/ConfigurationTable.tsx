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
import { Edit, Trash2, TestTube, Loader2 } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

// Define a more specific type that includes the expected nested relations
// This assumes you are fetching data from Supabase like:
// supabase.from('ai_configurations').select('*, provider:providers(name), model:models(display_name)')
type ConfigurationWithRelations = Tables<'ai_configurations'> & {
  provider: { name: string } | null;
  model: { display_name: string } | null;
};

// Define the props for the table component
interface ConfigurationTableProps {
  configurations: ConfigurationWithRelations[];
  onEdit: (config: ConfigurationWithRelations) => void;
  onDelete: (configId: string) => void;
  onTest: (config: ConfigurationWithRelations) => void;
  // A simpler state for tracking the currently testing configuration
  testingConfigId: string | null;
}

export const ConfigurationTable = ({
  configurations,
  onEdit,
  onDelete,
  onTest,
  testingConfigId,
}: ConfigurationTableProps) => {
  return (
    <ResponsiveTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[25%]">Name</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Test Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configurations.length > 0 ? (
            configurations.map((config) => {
              const isTesting = testingConfigId === config.id;
              return (
                <TableRow key={config.id}>
                  {/* Name and Description */}
                  <TableCell className="font-medium">
                    <div className="font-semibold">{config.name}</div>
                    {config.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {config.description}
                      </div>
                    )}
                  </TableCell>

                  {/* Provider */}
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {config.provider?.name || 'N/A'}
                    </Badge>
                  </TableCell>

                  {/* Model */}
                  <TableCell>{config.model?.display_name || 'N/A'}</TableCell>

                  {/* Status (Active/Default) */}
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge variant={config.is_active ? 'default' : 'secondary'} className="bg-green-600 text-white">
                        {config.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {config.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Test Status */}
                  <TableCell>
                    <Badge
                      variant={
                        config.test_status === 'success'
                          ? 'default'
                          : config.test_status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {config.test_status || 'Untested'}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onTest(config)}
                        disabled={isTesting}
                        title="Test Configuration"
                      >
                        {isTesting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <TestTube className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(config)}
                        title="Edit Configuration"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(config.id)}
                        title="Delete Configuration"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            // Empty state row
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center h-24 text-muted-foreground"
              >
                No AI configurations found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ResponsiveTable>
  );
};