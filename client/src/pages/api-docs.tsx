import React, { useState, useEffect } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyIcon, CheckIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const ApiDocs: React.FC = () => {
  const [swagger, setSwagger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchSwagger = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/swagger.json");
        if (!response.ok) {
          throw new Error(`Failed to load API documentation: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setSwagger(data);
      } catch (err: any) {
        console.error("Error loading API documentation:", err);
        setError(err.message || "Failed to load API documentation");
      } finally {
        setLoading(false);
      }
    };

    fetchSwagger();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied({ ...copied, [id]: true });
        toast({
          title: "Copied to clipboard",
          description: "The code snippet has been copied to your clipboard.",
          duration: 3000,
        });
        setTimeout(() => {
          setCopied((prev) => ({ ...prev, [id]: false }));
        }, 2000);
      },
      (err) => {
        console.error("Could not copy text: ", err);
        toast({
          title: "Failed to copy",
          description: "There was an error copying to clipboard.",
          variant: "destructive",
        });
      }
    );
  };

  const codeExamples = {
    javascript: `import axios from 'axios';

// Configure API key authorization
const axiosInstance = axios.create({
  baseURL: 'https://api.appmo.com',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// Example: Get all tasks
async function getTasks() {
  try {
    const response = await axiosInstance.get('/api/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

// Example: Create a new task
async function createTask(task) {
  try {
    const response = await axiosInstance.post('/api/tasks', task);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}`,
    python: `import requests

# Configure API key authorization
API_KEY = 'YOUR_API_KEY'
BASE_URL = 'https://api.appmo.com'
HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# Example: Get all tasks
def get_tasks():
    try:
        response = requests.get(f'{BASE_URL}/api/tasks', headers=HEADERS)
        response.raise_for_status()  # Raise exception for non-2xx responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error fetching tasks: {e}')
        raise

# Example: Create a new task
def create_task(task):
    try:
        response = requests.post(f'{BASE_URL}/api/tasks', json=task, headers=HEADERS)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error creating task: {e}')
        raise`,
    java: `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.json.JSONObject;

public class AppmoApiClient {
    private static final String API_KEY = "YOUR_API_KEY";
    private static final String BASE_URL = "https://api.appmo.com";
    private final HttpClient client;

    public AppmoApiClient() {
        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    // Example: Get all tasks
    public String getTasks() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/tasks"))
                .header("Authorization", "Bearer " + API_KEY)
                .header("Content-Type", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to get tasks: " + response.statusCode());
        }
        
        return response.body();
    }

    // Example: Create a new task
    public String createTask(JSONObject task) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/tasks"))
                .header("Authorization", "Bearer " + API_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(task.toString()))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 201) {
            throw new RuntimeException("Failed to create task: " + response.statusCode());
        }
        
        return response.body();
    }
}`
  };

  const installationSteps = {
    npm: `# Install Appmo JavaScript SDK
npm install appmo-sdk`,
    pip: `# Install Appmo Python SDK
pip install appmo-sdk`,
    maven: `<!-- Add Appmo Java SDK dependency -->
<dependency>
  <groupId>com.appmo</groupId>
  <artifactId>appmo-sdk</artifactId>
  <version>1.0.0</version>
</dependency>`
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-6">Appmo API Documentation</h1>
      <p className="text-xl mb-8">
        The Appmo API allows you to integrate task management, bidding, messaging, and AI capabilities into your applications.
      </p>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="sdk">SDK & Examples</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  How to authenticate with the Appmo API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The Appmo API uses API keys for authentication. All API requests must include your API key in the Authorization header:
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>Authorization: Bearer YOUR_API_KEY</code>
                </pre>
                <p className="mt-4">
                  You can generate API keys in the "API Keys" tab or through your profile settings in the Appmo application.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rate Limiting</CardTitle>
                <CardDescription>
                  Understand API usage limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  The Appmo API implements rate limiting to ensure fair usage and system stability. Rate limits vary by endpoint:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Authentication endpoints: 10 requests per minute</li>
                  <li>Task endpoints: 60 requests per minute</li>
                  <li>AI-powered endpoints: 20 requests per minute</li>
                </ul>
                <p className="mt-4">
                  Rate limit information is included in the response headers:
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1619291451</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Base URL</CardTitle>
                <CardDescription>
                  API endpoint base URLs for different environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2">The base URL for all API endpoints is:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>https://api.appmo.com</code>
                </pre>
                <p className="mt-4 mb-2">For testing and development, use:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>https://staging.api.appmo.com</code>
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Format</CardTitle>
                <CardDescription>
                  Understanding API response structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  All API responses are returned in JSON format. Successful responses typically have the following structure:
                </p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{JSON.stringify({
                    "data": {
                      "id": 1,
                      "title": "Example Task",
                      "description": "This is an example task"
                    }
                  }, null, 2)}</code>
                </pre>
                <p className="mt-4 mb-2">Error responses follow this format:</p>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                  <code>{JSON.stringify({
                    "error": {
                      "code": "invalid_request",
                      "message": "The request was unacceptable",
                      "details": "Title is required"
                    }
                  }, null, 2)}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="endpoints">
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-[500px] w-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
          ) : error ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-destructive">Error Loading API Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
                <Button 
                  className="mt-4" 
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : swagger ? (
            <>
              <div className="mb-6">
                <p className="text-lg mb-4">
                  Browse and test the Appmo API endpoints below. The interactive documentation allows you to make requests and see responses directly.
                </p>
              </div>
              <div className="swagger-container rounded-lg border overflow-hidden">
                <SwaggerUI spec={swagger} />
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No API Documentation Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p>The API documentation could not be loaded. Please try again later.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sdk">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SDK Installation</CardTitle>
                <CardDescription>
                  Install the Appmo SDK for your programming language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="npm">
                  <TabsList className="mb-4">
                    <TabsTrigger value="npm">JavaScript (npm)</TabsTrigger>
                    <TabsTrigger value="pip">Python (pip)</TabsTrigger>
                    <TabsTrigger value="maven">Java (Maven)</TabsTrigger>
                  </TabsList>
                  {Object.entries(installationSteps).map(([key, code]) => (
                    <TabsContent key={key} value={key}>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(code, `install-${key}`)}
                        >
                          {copied[`install-${key}`] ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>
                  Examples of using the Appmo API in different languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript">
                  <TabsList className="mb-4">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="java">Java</TabsTrigger>
                  </TabsList>
                  {Object.entries(codeExamples).map(([key, code]) => (
                    <TabsContent key={key} value={key}>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                          <code>{code}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(code, `example-${key}`)}
                        >
                          {copied[`example-${key}`] ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <CopyIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhooks</CardTitle>
                <CardDescription>
                  Receive real-time updates from Appmo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Appmo can send real-time updates to your application using webhooks. To use webhooks:
                </p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Register a webhook URL in your API settings</li>
                  <li>Choose which events you want to receive</li>
                  <li>Implement an endpoint to receive webhook payloads</li>
                </ol>
                <p className="mt-4 mb-2">Example webhook payload for a task update:</p>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                    <code>{JSON.stringify({
                      "event": "task.updated",
                      "data": {
                        "id": 123,
                        "title": "Updated Task Title",
                        "description": "This task was just updated",
                        "userId": 1,
                        "updated_at": "2025-04-18T10:30:00Z"
                      }
                    }, null, 2)}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(JSON.stringify({
                      "event": "task.updated",
                      "data": {
                        "id": 123,
                        "title": "Updated Task Title",
                        "description": "This task was just updated",
                        "userId": 1,
                        "updated_at": "2025-04-18T10:30:00Z"
                      }
                    }, null, 2), "webhook-example")}
                  >
                    {copied["webhook-example"] ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="keys">
          <Card>
            <CardHeader>
              <CardTitle>Managing API Keys</CardTitle>
              <CardDescription>
                Generate and manage your API keys for accessing the Appmo API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">API Key Security Best Practices</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Never share your API keys or expose them in client-side code</li>
                    <li>Use environment variables to store API keys in your applications</li>
                    <li>Create separate API keys for different applications or environments</li>
                    <li>Regularly rotate your API keys for enhanced security</li>
                    <li>Revoke unused or compromised API keys immediately</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">How to Create an API Key</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Log in to your Appmo account</li>
                    <li>Go to your Profile settings</li>
                    <li>Navigate to the "API Keys" tab</li>
                    <li>Click "Create New API Key"</li>
                    <li>Give your key a descriptive name (e.g., "Development", "Production")</li>
                    <li>Copy and securely store your API key (it will only be shown once)</li>
                  </ol>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">API Key Format</h3>
                  <p className="mb-2">Appmo API keys follow this format:</p>
                  <pre className="bg-muted p-4 rounded-md">
                    <code>appmo_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                  </pre>
                  <p className="mt-4">
                    Note: You must include the API key in the Authorization header as a Bearer token.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">API Key Permissions</h3>
                  <p className="mb-4">
                    All API keys have the same permissions as the user who created them. API keys can:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Access and manage tasks owned by the user</li>
                    <li>Create and update task templates</li>
                    <li>Send and receive messages</li>
                    <li>Access AI capabilities (subject to usage limits)</li>
                    <li>View and place bids on public tasks</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiDocs;