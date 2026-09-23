'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  assetTag: z.string().optional(),
  status: z.string().optional(),
  quantity: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export function AssetFormDialog({
  open,
  onOpenChange,
  type,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'inventory' | 'stock';
  initialData?: any;
}) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData;

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      category: '',
      assetTag: '',
      status: 'Available',
      quantity: 1,
    },
  });

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        name: initialData.name,
        category: initialData.category,
        assetTag: initialData.assetTag || '',
        status: initialData.status,
        quantity: initialData.quantity,
      });
    } else if (open) {
      form.reset({
        name: '',
        category: '',
        assetTag: '',
        status: 'Available',
        quantity: 1,
      });
    }
  }, [initialData, open, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        await api.patch(`/assets/${initialData.id}`, data);
      } else {
        await api.post(`/assets/${type}`, data);
      }
    },
    onSuccess: () => {
      // The queryKey used in the pages is ['assets', type]
      queryClient.invalidateQueries({ queryKey: ['assets', type] });
      toast.success(`${type === 'inventory' ? 'Asset' : 'Item'} ${isEditing ? 'updated' : 'created'} successfully`);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Something went wrong');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const entityName = type === 'inventory' ? 'Asset' : 'Stock Item';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit ${entityName}` : `New ${entityName}`}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. MacBook Pro M3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Laptops" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === 'stock' && (
              <FormField
                control={form.control as any}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEditing && type === 'inventory' && (
              <FormField
                control={form.control as any}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="In Use">In Use</SelectItem>
                        <SelectItem value="Broken">Broken</SelectItem>
                        <SelectItem value="Retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
