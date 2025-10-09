import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResponsiveTable from "@/components/ui/ResponsiveTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2, Youtube, Music, Clock } from "lucide-react";
import { WellnessResources } from "@/integrations/supabase/tables/wellness_resources";

type WellnessResource = WellnessResources['Row'];

interface ResourceTableProps {
  resources: WellnessResource[];
  onEdit: (resource: WellnessResource) => void;
  onDelete: (resource: WellnessResource) => void;
  loading: boolean;
}

const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const getAudioTypeBadge = (resource: WellnessResource) => {
  if (resource.audio_type === 'youtube') {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <Youtube className="w-3 h-3 mr-1" />
        YouTube
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
      <Music className="w-3 h-3 mr-1" />
      Audio File
    </Badge>
  );
};

export function ResourceTable({ resources, onEdit, onDelete, loading }: ResourceTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ResponsiveTable>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{resource.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {resource.description}
                  </div>
                  {resource.youtube_url && (
                    <div className="text-xs text-blue-600 mt-1">
                      YouTube: {resource.youtube_url}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {resource.category}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDuration(resource.duration || 0)}</span>
                </div>
              </TableCell>
              <TableCell>
                {getAudioTypeBadge(resource)}
              </TableCell>
              <TableCell>
                {resource.audio_type === 'youtube' && !resource.youtube_audio_extracted ? (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Processing
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Ready
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(resource)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(resource)}
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
}