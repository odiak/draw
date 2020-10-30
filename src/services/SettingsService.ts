import { memo } from '../utils/memo'
import { Tool } from '../types/Tool'
import { localStorage } from '../utils/localStorage'

const drawingSettingsKey = 'KAKERU_DRAWING_SETTINGS'

type DrawingSettings = {
  tool: Tool
  palmRejection: boolean
  strokeColor: string
  strokeWidth: number
}

export class SettingsService {
  static readonly instantiate = memo(() => new SettingsService())

  get drawingSettings(): Partial<DrawingSettings> {
    const s: Partial<DrawingSettings> = {}

    const jsonStr = localStorage.getItem(drawingSettingsKey)
    if (jsonStr == null) return s
    const obj: { [key: string]: unknown } = JSON.parse(jsonStr)

    const { tool, palmRejection, strokeColor, strokeWidth } = obj
    if (typeof tool === 'string' && (tool === 'pen' || tool === 'hand' || tool === 'eraser')) {
      s.tool = tool
    }
    if (typeof palmRejection === 'boolean') {
      s.palmRejection = palmRejection
    }
    if (typeof strokeColor === 'string') {
      s.strokeColor = strokeColor
    }
    if (typeof strokeWidth === 'number') {
      s.strokeWidth = strokeWidth
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
