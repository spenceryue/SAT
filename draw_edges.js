'use strict';


let ctx,
    adjacencies,
    nodes,
    positions,
    animation_id,
    dirty,
    mouse,
    half,
    radius,
    minOpacity;


async function init ()
{
  let canvas = document.querySelector ('canvas');
  ctx = canvas.getContext ('2d');

  // Size canvas, taking account for devicePixelRatio
  resize ();
  window.addEventListener ('resize', resize);

  // Load adjacency lists
  let response = await fetch ('adjacencies.json');
  adjacencies = await response.json ();

  // Get node center positions
  nodes = Array.from (Object.keys (adjacencies), Number)
  positions = Array.from (nodes, () => Array (2));
  set_positions ();
  window.addEventListener ('resize', set_positions);

  // Mouse tracking variables
  mouse = {x: canvas.width/2, y: canvas.height/2};
  dirty = true;
  document.body.addEventListener ('mousemove', e =>
  {
    dirty = true;
    [mouse.x, mouse.y] = [e.clientX + window.scrollX,
                          e.clientY + window.scrollY];
  });

  // Start rendering edges
  minOpacity = .1;
  animation_id = requestAnimationFrame (render);

  console.log ('init() called.')
}


function resize ()
{
  let canvas = ctx.canvas;
  let {width, height} = canvas.getBoundingClientRect ();

  // Set actual size in memory (scaled to account for extra pixel density).
  let scale = window.devicePixelRatio;
  [canvas.width, canvas.height] = [scale * width, scale * height];

  // Normalize coordinate system to use css pixels.
  ctx.scale (scale, scale);

  // Rendering scale, pixels to half opacity
  half = .05 * (canvas.width + canvas.height) / 2;
  half = 1 / half;

  console.log ('resize() called.')
}


function set_positions ()
{
  for (let node of nodes)
  {
    // Get node bounding box
    let element = document.getElementById (`node_${node}`);
    let {x, y, width, height} = element.getBoundingClientRect ();

    // Calculate node center position
    positions[node] = [x + width/2 + window.scrollX,
                       y + height/2 + window.scrollY];

  // Record node radius
  if (radius === undefined)
    radius = width / 2;
  }

  console.log ('set_positions() called.')
}


function render ()
{
  // Skip render if mouse didn't move since last frame
  if (!dirty)
  {
    animation_id = requestAnimationFrame (render);
    return;
  }

  // Track rendering time
  let t = performance.now ();

  // Clear frame, reset dirty
  let canvas = ctx.canvas;
  ctx.clearRect (0, 0, canvas.width, canvas.height);
  dirty = false;
  let count = 0;

  // Loop through edges
  for (let node of nodes)
  {
    // Get distance from node to mouse
    let [x0, y0] = positions[node];
    let d0 = Math.hypot (x0 - mouse.x, y0 - mouse.y);
    d0 = Math.max (d0 - radius, 0);

    for (let dest of adjacencies[node])
    {
    // Get distance from dest to mouse
      let [x1, y1] = positions[dest];
      let d1 = Math.hypot (x1 - mouse.x, y1 - mouse.y);
      d1 = Math.max (d1 - radius, 0);

      // Use the shorter of the two distances
      let d = Math.min (d0, d1);

      // Calculate opacity based on distance to the mouse
      let opacity = 1 / (1 + half * Math.pow (d, 1.5));
      opacity = Math.max (opacity, minOpacity);

      // Interpolate colors and linewidth (scaling with opacity)
      let [r, g, b] = [opacity * (128 - 64) + 64,
                       opacity * (176 - 128) + 128,
                       opacity * (255 - 255) + 255];
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      ctx.lineWidth = opacity * (3 - 1) + 1;

      // Draw the edge
      ctx.beginPath ();
      ctx.moveTo (x0, y0);
      ctx.lineTo (x1, y1);
      ctx.stroke ();

      // Record one more line drawn
      count++;
    }
  }

  // Report render stats
  t = performance.now () - t;
  console.log (`${count} edges drawn in ${t.toFixed (2)}ms`);

  // Queue next frame
  animation_id = requestAnimationFrame (render);
}


// Init edge renderer
document.addEventListener ('DOMContentLoaded', init);
