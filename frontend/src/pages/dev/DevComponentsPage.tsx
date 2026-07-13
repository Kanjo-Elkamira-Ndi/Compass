import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, AlertTriangle, CheckCircle } from "lucide-react";

export default function DevComponentsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Design System</h1>
        <p className="text-muted-foreground">
          All shadcn/ui primitives and design tokens in one place.
        </p>
      </div>

      <Separator />

      {/* Colour Tokens */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Colour Tokens</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Primary", classes: "bg-primary text-primary-foreground", hex: "#1e3a8a" },
            { name: "Secondary", classes: "bg-secondary text-secondary-foreground", hex: "#7c3aed" },
            { name: "Destructive", classes: "bg-destructive text-destructive-foreground", hex: "#dc2626" },
            { name: "Warning", classes: "bg-warning text-warning-foreground", hex: "#d97706" },
            { name: "Success", classes: "bg-success text-success-foreground", hex: "#16a34a" },
            { name: "Muted", classes: "bg-muted text-muted-foreground", hex: "#f1f5f9" },
            { name: "Accent", classes: "bg-accent text-accent-foreground", hex: "#f1f5f9" },
            { name: "Card", classes: "bg-card text-card-foreground border", hex: "#ffffff" },
          ].map((t) => (
            <div key={t.name} className="space-y-2">
              <div className={`h-16 rounded-lg ${t.classes} flex items-end p-2`}>
                <span className="text-xs font-mono">{t.hex}</span>
              </div>
              <p className="text-sm font-medium">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" className="h-10 w-10">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <Separator />

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Badge</h2>
        <div className="flex flex-wrap gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge className="bg-success text-success-foreground">Success</Badge>
          <Badge className="bg-warning text-warning-foreground">Warning</Badge>
        </div>
      </section>

      <Separator />

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This is the card content area. It can hold any content.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Another Card</CardTitle>
              <CardDescription>With different content.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge>Tag 1</Badge>
                <Badge variant="secondary">Tag 2</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Alert */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Alert</h2>
        <div className="space-y-3">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Your changes have been saved.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong.</AlertDescription>
          </Alert>
        </div>
      </section>

      <Separator />

      {/* Form Elements */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Form Elements</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="select">Programme</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtech-se">M.Tech Software Engineering</SelectItem>
                <SelectItem value="mba">MBA</SelectItem>
                <SelectItem value="bba">BBA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" placeholder="Type your message here." />
          </div>
        </div>
      </section>

      <Separator />

      {/* Avatar */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Avatar</h2>
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt="User" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">AB</AvatarFallback>
          </Avatar>
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-success/10 text-success">CD</AvatarFallback>
          </Avatar>
        </div>
      </section>

      <Separator />

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Table</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Alice Nkomo</TableCell>
                <TableCell>Student</TableCell>
                <TableCell><Badge className="bg-success text-success-foreground">Active</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Dr. Fouda</TableCell>
                <TableCell>Lecturer</TableCell>
                <TableCell><Badge className="bg-success text-success-foreground">Active</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Bob Tamba</TableCell>
                <TableCell>Student</TableCell>
                <TableCell><Badge className="bg-warning text-warning-foreground">At Risk</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      </section>

      <Separator />

      {/* Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Skeleton</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </section>

      <Separator />

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs</h2>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Overview tab content goes here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="details">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Details tab content goes here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Settings tab content goes here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      {/* Accordion */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Accordion</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is Compass?</AccordionTrigger>
            <AccordionContent>
              Compass is an AI-powered academic advisor for YIBS students.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How does the chatbot work?</AccordionTrigger>
            <AccordionContent>
              The chatbot uses OpenAI GPT-4o-mini with optional RAG grounding
              from university documents.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Is my data secure?</AccordionTrigger>
            <AccordionContent>
              Yes. All data is stored in PostgreSQL with encrypted tokens and
              role-based access control.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Separator />

      {/* Shells Preview */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Layout Shells</h2>
        <p className="text-sm text-muted-foreground">
          PublicLayout and AppShell are rendered via routes:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/</code>{" "}
            — renders inside PublicLayout (top nav + footer)
          </li>
          <li>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
              /dev/app-shell
            </code>{" "}
            — renders inside AppShell (sidebar + top bar)
          </li>
        </ul>
      </section>
    </div>
  );
}
