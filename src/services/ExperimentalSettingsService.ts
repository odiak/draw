import { memo } from '../utils/memo'
import { Variable } from '../utils/Variable'

const drawingSettingsKey = 'KAKERU_EXPERIMENTAL_SETTINGS'

type ExperimentalSettings = {
  smoothPaths: boolean
}

export class ExperimentalSettingsService {
  static readonly instantiate = memo(() => new ExperimentalSettingsService())

  experimentalSettings: Variable<Partial<ExperimentalSettings>>

  constructor() {
    this.experimentalSettings = new Variable(this.deserializeExperimentalSettings())

    window.addEventListener('storage', (event) => {
      if (event.key === drawingSettingsKey && event.storageArea === localStorage) {
        this.experimentalSettings.next(this.deserializeExperimentalSettings())
      }
    })
  }

  private deserializeExperimentalSettings(): Partial<ExperimentalSettings> {
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

  setExperimentalSettings(settings: Partial<ExperimentalSettings>) {
    try {
      localStorage.setItem(drawingSettingsKey, JSON.stringify(settings))
    } finally {
      // nothing
    }
    this.experimentalSettings.next(settings)
  }
}
