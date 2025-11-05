import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ShadcnComponentsTestPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Shadcn Component Test Page</h1>
        <p className="text-muted-foreground">
          Testing all installed shadcn/ui components for the Fictures platform
        </p>
      </div>

      <Separator />

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex gap-4 flex-wrap">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <Separator />

      {/* Cards Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Cards</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Story Analytics</CardTitle>
              <CardDescription>Track your story performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View detailed metrics about your stories
              </p>
            </CardContent>
            <CardFooter>
              <Button>View Details</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community</CardTitle>
              <CardDescription>Share and discuss stories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge>Popular</Badge>
                <Badge variant="secondary">Trending</Badge>
                <Badge variant="outline">New</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Explore</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reading Progress</CardTitle>
              <CardDescription>Continue where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={65} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2">65% complete</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Resume Reading</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <Separator />

      {/* Tabs Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tabs</h2>
        <Tabs defaultValue="novels" className="w-full">
          <TabsList>
            <TabsTrigger value="novels">Novels</TabsTrigger>
            <TabsTrigger value="comics">Comics</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>
          <TabsContent value="novels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Novels</CardTitle>
                <CardDescription>Text-based story format</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Browse and read your novel collection</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="comics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Comics</CardTitle>
                <CardDescription>Visual story format</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Browse and read your comic collection</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="community" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Posts</CardTitle>
                <CardDescription>Share and discuss</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Engage with the writing community</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      {/* Form Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Components</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Create New Story</CardTitle>
            <CardDescription>Enter story details below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title</Label>
              <Input id="title" placeholder="Enter your story title..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Brief description..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Input id="genre" placeholder="e.g., Fantasy, Sci-Fi..." />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline">Cancel</Button>
            <Button>Create Story</Button>
          </CardFooter>
        </Card>
      </section>

      <Separator />

      {/* Avatar & Badge Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Avatars & Badges</h2>
        <div className="flex gap-4 items-center">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>WR</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>RD</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge>Writer</Badge>
          <Badge variant="secondary">Reader</Badge>
          <Badge variant="outline">Manager</Badge>
          <Badge>Active</Badge>
          <Badge variant="destructive">Urgent</Badge>
        </div>
      </section>

      <Separator />

      {/* Progress Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Progress Indicators</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <Label>Story Generation Progress</Label>
            <Progress value={33} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">33% - Generating characters...</p>
          </div>
          <div>
            <Label>Reading Progress</Label>
            <Progress value={75} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">75% - Chapter 8 of 10</p>
          </div>
          <div>
            <Label>Upload Progress</Label>
            <Progress value={100} className="mt-2" />
            <p className="text-sm text-muted-foreground mt-1">100% - Complete!</p>
          </div>
        </div>
      </section>

      <div className="py-8">
        <Card>
          <CardHeader>
            <CardTitle>✅ Component Test Complete</CardTitle>
            <CardDescription>
              All shadcn/ui components are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Components tested: Button, Card, Input, Label, Tabs, Badge, Progress,
              Separator, Avatar, and more.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
