import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { WellnessResources } from "@/integrations/supabase/tables/wellness_resources";

type WellnessResource = WellnessResources['Row'];

interface DeleteResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  resource: WellnessResource | null;
}

export function DeleteResourceDialog({ open, onOpenChange, onConfirm, resource }: DeleteResourceDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Resource"
      description={`Are you sure you want to delete "${resource?.title}"? This action cannot be undone.`}
      onConfirm={onConfirm}
    />
  );
}