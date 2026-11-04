/** Las rayitas de un anillo del dial, como las de una balanza: cada `major`, una más larga y más clara. */
function Ticks({ count, r, len, major, className }: { count: number; r: number; len: number; major: number; className: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * 2 * Math.PI;
        const big = i % major === 0;
        const r2 = r - (big ? len * 2 : len);
        const [s, c] = [Math.sin(a), Math.cos(a)];
        return (
          <line
            key={i}
            x1={(100 + r * s).toFixed(2)}
            y1={(100 - r * c).toFixed(2)}
            x2={(100 + r2 * s).toFixed(2)}
            y2={(100 - r2 * c).toFixed(2)}
            className={big ? "tick tick--major" : "tick"}
          />
        );
      })}
    </svg>
  );
}

/** El fondo del ingreso: un dial dorado (balanza y cronómetro) que gira detrás del panel, con un barrido de luz. */
export function LoginBackdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__glow backdrop__glow--a" />
      <div className="backdrop__glow backdrop__glow--b" />
      <div className="dial">
        <div className="dial__sweep" />
        <Ticks className="dial__ticks dial__ticks--outer" count={120} r={98} len={3} major={10} />
        <Ticks className="dial__ticks dial__ticks--inner" count={60} r={80} len={2.5} major={5} />
        <div className="dial__ring" />
        <div className="dial__pulse" />
        <div className="dial__pulse dial__pulse--late" />
      </div>
    </div>
  );
}
