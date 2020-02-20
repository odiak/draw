import { memo } from '../utils/memo'
import { Tool } from '../types/Tool'

const drawingSettingsKey = 'KAKERU_DRAWING_SETTINGS'

type DrawingSettings = {
  tool: Tool
  palmRejection: boolean
}

export class SettingsService {
  static readonly instantiate = memo(() => new SettingsService())

  get drawingSettings(): Partial<DrawingSettings> {
    const s: Partial<DrawingSettings> = {}

    let obj: { [key: string]: unknown }
    try {
      const jsonStr = localStorage.getItem(drawingSettingsKey)
      if (jsonStr == null) return s
      obj = JSON.parse(jsonStr)
    } catch (e) {
      return s
    }

    const { tool, palmRejection } = obj
    if (typeof tool === 'string' && (tool === 'pen' || tool === 'hand' || tool === 'eraser')) {
      s.tool = tool
    }
    if (typeof palmRejection === 'boolean') {
      s.palmRejection = palmRejection
    }

    return s
  }

  set drawingSettings(settings: Partial<DrawingSettings>) {
    try {
      localStorage.setItem(drawingSettingsKey, JSON.stringify(settings))
    } finally {
      // nothing
    }
  }
}
