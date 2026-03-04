'use client';

import { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { KpiCriterion, KpiAngle } from '@/types';

const schema = z.object({
  angle: z.enum(['commitment', 'contribution', 'character', 'competency']),
  name: z.string().min(1, 'Name is required'),
  nameEn: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  weight: z.string().refine(v => parseFloat(v) > 0, 'Weight must be > 0'),
  minScore: z.coerce.number().int().min(0),
  maxScore: z.coerce.number().int().max(100),
  scoringGuide: z.string(),
  isRequired: z.boolean().default(true),
  notes: z.string().optional().nullable(),
}).refine(d => d.minScore < d.maxScore, { message: 'Min score must be less than max', path: ['maxScore'] });

export type CriterionFormValues = z.infer<typeof schema>;

interface CriterionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAngle?: KpiAngle;
  criterion?: KpiCriterion | null;
  onSave: (values: CriterionFormValues) => void;
}

const ANGLE_OPTIONS: { value: KpiAngle; label: string }[] = [
  { value: 'commitment', label: 'Commitment' },
  { value: 'contribution', label: 'Contribution' },
  { value: 'character', label: 'Character' },
  { value: 'competency', label: 'Competency' },
];

export function CriterionForm({ open, onOpenChange, defaultAngle, criterion, onSave }: CriterionFormProps) {
  const form = useForm<CriterionFormValues>({
    resolver: zodResolver(schema) as Resolver<CriterionFormValues>,
    defaultValues: {
      angle: defaultAngle ?? 'commitment',
      name: '',
      nameEn: '',
      description: '',
      weight: '10',
      minScore: 0,
      maxScore: 10,
      scoringGuide: '',
      isRequired: true,
      notes: '',
    },
  });

  useEffect(() => {
    if (criterion) {
      form.reset({
        angle: criterion.angle,
        name: criterion.name,
        nameEn: criterion.nameEn ?? '',
        description: criterion.description ?? '',
        weight: criterion.weight,
        minScore: criterion.minScore,
        maxScore: criterion.maxScore,
        scoringGuide: criterion.scoringGuide,
        isRequired: criterion.isRequired,
        notes: criterion.notes ?? '',
      });
    } else {
      form.reset({
        angle: defaultAngle ?? 'commitment',
        name: '',
        nameEn: '',
        description: '',
        weight: '10',
        minScore: 0,
        maxScore: 10,
        scoringGuide: '',
        isRequired: true,
        notes: '',
      });
    }
  }, [criterion, defaultAngle, open, form]);

  function handleSubmit(values: CriterionFormValues) {
    onSave(values);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{criterion ? 'Edit Criterion' : 'Add Criterion'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField control={form.control} name="angle" render={({ field }) => (
              <FormItem>
                <FormLabel>Angle</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {ANGLE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Primary)</FormLabel>
                <FormControl><Input placeholder="e.g. 出席率：Attendance Rate" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="nameEn" render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English) <span className="text-slate-400">(optional)</span></FormLabel>
                <FormControl><Input placeholder="English name" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-3 gap-3">
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (%)</FormLabel>
                  <FormControl><Input type="number" min="0.1" max="100" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="minScore" render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Score</FormLabel>
                  <FormControl><Input type="number" min="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="maxScore" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Score</FormLabel>
                  <FormControl><Input type="number" max="100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description <span className="text-slate-400">(optional)</span></FormLabel>
                <FormControl><Textarea rows={2} placeholder="What this criterion measures..." {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="scoringGuide" render={({ field }) => (
              <FormItem>
                <FormLabel>Scoring Guide</FormLabel>
                <FormControl>
                  <Textarea rows={5} placeholder="10 = Full attendance, no late/early&#10;8 = 1-2 late instances&#10;6 = 3-4 late instances&#10;..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes <span className="text-slate-400">(optional)</span></FormLabel>
                <FormControl><Textarea rows={2} {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isRequired" render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <Label className="cursor-pointer">Required criterion (must be rated to submit)</Label>
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {criterion ? 'Save Changes' : 'Add Criterion'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
