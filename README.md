# Minecraft MCP Bot

This is a Minecraft bot that uses Model Context Protocol (MCP) with OpenAI function calling to react to chat messages and execute game commands.

## Features

The bot can:
- React to chat messages
- Send chat messages
- Execute game commands (like `/tp`, `/give`, etc.)
- Teleport to players
- Check position
- Observe environment and nearby players

## MCP Tools

The bot has access to these tools:
- `reply_in_chat` - Send a chat message
- `execute_command` - Execute any game command
- `go_to_player` - Teleport to a specific player
- `current_position` - Get current bot position
- `look_around` - Observe nearby entities and players

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure server connection in `index.ts` (INSTANCE (lines 4-10)

3. Add your OpenAI API key in `index.ts` (line 13)

4. Run the bot:
```bash
node index.ts
```

## How It Works

When someone sends a chat message:
1. The bot receives the message
2. It sends it to OpenAI with tool definitions
3. OpenAI decides if any actions should be taken (chat response or game commands)
4. The bot executes the chosen tools/commands
5. Results are logged to console

## Example Interactions

- Player: "дай алмаз" → Bot executes `/give` command
- Player: "иди ко мне" → Bot teleports to the player
- Player: "где ты?" → Bot checks and reports position
- Player: "кто рядом?" → Bot observes environment
- Normal chat → Bot responds with text

