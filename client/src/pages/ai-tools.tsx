import { SmartTasks } from "@/components/smart-tasks";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, LayoutGrid, Sparkles } from "lucide-react";

export default function AiToolsPage() {
  return (
    <div className="space-y-8">
      {/* Featured AI Tools Section */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold mb-4">Featured AI Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* App Generator Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                App Generator
              </CardTitle>
              <CardDescription className="text-blue-100">
                AI-powered application development
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Generate complete application code with AI. Describe your app and let our AI build it for you.
              </p>
              <Link href="/app-generator">
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Launch App Generator
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* AI Models Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                AI Models
              </CardTitle>
              <CardDescription className="text-purple-100">
                Explore trending AI models
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Discover and explore the latest AI models from Hugging Face for various use cases and applications.
              </p>
              <Link href="/ai-models">
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Browse AI Models
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Smart Tasks Section */}
      <SmartTasks />
    </div>
  );
}