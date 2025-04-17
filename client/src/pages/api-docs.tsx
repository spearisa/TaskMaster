import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clipboard, Check, Copy, ExternalLink, Lock, Unlock, Save } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Type for API Key
interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [newKeyName, setNewKeyName] = useState('');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    // Demo API keys for display purposes
    {
      id: '1',
      name: 'Development',
      key: 'appmo_dev_' + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }
  ]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [filteredEndpoints, setFilteredEndpoints] = useState<any[]>([]);
  const [swaggerDocs, setSwaggerDocs] = useState<any>({ paths: {}, tags: [] });
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Swagger documentation
  useEffect(() => {
    const fetchSwaggerDocs = async () => {
      try {
        // Fetch from local file
        const response = await fetch('/appmo-api-swagger.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch API documentation: ${response.status}`);
        }
        const data = await response.json();
        setSwaggerDocs(data);
        
        // Extract endpoints
        const extractedEndpoints = Object.entries(data.paths).map(([path, methods]: [string, any]) => {
          const methodEntries = Object.entries(methods);
          return methodEntries.map(([method, details]: [string, any]) => ({
            path,
            method: method.toUpperCase(),
            summary: details.summary || '',
            description: details.description || '',
            tags: details.tags || [],
            requiresAuth: (details.security || []).length > 0 || path.includes('/user') || !path.includes('/public'),
            responses: details.responses || {}
          }));
        }).flat();
        
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
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate new API key
  const generateApiKey = () => {
    if (!newKeyName.trim()) return;
    
    const newKey = {
      id: (apiKeys.length + 1).toString(),
      name: newKeyName,
      key: 'appmo_' + Math.random().toString(36).substring(2, 15) + '_' + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString()
    };
    
    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
  };

  // Delete API key
  const deleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
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
                  API keys grant access to the Appmo API. Keep your keys secure and never share them in public repositories or client-side code.
                </p>
                
                <div className="flex items-end gap-4 mb-6">
                  <div className="flex-1">
                    <Label htmlFor="new-key-name" className="mb-2 block">Key name</Label>
                    <Input
                      id="new-key-name"
                      placeholder="e.g., Production, Testing"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <Button onClick={generateApiKey} disabled={!newKeyName.trim()}>
                    Generate new key
                  </Button>
                </div>
                
                <div className="border rounded-md mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead className="hidden md:table-cell">Created</TableHead>
                        <TableHead className="hidden lg:table-cell">Last used</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map((apiKey) => (
                        <TableRow key={apiKey.id}>
                          <TableCell className="font-medium">{apiKey.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="font-mono text-xs mr-2">
                                {apiKey.key.substring(0, 10)}...{apiKey.key.substring(apiKey.key.length - 5)}
                              </span>
                              <Button variant="ghost" size="icon" onClick={() => copyApiKey(apiKey.key)}>
                                {copiedKey === apiKey.key ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {new Date(apiKey.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => deleteApiKey(apiKey.id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
                  <h3 className="text-amber-800 dark:text-amber-300 font-medium mb-2">API Key Security</h3>
                  <p className="text-amber-700 dark:text-amber-400 text-sm">
                    Your API key carries many privileges, so be sure to keep it secure. Don't share your API key in publicly accessible areas such
                    as GitHub, client-side code, or in calls to the API that can be intercepted. Appmo cannot revoke a compromised key, so you'll
                    need to delete it and generate a new one.
                  </p>
                </div>
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
                    curl -X GET "https://api.appmo.com/tasks" \<br />
                    &nbsp;&nbsp;-H "Authorization: Bearer YOUR_API_KEY" \<br />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}