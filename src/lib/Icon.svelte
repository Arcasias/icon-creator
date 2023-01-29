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
    backgroundColor: Color;
    gradientColor: Color;
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
    color: Color,
    x: number,
    y: number,
    radius: number,
    rounding: number
  ) => {
    const { width, height } = ctx.canvas;
    x = (x / 100) * width;
    y = (y / 100) * width;
    radius = (radius / 100) * width;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");

    drawRect(ctx, gradient, 0, 0, width, height, rounding);
  };

  const drawRect = (
    ctx: CanvasRenderingContext2D,
    color: Color | CanvasGradient,
    x: number,
    y: number,
    width: number,
    height: number,
    rounding: number
  ) => {
    ctx.fillStyle = color;
    if (rounding) {
      /**
       * 'CanvasRenderingContext2D.roundRect()' is not yet standard
       * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/roundRect
       */
      ctx.beginPath();
      ctx.moveTo(x + rounding, y);
      ctx.lineTo(x + width - rounding, y);
      ctx.arcTo(x + width, y, x + width, y + rounding, rounding);
      ctx.lineTo(x + width, y + height - rounding);
      ctx.arcTo(
        x + width,
        y + height,
        x + width - rounding,
        y + height,
        rounding
      );
      ctx.lineTo(x + rounding, y + height);
      ctx.arcTo(x, y + height, x, y + height - rounding, rounding);
      ctx.lineTo(x, y + rounding);
      ctx.arcTo(x, y, x + rounding, y, rounding);
      ctx.closePath();

      ctx.fill();
    } else {
      ctx.fillRect(x, y, width, height);
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
    backgroundColor: "#8000ff",
    gradientColor: "#ff0080",
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
    [icon.backgroundColor, icon.gradientColor] = [
      icon.gradientColor,
      icon.backgroundColor,
    ];
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
      backgroundColor,
      gradientColor,
      gradientPosition,
      gradientRadius,
      topText,
      topTextSize,
      bottomText,
      bottomTextSize,
      textColor,
    } = icon;

    const actualRounding = (rounding / 100) * canvas.width;

    if (backgroundColor) {
      drawRect(
        ctx,
        backgroundColor,
        0,
        0,
        canvas.width,
        canvas.height,
        actualRounding
      );
    }
    if (gradientRadius && gradientColor) {
      drawGradient(
        ctx,
        gradientColor,
        gradientPosition.x,
        gradientPosition.y,
        gradientRadius,
        actualRounding
      );
    }
    if (topText && topTextSize && textColor) {
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
    }
    if (bottomText && bottomTextSize && textColor) {
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
    }
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
    style={icon.backgroundColor &&
      `background-color: ${icon.backgroundColor}60`}
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
      <div class="border-b-2 border-slate-400 py-1 text-left">Top text</div>
      <div class="border-b-2 border-slate-400 py-1 text-left">Bottom text</div>
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
        min={1}
        max={100}
        title="Top text size"
      />
      <input
        type="range"
        bind:value={icon.bottomTextSize}
        class="animate-slide-down"
        min={1}
        max={100}
        title="Bottom text size"
      />
    {/if}
  </div>
  <div class="grid w-full grid-cols-3 items-center gap-2">
    <button
      class="col-span-3 border-b-2 border-slate-400 py-1 text-left font-semibold text-slate-400 transition-colors hover:text-slate-300"
      class:text-sky-500={highlighted}
      on:click={(ev) => onToggleClick(ev, "colors")}
    >
      Colors
    </button>
    {#if unfolded.includes("colors")}
      <div class="animate-slide-down relative">
        Background
        <button
          class="absolute -bottom-5 left-0 rounded-full bg-sky-600 px-2 text-xs transition-colors hover:bg-sky-500"
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
          bind:value={icon.backgroundColor}
        />
        <input type="color" class="w-12" bind:value={icon.backgroundColor} />
      </div>
      <div class="animate-slide-down">Gradient</div>
      <div class="animate-slide-down col-span-2 flex gap-2">
        <input
          type="text"
          class="w-full bg-slate-700 px-2 py-1"
          bind:value={icon.gradientColor}
        />
        <input type="color" class="w-12" bind:value={icon.gradientColor} />
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
      class="col-span-3 border-b-2 border-slate-400 py-1 text-left font-semibold text-slate-400 transition-colors hover:text-slate-300"
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
        min={0}
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
        min={0}
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
        min={0}
        max={300}
        bind:value={icon.gradientRadius}
      />
    {/if}
  </div>
  <div class="grid w-full grid-cols-3 gap-2">
    <button
      class="col-span-3 border-b-2 border-slate-400 py-1 text-left font-semibold text-slate-400 transition-colors hover:text-slate-300"
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
        min={0}
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
        min={0}
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
      class="animate-slide-left absolute right-2 top-2 h-7 w-7 rounded-full bg-red-500 transition-colors hover:bg-red-400"
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
