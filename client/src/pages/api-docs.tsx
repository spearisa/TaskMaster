import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clipboard, Check, Copy, ExternalLink, Lock, Unlock, Save, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation } from '@tanstack/react-query';

// Type for API Key
interface ApiKey {
  id: number;
  name: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  revoked: string;
}

export default function ApiDocsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [filteredEndpoints, setFilteredEndpoints] = useState<any[]>([]);
  const [swaggerDocs, setSwaggerDocs] = useState<any>({ paths: {}, tags: [] });
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch API keys
  const {
    data: apiKeys = [],
    isLoading: isLoadingKeys,
    refetch: refetchApiKeys
  } = useQuery<ApiKey[]>({
    queryKey: ['/api/keys'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/keys');
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching API keys:', error);
        return [];
      }
    },
    enabled: !!user
  });

  // Create new API key
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest('POST', '/api/keys', { name });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'API Key Created',
        description: 'Your new API key has been generated successfully.',
      });
      setNewKeyName('');
      refetchApiKeys();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete API key
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'API Key Revoked',
        description: 'The API key has been revoked successfully.',
      });
      refetchApiKeys();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Revoking API Key',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Load Swagger documentation
  useEffect(() => {
    const fetchSwaggerDocs = async () => {
      try {
        const response = await fetch('/appmo-api-swagger.json');
        const data = await response.json();
        console.log('Swagger docs loaded:', Object.keys(data.paths).length, 'paths in Swagger doc');
        setSwaggerDocs(data);
        
        // Extract endpoints from Swagger docs
        const extractedEndpoints = [];
        for (const [path, methods] of Object.entries(data.paths)) {
          for (const [method, details] of Object.entries(methods as Record<string, any>)) {
            extractedEndpoints.push({
              path,
              method: method.toUpperCase(),
              summary: details.summary || '',
              description: details.description || '',
              tags: details.tags || [],
              requiresAuth: details.security && details.security.some((s: any) => s.BearerAuth),
              responses: details.responses || {},
            });
          }
        }
        
        console.log('Extracted', extractedEndpoints.length, 'endpoints from Swagger paths');
        setEndpoints(extractedEndpoints);
        setFilteredEndpoints(extractedEndpoints);
      } catch (error) {
        console.error('Error fetching API documentation:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSwaggerDocs();
  }, []);

  // Filter endpoints based on search
  useEffect(() => {
    if (!endpoints.length) return;
    
    if (!filter) {
      setFilteredEndpoints(endpoints);
      return;
    }
    
    const lowerFilter = filter.toLowerCase();
    const filtered = endpoints.filter(endpoint => 
      endpoint.path.toLowerCase().includes(lowerFilter) || 
      endpoint.summary.toLowerCase().includes(lowerFilter) || 
      endpoint.description.toLowerCase().includes(lowerFilter) ||
      endpoint.tags.some((tag: string) => tag.toLowerCase().includes(lowerFilter)) ||
      endpoint.method.toLowerCase().includes(lowerFilter)
    );
    
    setFilteredEndpoints(filtered);
  }, [filter, endpoints]);

  // Copy API key to clipboard
  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({
      title: 'Copied to clipboard',
      description: 'API key has been copied to your clipboard.',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Create new API key
  const generateApiKey = async () => {
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate(newKeyName);
  };

  // Delete API key
  const deleteApiKey = (id: number) => {
    if (confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      deleteKeyMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Appmo API Documentation</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Appmo API</CardTitle>
              <CardDescription>
                Build integrations with the Appmo platform for task management, messaging, and AI assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  To use the Appmo API, you'll need an API key. You can generate one in the 
                  <Button 
                    variant="link" 
                    className="px-1"
                    onClick={() => setActiveTab('keys')}
                  >
                    API Keys
                  </Button> 
                  section.
                </p>
                
                <h4 className="text-lg font-semibold mb-2">Base URL</h4>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm mb-4">
                  https://api.appmo.com
                </div>
                
                <h4 className="text-lg font-semibold mb-2">Authentication</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Include your API key in the Authorization header of your requests:
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm mb-4">
                  Authorization: Bearer YOUR_API_KEY
                </div>
                
                <h4 className="text-lg font-semibold mb-2">Response Format</h4>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  All API responses are returned in JSON format.
                </p>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => setActiveTab('endpoints')} 
                    className="mr-2"
                  >
                    View Endpoints
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('https://appmo.com/api-status', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    API Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>API Features</CardTitle>
              <CardDescription>
                Explore the capabilities of the Appmo API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Task Management</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Create, read, update and delete tasks. Assign tasks, mark them complete, and manage priorities.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Bidding System</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Place bids on tasks, accept bids, and process payments.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">AI Integration</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Leverage AI features like task delegation, schedule generation, and code generation.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Messaging</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Send and receive messages between users with reactions and read status.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">User Management</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Search users, update profiles, and manage authentication.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Templates</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Create and use task templates for repeated workflows.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Appmo SDK</CardTitle>
              <CardDescription>
                Use our official client libraries to integrate with Appmo quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Tabs defaultValue="javascript" className="w-full">
                  <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="java">Java</TabsTrigger>
                  </TabsList>
                  
                  {/* JavaScript SDK */}
                  <TabsContent value="javascript" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Installation</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText('npm install @appmo/sdk');
                                toast({
                                  title: "Copied to clipboard",
                                  description: "Installation command copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <pre>npm install @appmo/sdk</pre>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Python SDK */}
                  <TabsContent value="python" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Installation</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText('pip install appmo-sdk');
                                toast({
                                  title: "Copied to clipboard",
                                  description: "Installation command copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <pre>pip install appmo-sdk</pre>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Java SDK */}
                  <TabsContent value="java" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Installation</h3>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm relative group">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                navigator.clipboard.writeText('<dependency>\n  <groupId>com.appmo</groupId>\n  <artifactId>appmo-sdk</artifactId>\n  <version>1.0.0</version>\n</dependency>');
                                toast({
                                  title: "Copied to clipboard",
                                  description: "Installation command copied to clipboard",
                                });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <pre>{'<dependency>\n  <groupId>com.appmo</groupId>\n  <artifactId>appmo-sdk</artifactId>\n  <version>1.0.0</version>\n</dependency>'}</pre>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Explore all available endpoints in the Appmo API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500">Loading API documentation...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="filter-endpoints">Filter Endpoints</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        id="filter-endpoints"
                        placeholder="Search by path, method, description..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      />
                      {filter && (
                        <Button variant="ghost" size="icon" onClick={() => setFilter('')}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          <span className="sr-only">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Accordion type="multiple" className="w-full">
                    {filteredEndpoints.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No endpoints found for your search criteria.</p>
                        <p className="text-sm text-gray-400 mt-2">Try adjusting your filter or check back later.</p>
                      </div>
                    ) : (
                      filteredEndpoints.map((endpoint, idx) => (
                        <AccordionItem value={`endpoint-${idx}`} key={`${endpoint.method}-${endpoint.path}-${idx}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center w-full">
                              <Badge 
                                className={`mr-3 ${
                                  endpoint.method === 'GET' ? 'bg-blue-500' :
                                  endpoint.method === 'POST' ? 'bg-green-500' :
                                  endpoint.method === 'PATCH' ? 'bg-orange-500' :
                                  endpoint.method === 'DELETE' ? 'bg-red-500' : 
                                  'bg-purple-500'
                                }`}
                              >
                                {endpoint.method}
                              </Badge>
                              <span className="font-mono text-sm mr-2">{endpoint.path}</span>
                              <span className="text-gray-500 text-sm hidden sm:inline ml-auto mr-2">{endpoint.summary}</span>
                              {endpoint.requiresAuth && (
                                <Lock className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pl-2 py-2">
                              <div className="mb-4">
                                <h4 className="font-medium mb-1">Description</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm">{endpoint.description}</p>
                              </div>
                              
                              <div className="mb-4">
                                <h4 className="font-medium mb-1">Authentication</h4>
                                <p className="text-gray-700 dark:text-gray-300 text-sm flex items-center">
                                  {endpoint.requiresAuth ? (
                                    <>
                                      <Lock className="h-4 w-4 mr-1 text-amber-500" />
                                      Requires API key
                                    </>
                                  ) : (
                                    <>
                                      <Unlock className="h-4 w-4 mr-1 text-green-500" />
                                      No authentication required
                                    </>
                                  )}
                                </p>
                              </div>
                              
                              {/* Add schema information */}
                              <div className="mb-4">
                                <Tabs defaultValue="request" className="w-full">
                                  <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2">
                                    <TabsTrigger value="request">Request Schema</TabsTrigger>
                                    <TabsTrigger value="response">Response Schema</TabsTrigger>
                                  </TabsList>
                                  <TabsContent value="request" className="mt-2">
                                    {endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH' ? (
                                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm relative group">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button 
                                            variant="ghost" 
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => {
                                              let schema = '';
                                              if (endpoint.path.includes('task')) {
                                                schema = `{
  "title": "string",
  "description": "string",
  "priority": "high" | "medium" | "low", 
  "category": "string",
  "dueDate": "string (ISO 8601)",
  "estimatedTime": "number (minutes)"
}`;
                                              } else if (endpoint.path.includes('user')) {
                                                schema = `{
  "username": "string",
  "displayName": "string",
  "bio": "string",
  "interests": "string[]",
  "skills": "string[]"
}`;
                                              } else if (endpoint.path.includes('bid')) {
                                                schema = `{
  "taskId": "number",
  "amount": "number",
  "proposal": "string",
  "estimatedTime": "number (minutes)"
}`;
                                              } else {
                                                schema = `{
  "key": "value"
}`;
                                              }
                                              navigator.clipboard.writeText(schema);
                                              toast({
                                                title: "Copied to clipboard",
                                                description: "Schema copied to clipboard",
                                              });
                                            }}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </Button>
                                        </div>
                                        <pre className="whitespace-pre-wrap">
{endpoint.path.includes('task') ? `{
  "title": "string",
  "description": "string",
  "priority": "high" | "medium" | "low", 
  "category": "string",
  "dueDate": "string (ISO 8601)",
  "estimatedTime": "number (minutes)"
}` : endpoint.path.includes('user') ? `{
  "username": "string",
  "displayName": "string",
  "bio": "string",
  "interests": "string[]",
  "skills": "string[]"
}` : endpoint.path.includes('bid') ? `{
  "taskId": "number",
  "amount": "number",
  "proposal": "string",
  "estimatedTime": "number (minutes)"
}` : `{
  "key": "value"
}`}
                                        </pre>
                                      </div>
                                    ) : (
                                      <p className="text-gray-700 dark:text-gray-300 text-sm p-2">No request body required for {endpoint.method} requests.</p>
                                    )}
                                  </TabsContent>
                                  <TabsContent value="response" className="mt-2">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm relative group">
                                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() => {
                                            let schema = '';
                                            if (endpoint.path.includes('task') && !endpoint.path.includes('tasks')) {
                                              schema = `{
  "id": "number",
  "title": "string",
  "description": "string",
  "priority": "high" | "medium" | "low",
  "category": "string",
  "completed": "boolean",
  "dueDate": "string (ISO 8601)",
  "completedAt": "string (ISO 8601) | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "userId": "number",
  "assignedToUserId": "number | null",
  "isPublic": "boolean"
}`;
                                            } else if (endpoint.path.includes('tasks')) {
                                              schema = `[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "priority": "high" | "medium" | "low",
    "category": "string",
    "completed": "boolean",
    "dueDate": "string (ISO 8601)",
    "completedAt": "string (ISO 8601) | null",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)",
    "userId": "number",
    "assignedToUserId": "number | null",
    "isPublic": "boolean"
  },
  // ...more tasks
]`;
                                            } else if (endpoint.path.includes('user')) {
                                              schema = `{
  "id": "number",
  "username": "string",
  "displayName": "string",
  "bio": "string",
  "interests": "string[]",
  "skills": "string[]",
  "avatarUrl": "string | null",
  "createdAt": "string (ISO 8601)"
}`;
                                            } else if (endpoint.path.includes('bid')) {
                                              schema = `{
  "id": "number",
  "taskId": "number",
  "bidderId": "number",
  "amount": "number",
  "proposal": "string",
  "status": "pending" | "accepted" | "rejected" | "completed",
  "estimatedTime": "number",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}`;
                                            } else {
                                              schema = `{
  "success": "boolean",
  "data": "object"
}`;
                                            }
                                            navigator.clipboard.writeText(schema);
                                            toast({
                                              title: "Copied to clipboard",
                                              description: "Schema copied to clipboard",
                                            });
                                          }}
                                        >
                                          <Copy className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <pre className="whitespace-pre-wrap">
{endpoint.path.includes('task') && !endpoint.path.includes('tasks') ? `{
  "id": "number",
  "title": "string",
  "description": "string",
  "priority": "high" | "medium" | "low",
  "category": "string",
  "completed": "boolean",
  "dueDate": "string (ISO 8601)",
  "completedAt": "string (ISO 8601) | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "userId": "number",
  "assignedToUserId": "number | null",
  "isPublic": "boolean"
}` : endpoint.path.includes('tasks') ? `[
  {
    "id": "number",
    "title": "string",
    "description": "string",
    "priority": "high" | "medium" | "low",
    "category": "string",
    "completed": "boolean",
    "dueDate": "string (ISO 8601)",
    "completedAt": "string (ISO 8601) | null",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)",
    "userId": "number",
    "assignedToUserId": "number | null",
    "isPublic": "boolean"
  },
  // ...more tasks
]` : endpoint.path.includes('user') ? `{
  "id": "number",
  "username": "string",
  "displayName": "string",
  "bio": "string",
  "interests": "string[]",
  "skills": "string[]",
  "avatarUrl": "string | null",
  "createdAt": "string (ISO 8601)"
}` : endpoint.path.includes('bid') ? `{
  "id": "number",
  "taskId": "number",
  "bidderId": "number",
  "amount": "number",
  "proposal": "string",
  "status": "pending" | "accepted" | "rejected" | "completed",
  "estimatedTime": "number",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}` : `{
  "success": "boolean",
  "data": "object"
}`}
                                      </pre>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </div>
                              
                              {endpoint.tags && endpoint.tags.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="font-medium mb-1">Tags</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {endpoint.tags.map((tag: string) => (
                                      <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    )}
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys to authenticate with the Appmo API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Authentication Required</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    You need to be logged in to view and manage your API keys.
                  </p>
                  <Button onClick={() => window.location.href = '/auth'}>
                    Sign In
                  </Button>
                </div>
              ) : isLoadingKeys ? (
                <div className="flex justify-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-gray-500">Loading your API keys...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Your API Keys</h3>
                    
                    {apiKeys.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          You don't have any API keys yet.
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                          Create a key to start using the Appmo API.
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Key</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Last Used</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {apiKeys.map((apiKey) => (
                              <TableRow key={apiKey.id}>
                                <TableCell>{apiKey.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                                      {apiKey.key.slice(0, 8)}...{apiKey.key.slice(-4)}
                                    </code>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copyApiKey(apiKey.key)}
                                      className="h-6 w-6"
                                    >
                                      {copiedKey === apiKey.key ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {new Date(apiKey.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {apiKey.lastUsedAt
                                    ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                                    : 'Never'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteApiKey(apiKey.id)}
                                  >
                                    Revoke
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-4">Create a New API Key</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div className="col-span-2">
                        <Label htmlFor="new-key-name">Key Name</Label>
                        <Input
                          id="new-key-name"
                          placeholder="e.g., Development, Production"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <Button
                        onClick={generateApiKey}
                        disabled={!newKeyName.trim() || createKeyMutation.isPending}
                        className="col-span-1"
                      >
                        {createKeyMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Generate Key
                      </Button>
                    </div>
                    
                    {createKeyMutation.isPending && (
                      <p className="text-sm text-gray-500 mt-2">
                        Creating your new API key...
                      </p>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-2">Security Best Practices</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>Keep your API keys secure and never expose them in client-side code.</li>
                      <li>Use a specific key for each application or integration.</li>
                      <li>Rotate your keys periodically for enhanced security.</li>
                      <li>If a key is compromised, revoke it immediately and create a new one.</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}