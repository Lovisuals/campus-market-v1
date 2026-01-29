import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #075E54, #008069)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Pulsing Breathing Glow Rings */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "#25D366",
            opacity: 0.3,
            animation: "breathing 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "#25D366",
            opacity: 0.2,
            animation: "breathing 4s ease-in-out infinite 1s",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "#25D366",
            opacity: 0.15,
            animation: "breathing 4s ease-in-out infinite 2s",
          }}
        />

        {/* Shopping Cart */}
        <div
          style={{
            position: "relative",
            width: "400px",
            height: "300px",
            zIndex: 10,
          }}
        >
          {/* Cart Body */}
          <div
            style={{
              position: "absolute",
              bottom: "60px",
              left: "50px",
              width: "300px",
              height: "180px",
              background: "#25D366",
              borderRadius: "30px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
            }}
          />

          {/* Cart Handle */}
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "80px",
              width: "240px",
              height: "100px",
              border: "25px solid #ffffff",
              borderBottom: "none",
              borderRadius: "120px 120px 0 0",
            }}
          />

          {/* Wheels */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "80px",
              width: "70px",
              height: "70px",
              background: "#ffffff",
              borderRadius: "50%",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              right: "80px",
              width: "70px",
              height: "70px",
              background: "#ffffff",
              borderRadius: "50%",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)",
            }}
          />

          {/* WhatsApp Logo Inside Cart */}
          <div
            style={{
              position: "absolute",
              top: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "200px",
              height: "200px",
              background: "#ffffff",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <svg width="140" height="140" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.04 2 11.03c0 1.93.56 3.72 1.52 5.24L2 22l5.93-1.55c1.43.78 3.05 1.23 4.77 1.23 5.52 0 10-4.04 10-9.03S17.52 2 12 2Z"
                fill="#25D366"
              />
              <path
                d="M10.24 7.62c-.23-.51-.47-.52-.69-.53h-.59c-.2 0-.52.07-.8.35s-1.04 1.02-1.04 2.5 1.07 2.9 1.22 3.1c.15.2 2.06 3.2 5.05 4.36 2.48.95 2.98.76 3.52.71.54-.05 1.74-.71 1.98-1.39.25-.68.25-1.26.18-1.39-.07-.13-.28-.2-.59-.35-.31-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.65.15-.19.3-.75.96-.92 1.15-.17.2-.34.23-.65.08-.31-.15-1.3-.48-2.47-1.52-.91-.81-1.52-1.8-1.7-2.1-.18-.3-.02-.46.13-.61.13-.13.31-.34.46-.51.15-.17.2-.3.31-.51.1-.2.05-.38-.03-.53-.08-.15-.69-1.73-.94-2.24Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
        </div>

        {/* Title Text */}
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            color: "#ffffff",
            fontSize: "48px",
            fontWeight: "900",
            textAlign: "center",
            textShadow: "0 4px 20px rgba(0,0,0,0.6)",
            letterSpacing: "2px",
          }}
        >
          CampusMarket P2P
        </div>

        <style>{`
          @keyframes breathing {
            0%, 100% { transform: scale(1); opacity: 0.2; }
            50% { transform: scale(1.3); opacity: 0.4; }
          }
        `}</style>
      </div>
    ),
    {
      ...size,
    }
  );
}