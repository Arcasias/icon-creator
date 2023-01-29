<script lang="ts" context="module">
  import { afterUpdate, onMount } from "svelte";
  import type { EventBus } from "./EventBus";

  interface FoldDetail {
    category: Category;
    toggle: boolean;
  }

  export interface IconProps {
    id: string;
    padding: number;
    spacing: number;
    rounding: number;
    // Background
    primaryBackgroundColor: Color;
    secondaryBackgroundColor: Color;
    gradientPosition: Point;
    gradientRadius: number;
    // Text
    topText: string;
    topTextSize: number;
    bottomText: string;
    bottomTextSize: number;
    textColor: Color;
  }

  export interface Point {
    x: number;
    y: number;
  }

  export type Color = `#${string}`;
  type Category = "texts" | "colors" | "gradient" | "other";

  const choice = <T>(list: T[]) =>
    list[Math.floor(Math.random() * list.length)];

  const drawDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawGradient = (
    ctx: CanvasRenderingContext2D,
    colorA: Color,
    colorB: Color,
    x: number,
    y: number,
    r: number,
    rounding: number
  ) => {
    const { width, height } = ctx.canvas;
    x = (x / 100) * width;
    y = (y / 100) * width;
    r = (r / 100) * width;
    rounding = (rounding / 100) * width;
    try {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, colorB);
      gradient.addColorStop(1, colorA);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      roundRect(ctx, 0, 0, width, height, rounding);
      ctx.fill();

      // ctx.fillRect(0, 0, width, height);
    } catch (err) {
      console.error(err);
    }
  };

  const drawText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    color: Color,
    size: number,
    padding: number,
    spacing: number,
    area: "top" | "bottom",
    shadow: boolean
  ) => {
    const { width, height } = ctx.canvas;
    const texts = text.split("\n").map((t) => t.trim());

    size = (size / 100) * height;
    spacing = (spacing / 100) * height;
    const paddingX = (padding / 100) * width;
    const paddingY = (padding / 100) * height;

    ctx.fillStyle = color;
    ctx.font = `800 ${size}px Montserrat`;

    if (shadow) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = width * 0.03;
      ctx.shadowOffsetX = width * 0.01;
      ctx.shadowOffsetY = height * 0.01;
    }

    if (area === "top") {
      const xOffset = paddingX;
      const yOffset = paddingY + size * 0.9;
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        ctx.fillText(text, xOffset, yOffset + i * (size + spacing));
      }
    } else {
      texts.reverse();
      const xOffset = width - paddingX;
      const yOffset = height - (paddingY + size * 0.3);
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const { width: textWidth } = ctx.measureText(text);
        ctx.fillText(text, xOffset - textWidth, yOffset - i * (size + spacing));
      }
    }

    ctx.shadowColor = "";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  export const getDefaultValues = (): IconProps => ({
    id: crypto.randomUUID().split("-")[0],
    padding: 5,
    spacing: 2,
    rounding: 0,
    primaryBackgroundColor: "#8000ff",
    secondaryBackgroundColor: "#ff0080",
    gradientPosition: { x: 10, y: 10 },
    gradientRadius: 150,
    topText: "New\nicon",
    topTextSize: 20,
    bottomText: choice(["💰", "🚁", "🥔", "🍒", "🌙", "🦤"]),
    bottomTextSize: 30,
    textColor: "#ffffff",
  });

  /**
   * 'CanvasRenderingContext2D.roundRect()' is not yet standard
   * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect
   */
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  };
</script>

