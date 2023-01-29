<script lang="ts" context="module">
  import { EventBus } from "./lib/EventBus";
  import Icon, { getDefaultValues, type IconProps } from "./lib/Icon.svelte";
  import icon256 from "/icon_256.png";

  const ICON_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048] as const;
</script>

<script lang="ts">
  const addIcon = () => {
    icons = [makeIcon(), ...icons];
    iconListEl?.scrollTo(0, 0);
  };

  const exportIcons = () => {
    bus.trigger("save");
  };

  const loadIcons = () => {
    const storageIcons = localStorage.getItem("icons");
    const rawIcons = storageIcons ? JSON.parse(storageIcons) : [];
    const expectedKeysLength = Object.keys(getDefaultValues()).length;

    icons = rawIcons
      .filter(
        (rawIcon: object) => Object.keys(rawIcon).length === expectedKeysLength
      )
      .map(makeIcon);

    saveIcons();
  };

  const makeIcon = (values: any[] = []) =>
    Object.fromEntries(
      Object.entries(getDefaultValues()).map(([key, value], i) => [
        key,
        values[i] ?? value,
      ])
    ) as IconProps;

  const onWindowKeyDown = (ev: KeyboardEvent) => {
    if (!ev.ctrlKey) {
      return;
    }
    switch (ev.key) {
      case "e": {
        ev.preventDefault();
        exportIcons();
        break;
      }
      case "s": {
        ev.preventDefault();
        saveIcons();
        break;
      }
    }
  };

  const removeIcon = (icon: IconProps) => {
    const text = [icon.topText, icon.bottomText]
      .filter(Boolean)
      .join(" / ")
      .replace(/\n+/, " ");
    if (
      confirm(
        `Are you sure you want to delete ${
          text ? `icon "${text}"` : "this unnamed icon"
        }?`
      )
    ) {
      icons = icons.filter(({ id }) => icon.id !== id);
    }
  };

  const saveIcons = () => {
    const values = icons.map(Object.values);
    localStorage.setItem("icons", JSON.stringify(values));
  };

  const setIconSize = (iconSize: number) => {
    currentIconSize = iconSize;
    localStorage.setItem("icon-size", String(iconSize));
  };

  const bus = new EventBus();
  let icons: IconProps[];
  let currentIconSize = Number(localStorage.getItem("icon-size")) || 512;
  let iconListEl: HTMLElement;

  const fontPromise = document.fonts.ready;

  loadIcons();
</script>

<svelte:window on:keydown={onWindowKeyDown} />

<div class="flex h-full flex-col">
  <header class="flex items-center justify-between bg-slate-800 p-3 text-white">
    <h1 class="flex items-center gap-2 font-[Montserrat] text-2xl">
      <img src={icon256} class="max-h-8" alt="Icon creator" />
      <div class="hidden lg:block">Icon creator</div>
    </h1>
    <div class="hidden items-center gap-3 md:flex">
      <div class="text-slate-400">Icon size</div>
      <ul class="flex gap-2">
        {#each ICON_SIZES as iconSize (iconSize)}
          <li>
            <button
              class="rounded px-2 py-1 transition-colors hover:bg-slate-500"
              class:bg-slate-700={iconSize !== currentIconSize}
              class:bg-slate-500={iconSize === currentIconSize}
              on:click={() => setIconSize(iconSize)}
            >
              {iconSize}
            </button>
          </li>
        {/each}
      </ul>
    </div>
    <div class="grid grid-cols-3 gap-2">
      <button
        class="rounded p-2 text-green-600 transition-colors hover:text-green-500"
        title="Restore icons from your browser's local storage"
        on:click={loadIcons}
      >
        Reset
      </button>
      <button
        class="rounded p-2 text-green-600 transition-colors hover:text-green-500"
        title="Save to your browser's local storage"
        on:click={saveIcons}
      >
        Save
      </button>
      <button
        class="rounded bg-green-600 p-2 transition-colors hover:bg-green-500"
        title="Export all current icons"
        on:click={exportIcons}
      >
        Export
      </button>
    </div>
  </header>
  <main
    bind:this={iconListEl}
    class="flex-1 overflow-y-auto bg-slate-900 p-2 text-white"
  >
    <ul class="grid gap-4">
      {#each icons as icon (icon.id)}
        <li>
          {#await fontPromise}
            Loading...
          {:then}
            <Icon
              size={currentIconSize}
              {icon}
              {bus}
              onRemoveIcon={() => removeIcon(icon)}
            />
          {/await}
        </li>
      {/each}
      <button
        class="absolute bottom-3 left-3 rounded-full border-2 border-green-500 bg-green-600 bg-opacity-75 p-3 font-[Montserrat] text-xl text-green-100 transition-colors hover:bg-green-500"
        on:click={addIcon}
      >
        Add +
      </button>
    </ul>
  </main>
</div>

<style>
  ul {
    grid-template-columns: repeat(auto-fit, minmax(256px, 1fr));
  }
</style>
