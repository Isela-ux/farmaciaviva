export default function AsistenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="medico-virtual-full flex min-h-[calc(100dvh-3.25rem)] flex-1 flex-col">
      {children}
    </div>
  );
}
