import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;
