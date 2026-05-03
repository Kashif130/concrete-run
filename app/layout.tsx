export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background: '#111', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
