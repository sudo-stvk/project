import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from "d3-force";
import { zoom, zoomIdentity } from "d3-zoom";
import { select } from "d3-selection";
const WIDTH = 1000,
  HEIGHT = 700;
const KnowledgeGraph = forwardRef(function KnowledgeGraph(
  {
    data,
    layout,
    selected,
    onSelect,
    onSave,
    path = [],
    labels = true,
    preview = false,
    reducedMotion = false,
  },
  ref,
) {
  const svg = useRef(null),
    group = useRef(null),
    engine = useRef(null),
    zoomer = useRef(null),
    nodes = useRef([]),
    drag = useRef(null),
    callbacks = useRef({ onSelect, onSave });
  callbacks.current = { onSelect, onSave };
  const viewport = useRef(layout?.viewport || { x: 0, y: 0, zoom: 1 });
  const save = () =>
    callbacks.current.onSave?.({
      positions: nodes.current
        .filter((n) => n.manual)
        .map((n) => ({ noteId: n.id, x: n.x, y: n.y, pinned: !!n.pinned })),
      viewport: viewport.current,
    });
  const paint = () => {
    if (!group.current) return;
    const map = new Map(nodes.current.map((n) => [n.id, n]));
    group.current.querySelectorAll("[data-node]").forEach((element) => {
      const n = map.get(element.dataset.node);
      if (n) element.setAttribute("transform", `translate(${n.x},${n.y})`);
    });
    group.current.querySelectorAll("[data-source]").forEach((element) => {
      const a = map.get(element.dataset.source),
        b = map.get(element.dataset.target);
      if (a && b) {
        element.setAttribute("x1", a.x);
        element.setAttribute("y1", a.y);
        element.setAttribute("x2", b.x);
        element.setAttribute("y2", b.y);
      }
    });
  };
  useEffect(() => {
    const saved = new Map((layout?.positions || []).map((p) => [p.noteId, p]));
    for (const node of nodes.current) if (node.manual) saved.set(node.id, node);
    nodes.current = data.nodes.map((n, i) => {
      const position = saved.get(n.id);
      return {
        ...n,
        x: position?.x ?? WIDTH / 2 + Math.cos(i * 2.399) * (90 + i * 9),
        y: position?.y ?? HEIGHT / 2 + Math.sin(i * 2.399) * (90 + i * 6),
        ...(position
          ? {
              fx: position.x,
              fy: position.y,
              manual: true,
              pinned: position.pinned,
            }
          : {}),
      };
    });
    const simulation = forceSimulation(nodes.current)
      .force(
        "link",
        forceLink(data.links.map((l) => ({ ...l })))
          .id((n) => n.id)
          .distance(125),
      )
      .force("charge", forceManyBody().strength(-450))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("x", forceX(WIDTH / 2).strength(0.045))
      .force("y", forceY(HEIGHT / 2).strength(0.06))
      .force(
        "collision",
        forceCollide().radius((n) => 37 + Math.min(n.degree, 10) * 2),
      );
    engine.current = simulation;
    let frame;
    simulation.on("tick", () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = null;
          paint();
        });
    });
    if (reducedMotion) {
      simulation.stop();
      simulation.tick(220);
      paint();
    } else {
      simulation.tick(40);
      paint();
    }
    const behavior = zoom()
      .extent([
        [0, 0],
        [WIDTH, HEIGHT],
      ])
      .scaleExtent([0.1, 4])
      .filter(
        (event) =>
          !preview &&
          !event.target.closest("[data-node]") &&
          (!event.button || event.type === "wheel"),
      )
      .on("zoom", (event) => {
        group.current?.setAttribute("transform", event.transform.toString());
        viewport.current = {
          x: event.transform.x,
          y: event.transform.y,
          zoom: event.transform.k,
        };
      })
      .on("end", (event) => {
        if (event.sourceEvent) save();
      });
    zoomer.current = behavior;
    select(svg.current).call(behavior).on("dblclick.zoom", null);
    const v = layout?.viewport || { x: 0, y: 0, zoom: 1 };
    select(svg.current).call(
      behavior.transform,
      zoomIdentity.translate(v.x, v.y).scale(v.zoom),
    );
    return () => {
      simulation.stop();
      cancelAnimationFrame(frame);
      select(svg.current).on(".zoom", null);
    };
  }, [data, layout, reducedMotion, preview]);
  const transform = (x, y, scale) => {
    select(svg.current).call(
      zoomer.current.transform,
      zoomIdentity.translate(x, y).scale(scale),
    );
    save();
  };
  useImperativeHandle(ref, () => ({
    zoom: (factor) => {
      select(svg.current).call(zoomer.current.scaleBy, factor);
      save();
    },
    fit: () => {
      if (!nodes.current.length) return;
      const xs = nodes.current.map((n) => n.x),
        ys = nodes.current.map((n) => n.y),
        minX = Math.min(...xs) - 90,
        minY = Math.min(...ys) - 70,
        w = Math.max(...xs) - minX + 90,
        h = Math.max(...ys) - minY + 70;
      const scale = Math.min(
        1.5,
        Math.max(0.1, Math.min(WIDTH / w, HEIGHT / h)),
      );
      transform(
        WIDTH / 2 - (minX + w / 2) * scale,
        HEIGHT / 2 - (minY + h / 2) * scale,
        scale,
      );
    },
    focus: (id) => {
      const node = nodes.current.find((n) => n.id === id);
      if (node) {
        transform(WIDTH / 2 - node.x * 1.4, HEIGHT / 2 - node.y * 1.4, 1.4);
        callbacks.current.onSelect?.(id);
      }
    },
    togglePin: (id) => {
      const node = nodes.current.find((n) => n.id === id);
      if (node) {
        node.pinned = !node.pinned;
        node.manual = true;
        node.fx = node.x;
        node.fy = node.y;
        save();
        return node.pinned;
      }
    },
  }));
  const neighbors = new Set([selected]);
  data.links.forEach((l) => {
    if (l.source === selected) neighbors.add(l.target);
    if (l.target === selected) neighbors.add(l.source);
  });
  const pathEdges = new Set(
    path.slice(1).map((id, i) => [path[i], id].sort().join(":")),
  );
  function start(e, id) {
    if (preview) return;
    e.stopPropagation();
    const node = nodes.current.find((n) => n.id === id);
    drag.current = { node, moved: false, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    callbacks.current.onSelect?.(id);
  }
  function move(e) {
    if (!drag.current || drag.current.node.pinned) return;
    if (
      Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) < 4 &&
      !drag.current.moved
    )
      return;
    drag.current.moved = true;
    const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
      group.current.getScreenCTM().inverse(),
    );
    const n = drag.current.node;
    n.x = n.fx = point.x;
    n.y = n.fy = point.y;
    n.manual = true;
    paint();
  }
  function end() {
    if (drag.current?.moved) save();
    drag.current = null;
  }
  return (
    <svg
      ref={svg}
      className={`knowledge-svg ${preview ? "preview" : ""}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      aria-label="Interactive knowledge graph"
      role="group"
      onClick={(e) => {
        if (e.target === svg.current) callbacks.current.onSelect?.(null);
      }}
    >
      <defs>
        <radialGradient id={preview ? "node-core-preview" : "node-core"}>
          <stop offset="0%" stopColor="white" stopOpacity=".9" />
          <stop offset="100%" stopColor="currentColor" />
        </radialGradient>
      </defs>
      <g ref={group}>
        {data.links.map((l) => {
          const onPath = pathEdges.has([l.source, l.target].sort().join(":")),
            adjacent = l.source === selected || l.target === selected;
          return (
            <line
              key={l.id}
              data-source={l.source}
              data-target={l.target}
              className={`graph-edge ${onPath ? "on-path" : adjacent ? "edge-active" : ""}`}
              opacity={selected && !adjacent && !onPath ? 0.16 : 1}
            >
              <title>{l.label || l.relationType.replaceAll("_", " ")}</title>
            </line>
          );
        })}
        {data.nodes.map((n) => (
          <g
            key={n.id}
            data-node={n.id}
            className={`graph-node ${selected === n.id ? "node-selected" : ""} ${path.includes(n.id) ? "node-path" : ""}`}
            style={{
              color: n.color,
              opacity:
                selected && !neighbors.has(n.id) && !path.includes(n.id)
                  ? 0.2
                  : 1,
            }}
            role={preview ? undefined : "button"}
            tabIndex={preview ? -1 : 0}
            aria-label={`${n.title}, ${n.degree} connections`}
            onKeyDown={(e) => {
              if (["Enter", " "].includes(e.key)) {
                e.preventDefault();
                callbacks.current.onSelect?.(n.id);
              }
            }}
            onPointerDown={(e) => start(e, n.id)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          >
            <circle className="node-halo" r={30 + Math.min(n.degree, 10) * 2} />
            <circle className="node-ring" r={16 + Math.min(n.degree, 10) * 2} />
            <circle
              className="node-core"
              r={8 + Math.min(n.degree, 10) * 1.3}
            />
            <circle r="3" fill="white" opacity=".75" />
            {labels && (
              <text y={35 + Math.min(n.degree, 10) * 2} textAnchor="middle">
                {n.title.length > 25 ? n.title.slice(0, 24) + "…" : n.title}
              </text>
            )}
            <title>{n.title}</title>
          </g>
        ))}
      </g>
    </svg>
  );
});
export default KnowledgeGraph;
