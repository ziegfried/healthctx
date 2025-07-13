Great—here’s a concise mapping of HealthCtx to shadcn/ui with Tailwind tokens, component picks, and implementation snippets so engineering can build fast with design parity.

Design tokens mapped to Tailwind/shadcn
Tailwind config (extend theme)
- Colors: Map product palette into CSS vars the shadcn theme consumes.

Code: tailwind.config.ts (excerpt)
```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        // Product data colors
        hc: {
          lipids: "#8B5CF6",
          a1c: "#EF4444",
          weight: "#22C55E",
          steps: "#06B6D4",
          success: "#16A34A",
          warning: "#F59E0B",
          danger: "#DC2626",
          info: "#0EA5E9"
        }
      },
      borderRadius: {
        lg: "12px", // modals
        md: "8px", // cards
        sm: "6px"
      },
      boxShadow: {
        "card-sm":
          "0 1px 2px 0 rgba(0,0,0,0.06), 0 1px 3px 0 rgba(0,0,0,0.04)",
        "card-lg": "0 8px 24px rgba(0,0,0,0.08)"
      },
      spacing: {
        4.5: "18px",
        7.5: "30px",
        10.5: "42px"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
} satisfies Config;
```

Global CSS theme tokens (match our palette)
Code: src/app/globals.css (excerpt)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 221 83% 53%; /* #2563EB */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 72% 51%; /* #DC2626 */
    --destructive-foreground: 0 0% 98%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 53%;

    --radius: 0.5rem; /* 8px card corner */
  }

  .dark {
    --background: 222 47% 7%;
    --foreground: 0 0% 98%;
    --card: 222 47% 9%;
    --card-foreground: 0 0% 98%;
    --popover: 222 47% 9%;
    --popover-foreground: 0 0% 98%;
    --primary: 221 83% 60%;
    --primary-foreground: 222 47% 11%;
    --secondary: 222 14% 15%;
    --secondary-foreground: 0 0% 98%;
    --muted: 222 14% 15%;
    --muted-foreground: 217 12% 65%;
    --accent: 222 14% 15%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 72% 40%;
    --destructive-foreground: 0 0% 98%;
    --border: 222 14% 20%;
    --input: 222 14% 20%;
    --ring: 221 83% 60%;
  }
}
```

Component selections in shadcn/ui
- App shell: Sheet + Navbar using Button, Badge, Separator.
- Cards: Card with header/content/footer; states via border and bg utilities.
- Tabs: Tabs for Labs families.
- Lists/Tables: Table for shares and imports; ScrollArea for long panes.
- Forms: Form, Input, Select, Checkbox, Toggle, Textarea, DatePicker (community).
- Drawer/Modal: Dialog, Drawer, Sheet as needed.
- Pills/Badges: Badge for ConfidencePill, EvidenceBadge.
- Toast: use Sonner or built-in toast for alerts and OCR errors.

Reusable primitives
Code: src/components/ui/confidence-pill.tsx
```tsx
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Level = "low" | "medium" | "high";

export function ConfidencePill({
  level,
  className
}: {
  level: Level;
  className?: string;
}) {
  const map: Record<Level, string> = {
    low: "bg-orange-100 text-orange-800 dark:bg-orange-900/40",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/40",
    high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40"
  };
  return (
    <Badge
      variant="secondary"
      className={cn("rounded-full px-2.5 py-0.5 text-xs", map[level], className)}
    >
      {level}
    </Badge>
  );
}
```

Code: src/components/ui/correlation-badge.tsx
```tsx
import { Badge } from "@/components/ui/badge";

