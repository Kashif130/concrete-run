export default function RootLayout({ children }) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#000' }}>
        {children}
      </body>
    </html>
  );
}
