import { memo } from '../utils/memo'
import { Variable } from '../utils/Variable'
import { Tool } from '../types/Tool'
import { Subject } from '../utils/Subject'
import { SettingsService } from './SettingsService'

export const colors = [
  '#c0c0c0',
  '#808080',
  '#000000',
  '#800000',
  '#ff0000',
  '#ffa500',
  '#ffff00',
  '#008000',
  '#0000ff',
  '#ff00ff',
  '#800080',
  '#4b0082'
]

export const widths = [1, 2, 3, 4, 5, 7, 9, 11]

export class DrawingService {
  static readonly instantiate = memo(() => new DrawingService())

  private settingsService = SettingsService.instantiate()

  readonly tool = new Variable<Tool>('pen')
  readonly palmRejectionEnabled = new Variable(false)
  readonly scale = new Variable(1.0)
  readonly canUndo = new Variable(false)
  readonly canRedo = new Variable(false)
  readonly strokeWidth = new Variable(widths[2])
  readonly strokeColor = new Variable(colors[2])

  readonly onZoomIn = new Subject<null>()
  readonly onZoomOut = new Subject<null>()
  readonly onUndo = new Subject<null>()
  readonly onRedo = new Subject<null>()

  constructor() {
    const { tool, palmRejection, strokeWidth, strokeColor } = this.settingsService.drawingSettings
    if (tool != null) {
      this.tool.next(tool)
    }
    if (palmRejection != null) {
      this.palmRejectionEnabled.next(palmRejection)
    }
    if (strokeWidth != null) {
      this.strokeWidth.next(strokeWidth)
    }
    if (strokeColor != null) {
      this.strokeColor.next(strokeColor)
    }

    const saveSettings = this.saveSettings.bind(this)
    this.tool.subscribe(saveSettings)
    this.palmRejectionEnabled.subscribe(saveSettings)
    this.strokeWidth.subscribe(saveSettings)
    this.strokeColor.subscribe(saveSettings)
  }

  private saveSettings() {
    this.settingsService.drawingSettings = {
      tool: this.tool.value,
      palmRejection: this.palmRejectionEnabled.value,
      strokeColor: this.strokeColor.value,
      strokeWidth: this.strokeWidth.value
    }
  }
}
