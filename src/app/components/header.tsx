export function Header() {
  return (
    <div className="text-5xl text-center p-12 bg-black text-white dark:bg-white dark:text-black font-boldonse mb-22">
      <a href="/">RSC Movies</a>
      <div className="flex items-center justify-center mt-2 text-sm">
        <span className="mr-1">Powered by</span>
        <img src="/rwsdk-logo.svg" alt="Redwood logo" className="h-6" />
      </div>
    </div>
  );
}
