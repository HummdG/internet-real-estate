"use client";

interface Props {
  onClose: () => void;
  onEdit: () => void;
}

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://pixelestate.com";

export default function SocialShareModal({ onClose, onEdit }: Props) {
  const message = `I just claimed my piece of the internet on Pixel Estate! 🎨 Own 1 pixel or 10,000. It's yours forever. ${BASE_URL}`;
  const encodedMsg = encodeURIComponent(message);
  const encodedUrl = encodeURIComponent(BASE_URL);

  const platforms = [
    {
      name: "X / Twitter",
      color: "#000",
      textColor: "#fff",
      href: `https://twitter.com/intent/tweet?text=${encodedMsg}`,
    },
    {
      name: "Reddit",
      color: "#ff4500",
      textColor: "#fff",
      href: `https://reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent("I just claimed pixels on Pixel Estate!")}`,
    },
    {
      name: "LinkedIn",
      color: "#0077b5",
      textColor: "#fff",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodeURIComponent("Pixel Estate")}&summary=${encodedMsg}`,
    },
    {
      name: "Facebook",
      color: "#1877f2",
      textColor: "#fff",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "Instagram (copy link)",
      color: "#e1306c",
      textColor: "#fff",
      href: null, // copy to clipboard
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(4px)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#0a0a0a",
          border: "1px solid #1a1a1a",
          padding: "40px 32px",
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            marginBottom: 8,
          }}
        >
          🎨
        </div>

        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.2em",
            color: "var(--accent)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Your pixels are live!
        </div>

        <h2
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Tell the world
        </h2>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "#666",
            marginBottom: 32,
            lineHeight: 1.5,
          }}
        >
          Your artwork is now permanently on the internet. Share it with the world.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {platforms.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                if (p.href) {
                  window.open(p.href, "_blank", "noopener,noreferrer");
                } else {
                  navigator.clipboard.writeText(BASE_URL);
                  alert("Link copied! Paste it into your Instagram post.");
                }
              }}
              style={{
                width: "100%",
                background: p.color,
                color: p.textColor,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "12px",
                border: "none",
                cursor: "pointer",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onEdit}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              padding: "12px",
              background: "transparent",
              border: "1px solid #1a1a1a",
              color: "#aaa",
              cursor: "pointer",
            }}
          >
            Keep editing
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              fontWeight: 700,
              padding: "12px",
              background: "#fff",
              border: "none",
              color: "#000",
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
