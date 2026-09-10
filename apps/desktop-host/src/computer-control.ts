/** Native, approval-gated desktop computer tools for the Electron host. */

import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { Context } from '@deepseek-ai/cordis'
import { AttachmentId } from '@deepseek-ai/dsh-attachment'
import type { ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import { defineTool, type ToolExecution } from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-user-approval'

const run = promisify(execFile)
const MAX_TEXT = 2_000
const MAX_APP_NAME = 120
const MAX_COORDINATE = 32_767

function agentFor(exec: ToolExecution, toolName: string) {
  if (exec.agent === undefined) throw new Error(`${toolName} requires an active Agent session`)
  return exec.agent
}

async function approve(ctx: Context, exec: ToolExecution, toolName: string, reason: string): Promise<void> {
  const outcome = await ctx.approval.request({
    agent: agentFor(exec, toolName), toolName, reason, callId: exec.callId, signal: exec.signal,
  })
  if (outcome !== 'allowed-once') throw new Error(`${toolName} was not approved by the user`)
}

function coordinate(value: unknown, name: string): number {
  if (!Number.isInteger(value) || typeof value !== 'number' || value < 0 || value > MAX_COORDINATE) {
    throw new Error(`${name} must be an integer from 0 through ${MAX_COORDINATE}`)
  }
  return value
}

function appleScriptText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\r', '').replaceAll('\n', '\\r')
}

const SCREENSHOT_MEDIA_TYPE = 'image/png' as const

const SCREENSHOT_VALUE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: true,
  properties: {
    attachmentId: { type: 'string', required: true },
    mediaType: { type: 'string', enum: ['image/png'], required: true },
    bytes: { type: 'integer', required: true },
    width: { type: 'integer', required: true },
    height: { type: 'integer', required: true },
    name: { type: 'string' },
    originalDimensions: {
      type: 'object',
      additionalProperties: false,
      properties: {
        width: { type: 'integer', required: true },
        height: { type: 'integer', required: true },
      },
    },
  },
} as const

interface DesktopScreenshotValue {
  readonly image: {
    readonly attachmentId: string
    readonly mediaType: typeof SCREENSHOT_MEDIA_TYPE
    readonly bytes: number
    readonly width: number
    readonly height: number
    readonly name?: string
    readonly originalDimensions?: {
      readonly width: number
      readonly height: number
    }
  }
}

function screenshotAttachment(value: DesktopScreenshotValue['image']): ImageAttachmentRef {
  return {
    attachmentId: AttachmentId(value.attachmentId),
    mediaType: value.mediaType,
    bytes: value.bytes,
    width: value.width,
    height: value.height,
    ...value.name === undefined ? {} : { name: value.name },
    ...value.originalDimensions === undefined ? {} : {
      originalDimensions: { ...value.originalDimensions },
    },
  }
}

function screenshotContent(value: DesktopScreenshotValue): ContentBlock[] {
  return [
    { type: 'text', text: 'Captured the primary display and attached it to this conversation.' },
    { type: 'image', attachment: screenshotAttachment(value.image) },
  ]
}

function screenshotValue(image: ImageAttachmentRef): DesktopScreenshotValue['image'] {
  return {
    attachmentId: image.attachmentId,
    mediaType: SCREENSHOT_MEDIA_TYPE,
    bytes: image.bytes,
    width: image.width,
    height: image.height,
    ...image.name === undefined ? {} : { name: image.name },
    ...image.originalDimensions === undefined ? {} : {
      originalDimensions: { ...image.originalDimensions },
    },
  }
}

function windowsScript(source: string): string[] {
  return ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', source]
}

async function takeScreenshot(path: string): Promise<void> {
  if (process.platform === 'darwin') {
    await run('/usr/sbin/screencapture', ['-x', '-t', 'png', path])
    return
  }
  if (process.platform === 'win32') {
    const escaped = path.replaceAll("'", "''")
    const dpi = 'using System; using System.Runtime.InteropServices; public static class DshDisplay { [DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); }'
    const script = `$dpi='${dpi.replaceAll("'", "''")}'; Add-Type -TypeDefinition $dpi; [DshDisplay]::SetProcessDPIAware(); `
      + 'Add-Type -AssemblyName System.Windows.Forms; Add-Type -AssemblyName System.Drawing; '
      + '$bounds=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; '
      + '$image=New-Object System.Drawing.Bitmap $bounds.Width,$bounds.Height; '
      + '$graphics=[System.Drawing.Graphics]::FromImage($image); '
      + '$graphics.CopyFromScreen($bounds.Location,[System.Drawing.Point]::Empty,$bounds.Size); '
      + `$image.Save('${escaped}',[System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $image.Dispose()`
    await run('powershell.exe', windowsScript(script))
    return
  }
  throw new Error(`computer control is unavailable on ${process.platform}`)
}

async function click(x: number, y: number): Promise<void> {
  if (process.platform === 'darwin') {
    await run('/usr/bin/osascript', ['-e', `tell application "System Events" to click at {${x}, ${y}}`])
    return
  }
  if (process.platform === 'win32') {
    const source = 'using System; using System.Runtime.InteropServices; public static class DshMouse {'
      + '[DllImport("user32.dll")] public static extern bool SetCursorPos(int x,int y); '
      + '[DllImport("user32.dll")] public static extern void mouse_event(uint f,uint x,uint y,uint d,UIntPtr e); }'
    const script = `$source='${source.replaceAll("'", "''")}'; Add-Type -TypeDefinition $source; [DshMouse]::SetCursorPos(${x},${y}); [DshMouse]::mouse_event(2,0,0,0,[UIntPtr]::Zero); [DshMouse]::mouse_event(4,0,0,0,[UIntPtr]::Zero)`
    await run('powershell.exe', windowsScript(script))
    return
  }
  throw new Error(`computer control is unavailable on ${process.platform}`)
}

