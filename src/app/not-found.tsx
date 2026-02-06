export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gfl-navy">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gfl-gold mb-4">404</h1>
        <p className="text-gray-400 text-lg mb-6">Page not found</p>
        <a
          href="/"
          className="bg-gradient-gold text-gfl-navy font-bold py-3 px-6 rounded-lg hover:shadow-glow-gold transition-all duration-300"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
