# Stagewise Setup Guide

This guide will help you set up the stagewise extension to use with your CodeGapper Playground app in the browser.

## What is Stagewise?

Stagewise is a VS Code extension that acts as an IDE Bridge, allowing AI agents to interact with your frontend application running in the browser. It enables visual coding and AI-powered editing directly in your browser.

## Prerequisites

1. **VS Code** (or compatible IDE) installed
2. **Stagewise VS Code Extension** installed
3. **Node.js** and **npm** (or pnpm/yarn) installed

## Setup Steps

### 1. Install the Stagewise VS Code Extension

**Manual Step Required:**

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "stagewise"
4. Install the extension: `stagewise.stagewise-vscode-extension`
5. Reload VS Code if prompted

**Alternative:** Install via command line:
```bash
code --install-extension stagewise.stagewise-vscode-extension
```

### 2. Configure Your Development Server

The project is already configured:
- ✅ `vite.config.ts` is set to run on port 3000
- ✅ `stagewise.json` is configured with `appPort: 3000`

### 3. Start Your Development Server

In one terminal, start your Vite dev server:
```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

### 4. Start Stagewise CLI

**Option A: Using npm script (Recommended)**

In a second terminal, run:
```bash
npm run stagewise:bridge
```

This runs stagewise in bridge mode (`-b` flag), which connects with IDE agents like Cursor, GitHub Copilot, Windsurf, etc.

**Option B: Direct CLI command**

```bash
npx stagewise@latest -b
```

Or with pnpm:
```bash
pnpm dlx stagewise@latest -b
```

### 5. Complete Stagewise Setup

When you first run stagewise, you'll be prompted to:
1. Complete a short CLI setup process
2. Configure your stagewise account (if needed)
3. Follow any on-screen instructions

### 6. Use Stagewise in Browser

Once both servers are running:
1. The stagewise toolbar should appear in your browser
2. You can now use AI agents to edit your frontend code
3. Changes will be reflected in real-time

## Configuration Files

### `stagewise.json`
```json
{
  "appPort": 3000,
  "appUrl": "http://localhost:3000"
}
```

### `vite.config.ts`
```typescript
server: {
  port: 3000,
  host: true, // Allows external connections for stagewise
}
```

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
1. Change the port in `vite.config.ts` and `stagewise.json`
2. Or kill the process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Stagewise Toolbar Not Appearing
1. Make sure both dev server and stagewise CLI are running
2. Check browser console for errors
3. Verify `stagewise.json` port matches your dev server port
4. Try refreshing the browser

### Extension Not Detecting App
1. Ensure the VS Code extension is installed and enabled
2. Make sure you're running stagewise in bridge mode (`-b` flag)
3. Check that your app is accessible at the configured URL

## Additional Resources

- [Stagewise Documentation](https://stagewise.io/docs)
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=stagewise.stagewise-vscode-extension)
- [Stagewise Discord](https://discord.gg/stagewise)

## Notes

- The stagewise toolbar hosts your app independently, so it continues working even if your dev app crashes
- No need to add stagewise as a dependency to `package.json` - it runs via npx
- Bridge mode (`-b`) is recommended for IDE integration with Cursor, GitHub Copilot, etc.
