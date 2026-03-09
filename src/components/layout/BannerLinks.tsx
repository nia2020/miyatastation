import Image from "next/image";

export function BannerLinks() {
  return (
    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-600 grid grid-cols-3 gap-6">
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Online Community Miyata Station
        </p>
        <a
          href="https://sunhouse-miyata-kazuya.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          <Image
            src="/banner-sunhouse.png"
            alt="宮田和弥 Online Community Miyata Station"
            width={288}
            height={48}
            className="w-full h-14 object-contain object-left invert"
          />
        </a>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          MIYATA KAZUYA Official Site
        </p>
        <a
          href="https://www.miyata-kazuya.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          <Image
            src="/banner-miyata.png"
            alt="宮田和弥 オフィシャルサイト"
            width={288}
            height={48}
            className="w-full h-14 object-contain object-left invert"
          />
        </a>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          JUN SKY WALKER(S) Official Site
        </p>
        <a
          href="http://junskywalkers.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="block hover:opacity-80 transition-opacity"
        >
          <Image
            src="/banner-junskywalkers.png"
            alt="JUN SKY WALKER(S) オフィシャルサイト"
            width={288}
            height={48}
            className="w-full h-14 object-contain object-left invert"
          />
        </a>
      </div>
    </div>
  );
}
