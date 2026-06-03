// Centers the app in a phone-sized canvas on desktop; full-bleed on mobile.
export default function PhoneFrame({ children }) {
  return (
    <div className="min-h-full w-full flex items-stretch sm:items-center justify-center sm:py-6">
      <div className="relative w-full max-w-phone bg-white sm:rounded-[2.2rem] sm:shadow-2xl overflow-hidden
                      h-[100dvh] sm:h-[860px] sm:max-h-[92vh] flex flex-col">
        {children}
      </div>
    </div>
  );
}
