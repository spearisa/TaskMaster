import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Shield, LockKeyhole } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";
import { useTranslation } from "@/hooks/use-translation";

const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const { t } = useTranslation();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user, loginMutation } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // If user is already logged in and is an admin, redirect to admin dashboard
  if (user?.isAdmin) {
    navigate("/admin/dashboard");
    return null;
  }

  const form = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoggingIn(true);
    try {
      const user = await loginMutation.mutateAsync(data);
      
      if (user.isAdmin) {
        toast({
          title: "Admin Login Successful",
          description: "Welcome to the Appmo admin panel",
        });
        navigate("/admin/dashboard");
      } else {
        toast({
          title: "Access Denied",
          description: "Your account does not have administrator privileges",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      <div className="container flex h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex items-center justify-center p-2 bg-amber-100 rounded-full">
              <Shield className="h-10 w-10 text-amber-600" />
            </div>
            <div>
              <Logo size="lg" />
              <h1 className="text-3xl font-bold tracking-tight text-amber-900 mt-4">
                Admin Login
              </h1>
              <p className="text-sm text-amber-700 mt-1">
                Access Appmo's administration dashboard
              </p>
            </div>
          </div>

          <Card className="border-amber-200 shadow-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-center text-amber-900">Administrator Authentication</CardTitle>
              <CardDescription className="text-center text-amber-700">
                Enter your admin credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="admin" 
                            {...field} 
                            className="border-amber-200 focus:border-amber-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              className="border-amber-200 focus:border-amber-500"
                            />
                            <LockKeyhole className="h-4 w-4 absolute right-3 top-2.5 text-amber-500 opacity-70" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? "Authenticating..." : "Login to Admin Panel"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter>
              <Alert className="bg-amber-100 border-amber-200 text-amber-800">
                <AlertDescription className="text-xs">
                  <b>Demo Admin Access:</b> Username: demo | Password: demo123
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>

          <div className="text-center">
            <Button 
              variant="ghost" 
              className="text-amber-700 hover:text-amber-900 hover:bg-amber-100"
              onClick={() => navigate("/")}
            >
              Return to main application
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}