async function typeText(text: string): Promise<void> {
  if (process.platform === 'darwin') {
    await run('/usr/bin/osascript', ['-e', `tell application "System Events" to keystroke "${appleScriptText(text)}"`])
    return
  }
  if (process.platform === 'win32') {
    const encoded = Buffer.from(text, 'utf16le').toString('base64')
    const script = "Add-Type -AssemblyName System.Windows.Forms; $value=[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('"
      + `${encoded}')); $previous=[System.Windows.Forms.Clipboard]::GetDataObject(); try { [System.Windows.Forms.Clipboard]::SetText($value); [System.Windows.Forms.SendKeys]::SendWait('^v') } finally { if ($null -eq $previous) { [System.Windows.Forms.Clipboard]::Clear() } else { [System.Windows.Forms.Clipboard]::SetDataObject($previous,$true) } }`
    await run('powershell.exe', windowsScript(script))
    return
  }
  throw new Error(`computer control is unavailable on ${process.platform}`)
}

async function openApplication(application: string): Promise<void> {
  if (process.platform === 'darwin') {
    await run('/usr/bin/open', ['-a', application])
    return
  }
  if (process.platform === 'win32') {
    const encoded = Buffer.from(application, 'utf16le').toString('base64')
    const script = `$app=[Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${encoded}')); Start-Process -FilePath $app`
    await run('powershell.exe', windowsScript(script))
    return
  }
  throw new Error(`computer control is unavailable on ${process.platform}`)
}

/** Register all desktop-control tools. Every irreversible or privacy-sensitive action needs one human grant. */
export function installDesktopComputerTools(ctx: Context): void {
  ctx.tools.register(defineTool({
    name: 'computer_screenshot',
    description: 'Capture the primary display after user approval and attach it to the current conversation for visual reasoning. Requires an image-capable model. Never use while the user is entering a password or other secret.',
    parameters: {},
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: { image: SCREENSHOT_VALUE_SCHEMA },
      },
      render: (_args, value) => screenshotContent(value),
    },
    async execute(_args, exec) {
      await approve(ctx, exec, 'computer_screenshot', 'Capture the primary display and attach it to this conversation for the Agent to inspect.')
      const attachments = ctx.get('attachments')
      if (attachments === undefined) throw new Error('computer screenshot requires the attachment service')
      const directory = await mkdtemp(join(tmpdir(), 'dsh-computer-'))
      const path = join(directory, `${randomUUID()}.png`)
      try {
        await takeScreenshot(path)
        const data = await readFile(path)
        const image = await attachments.saveImage({ data, mediaType: SCREENSHOT_MEDIA_TYPE, name: 'desktop-screenshot.png' })
        return { image: screenshotValue(image) }
      } finally {
        await rm(directory, { recursive: true, force: true })
      }
    },
  }))
  ctx.tools.register(defineTool({
    name: 'computer_click', description: 'Click one screen coordinate after explicit user approval.',
    parameters: { x: { type: 'integer', required: true }, y: { type: 'integer', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { clicked: { type: 'boolean', required: true } } }, render: () => [{ type: 'text', text: 'Clicked the approved screen coordinate.' }] },
    async execute(args, exec) { const x = coordinate(args.x, 'x'); const y = coordinate(args.y, 'y'); await approve(ctx, exec, 'computer_click', `Click screen coordinate (${x}, ${y}).`); await click(x, y); return { clicked: true } },
  }))
  ctx.tools.register(defineTool({
    name: 'computer_type', description: 'Type text into the focused application after explicit user approval. On Windows, this temporarily places the approved text on the clipboard before pasting it. Never use for passwords, API keys, or other secrets.',
    parameters: { text: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { typed: { type: 'boolean', required: true } } }, render: () => [{ type: 'text', text: 'Typed the approved text into the focused application.' }] },
    async execute(args, exec) { if (args.text.length === 0 || args.text.length > MAX_TEXT) throw new Error(`text must contain 1 to ${MAX_TEXT} characters`); await approve(ctx, exec, 'computer_type', 'Type text into the currently focused application. On Windows this temporarily places the approved text on the clipboard.'); await typeText(args.text); return { typed: true } },
  }))
  ctx.tools.register(defineTool({
    name: 'computer_open_application', description: 'Open a named local application after explicit user approval.',
    parameters: { application: { type: 'string', required: true } },
    output: { schema: { type: 'object', additionalProperties: false, properties: { opened: { type: 'boolean', required: true } } }, render: () => [{ type: 'text', text: 'Opened the approved application.' }] },
    async execute(args, exec) { if (args.application.trim() === '' || args.application.length > MAX_APP_NAME || /[\r\n]/u.test(args.application)) throw new Error(`application must contain 1 to ${MAX_APP_NAME} non-newline characters`); await approve(ctx, exec, 'computer_open_application', `Open local application “${args.application}”.`); await openApplication(args.application); return { opened: true } },
  }))
}
