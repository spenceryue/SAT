'use strict';


let CTX,
    ADJACENCIES,
    NODES,
    POSITIONS,
    HIGHLIGHTED,
    ANIMATION_ID,
    DIRTY,
    MOUSE,
    HALF,
    RADIUS,
    MIN_OPACITY,
    RENDER_STATS;

async function init ()
{
  let canvas = document.querySelector ('canvas');
  CTX = canvas.getContext ('2d');

  // Size canvas, taking account for devicePixelRatio
  resize ();
  window.addEventListener ('resize', resize);

  // Load adjacency lists
  let response = await fetch ('adjacencies.json');
  ADJACENCIES = await response.json ();

  // Get node center positions
  NODES = Array.from (Object.keys (ADJACENCIES), Number);
  POSITIONS = Array.from (NODES, () => Array (2));
  set_positions ();
  window.addEventListener ('resize', set_positions);

  // Keep a set for highlighted nodes
  init_highlights ();

  // Mouse tracking variables
  MOUSE = {x: canvas.width/2, y: canvas.height/2};
  DIRTY = true;
  document.body.addEventListener ('mousemove', e =>
  {
    DIRTY = true;
    [MOUSE.x, MOUSE.y] = [e.clientX + window.scrollX,
                          e.clientY + window.scrollY];
  });

  // Start rendering edges
  MIN_OPACITY = .1;
  RENDER_STATS = false;
  CTX.lineCap = 'round';
  ANIMATION_ID = requestAnimationFrame (render);

  console.log ('init()');
}


function resize ()
{
  let canvas = CTX.canvas;
  let {width, height} = canvas.getBoundingClientRect ();

  // Set actual size in memory (scaled to account for extra pixel density).
  let scale = window.devicePixelRatio;
  [canvas.width, canvas.height] = [scale * width, scale * height];

  // Normalize coordinate system to use css pixels.
  CTX.scale (scale, scale);

  // Rendering scale, pixels to half opacity
  HALF = .05 * (canvas.width + canvas.height) / 2;
  HALF = 1 / HALF;

  console.log ('resize()');
}


function set_positions ()
{
  for (let node of NODES)
  {
    // Get node bounding box
    let element = document.getElementById (`node_${node}`);
    let {x, y, width, height} = element.getBoundingClientRect ();

    // Calculate node center position
    POSITIONS[node] = [x + width/2 + window.scrollX,
                       y + height/2 + window.scrollY];

  // Record node radius
  if (RADIUS === undefined)
    RADIUS = width / 2;
  }

  console.log ('set_positions()');
}


function init_highlights ()
{
  // Array of highlight status pairs (clicked, hovered).
  // Node is considered highlighted if (clicked||hovered).
  HIGHLIGHTED = Array.from (NODES, () => [false, false]);

  // Attach event listeners for each node
  for (let node of NODES)
  {
    let element = document.getElementById (`node_${node}`);
    element.addEventListener ('click', () => highlight (node));
    element.addEventListener ('mouseenter', () => hover_highlight (node));
    element.addEventListener ('mouseleave', () => hover_highlight (node));
  }

  console.log ('init_highlights()');
}


function highlight (...nodes)
{
  DIRTY = true;

  // Unfold if a single iterable is passed.
  if (nodes.length == 1 && Symbol.iterator in Object (nodes[0]))
    nodes = nodes[0];

  // If no arguments passed, assume all nodes
  if (nodes.length == 0)
    nodes = NODES;

  let added = [],
      erased = [];

  // Toggle highlighted status of nodes
  for (let node of nodes)
  {
    // Toggle clicked status
    HIGHLIGHTED[node][0] ^= 1;

    // Toggle hover style
    let element = document.getElementById (`node_${node}`);
    element.classList.toggle ('hover', any (HIGHLIGHTED[node]));
    if (HIGHLIGHTED[node][0])
      added.push (node);
    else
      erased.push (node);
  }

  console.log ('highlight()');

  if (added.length)
    console.log (`...Added [${added}] (${added.length} node${added.length > 1 ? 's' : ''})`);
  if (erased.length)
    console.log (`...Erased [${erased}] (${erased.length} node${erased.length > 1 ? 's' : ''})`);
}


