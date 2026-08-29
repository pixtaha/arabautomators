const DUR = "6s";

const nodes = [
  { no: "01", label: "webhook", x: 18, y: 108 },
  { no: "02", label: "transform", x: 148, y: 38 },
  { no: "03", label: "retry", x: 278, y: 108 },
  { no: "04", label: "done", x: 386, y: 38 },
] as const;

const NODE_W = 84;
const NODE_H = 44;

// Visible connector curves (edge-to-edge, matches the motion path below).
const CURVE_1 = "M102,130 C160,130 120,60 148,60";
const CURVE_2 = "M232,60 C290,60 250,130 278,130";
const CURVE_3 = "M362,130 C420,130 380,60 386,60";

// Hidden motion path: curves plus straight "through node" segments so the
// travelling dot disappears exactly while a node is "processing" it.
const MOTION_PATH = `${CURVE_1} L232,60 ${CURVE_2.replace("M232,60 ", "")} L362,130 ${CURVE_3.replace("M362,130 ", "")} L428,60`;

export function WorkflowPreview() {
  return (
    <div
      id="workflow"
      className="flex scroll-mt-24 flex-col gap-3.5 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Automation canvas
        </span>
        <span className="animate-pulse-glow inline-flex items-center gap-1.5 rounded-full bg-surface-brand-soft px-2.5 py-1 font-mono text-[10px] tracking-widest text-text-accent uppercase">
          <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-surface-brand" />
          running
        </span>
      </div>

      <div className="bg-grid overflow-hidden rounded-card-inner bg-surface-sunken p-2">
        <svg
          viewBox="0 0 480 190"
          className="h-auto w-full"
          role="img"
          aria-label="Animated diagram of a workflow: a webhook triggers a transform step, which retries on failure before completing successfully."
        >
          {/* static connector lines */}
          <path d={CURVE_1} fill="none" stroke="var(--color-border-hairline-strong)" strokeWidth={2} />
          <path d={CURVE_2} fill="none" stroke="var(--color-border-hairline-strong)" strokeWidth={2} />
          <path d={CURVE_3} fill="none" stroke="var(--color-border-hairline-strong)" strokeWidth={2} />

          {/* ambient flow texture on the connectors */}
          <path
            d={CURVE_1}
            fill="none"
            stroke="var(--color-surface-brand)"
            strokeWidth={2}
            strokeDasharray="1 11"
            strokeLinecap="round"
            className="n8n-flow"
          />
          <path
            d={CURVE_2}
            fill="none"
            stroke="var(--color-surface-brand)"
            strokeWidth={2}
            strokeDasharray="1 11"
            strokeLinecap="round"
            className="n8n-flow"
          />
          <path
            d={CURVE_3}
            fill="none"
            stroke="var(--color-surface-brand)"
            strokeWidth={2}
            strokeDasharray="1 11"
            strokeLinecap="round"
            className="n8n-flow"
          />

          {/* travelling data pulse */}
          <g className="n8n-dot">
            <circle r={9} fill="var(--color-surface-brand)" opacity={0.18} />
            <circle r={4} fill="var(--color-surface-brand)" />
            <animateMotion
              dur={DUR}
              repeatCount="indefinite"
              calcMode="linear"
              keyPoints="0;1;1"
              keyTimes="0;0.767;1"
              path={MOTION_PATH}
            />
          </g>

          {/* nodes */}
          {nodes.map((node, index) => {
            const cx = node.x + NODE_W / 2;
            const cy = node.y + NODE_H / 2;
            const isRetry = node.label === "retry";
            const isDone = node.label === "done";

            const glowColor = isRetry
              ? "var(--color-surface-accent)"
              : "var(--color-surface-brand)";

            const glowTimes = [
              "0;0.03;0.09;1",
              "0;0.22;0.26;0.32;1",
              "0;0.46;0.51;0.58;1",
              "0;0.74;0.78;1",
            ][index];
            const glowValues = [
              "0;1;0;0",
              "0;0;1;0;0",
              "0;0;1;0;0",
              "0;0;1;1",
            ][index];

            return (
              <g key={node.no}>
                <rect
                  className="n8n-glow"
                  x={node.x - 3}
                  y={node.y - 3}
                  width={NODE_W + 6}
                  height={NODE_H + 6}
                  rx={13}
                  fill="none"
                  stroke={glowColor}
                  strokeWidth={2}
                  opacity={0}
                >
                  <animate
                    attributeName="opacity"
                    dur={DUR}
                    repeatCount="indefinite"
                    keyTimes={glowTimes}
                    values={glowValues}
                  />
                </rect>

                <rect
                  x={node.x}
                  y={node.y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={11}
                  fill="var(--color-surface-card)"
                  stroke="var(--color-border-hairline)"
                  strokeWidth={1.5}
                />

                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  fill="var(--color-text-faint)"
                >
                  {node.no}
                </text>
                <text
                  x={cx}
                  y={cy + 10}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={12}
                  fill="var(--color-text-strong)"
                >
                  {node.label}
                </text>

                {isRetry && (
                  <g className="n8n-spin" transform={`translate(${node.x + NODE_W}, ${node.y})`}>
                    <circle
                      r={8}
                      fill="var(--color-surface-card)"
                      stroke="var(--color-surface-accent)"
                      strokeWidth={2}
                      strokeDasharray="10 6"
                      strokeLinecap="round"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        dur={DUR}
                        repeatCount="indefinite"
                        keyTimes="0;0.46;0.58;1"
                        values="0;0;380;380"
                      />
                    </circle>
                  </g>
                )}

                {isDone && (
                  <g className="n8n-done" transform={`translate(${node.x + NODE_W}, ${node.y})`} opacity={0}>
                    <animate
                      attributeName="opacity"
                      dur={DUR}
                      repeatCount="indefinite"
                      keyTimes="0;0.74;0.78;1"
                      values="0;0;1;1"
                    />
                    <circle r={8} fill="var(--color-surface-brand)" />
                    <path
                      d="M-3.5,0 L-1,2.6 L3.5,-3"
                      fill="none"
                      stroke="white"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-[11px] leading-relaxed text-text-muted">
        Runs on its own. When a step fails it retries automatically before moving on.
      </p>
    </div>
  );
}
