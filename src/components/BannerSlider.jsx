import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function BannerSlider() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    api.get("/config/banners")
      .then((res) => setBanners(res.data || []))
      .catch(() => setBanners([]));
  }, []);

  const visible = useMemo(
    () => banners.filter((b) => !b.placement || b.placement === "HOME"),
    [banners]
  );

  useEffect(() => {
    if (visible.length <= 1) return;
    const seconds = Number(visible[index]?.displaySeconds || 5);
    const t = setTimeout(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((p) => (p + 1) % visible.length);
        setAnimating(false);
      }, 200);
    }, Math.max(2, seconds) * 1000);
    return () => clearTimeout(t);
  }, [visible, index]);

  useEffect(() => {
    if (index >= visible.length) setIndex(0);
  }, [visible.length]);

  if (!visible.length) return null;

  const banner = visible[index];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
      <button
        className="block w-full text-left focus:outline-none"
        onClick={() => navigate(banner.redirectPath || "/")}
      >
        <div className={`transition-opacity duration-200 ${animating ? "opacity-0" : "opacity-100"}`}>
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full aspect-[21/8] sm:aspect-[21/7] object-cover"
            loading="lazy"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-4 py-4">
            <p className="text-sm font-bold text-white drop-shadow">{banner.title}</p>
          </div>
        </div>
      </button>

      {visible.length > 1 && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
