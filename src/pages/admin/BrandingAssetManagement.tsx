import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2, Image, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface Asset {
  id: string;
  name: string;
  url: string;
  type: string;
  created_at: string;
}

export default function BrandingAssetManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('branding-assets').list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

      if (error) throw error;

      const publicAssets: Asset[] = data.map((item) => ({
        id: item.id,
        name: item.name,
        url: supabase.storage.from('branding-assets').getPublicUrl(item.name).data.publicUrl,
        type: item.metadata?.mimetype || 'unknown',
        created_at: item.created_at,
      }));
      setAssets(publicAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.warning('Please select a file to upload.');
      return;
    }

    setUploading(true);
    try {
      const { error } = await supabase.storage
        .from('branding-assets')
        .upload(file.name, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      toast.success('Asset uploaded successfully!');
      setFile(null);
      loadAssets();
    } catch (error) {
      console.error('Error uploading asset:', error);
      toast.error('Failed to upload asset.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetName: string) => {
    setAssetToDelete(assetName);
    setDialogOpen(true);
  };

  const performDelete = async () => {
    setDialogOpen(false);
    if (!assetToDelete) return;

    try {
      const { error } = await supabase.storage.from('branding-assets').remove([assetToDelete]);

      if (error) throw error;

      toast.success('Asset deleted successfully!');
      setAssetToDelete(null);
      loadAssets();
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Failed to delete asset.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold gradient-text">Branding & Asset Management</h1>
      <p className="text-muted-foreground">
        Upload and manage logos, images, and other branding assets.
      </p>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="gradient-text">Upload New Asset</CardTitle>
          <CardDescription>Add new images or files to your branding assets.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="asset-file">Select File</Label>
            <Input id="asset-file" type="file" onChange={handleFileChange} className="glass" />
          </div>
          <Button onClick={handleUpload} disabled={uploading || !file} className="clay-button">
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : 'Upload Asset'}
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="gradient-text">Existing Assets</CardTitle>
          <CardDescription>Manage your uploaded branding assets.</CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assets uploaded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="relative group">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-48">
                    {asset.type.startsWith('image/') ? (
                      <img src={asset.url} alt={asset.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <Image className="w-12 h-12 mb-2" />
                        <p className="text-sm text-center break-all">{asset.name}</p>
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(asset.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                  <CardFooter className="p-2 text-center text-sm text-muted-foreground">
                    {asset.name}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={performDelete}
        title="Delete branding asset"
        description={`Are you sure you want to delete '${assetToDelete}'?`}
      />
    </div>
  );
}
