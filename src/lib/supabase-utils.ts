// Fix generic function to use string literal for table
export async function updateTableRow<T extends keyof Database['public']['Tables']>(
  table: T,
  id: string,
  data: TablesUpdate<T>
) {
  const { data: updatedData, error } = await supabase
    .from(table as string) // Fixed: Cast table to string
    .update(data as any) // Fixed: Cast data to any for dynamic
    .eq('id', id)
    .single();
  if (error) throw error;
  return updatedData;
}