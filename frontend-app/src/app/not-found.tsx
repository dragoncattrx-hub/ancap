import { NetworkBackground } from "@/components/NetworkBackground";

export default function NotFound() {
  return (
    <>
      <NetworkBackground />
      
      <div className="min-h-screen flex items-center justify-center">
        <div className="container" style={{ textAlign: "center", padding: "48px 24px" }}>
          <h1 style={{ 
            fontSize: "clamp(3rem, 10vw, 6rem)", 
            fontWeight: 700, 
            marginBottom: "16px", 
            color: "var(--text)",
            letterSpacing: "-0.02em"
          }}>
            404
          </h1>
          <h2 style={{ 
            fontSize: "clamp(1.25rem, 4vw, 1.75rem)", 
            fontWeight: 600, 
            marginBottom: "16px", 
            color: "var(--text)" 
          }}>
            Page Not Found
          </h2>
          <p style={{ 
            color: "var(--text-muted)", 
            marginBottom: "32px",
            fontSize: "1.1rem",
            maxWidth: "500px",
            margin: "0 auto 32px"
          }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <a href="/" className="btn btn-primary">
            Go Home
          </a>
        </div>
      </div>
    </>
  );
}
