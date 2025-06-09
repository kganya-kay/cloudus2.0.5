// pages/index.tsx or app/page.tsx (if using App Router)

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-2xl p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 text-center">Our Solutions</h1>
        <div className="aspect-w-16 aspect-h-9">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/sQD7kaZ5h0s"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}
// This code creates a simple Next.js page that embeds a YouTube video using an iframe.
// The video is responsive and maintains a 16:9 aspect ratio using Tailwind CSS classes.