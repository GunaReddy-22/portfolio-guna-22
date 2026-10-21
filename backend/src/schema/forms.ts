import { z } from 'zod';

export const FormFieldTypeSchema = z.enum([
  'text',
  'email',
  'tel',
  'textarea',
  'select',
  'checkbox',
  'url',
  'rating',
  'number',
]);

export const FormFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  label: z.string().min(1),
  type: FormFieldTypeSchema,
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  helpText: z.string().optional(),
});

export const FormDefinitionSchema = z.object({
  id: z.string().optional(),
  siteId: z.string().default('gunasai-in'),
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  submitButtonText: z.string().default('Submit Feedback'),
  successMessage: z.string().default('Thank you for your feedback! It helps improve the app.'),
  notificationEmail: z.string().email().optional().or(z.literal('')),
  fields: z.array(FormFieldSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const FormSubmissionSchema = z.object({
  id: z.string(),
  siteId: z.string().default('gunasai-in'),
  formId: z.string(),
  formSlug: z.string(),
  data: z.record(z.any()),
  status: z.enum(['unread', 'reviewed', 'archived']).default('unread'),
  ipHash: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string().optional(),
});

export type FormFieldType = z.infer<typeof FormFieldTypeSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormDefinition = z.infer<typeof FormDefinitionSchema>;
export type FormSubmission = z.infer<typeof FormSubmissionSchema>;