function hover_highlight (node)
{
  DIRTY = true;

  // Toggle hovered status
  HIGHLIGHTED[node][1] ^= 1;

  // Toggle hover style
  let element = document.getElementById (`node_${node}`);
  element.classList.toggle ('hover', any (HIGHLIGHTED[node]));
}


function render ()
{
  // Skip render if mouse didn't move since last frame
  if (!DIRTY)
  {
    ANIMATION_ID = requestAnimationFrame (render);
    return;
  }

  // Track rendering time
  let t = performance.now ();

  // Clear frame, reset DIRTY
  let canvas = CTX.canvas;
  CTX.clearRect (0, 0, canvas.width, canvas.height);
  DIRTY = false;
  let count = 0;

  // Loop through edges
  for (let node of NODES)
  {
    // Get distance from node to mouse
    let [x0, y0] = POSITIONS[node];
    let d0 = Math.hypot (x0 - MOUSE.x, y0 - MOUSE.y);
    d0 = Math.max (d0 - RADIUS, 0);

    for (let dest of ADJACENCIES[node])
    {
    // Get distance from dest to mouse
      let [x1, y1] = POSITIONS[dest];
      let d1 = Math.hypot (x1 - MOUSE.x, y1 - MOUSE.y);
      d1 = Math.max (d1 - RADIUS, 0);

      // Use the shorter of the two distances
      let d = Math.min (d0, d1);

      // Calculate opacity based on distance to the mouse
      let opacity = 1 / (1 + HALF * Math.pow (d, 1.5));
      opacity = Math.max (opacity, MIN_OPACITY);

      // Interpolate colors and linewidth (scaling with opacity)
      let [r, g, b] = [opacity * (64 - 64) + 64,
                       opacity * (192 - 128) + 128,
                       opacity * (64 - 255) + 255];
      CTX.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      CTX.lineWidth = opacity * (3 - 1) + 1;

      if (any (HIGHLIGHTED[node]) && any (HIGHLIGHTED[dest]))
      {
        opacity = Math.max (opacity, .5);
        CTX.strokeStyle = `rgba(255, 0, 0, ${opacity})`;
        CTX.lineWidth = opacity * (3 - 1) + 2;
      }

      // Draw the edge
      CTX.beginPath ();
      CTX.moveTo (x0, y0);
      CTX.lineTo (x1, y1);
      CTX.stroke ();

      // Record one more line drawn
      count++;
    }
  }

  // Report render stats
  if (RENDER_STATS)
  {
    t = performance.now () - t;
    console.log (`${count} edges drawn in ${t.toFixed (2)}ms`);
  }

  // Queue next frame
  ANIMATION_ID = requestAnimationFrame (render);

  window.CTX          = CTX;
  window.ADJACENCIES  = ADJACENCIES;
  window.NODES        = NODES;
  window.POSITIONS    = POSITIONS;
  window.HIGHLIGHTED  = HIGHLIGHTED;
  window.ANIMATION_ID = ANIMATION_ID;
  window.DIRTY        = DIRTY;
  window.MOUSE        = MOUSE;
  window.HALF         = HALF;
  window.RADIUS       = RADIUS;
  window.MIN_OPACITY  = MIN_OPACITY;
  window.RENDER_STATS = RENDER_STATS;
}


function any (...args)
{
  // Unfold if a single iterable is passed.
  if (args.length == 1 && Symbol.iterator in Object (args[0]))
    args = args[0];

  return args.reduce ((a,b) => a||b, 0);
}


function all (...args)
{
  // Unfold if a single iterable is passed.
  if (args.length == 1 && Symbol.iterator in Object (args[0]))
    args = args[0];

  return args.reduce ((a,b) => a&&b, 1);
}


function get_highlighted ()
{
  return NODES.filter (node => HIGHLIGHTED[node][0]);
}


function clear_all ()
{
  let nodes = get_highlighted ();
  if (nodes.length)
    highlight (nodes);
}


window.highlight = highlight;
window.any = any;
window.all = all;
window.get_highlighted = get_highlighted;
window.clear_all = clear_all;


// Init edge renderer
document.addEventListener ('DOMContentLoaded', init);
