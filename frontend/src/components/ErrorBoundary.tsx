import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

export const ErrorBoundary = () => {
  const error = useRouteError();

  let title = 'Oops! Something went wrong';
  let message = 'An unexpected error occurred.';
  let statusCode: number | null = null;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    switch (error.status) {
      case 404:
        title = 'Page Not Found';
        message = "The page you're looking for doesn't exist or has been moved.";
        break;
      case 401:
        title = 'Unauthorized';
        message = 'You need to be logged in to access this page.';
        break;
      case 403:
        title = 'Access Denied';
        message = "You don't have permission to access this resource.";
        break;
      case 500:
        title = 'Server Error';
        message = 'Something went wrong on our end. Please try again later.';
        break;
      default:
        title = `Error ${error.status}`;
        message = error.statusText || 'An error occurred.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card glass className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">
            {statusCode && (
              <span className="block text-5xl font-bold text-primary mb-2">
                {statusCode}
              </span>
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Link to="/dashboard">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
