import { memo } from '../utils/memo'

const drawingSettingsKey = 'KAKERU_EXPERIMENTAL_SETTINGS'

type ExperimentalSettings = {
  smoothPaths: boolean
}

export class ExperimentalSettingsService {
  static readonly instantiate = memo(() => new ExperimentalSettingsService())

  get experimentalSettings(): Partial<ExperimentalSettings> {
    const s: Partial<ExperimentalSettings> = {}

    let obj: { [key: string]: unknown }
    try {
      const jsonStr = localStorage.getItem(drawingSettingsKey)
      if (jsonStr == null) return s
      obj = JSON.parse(jsonStr)
    } catch (e) {
      return s
    }

    const { smoothPaths } = obj
    if (typeof smoothPaths === 'boolean') {
      s.smoothPaths = !!smoothPaths
    }

    return s
  }

  set experimentalSettings(settings: Partial<ExperimentalSettings>) {
    try {
      localStorage.setItem(drawingSettingsKey, JSON.stringify(settings))
    } finally {
      // nothing
    }
  }
}
