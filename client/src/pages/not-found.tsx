import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";

export default function NotFound() {
  const { t } = useTranslation();
  const [location] = useLocation();
  
  // Update the page title when this component mounts
  useEffect(() => {
    document.title = `${t('error.notFound')} | Appmo`;
    
    // Add a meta description specific to this error page
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "The page you were looking for could not be found. Navigate back to Appmo's homepage to continue managing your tasks.");
    }
    
    // Clean up when component unmounts
    return () => {
      document.title = "Appmo | Intelligent Task Management";
      if (metaDescription) {
        metaDescription.setAttribute("content", "Appmo is an AI-powered task management platform that helps you organize, prioritize, and complete tasks efficiently with smart reminders and deadline tracking.");
      }
    };
  }, [t]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gray-50" role="main">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <header className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-900">{t('error.notFound')}</h1>
          </header>

          <section>
            <p className="mt-4 text-md text-gray-600">
              {t('error.pageNotFoundMessage')}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {`${t('error.requestedUrl')}: ${location}`}
            </p>
          </section>
        </CardContent>
        
        <CardFooter className="flex gap-4 justify-center pt-2 pb-6">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{t('error.goBack')}</span>
          </Button>
          
          <Button asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>{t('common.home')}</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
