import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitContactForm } from '@/api/client';
import { toast } from 'sonner';
import type { ContactFormData } from '@/types';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  roleInterest: z.enum(['Student', 'Lecturer', 'Partner']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  honeypot: z.string().max(0).optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const CONTACT_INFO = [
  {
    icon: Mail,
    title: 'Email',
    detail: 'hello@compass.edu',
    description: 'We reply within 24 hours',
  },
  {
    icon: MapPin,
    title: 'Location',
    detail: 'University Avenue, Building C',
    description: 'Douala, Cameroon',
  },
  {
    icon: Phone,
    title: 'Phone',
    detail: '+237 6 00 00 00 00',
    description: 'Mon-Fri, 8AM - 5PM',
  },
];

export function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      roleInterest: 'Student',
      message: '',
      honeypot: '',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const formData: ContactFormData = {
        name: data.name,
        email: data.email,
        roleInterest: data.roleInterest,
        message: data.message,
        honeypot: data.honeypot,
      };
      const response = await submitContactForm(formData);
      if (response.success) {
        toast.success(response.message || 'Message sent successfully!');
        reset();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to send message. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] py-16 md:py-24 px-4">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
            <Mail className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Have a question about Compass? Want to learn more about partnerships?
            We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Honeypot — hidden from real users */}
                  <div className="sr-only" aria-hidden="true">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      tabIndex={-1}
                      autoComplete="off"
                      {...register('honeypot')}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        {...register('name')}
                        aria-invalid={!!errors.name}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        {...register('email')}
                        aria-invalid={!!errors.email}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Role Interest */}
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a...</Label>
                    <Select
                      defaultValue="Student"
                      onValueChange={(value) =>
                        setValue('roleInterest', value as ContactFormValues['roleInterest'])
                      }
                    >
                      <SelectTrigger id="role" aria-label="Select your role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Lecturer">Lecturer</SelectItem>
                        <SelectItem value="Partner">Partner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help you..."
                      rows={5}
                      {...register('message')}
                      aria-invalid={!!errors.message}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                    aria-label="Send message"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-4">
            {CONTACT_INFO.map((item) => (
              <Card key={item.title}>
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {item.detail}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-secondary/20 bg-secondary/5">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-1">Partnership Inquiries</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Interested in bringing Compass to your institution? We offer
                  flexible partnership models for universities and educational
                  organizations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}