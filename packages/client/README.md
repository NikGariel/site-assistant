# site-assistant-client

Browser SDK for AI-driven UI control via WebSocket. Receives commands and executes visual actions (highlight, scroll, click, ghost cursor, tooltips). Part of [site-assistant](https://github.com/NikGariel/site-assistant).

## Install

```bash
npm install site-assistant-client
```

Or via CDN:
```html
<script src="https://unpkg.com/site-assistant-client/dist/index.umd.js"></script>
```

## Usage (ESM)

```typescript
import { SiteAssistant } from 'site-assistant-client'

const assistant = new SiteAssistant({
  url: 'wss://your-server.com/assistant',
  meta: { userId: '123', sessionId: 'abc', token: 'jwt...' },
  theme: {
    primaryColor: '#e91e63',
    tooltipBackground: '#222',
  }
})

assistant.on('message', (text) => console.log(text))
assistant.on('error', (reason) => console.error(reason))
assistant.connect()

// Register elements programmatically
assistant.register('custom_el', '#my-element')

// Send events to server
assistant.emit('page_changed', { url: '/new-page' })

// Cleanup (SPA route change)
assistant.destroy()
```

## Usage (UMD / Script Tag)

```html
<button data-ai="signup_button">Sign Up</button>
<section data-ai="pricing">...</section>

<script src="https://unpkg.com/site-assistant-client/dist/index.umd.js"></script>
<script>
  const assistant = new SiteAssistantSDK.SiteAssistant({
    url: 'wss://your-server.com',
    meta: { userId: '123' }
  })
  assistant.connect()
</script>
```

## Element Targeting

Mark elements with `data-ai` attribute:
```html
<button data-ai="signup_button">Sign Up</button>
```

Or register programmatically:
```typescript
assistant.register('signup_button', '#header .btn-primary')
```

Lookup order: `data-ai` attribute first, then registered selectors.

## Theme Customization

```typescript
const assistant = new SiteAssistant({
  url: 'wss://...',
  meta: {},
  theme: {
    primaryColor: '#ff6b35',
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    highlightBorderWidth: 3,
    highlightGlowSpread: 15,
    highlightBorderRadius: 8,
    tooltipBackground: '#2d2d2d',
    tooltipColor: '#f0f0f0',
    tooltipFontSize: '13px',
    tooltipBorderRadius: 8,
    tooltipMaxWidth: 300,
    tooltipPadding: '10px 16px',
    cursorSvg: '<svg>...your custom cursor...</svg>',
    cursorSize: 24,
    cursorDuration: 600,
    cursorEasing: 'ease-out',
    stepIndicatorBackground: '#333',
    stepIndicatorColor: '#fff',
    stepIndicatorPosition: 'bottom-left',
    zIndexBase: 50000,
  }
})

// Update theme at runtime
assistant.setTheme({ primaryColor: '#4caf50' })
```

Or override via CSS:
```css
:root {
  --sa-primary: #ff6b35;
  --sa-overlay: rgba(0, 0, 0, 0.8);
  --sa-tooltip-bg: #222;
}
```

## Available Actions

| Action | Description |
|--------|-------------|
| `highlight` | Dark overlay + glowing border around element |
| `scroll` | Smooth scroll to element |
| `click` | Programmatic click |
| `fill` | Set input value (React/Vue compatible) |
| `show_message` | Positioned tooltip near element |
| `ghost_cursor` | Animated cursor moves to element + optional click |

## Events

| Event | Args | Description |
|-------|------|-------------|
| `message` | `text` | Server sent a text message |
| `error` | `reason` | Auth rejected or server error |
| `scenario_start` | `steps[]` | Scenario began |
| `scenario_end` | - | Scenario completed |
| `disconnect` | - | Connection lost |
| `reconnect` | - | Connection restored |

## API

### `new SiteAssistant(options)`

| Option | Type | Description |
|--------|------|-------------|
| `url` | string | WebSocket server URL |
| `meta` | object | Auth/routing data sent on connect |
| `clientId` | string? | Custom client ID (auto-generated if omitted) |
| `theme` | object? | Visual customization |

### Methods

| Method | Description |
|--------|-------------|
| `connect()` | Connect to server |
| `disconnect()` | Disconnect (can reconnect later) |
| `destroy()` | Full cleanup (styles, handlers, connection) |
| `register(name, selector)` | Register element selector |
| `emit(event, payload?)` | Send event to server |
| `on(event, handler)` | Listen for events |
| `off(event, handler)` | Remove listener |
| `setTheme(theme)` | Update theme at runtime |

## License

MIT