export function CorrelationBadge({
  r,
  p
}: {
  r: number;
  p?: number;
}) {
  const strength =
    Math.abs(r) >= 0.7 ? "strong" : Math.abs(r) >= 0.4 ? "moderate" : "weak";
  return (
    <Badge variant="outline" className="font-mono text-xs">
      r={r.toFixed(2)} {p !== undefined ? ` p≈${p.toFixed(2)}` : ""} · {strength}
    </Badge>
  );
}
```

Home overview scaffold
Code: src/app/(app)/page.tsx
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CorrelationBadge } from "@/components/ui/correlation-badge";

export default function Home() {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <div className="ml-auto flex gap-2">
          <Button>Upload</Button>
          <Button variant="secondary">Connect</Button>
          <Button variant="secondary">Ask AI</Button>
          <Button variant="outline">Share</Button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8">
          <CardHeader>
            <CardTitle>Health Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "BP 7d", value: "124/80", trend: "up" },
              { label: "HR Rest", value: "60", trend: "up" },
              { label: "Weight", value: "78.8 kg", trend: "down" },
              { label: "Sleep", value: "6.6 h", trend: "down" }
            ].map((m) => (
              <div key={m.label} className="space-y-1">
                <div className="text-sm text-muted-foreground">{m.label}</div>
                <div className="text-xl font-semibold">{m.value}</div>
                <div className="h-8 rounded bg-muted" />
              </div>
            ))}
            <div className="col-span-full text-sm text-muted-foreground">
              Notable: Slight sleep decrease; resting HR +2 bpm.
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Imports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">lipid_panel_2025.pdf</div>
                <div className="text-xs text-muted-foreground">
                  Extracted (High)
                </div>
              </div>
              <div className="text-xs">LDL 138 (H)</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">cbc_2024.png</div>
                <div className="text-xs text-muted-foreground">
                  Needs review
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Insights & Correlations</CardTitle>
            <CorrelationBadge r={0.42} />
          </CardHeader>
          <CardContent>
            <div className="text-sm">Sleep ↓ ↔ Resting HR ↑ (last 90d)</div>
            <div className="mt-2 h-24 rounded bg-muted" />
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="font-medium">Endocrinology in 5 days</div>
              <div className="text-sm text-muted-foreground">
                3 talking points ready
              </div>
            </div>
            <Button size="sm" variant="secondary">
              Open Visit Packet
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Care Team & Sharing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Dr. Lee — Read-only</div>
            <div>Partner — View + Comment</div>
          </CardContent>
        </Card>

        <Card className="col-span-12 lg:col-span-4">
          <CardHeader>
            <CardTitle>Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>A1C &lt; 6.5%</span>
                <span>62%</span>
              </div>
              <div className="h-2 w-full rounded bg-muted">
                <div className="h-2 rounded bg-hc-a1c" style={{ width: "62%" }} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Sleep 7–8h</span>
                <span>74%</span>
              </div>
              <div className="h-2 w-full rounded bg-muted">
                <div className="h-2 rounded bg-hc-steps" style={{ width: "74%" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

Labs explorer scaffold
Code: src/app/(app)/labs/page.tsx
```tsx
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Labs() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="col-span-12 md:col-span-3">
        <Tabs defaultValue="lipids" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metabolic">Metabolic</TabsTrigger>
            <TabsTrigger value="cbc">CBC</TabsTrigger>
            <TabsTrigger value="lipids">Lipids</TabsTrigger>
            <TabsTrigger value="endocrine">Endocrine</TabsTrigger>
          </TabsList>
          <TabsContent value="lipids" className="mt-4 space-y-2">
            {["LDL-C", "HDL-C", "Triglycerides", "Non-HDL-C"].map((t) => (
              <Card key={t}>
                <CardContent className="py-2 text-sm">{t}</CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </aside>

      <section className="col-span-12 md:col-span-9">
        <Card>
          <CardHeader>
            <CardTitle>LDL-C</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Unit: mg/dL • Ref: &lt; 100 • Target: &lt; 70 • Sources: Quest, EHR
            </div>
            <div className="h-72 w-full rounded-md bg-indigo-50 dark:bg-indigo-950/40" />
            <div className="grid gap-2 md:grid-cols-3">
              <Card>
                <CardContent className="py-3 text-sm">
                  Last 6m avg: 132 mg/dL
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-sm">
                  Recent change: +8% vs prior 3m
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-sm">
                  Fasting toggles, flags
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary">
                What does LDL indicate?
              </Button>
              <Button size="sm" variant="secondary">
                Why elevated on Jul 20?
              </Button>
              <Button size="sm" variant="secondary">
                Plan to reduce LDL?
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
```

AI console scaffold
Code: src/app/(app)/ai/page.tsx
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function AIConsole() {
  return (
    <div className="grid grid-cols-12 gap-4">
      <section className="col-span-12 xl:col-span-9">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>AI Console</CardTitle>
            <div className="flex gap-2">
              {["Explain", "Correlate", "Research", "Summarize", "Prep"].map(
                (m) => (
                  <Button key={m} variant="outline" size="sm">
                    {m}
                  </Button>
                )
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="rounded-md border p-3 text-sm">
                User: Correlate A1C with weight and steps last 12 months.
              </div>
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                AI: r(A1C, Weight)=0.36; r(A1C, Steps)=-0.41.
              </div>
            </div>
            <Textarea placeholder="Ask a question…" />
            <div className="flex justify-end">
              <Button>Send</Button>
            </div>
          </CardContent>
        </Card>
      </section>
      <aside className="col-span-12 xl:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Toolbelt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>ASCVD Risk</div>
            <div>Talking Points</div>
            <div>Follow-up Checklist</div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
```

Upload and extraction modal
Code: src/components/upload-extract-dialog.tsx
```tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function UploadExtractDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [files] = useState([
    { name: "lipid_panel_2025.pdf", status: "Parsing… 62%" },
    { name: "cbc_2024.png", status: "Queued" }
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Files</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-5">
            <div className="rounded-md border p-4">
              <div className="h-28 rounded border border-dashed" />
              <ScrollArea className="mt-4 h-40">
                <ul className="space-y-2 text-sm">
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center justify-between">
                      <span className="truncate">{f.name}</span>
                      <span className="text-muted-foreground">{f.status}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          </div>
          <div className="col-span-12 md:col-span-7">
            <div className="rounded-md border p-4">
              <div className="mb-3 text-sm font-medium">Extraction Preview</div>
              <div className="space-y-2 text-sm">
                <div>Title: Lipid Panel | Date: 2025-07-19 | Lab: Quest</div>
                <div>LDL-C: 138 mg/dL (H) • Ref: &lt; 100</div>
                <div>HDL-C: 52 mg/dL • Ref: &gt; 40</div>
                <div>Trig: 150 mg/dL • Ref: &lt; 150</div>
                <div>Confidence: High</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="outline">
                  Map Units
                </Button>
                <Button size="sm" variant="outline">
                  Fasting
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Save & Normalize</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

Sharing table
Code: src/app/(app)/sharing/page.tsx
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Sharing() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Shares</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Dr. Lee (email)</TableCell>
                <TableCell>Last 6m Labs & Vitals</TableCell>
                <TableCell>View, Comment</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost">
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Partner</TableCell>
                <TableCell>Entire record</TableCell>
                <TableCell>View</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost">
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>New Share</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input placeholder="Email/phone/provider portal" />
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Entire record</SelectItem>
              <SelectItem value="time">Time-bounded</SelectItem>
              <SelectItem value="specific">Specific categories</SelectItem>
            </SelectContent>
          </Select>
          <div className="col-span-full grid grid-cols-2 gap-2">
            {["View", "Comment", "Upload", "Request data"].map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm">
                <Checkbox /> {p}
              </label>
            ))}
          </div>
          <div className="col-span-full flex justify-end gap-2">
            <Button variant="outline">Preview</Button>
            <Button>Send Invite</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

Notes
- All components use shadcn/ui primitives; theming via CSS vars preserves brand.
- Replace chart placeholders with a chart lib (e.g., Recharts or VisX) and map series to hc colors.
- For forms, use react-hook-form + zod resolver; shadcn’s Form components pair well.
- Use Dialog for conflict resolution, Sheet for right-side extraction editor, Drawer for mobile filters.
- For accessibility and trust, add descriptions under AI outputs and link to citations.

If you want, I can produce a small repo scaffold (Next.js + shadcn/ui pre-installed) with these pages wired, and a basic data model to mock labs and insights.
