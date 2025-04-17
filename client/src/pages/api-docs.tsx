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
              requiresAuth: details.security && details.security.some((s: any) => s.ApiKeyAuth),
              responses: details.responses || {},
            });
          }
        }
        
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
        </TabsContent>
        
        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoints</CardTitle>
              <CardDescription>
                Browse and search all available API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <Label htmlFor="filter" className="sr-only">Filter endpoints</Label>
                    <Input
                      id="filter"
                      placeholder="Search endpoints by path, method, or description..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="mb-4"
                    />
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {swaggerDocs.tags && swaggerDocs.tags.map((tag: any) => (
                        <Badge 
                          key={tag.name}
                          className="cursor-pointer"
                          variant={filter === tag.name ? "default" : "outline"}
                          onClick={() => setFilter(filter === tag.name ? '' : tag.name)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Accordion type="multiple" className="w-full">
                    {filteredEndpoints.map((endpoint, idx) => (
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
                            
                            <div className="mb-4">
                              <h4 className="font-medium mb-1">Responses</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-20">Status</TableHead>
                                    <TableHead>Description</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Object.entries(endpoint.responses).map(([status, details]: [string, any]) => (
                                    <TableRow key={status}>
                                      <TableCell>
                                        <Badge 
                                          className={`${
                                            status.startsWith('2') ? 'bg-green-500' :
                                            status.startsWith('4') ? 'bg-amber-500' :
                                            status.startsWith('5') ? 'bg-red-500' : 
                                            'bg-blue-500'
                                          }`}
                                        >
                                          {status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>{details.description}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  {filteredEndpoints.length === 0 && !isLoading && (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No endpoints found for your search criteria.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          {!user ? (
            <Card>
              <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>
                  Please log in to manage your API keys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8">
                  <Lock className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
                    You need to be logged in to create and manage API keys.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/auth'}
                    className="mt-2"
                  >
                    Sign In
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Your API Keys</CardTitle>
                  <CardDescription>
                    Create and manage your API keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      API keys grant access to the Appmo API. Keep your keys secure and never share them publicly.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mb-6">
                      <Input
                        placeholder="Name your API key (e.g., 'Development', 'Production')"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={generateApiKey} 
                        disabled={!newKeyName.trim() || createKeyMutation.isPending}
                      >
                        {createKeyMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : "Generate new key"}
                      </Button>
                    </div>
                    
                    {isLoadingKeys ? (
                      <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : apiKeys.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg">
                        <p className="text-gray-500 mb-2">No API keys found</p>
                        <p className="text-gray-500 text-sm">Generate a new API key to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {apiKeys.map((apiKey) => (
                          <Card key={apiKey.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                                <Badge variant={apiKey.revoked === 'true' ? 'destructive' : 'default'}>
                                  {apiKey.revoked === 'true' ? 'Revoked' : 'Active'}
                                </Badge>
                              </div>
                              <CardDescription className="flex items-center gap-2">
                                Created {new Date(apiKey.createdAt).toLocaleDateString()}
                                {apiKey.lastUsedAt && (
                                  <span className="text-xs text-gray-500">
                                    • Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm text-ellipsis overflow-hidden flex items-center">
                                <span className="truncate mr-2">{apiKey.key}</span>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => copyApiKey(apiKey.key)}
                                  className="ml-auto shrink-0"
                                >
                                  {copiedKey === apiKey.key ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-end gap-2">
                              {apiKey.revoked !== 'true' && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => deleteApiKey(apiKey.id)}
                                  disabled={deleteKeyMutation.isPending}
                                >
                                  {deleteKeyMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    'Revoke'
                                  )}
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Using Your API Key</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Authentication</h3>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        Pass your API key in the Authorization header with a Bearer prefix:
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm">
                        Authorization: Bearer YOUR_API_KEY
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Example Request</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm">
                        curl -X GET "https://api.appmo.com/tasks" <br />
                        &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" <br />
                        &nbsp;&nbsp;-H "Content-Type: application/json"
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Rate Limits</h3>
                      <p className="text-gray-700 dark:text-gray-300">
                        The Appmo API has a rate limit of 100 requests per minute per API key. If you exceed this limit,
                        you'll receive a 429 Too Many Requests response.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}