<script lang="ts">
  const normalize = (str: string) =>
    str
      .replace(/\s+/g, "_") // remove spaces
      .toLowerCase() // lower case
      .normalize("NFKD") // separate accents
      .replace(/[\u0300-\u036f]/g, ""); // remove accents

  const onToggleClick = (ev: MouseEvent, category: Category) => {
    const toggle = !unfolded.includes(category);
    if (ev.altKey) {
      ev.preventDefault();
      bus.trigger("fold", { category, toggle });
    } else {
      toggleFold(category, toggle);
    }
  };

  const onWindowKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === "Alt") {
      ev.preventDefault();
      highlighted = true;
    }
  };

  const onWindowKeyUp = (ev: KeyboardEvent) => {
    if (ev.key === "Alt") {
      ev.preventDefault();
      highlighted = false;
    }
  };

  const swapColors = () => {
    const tmp = icon.primaryBackgroundColor;
    icon.primaryBackgroundColor = icon.secondaryBackgroundColor;
    icon.secondaryBackgroundColor = tmp;
  };

  const toggleFold = (category: Category, toggle: boolean) => {
    if (toggle) {
      unfolded = [...unfolded, category];
    } else {
      unfolded = unfolded.filter((cat) => cat !== category);
    }
  };

  export let icon: IconProps;
  export let size: number;
  export let bus: EventBus;
  export let onRemoveIcon: () => void;

  let canvas: HTMLCanvasElement;
  let hovered = false;
  let highlighted = false;
  let unfolded: Category[] = ["texts"];

  onMount(() => {
    const subscriptions = [
      bus.subscribe("save", () => {
        const a = document.createElement("a");
        a.download = `${normalize(icon.topText)}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      }),
      bus.subscribe("fold", ({ detail }: CustomEvent<FoldDetail>) => {
        const { category, toggle } = detail;
        toggleFold(category, toggle);
      }),
    ];
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  });

  afterUpdate(() => {
    const ctx = canvas?.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const {
      padding,
      spacing,
      rounding,
      primaryBackgroundColor,
      secondaryBackgroundColor,
      gradientPosition,
      gradientRadius,
      topText,
      topTextSize,
      bottomText,
      bottomTextSize,
      textColor,
    } = icon;

    drawGradient(
      ctx,
      primaryBackgroundColor,
      secondaryBackgroundColor,
      gradientPosition.x,
      gradientPosition.y,
      gradientRadius,
      rounding
    );
    drawText(
      ctx,
      topText,
      textColor,
      topTextSize,
      padding,
      spacing,
      "top",
      false
    );
    drawText(
      ctx,
      bottomText,
      textColor,
      bottomTextSize,
      padding,
      spacing,
      "bottom",
      true
    );
  });
</script>

<svelte:window on:keydown={onWindowKeyDown} on:keyup={onWindowKeyUp} />

<div
  class="animate-slide-right relative flex flex-col items-center gap-3"
  on:mouseenter={() => (hovered = true)}
  on:mouseleave|self={() => (hovered = false)}
>
  <div
    class="flex h-full w-full justify-center"
    style="background-color: {icon.primaryBackgroundColor}60"
  >
    <canvas
      bind:this={canvas}
      width={size}
      height={size}
      class="max-w-64 max-h-64"
    />
  </div>
  <div class="grid w-full grid-cols-2 gap-2">
    <button
      class="col-span-2 grid grid-cols-2 gap-2 font-semibold text-slate-400 transition-colors hover:text-slate-300"
      class:text-sky-500={highlighted}
      on:click={(ev) => onToggleClick(ev, "texts")}
    >
      <div class="border-b-2 py-1 border-slate-400 text-left">Top text</div>
      <div class="border-b-2 py-1 border-slate-400 text-left">Bottom text</div>
    </button>
    {#if unfolded.includes("texts")}
      <textarea
        class="animate-slide-down flex resize-none bg-slate-700 px-2 py-1 font-[Montserrat]"
        placeholder="Top text"
        title="Top text"
        bind:value={icon.topText}
      />
      <textarea
        class="animate-slide-down flex resize-none bg-slate-700 px-2 py-1 font-[Montserrat]"
        placeholder="Bottom text"
        title="Bottom text"
        bind:value={icon.bottomText}
      />
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Size"
        title="Top text size"
        bind:value={icon.topTextSize}
      />
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Size"
        title="Bottom text size"
        bind:value={icon.bottomTextSize}
      />
      <input
        type="range"
        bind:value={icon.topTextSize}
        class="animate-slide-down"
        min="1"
        max="100"
        title="Top text size"
      />
      <input
        type="range"
        bind:value={icon.bottomTextSize}
        class="animate-slide-down"
        min="1"
        max="100"
        title="Bottom text size"
      />
    {/if}
  </div>
  <div class="grid w-full grid-cols-3 items-center gap-2">
    <button
      class="col-span-3 border-b-2 py-1 border-slate-400 text-left font-semibold text-slate-400 transition-colors hover:text-slate-300"
      class:text-sky-500={highlighted}
      on:click={(ev) => onToggleClick(ev, "colors")}
    >
      Colors
    </button>
    {#if unfolded.includes("colors")}
      <div class="animate-slide-down relative">
        Primary
        <button
          class="absolute left-0 -bottom-5 rounded-full bg-sky-600 px-2 text-xs transition-colors hover:bg-sky-500"
          title="Swap primary and secondary colors"
          on:click={swapColors}
        >
          SWAP
        </button>
      </div>
      <div class="animate-slide-down col-span-2 flex gap-2">
        <input
          type="text"
          class="w-full bg-slate-700 px-2 py-1"
          bind:value={icon.primaryBackgroundColor}
        />
        <input
          type="color"
          class="w-12"
          bind:value={icon.primaryBackgroundColor}
        />
      </div>
      <div class="animate-slide-down">Secondary</div>
      <div class="animate-slide-down col-span-2 flex gap-2">
        <input
          type="text"
          class="w-full bg-slate-700 px-2 py-1"
          bind:value={icon.secondaryBackgroundColor}
        />
        <input
          type="color"
          class="w-12"
          bind:value={icon.secondaryBackgroundColor}
        />
      </div>
      <div class="animate-slide-down">Text</div>
      <div class="animate-slide-down col-span-2 flex gap-2">
        <input
          type="text"
          class="w-full bg-slate-700 px-2 py-1"
          bind:value={icon.textColor}
        />
        <input type="color" class="w-12" bind:value={icon.textColor} />
      </div>
    {/if}
  </div>
  <div class="grid w-full grid-cols-3 gap-2">
    <button
      class="col-span-3 border-b-2 py-1 border-slate-400 text-left font-semibold text-slate-400 transition-colors hover:text-slate-300"
      class:text-sky-500={highlighted}
      on:click={(ev) => onToggleClick(ev, "gradient")}
    >
      Gradient
    </button>
    {#if unfolded.includes("gradient")}
      <div class="animate-slide-down">X position</div>
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Radius"
        title="Radius"
        bind:value={icon.gradientPosition.x}
      />
      <input
        type="range"
        class="animate-slide-down bg-slate-700"
        min={1}
        max={100}
        bind:value={icon.gradientPosition.x}
      />
      <div class="animate-slide-down">Y position</div>
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Radius"
        title="Radius"
        bind:value={icon.gradientPosition.y}
      />
      <input
        type="range"
        class="animate-slide-down bg-slate-700"
        min={1}
        max={100}
        bind:value={icon.gradientPosition.y}
      />
      <div class="animate-slide-down">Radius</div>
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Radius"
        title="Radius"
        bind:value={icon.gradientRadius}
      />
      <input
        type="range"
        class="animate-slide-down bg-slate-700"
        min={1}
        max={300}
        bind:value={icon.gradientRadius}
      />
    {/if}
  </div>
  <div class="grid w-full grid-cols-3 gap-2">
    <button
      class="col-span-3 border-b-2 py-1 border-slate-400 text-left font-semibold text-slate-400 transition-colors hover:text-slate-300"
      class:text-sky-500={highlighted}
      on:click={(ev) => onToggleClick(ev, "other")}
    >
      Other
    </button>
    {#if unfolded.includes("other")}
      <div class="animate-slide-down">Padding</div>
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Padding"
        title="Padding"
        bind:value={icon.padding}
      />
      <input
        type="range"
        class="animate-slide-down bg-slate-700"
        min={1}
        max={100}
        title="Padding"
        bind:value={icon.padding}
      />
      <div class="animate-slide-down">Spacing</div>
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Spacing"
        title="Spacing"
        bind:value={icon.spacing}
      />
      <input
        type="range"
        class="animate-slide-down bg-slate-700"
        min={1}
        max={100}
        title="Spacing"
        bind:value={icon.spacing}
      />
      <div class="animate-slide-down">Rounding</div>
      <input
        type="number"
        class="animate-slide-down bg-slate-700 px-2 py-1"
        placeholder="Rounding"
        title="Rounding"
        bind:value={icon.rounding}
      />
      <input
        type="range"
        class="animate-slide-down bg-slate-700"
        min={0}
        max={50}
        title="Rounding"
        bind:value={icon.rounding}
      />
    {/if}
  </div>
  {#if hovered}
    <button
      class="animate-slide-left absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 transition-colors hover:bg-red-400"
      on:click={onRemoveIcon}
    >
      <div class="-mt-1 text-xl">×</div>
    </button>
  {/if}
</div>

<style>
  @keyframes animate-slide-down {
    from {
      opacity: 0.2;
      margin-top: -20px;
    }
  }

  @keyframes animate-slide-left {
    from {
      opacity: 0.2;
      margin-right: -20px;
      right: 20px;
    }
  }

  @keyframes animate-slide-right {
    from {
      opacity: 0.2;
      margin-left: -20px;
    }
  }

  .animate-slide-down {
    animation: animate-slide-down ease-in-out 0.15s;
  }

  .animate-slide-left {
    animation: animate-slide-left ease-in-out 0.15s;
  }

  .animate-slide-right {
    animation: animate-slide-right ease-in-out 0.15s;
  }

  input,
  textarea {
    @apply rounded-sm;
  }
</style>
